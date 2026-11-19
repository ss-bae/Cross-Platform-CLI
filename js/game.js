/*
 * Game logic: terminal UI, scoring, weak-spot scheduling, persistence.
 * Question content lives in data/questions.js; answer matching in js/checker.js.
 */
(function () {
  'use strict';

  const BANK = window.QUESTION_BANK;
  const Checker = window.Checker;
  const APP = window.APP;

  const LEGACY_KEY = 'aplus-cli-trainer-v1'; // read once so earlier progress carries over
  const OSES = ['windows', 'linux', 'macos'];

  const COMMAND_POINTS = 60; // the right command
  const FULL_BONUS = 40;     // the whole answer, switches and arguments included
  const AFTER_MISS = 0.5;    // multiplier once you've had a wrong attempt
  const WITH_HINT = 0.25;    // multiplier once you've opened the hint
  const CLEAN_SOLVES_TO_CLEAR = 3; // unaided solves needed to take a command off the weak list
  const RECENT_WINDOW = 5;         // don't repeat a question within this many turns
  const SKIP_DELAY = 3;            // a skipped question returns after this many other questions
  const HISTORY_LIMIT = 50;

  const OS_META = {
    windows: {
      label: 'Windows',
      shell: 'Windows Command Prompt',
      title: 'Command Prompt',
      prompt: [{ text: 'C:\\Users\\student>' }],
      clear: ['cls'],
    },
    linux: {
      label: 'Linux',
      shell: 'Linux shell',
      title: 'student@ubuntu: ~',
      prompt: [{ text: 'student@ubuntu', cls: 'p-user' }, { text: ':' }, { text: '~', cls: 'p-path' }, { text: '$ ' }],
      clear: ['clear'],
    },
    macos: {
      label: 'macOS',
      shell: 'macOS Terminal',
      title: 'student — -zsh — 80×24',
      prompt: [{ text: 'student@MacBook ~ % ' }],
      clear: ['clear'],
    },
  };

  // Commands that exist on each OS, so a wrong answer gets a realistic error
  // ("not recognized" vs. "invalid option"). Bank answers are added below.
  const KNOWN_EXTRA = {
    windows: ['copy', 'xcopy', 'del', 'erase', 'type', 'echo', 'cls', 'help', 'tasklist', 'taskkill', 'shutdown',
      'mkdir', 'rd', 'move', 'ren', 'rename', 'attrib', 'systeminfo', 'net', 'dism', 'powershell', 'cmd', 'start',
      'find', 'findstr', 'more', 'tree', 'vol', 'label', 'where', 'set', 'path', 'arp', 'route', 'nbtstat', 'getmac',
      'bcdedit', 'regedit', 'msconfig', 'mmc', 'notepad', 'chdir', 'exit'],
    linux: ['cd', 'echo', 'touch', 'mkdir', 'rmdir', 'less', 'more', 'head', 'tail', 'vi', 'vim', 'kill', 'killall',
      'chgrp', 'passwd', 'useradd', 'usermod', 'ifconfig', 'netstat', 'ss', 'nslookup', 'host', 'wget', 'ssh', 'scp',
      'tar', 'gzip', 'zip', 'unzip', 'which', 'whoami', 'history', 'clear', 'exit', 'systemctl', 'journalctl',
      'umount', 'lsblk', 'fdisk', 'free', 'uname', 'hostname', 'ln', 'file', 'diff', 'sort', 'wc', 'awk', 'sed',
      'yum', 'rpm', 'dpkg', 'snap', 'apt-get', 'pico', 'bash', 'sh', 'date', 'uptime', 'id', 'groups'],
    macos: ['cd', 'echo', 'touch', 'mkdir', 'rmdir', 'less', 'more', 'head', 'tail', 'vi', 'vim', 'kill', 'killall',
      'chgrp', 'passwd', 'ifconfig', 'netstat', 'nslookup', 'host', 'ssh', 'scp', 'tar', 'gzip', 'zip', 'unzip',
      'which', 'whoami', 'history', 'clear', 'exit', 'umount', 'uname', 'hostname', 'ln', 'file', 'diff', 'sort',
      'wc', 'awk', 'sed', 'pico', 'bash', 'sh', 'zsh', 'date', 'uptime', 'id', 'groups', 'open', 'diskutil',
      'softwareupdate', 'brew', 'networksetup', 'scutil', 'tmutil', 'defaults'],
  };
  const LINUX_ONLY = ['apt', 'apt-get', 'dnf', 'yum', 'rpm', 'dpkg', 'snap', 'ip', 'systemctl', 'journalctl', 'lsblk', 'fdisk', 'free'];

  // ---------- Bank indexes ----------
  const byOs = {};
  const byId = {};
  const known = {};
  for (const os of OSES) {
    byOs[os] = BANK.questions.filter((q) => q.os === os);
    known[os] = new Set(KNOWN_EXTRA[os]);
  }
  for (const q of BANK.questions) {
    byId[q.id] = q;
    for (const a of q.answers) {
      const t = Checker.normalize(a).split(' ');
      const cmd = t[0] === 'sudo' ? t[1] : t[0];
      known[q.os].add(q.os === 'windows' ? cmd.toLowerCase() : cmd);
    }
  }

  // ---------- Persistence ----------
  function blankProgress() {
    return {
      score: 0, streak: 0, best: 0, answered: 0, clean: 0,
      cmds: {},      // command -> { seen, clean, missed, hinted, weak }
      qseen: {},     // question id -> times solved
      recent: [],    // recent question ids
      later: [],     // skipped questions: { id, due } where due is a turn number
      turn: 0,       // questions started so far
      history: [],   // typed commands for up-arrow
      current: null, // current question id
      attempt: null, // { id, wrong, hinted, solved, choices, points }
    };
  }

  function loadState() {
    const saved = APP.read(APP.KEYS.game, LEGACY_KEY);
    const state = { mode: 'windows', view: 'practice', os: {} };
    if (saved && OSES.includes(saved.mode)) state.mode = saved.mode;
    if (saved && saved.view === 'learn') state.view = 'learn';
    for (const os of OSES) {
      state.os[os] = Object.assign(blankProgress(), saved && saved.os && saved.os[os]);
      state.os[os].later = state.os[os].later.filter((x) => byId[x.id]);
      if (state.os[os].current && !byId[state.os[os].current]) {
        state.os[os].current = null; // question removed from the bank
        state.os[os].attempt = null;
      }
    }
    return state;
  }

  function saveState() {
    APP.write(APP.KEYS.game, state, LEGACY_KEY);
  }

  const state = loadState();
  const prog = () => state.os[state.mode];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    terminal: $('terminal'), body: $('term-body'), output: $('term-output'), input: $('term-input'),
    prompt: $('term-prompt'), typed: $('term-typed'), title: $('term-title'),
    qText: $('q-text'), qShell: $('q-shell'), qCategory: $('q-category'), qStyle: $('q-style'),
    score: $('score'), streak: $('streak'), best: $('best'),
    hintBtn: $('hint-btn'), nextBtn: $('next-btn'), pointsNote: $('points-note'),
    hintPanel: $('hint-panel'), hintNudge: $('hint-nudge'), hintChoices: $('hint-choices'),
    progressOs: $('progress-os'), progressSummary: $('progress-summary'), strengthList: $('strength-list'),
    resetBtn: $('reset-btn'), skipBtn: $('skip-btn'), showMeBtn: $('showme-btn'), qReview: $('q-review'), laterSummary: $('later-summary'),
  };

  function makeSpan(text, cls) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }

  function fillPrompt(target) {
    target.textContent = '';
    for (const part of OS_META[state.mode].prompt) target.appendChild(makeSpan(part.text, part.cls));
  }

  function scrollToBottom() { el.body.scrollTop = el.body.scrollHeight; }

  function printLine(text, cls) {
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    el.output.appendChild(div);
    scrollToBottom();
  }

  function printEcho(text) {
    const div = document.createElement('div');
    div.className = 'line echo';
    fillPrompt(div);
    div.appendChild(document.createTextNode(text));
    el.output.appendChild(div);
  }

  // Sample output, then the explanation. Used when solving and when replaying a solved question.
  function printSolved(q, attempt) {
    const full = attempt.full !== false; // saves from before partial credit were all full answers
    if (!full) printLine(`Sample output for the full command, ${attempt.matched}:`, 'game dim');
    printLine(trimOutput(q.output));
    printExplanation(q, attempt.points, attempt, full);
  }

  function printExplanation(q, points, attempt, full) {
    const box = document.createElement('div');
    box.className = 'explain';

    const head = document.createElement('p');
    const how = attempt.hinted ? 'with hint' : attempt.wrong ? 'after ' + attempt.wrong + ' miss' + (attempt.wrong > 1 ? 'es' : '') : 'first try';
    head.appendChild(makeSpan(full ? '✔ Correct ' : '✔ Right command ', 'ok-mark'));
    head.appendChild(makeSpan('+' + points + ' (' + how + (full ? ', full-command bonus included' : '') + ')'));
    box.appendChild(head);

    if (!full) {
      const bonus = document.createElement('p');
      bonus.className = 'bonus-miss';
      bonus.appendChild(document.createTextNode(`Full command for the +${pointsFor(attempt).bonus} bonus: `));
      bonus.appendChild(makeSpan(attempt.matched, 'code'));
      box.appendChild(bonus);
    }

    const why = document.createElement('p');
    why.appendChild(makeSpan('Why: ', 'label'));
    why.appendChild(document.createTextNode(q.why));
    box.appendChild(why);

    const about = document.createElement('p');
    about.appendChild(makeSpan('About ' + q.command + ': ', 'label'));
    about.appendChild(document.createTextNode(BANK.info[q.os][q.command]));
    box.appendChild(about);

    if (q.answers.length > 1) {
      const alt = document.createElement('p');
      alt.className = 'dim';
      alt.textContent = 'Also accepted: ' + q.answers.filter((a) => a !== attempt.matched).slice(0, 4).join('  ·  ');
      box.appendChild(alt);
    }

    el.output.appendChild(box);
    printLine('Press Enter or click Next for the next question.', 'game dim');
  }

  // ---------- Typed-line mirror with a block cursor ----------
  function renderTyped() {
    const v = el.input.value;
    const pos = el.input.selectionStart == null ? v.length : el.input.selectionStart;
    el.typed.textContent = '';
    el.typed.appendChild(document.createTextNode(v.slice(0, pos)));
    el.typed.appendChild(makeSpan(v.charAt(pos) || ' ', 'cursor'));
    el.typed.appendChild(document.createTextNode(v.slice(pos + 1)));
  }

  function focusInput() {
    if (state.view !== 'practice') return;
    if (document.activeElement !== el.input) el.input.focus({ preventScroll: true });
  }

  // ---------- Question selection (weak spots come back more often) ----------
  function weight(q, p, lastCommand) {
    const c = p.cmds[q.command];
    const weak = c ? c.weak : 0;
    const seen = p.qseen[q.id] || 0;
    let w = (1 + weak * 2) * (seen === 0 ? 2 : 1 / (1 + seen * 0.3));
    if (q.command === lastCommand) w *= 0.2; // space out repeats, even for weak commands
    return w;
  }

  function pickQuestion(os) {
    const p = state.os[os];
    const due = p.later.find((x) => x.due <= p.turn && x.id !== p.current);
    if (due) return byId[due.id];

    const pool = byOs[os];
    const recent = new Set(p.recent.concat(p.later.map((x) => x.id)));
    let candidates = pool.filter((q) => !recent.has(q.id));
    if (!candidates.length) candidates = pool.filter((q) => q.id !== p.current);
    const last = p.current && byId[p.current] ? byId[p.current].command : null;
    const weights = candidates.map((q) => weight(q, p, last));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  // ---------- Hint choices: the answer plus three same-OS distractors ----------
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildChoices(q) {
    const correct = q.answers[0];
    const key = (s) => (q.os === 'windows' ? s.toLowerCase() : s);
    const taken = new Set(q.answers.map(key));
    const others = byOs[q.os].filter((x) => x.id !== q.id);
    const tiers = [
      others.filter((x) => x.command === q.command),
      others.filter((x) => x.command !== q.command && x.category === q.category),
      others.filter((x) => x.category !== q.category),
    ];
    const picks = [];
    for (const tier of tiers) {
      for (const x of shuffle(tier)) {
        if (picks.length === 3) break;
        const cand = x.answers[0];
        if (taken.has(key(cand))) continue;
        taken.add(key(cand));
        picks.push(cand);
      }
    }
    return shuffle([correct].concat(picks));
  }

  // ---------- Realistic error output for a wrong answer ----------
  function tokensOf(text) {
    const t = Checker.normalize(text).split(' ');
    return t[0] === 'sudo' && t.length > 1 ? { sudo: true, cmd: t[1], args: t.slice(2) } : { sudo: false, cmd: t[0], args: t.slice(1) };
  }

  function errorFor(os, typed, q) {
    const { cmd, args } = tokensOf(typed);
    const win = os === 'windows';
    const norm = (s) => (win ? s.toLowerCase() : s);
    const isKnown = known[os].has(norm(cmd));

    if (!isKnown) {
      if (win) return [`'${cmd}' is not recognized as an internal or external command,`, 'operable program or batch file.'];
      if (os === 'linux') return [`${cmd}: command not found`];
      return [`zsh: command not found: ${cmd}`];
    }

    // Everything the accepted answers use, to spot the first token that doesn't belong.
    const expected = new Set();
    for (const a of q.answers) for (const t of Checker.normalize(a).split(' ')) expected.add(norm(t));
    const isSwitch = (t) => (win ? /^[/-]/.test(t) && t.length > 1 : /^-/.test(t) && t.length > 1);
    const badSwitch = args.find((t) => isSwitch(t) && !expected.has(norm(t)));
    const badArg = args.find((t) => !isSwitch(t) && !expected.has(norm(t)));
    const lc = cmd.toLowerCase();
    const looksLikeHost = (t) => /^[\w.-]+\.[a-z0-9-]+$/i.test(t) && !t.includes('/');

    if (win) {
      if (badSwitch) {
        if (lc === 'ipconfig') return ['Error: unrecognized or incomplete command line.', '', 'USAGE:', '    ipconfig [/allcompartments] [/? | /all | /renew [adapter] | /release [adapter] | /flushdns | /displaydns ]'];
        if (lc === 'ping') return [`Bad option ${badSwitch}.`];
        return [`Invalid switch - "${badSwitch.replace(/^[/-]/, '')}".`];
      }
      if (badArg) {
        if (lc === 'ping') return [`Ping request could not find host ${badArg}. Please check the name and try again.`];
        if (lc === 'tracert' || lc === 'pathping') return [`Unable to resolve target system name ${badArg}.`];
        if (lc === 'nslookup') return ['Server:  dns1.corp.local', 'Address:  192.168.1.10', '', `*** dns1.corp.local can't find ${badArg}: Non-existent domain`];
        if (lc === 'net') return ['The syntax of this command is:', '', 'NET', '    [ ACCOUNTS | COMPUTER | CONFIG | CONTINUE | FILE | GROUP | HELP |', '      HELPMSG | LOCALGROUP | PAUSE | SESSION | SHARE | START |', '      STATISTICS | STOP | TIME | USE | USER | VIEW ]'];
        if (lc === 'dir') return ['File Not Found'];
        if (['cd', 'chdir', 'rmdir', 'rd'].includes(lc)) return ['The system cannot find the path specified.'];
        return ['The system cannot find the file specified.'];
      }
      return ['The syntax of the command is incorrect.'];
    }

    const gnu = os === 'linux';
    if (badSwitch) {
      if (badSwitch.startsWith('--')) {
        return gnu ? [`${cmd}: unrecognized option '${badSwitch}'`, `Try '${cmd} --help' for more information.`]
                   : [`${cmd}: unrecognized option \`${badSwitch}'`, `usage: ${cmd} [options] ...`];
      }
      const chars = badSwitch.slice(1).split('');
      const allowed = new Set([...expected].filter((t) => t.startsWith('-')).join('').split(''));
      const c = chars.find((ch) => !allowed.has(ch)) || chars[0];
      return gnu ? [`${cmd}: invalid option -- '${c}'`, `Try '${cmd} --help' for more information.`]
                 : [`${cmd}: illegal option -- ${c}`, `usage: ${cmd} [options] ...`];
    }
    if (badArg) {
      if (['ping', 'traceroute', 'curl', 'dig'].includes(cmd) && looksLikeHost(badArg)) {
        if (cmd === 'curl') return [`curl: (6) Could not resolve host: ${badArg}`];
        if (cmd === 'dig') return [`; <<>> DiG <<>> ${badArg}`, ';; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN'];
        if (cmd === 'ping') return gnu ? [`ping: ${badArg}: Name or service not known`] : [`ping: cannot resolve ${badArg}: Unknown host`];
        return gnu ? [`${badArg}: Name or service not known`] : [`traceroute: unknown host ${badArg}`];
      }
      if (cmd === 'ls' && gnu) return [`ls: cannot access '${badArg}': No such file or directory`];
      return [`${cmd}: ${badArg}: No such file or directory`];
    }
    return gnu ? [`${cmd}: missing operand`, `Try '${cmd} --help' for more information.`] : [`usage: ${cmd} [options] ...`];
  }

  function caseErrorFor(os, typed, matched) {
    const t = tokensOf(typed);
    const m = tokensOf(matched);
    if (t.cmd !== m.cmd) return os === 'linux' ? [`${t.cmd}: command not found`] : [`zsh: command not found: ${t.cmd}`];
    const bad = t.args.find((a, i) => a !== m.args[i]) || t.args[0] || '';
    if (bad.startsWith('-')) {
      const c = bad.slice(1).split('').find((ch, i) => ch !== (m.args.find((x) => x.toLowerCase() === bad.toLowerCase()) || '').slice(1)[i]) || bad.slice(1, 2);
      return os === 'linux' ? [`${t.cmd}: invalid option -- '${c}'`, `Try '${t.cmd} --help' for more information.`]
                            : [`${t.cmd}: illegal option -- ${c}`, `usage: ${t.cmd} [options] ...`];
    }
    return os === 'linux' ? [`${t.cmd}: cannot access '${bad}': No such file or directory`] : [`${t.cmd}: ${bad}: No such file or directory`];
  }

  // ---------- Rendering ----------
  function renderStats() {
    const p = prog();
    el.score.textContent = p.score;
    el.streak.textContent = p.streak;
    el.best.textContent = p.best;
  }

  function pointsFor(a) {
    const m = a.hinted ? WITH_HINT : a.wrong ? AFTER_MISS : 1;
    return { command: Math.round(COMMAND_POINTS * m), bonus: Math.round(FULL_BONUS * m) };
  }

  function renderActions() {
    const a = prog().attempt;
    el.nextBtn.hidden = !a.solved;
    el.skipBtn.hidden = a.solved;
    el.showMeBtn.hidden = !APP.demo || a.solved;
    el.hintBtn.hidden = a.solved || a.wrong === 0 || a.hinted;
    el.hintPanel.hidden = a.solved || !a.hinted;
    const pts = pointsFor(a);
    el.pointsNote.textContent = a.solved ? '' : `Command ${pts.command} pts · full command +${pts.bonus} bonus`;
    if (a.hinted && !a.solved) renderHint();
  }

  function renderHint() {
    const a = prog().attempt;
    const q = byId[a.id];
    el.hintNudge.textContent = q.hint;
    el.hintChoices.textContent = '';
    for (const c of a.choices) {
      const li = document.createElement('li');
      li.textContent = c;
      el.hintChoices.appendChild(li);
    }
  }

  function strengthOf(c) {
    if (!c || !c.seen) return 'new';
    if (c.weak > 0) return 'weak';
    if (c.clean >= 2) return 'strong';
    return 'learning';
  }

  function renderProgress() {
    const os = state.mode;
    const p = prog();
    el.progressOs.textContent = OS_META[os].label;
    el.resetBtn.textContent = `Reset ${OS_META[os].label}`;
    el.strengthList.textContent = '';
    const tally = { strong: 0, learning: 0, weak: 0, new: 0 };
    for (const cmd of Object.keys(BANK.info[os])) {
      const c = p.cmds[cmd];
      const s = strengthOf(c);
      tally[s]++;
      const li = document.createElement('li');
      li.dataset.strength = s;
      li.title = c ? `${c.seen} answered · ${c.clean} unaided · ${c.missed} with a miss · ${c.hinted} with a hint` : 'Not seen yet';
      const dot = document.createElement('i');
      dot.className = 'dot ' + s;
      li.appendChild(dot);
      li.appendChild(makeSpan(cmd, 'cmd'));
      li.appendChild(makeSpan(c ? `${c.clean}✓ ${c.missed + c.hinted}✗` : '', 'counts'));
      el.strengthList.appendChild(li);
    }
    const pct = p.answered ? Math.round((p.clean / p.answered) * 100) : 0;
    el.laterSummary.hidden = !p.later.length;
    el.laterSummary.textContent = `${p.later.length} skipped question${p.later.length === 1 ? '' : 's'} saved for review.`;
    el.progressSummary.textContent =
      `${tally.strong} strong · ${tally.learning} learning · ${tally.weak} need review · ${tally.new} not seen. ` +
      `${p.answered} answered, ${pct}% first try. ${byOs[os].length} questions in this pool.`;
  }

  function renderQuestion(q) {
    el.qText.textContent = q.q;
    el.qShell.textContent = OS_META[q.os].shell;
    el.qCategory.textContent = q.category;
    el.qStyle.textContent = q.style === 'scenario' ? 'Scenario' : 'Recall';
    el.qReview.hidden = !prog().later.some((x) => x.id === q.id);
  }

  function applyTheme() {
    const os = state.mode;
    document.body.dataset.os = os;
    el.title.textContent = OS_META[os].title;
    fillPrompt(el.prompt);
    for (const b of document.querySelectorAll('.modes button')) {
      b.setAttribute('aria-selected', String(b.dataset.mode === os));
    }
  }

  // ---------- Flow ----------
  function startQuestion(q) {
    const p = prog();
    p.current = q.id;
    p.turn++;
    p.attempt = { id: q.id, wrong: 0, hinted: false, solved: false, choices: null, points: 0, matched: null };
    p.recent = p.recent.concat(q.id).slice(-Math.min(RECENT_WINDOW, byOs[state.mode].length - 1));
    saveState();
    showCurrent();
  }

  // Draw the current question and replay its attempt state (used on load and mode switch).
  function showCurrent() {
    const p = prog();
    const q = byId[p.current];
    el.output.textContent = '';
    renderQuestion(q);
    if (p.attempt.solved) {
      printSolved(q, p.attempt);
    } else if (p.attempt.wrong) {
      printLine(`(${p.attempt.wrong} wrong attempt${p.attempt.wrong > 1 ? 's' : ''} so far on this question)`, 'game dim');
    }
    renderActions();
    renderStats();
    renderProgress();
    resetInput();
  }

  function trimOutput(text) { return text.replace(/^\n/, ''); }

  function resetInput() {
    el.input.value = '';
    histIndex = prog().history.length;
    renderTyped();
    scrollToBottom();
  }

  function recordSolve(q, a) {
    const p = prog();
    const clean = !a.wrong && !a.hinted;
    const c = p.cmds[q.command] || (p.cmds[q.command] = { seen: 0, clean: 0, missed: 0, hinted: 0, weak: 0 });
    c.seen++;
    if (clean) {
      c.clean++;
      c.weak = Math.max(0, c.weak - 1);
      p.clean++;
      p.streak++;
      p.best = Math.max(p.best, p.streak);
    } else {
      if (a.wrong) c.missed++;
      if (a.hinted) c.hinted++;
      c.weak = CLEAN_SOLVES_TO_CLEAR;
      p.streak = 0;
    }
    p.answered++;
    p.later = p.later.filter((x) => x.id !== q.id);
    p.qseen[q.id] = (p.qseen[q.id] || 0) + 1;
    p.score += a.points;
  }

  function submit(raw) {
    const p = prog();
    const a = p.attempt;
    const q = byId[a.id];
    const text = Checker.normalize(raw);

    if (text && p.history[p.history.length - 1] !== text) {
      p.history = p.history.concat(text).slice(-HISTORY_LIMIT);
    }

    if (a.solved) { nextQuestion(); return; }

    printEcho(raw);
    if (!text) { resetInput(); return; }

    if (OS_META[state.mode].clear.includes(state.mode === 'windows' ? text.toLowerCase() : text)) {
      el.output.textContent = '';
      saveState();
      resetInput();
      return;
    }

    const result = Checker.check(text, q);
    if (result.status === 'correct' || result.status === 'command') {
      const pts = pointsFor(a);
      a.solved = true;
      a.full = result.status === 'correct';
      a.matched = result.matched;
      a.points = pts.command + (a.full ? pts.bonus : 0);
      recordSolve(q, a);
      printSolved(q, a);
    } else {
      a.wrong++;
      p.streak = 0;
      if (result.status === 'case') {
        for (const line of caseErrorFor(state.mode, text, result.matched)) printLine(line, 'err');
        printLine(`⚠ Right command, wrong capitalization. ${OS_META[state.mode].label} commands, options, and paths are case-sensitive.`, 'game warn');
      } else {
        for (const line of errorFor(state.mode, text, q)) printLine(line, 'err');
        const cmd = tokensOf(text).cmd;
        let note = '✗ Not what this question needs. Try again';
        note += a.hinted ? '.' : ', or open a hint.';
        if (state.mode === 'macos' && LINUX_ONLY.includes(cmd)) note += ` (${cmd} is a Linux tool; macOS doesn't include it.)`;
        printLine(note, 'game bad');
      }
    }
    saveState();
    renderActions();
    renderStats();
    renderProgress();
    resetInput();
  }

  function nextQuestion() {
    startQuestion(pickQuestion(state.mode));
    focusInput();
  }

  function skipQuestion() {
    const p = prog();
    const a = p.attempt;
    if (a.solved) return;
    const q = byId[a.id];
    // Skipping after a miss or hint still counts against the command.
    if (a.wrong || a.hinted) {
      const c = p.cmds[q.command] || (p.cmds[q.command] = { seen: 0, clean: 0, missed: 0, hinted: 0, weak: 0 });
      c.seen++;
      if (a.wrong) c.missed++;
      if (a.hinted) c.hinted++;
      c.weak = CLEAN_SOLVES_TO_CLEAR;
    }
    p.streak = 0;
    p.later = p.later.filter((x) => x.id !== q.id).concat({ id: q.id, due: p.turn + SKIP_DELAY });
    nextQuestion();
    printLine(`↷ Skipped. That question comes back for review after ${SKIP_DELAY} others.`, 'game dim');
  }

  function openHint() {
    const a = prog().attempt;
    if (a.solved || a.hinted) return;
    a.hinted = true;
    a.choices = buildChoices(byId[a.id]);
    saveState();
    renderActions();
    focusInput();
  }

  // Types text into the terminal one character at a time, then submits it.
  // Used by the demo tour and the demo-only "Show me" button.
  let autoTyping = false;
  function autoType(text, delay = 45) {
    if (autoTyping) return Promise.resolve(false);
    autoTyping = true;
    el.input.value = '';
    renderTyped();
    return new Promise((resolve) => {
      let i = 0;
      const step = () => {
        if (i < text.length) {
          el.input.value += text[i++];
          el.input.setSelectionRange(el.input.value.length, el.input.value.length);
          renderTyped();
          setTimeout(step, delay);
          return;
        }
        setTimeout(() => {
          autoTyping = false;
          submit(el.input.value);
          resolve(true);
        }, 250);
      };
      step();
    });
  }

  // Demo mode: type the answer for visitors who don't know the command. Scored as a hint.
  function showMe() {
    const a = prog().attempt;
    if (a.solved || autoTyping) return Promise.resolve(false);
    if (!a.hinted) {
      a.hinted = true;
      a.choices = buildChoices(byId[a.id]);
    }
    return autoType(byId[a.id].answers[0]);
  }

  function switchMode(os) {
    if (!OSES.includes(os) || os === state.mode) { focusInput(); return; }
    state.mode = os;
    applyTheme();
    if (!prog().current) startQuestion(pickQuestion(os));
    else showCurrent();
    saveState();
    announce();
    focusInput();
  }

  // Practice (the quiz terminal) or Learn (guided practice, flash cards, mini games).
  function applyView() {
    document.body.dataset.view = state.view;
    for (const b of document.querySelectorAll('.views button')) {
      b.setAttribute('aria-selected', String(b.dataset.view === state.view));
    }
  }

  function switchView(view) {
    if (view === state.view) return;
    state.view = view;
    applyView();
    saveState();
    announce();
    if (view === 'practice') { scrollToBottom(); focusInput(); }
  }

  // Tell learn.js which OS and view are active.
  function announce() {
    document.dispatchEvent(new CustomEvent('trainer:change', { detail: { mode: state.mode, view: state.view } }));
  }

  function resetMode() {
    const label = OS_META[state.mode].label;
    if (!window.confirm(`Reset all ${label} progress (score, streak, and command strength)? Other modes are not affected.`)) {
      focusInput();
      return;
    }
    state.os[state.mode] = blankProgress();
    startQuestion(pickQuestion(state.mode));
    focusInput();
  }

  // ---------- Input handling ----------
  let histIndex = 0;
  let draft = '';

  el.input.addEventListener('keydown', (e) => {
    const p = prog();
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(el.input.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!p.history.length) return;
      if (histIndex === p.history.length) draft = el.input.value;
      histIndex = Math.max(0, histIndex - 1);
      setInput(p.history[histIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIndex >= p.history.length) return;
      histIndex++;
      setInput(histIndex === p.history.length ? draft : p.history[histIndex]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      el.output.textContent = '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  });

  function setInput(v) {
    el.input.value = v;
    el.input.setSelectionRange(v.length, v.length);
    renderTyped();
  }

  for (const evt of ['input', 'keyup', 'click', 'select']) el.input.addEventListener(evt, renderTyped);
  document.addEventListener('selectionchange', () => { if (document.activeElement === el.input) renderTyped(); });

  el.input.addEventListener('focus', () => el.terminal.classList.add('focused'));
  el.input.addEventListener('blur', () => {
    el.terminal.classList.remove('focused');
    // Keep focus in the terminal unless the user moved to another control.
    setTimeout(() => {
      const ae = document.activeElement;
      if (!ae || ae === document.body) focusInput();
    }, 0);
  });

  el.terminal.addEventListener('mouseup', () => {
    // Allow selecting output text to copy; otherwise return focus to the prompt.
    if (!String(window.getSelection())) focusInput();
  });

  document.addEventListener('keydown', (e) => {
    if (state.view !== 'practice') return;
    if (document.activeElement === el.input) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if ((tag === 'BUTTON') && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') focusInput();
  });

  el.hintBtn.addEventListener('click', openHint);
  el.nextBtn.addEventListener('click', nextQuestion);
  el.skipBtn.addEventListener('click', skipQuestion);
  el.showMeBtn.addEventListener('click', () => { showMe(); focusInput(); });
  el.resetBtn.addEventListener('click', resetMode);
  for (const b of document.querySelectorAll('.modes button')) {
    b.addEventListener('click', () => switchMode(b.dataset.mode));
  }

  for (const b of document.querySelectorAll('.views button')) {
    b.addEventListener('click', () => switchView(b.dataset.view));
  }

  // ---------- Boot ----------
  applyTheme();
  applyView();
  if (!prog().current) startQuestion(pickQuestion(state.mode));
  else showCurrent();
  focusInput();

  // Shared with learn.js.
  window.Trainer = {
    get mode() { return state.mode; },
    get view() { return state.view; },
    OS_META,
    // Used by the demo tour (js/demo.js).
    switchMode,
    switchView,
    openHint,
    showMe,
    next: nextQuestion,
    focus: focusInput,
    typeAnswer: autoType,
    question: () => byId[prog().current],
    showQuestion(id) {
      const q = byId[id];
      if (!q) return;
      if (q.os !== state.mode) switchMode(q.os);
      startQuestion(q);
    },
  };
  announce();

  // Exposed for automated play-testing.
  window.__trainer = { state, byId, buildChoices, pickQuestion };
})();
