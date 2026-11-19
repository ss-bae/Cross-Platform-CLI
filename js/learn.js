/*
 * Learn mode: guided practice, flash cards, and mini games.
 * Content comes from data/questions.js (lessons, outputs) and data/learn.js (cards).
 * Shares the OS tabs with game.js via window.Trainer and the 'trainer:change' event.
 */
(function () {
  'use strict';

  const BANK = window.QUESTION_BANK;
  const CARDS = window.LEARN_DATA.cards;
  const Checker = window.Checker;
  const Trainer = window.Trainer;

  const STORAGE_KEY = 'cli-practice-learn-v1';
  const LEGACY_KEY = 'aplus-cli-learn-v1'; // read once so earlier progress carries over
  const OSES = ['windows', 'linux', 'macos'];
  const TABS = ['guided', 'cards', 'games'];
  const MISSES_BEFORE_REVEAL = 2;
  const SPEED_SECONDS = 60;
  const MATCH_PAIRS = 6;
  const DETECTIVE_ROUNDS = 10;
  const CHMOD_ROUNDS = 10;

  // ---------- Content indexes ----------
  const categoryOf = {}; // os -> command -> category
  const lessons = {};    // os -> [{ category, commands: [] }]
  const decks = {};      // os -> cards with id and category
  for (const os of OSES) {
    categoryOf[os] = {};
    lessons[os] = [];
    for (const q of BANK.questions.filter((x) => x.os === os)) {
      if (categoryOf[os][q.command]) continue;
      categoryOf[os][q.command] = q.category;
      let lesson = lessons[os].find((l) => l.category === q.category);
      if (!lesson) lessons[os].push((lesson = { category: q.category, commands: [] }));
      lesson.commands.push(q.command);
    }
    categoryOf[os]['System folders'] = 'System folders';
    decks[os] = CARDS.filter((c) => c.os.includes(os)).map((c) => Object.assign({}, c, {
      id: c.cmd,
      category: categoryOf[os][c.tag],
      answers: [c.cmd].concat(c.also || []),
    }));
  }
  const questionsFor = (os, command) => BANK.questions.filter((q) => q.os === os && q.command === command);

  // ---------- Persistence ----------
  function blankProgress() {
    return { guided: {}, boxes: {}, best: {}, cardDir: 'cmd', cardCat: 'all' };
  }

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY)); } catch (e) { saved = null; }
    const s = { tab: 'guided', os: {} };
    if (saved && TABS.includes(saved.tab)) s.tab = saved.tab;
    for (const os of OSES) s.os[os] = Object.assign(blankProgress(), saved && saved.os && saved.os[os]);
    return s;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      localStorage.removeItem(LEGACY_KEY);
    } catch (e) { /* storage unavailable */ }
  }

  const store = load();
  const os = () => Trainer.mode;
  const prog = () => store.os[os()];

  // Screen state that isn't saved: which lesson or game is open.
  const ui = {
    lesson: null, game: null, card: null, flipped: false, recent: [], cleanup: null, os: null,
    speed: null, detective: null, chmod: null, // per-game state while a game is open
  };

  function closeGame() {
    ui.game = null;
    ui.speed = ui.detective = ui.chmod = null;
  }

  // ---------- Helpers ----------
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : String(k));
    return e;
  }

  // Like Element.append, but skips null/false so optional pieces can be inlined.
  function append(parent, ...kids) {
    for (const k of kids.flat()) if (k != null && k !== false) parent.append(k);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentions = (text, word) => new RegExp(`(^|[^\\w/.-])${escapeRe(word)}($|[^\\w/.-])`, 'i').test(text);
  const trimOutput = (text) => text.replace(/^\n/, '');
  const caseNote = () => `Check your capitalization. ${Trainer.OS_META[os()].label} commands, options, and paths are case-sensitive.`;

  function promptNode() {
    const p = h('span', { class: 'prompt' });
    for (const part of Trainer.OS_META[os()].prompt) p.append(h('span', { class: part.cls, text: part.text }));
    return p;
  }

  // A small terminal: output area plus a real, visible input line.
  function miniTerm(onSubmit, opts = {}) {
    const out = h('div', { class: 'term-output' });
    const input = h('input', {
      class: 'lt-input', type: 'text', autocomplete: 'off', autocapitalize: 'off',
      autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Terminal input',
    });
    const body = h('div', { class: 'term-body lt-body' + (opts.tall ? ' tall' : '') }, out, h('div', { class: 'lt-line' }, promptNode(), input));
    const el = h('div', { class: 'terminal focused lt-term' },
      h('div', { class: 'term-titlebar' },
        h('span', { class: 'lights', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('span', { class: 'term-title', text: Trainer.OS_META[os()].title }),
        h('span', { class: 'win-controls', 'aria-hidden': 'true' }, h('i', { text: '–' }), h('i', { text: '□' }), h('i', { text: '✕' }))),
      body);

    const term = {
      el, input,
      print(text, cls) {
        out.append(h('div', { class: 'line' + (cls ? ' ' + cls : ''), text }));
        body.scrollTop = body.scrollHeight;
      },
      echo(text) {
        const line = h('div', { class: 'line echo' }, promptNode(), text);
        out.append(line);
      },
      clear() { out.textContent = ''; },
      focus() { input.focus({ preventScroll: true }); },
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = input.value;
        input.value = '';
        term.echo(v);
        onSubmit(v, term);
        body.scrollTop = body.scrollHeight;
      } else if (e.key === 'Tab' && opts.onTab) {
        e.preventDefault();
        opts.onTab(term);
      }
    });
    body.addEventListener('mouseup', () => { if (!String(window.getSelection())) term.focus(); });
    return term;
  }

  // ---------- Shell: tabs + render ----------
  const root = document.getElementById('learn-body');
  const tabButtons = document.querySelectorAll('.learn-tabs button');

  function leaveScreen() {
    if (ui.cleanup) { ui.cleanup(); ui.cleanup = null; }
  }

  function render() {
    if (Trainer.view !== 'learn') return;
    leaveScreen();
    if (ui.os !== os()) {
      ui.os = os();
      ui.lesson = null;
      closeGame();
      ui.card = null;
      ui.flipped = false;
      ui.recent = [];
    }
    for (const b of tabButtons) b.setAttribute('aria-selected', String(b.dataset.tab === store.tab));
    root.textContent = '';
    if (store.tab === 'guided') renderGuided();
    else if (store.tab === 'cards') renderCards();
    else renderGames();
  }

  for (const b of tabButtons) {
    b.addEventListener('click', () => {
      store.tab = b.dataset.tab;
      save();
      render();
    });
  }
  document.addEventListener('trainer:change', render);

  function sectionHead(title, sub, extra) {
    return h('div', { class: 'learn-head' },
      h('div', null, h('h2', { text: title }), sub ? h('p', { class: 'learn-sub', text: sub }) : null),
      extra || null);
  }

  // ===================================================================
  // Guided practice
  // ===================================================================
  function renderGuided() {
    if (ui.lesson) return renderLesson();
    const p = prog();
    const label = Trainer.OS_META[os()].label;
    const total = lessons[os()].reduce((n, l) => n + l.commands.length, 0);
    const done = lessons[os()].reduce((n, l) => n + l.commands.filter((c) => p.guided[c]).length, 0);

    root.append(sectionHead('Guided practice', `${label}: learn each command step by step. ${done} of ${total} commands learned.`,
      h('button', { class: 'btn btn-quiet', text: `Reset ${label} Learn progress`, onclick: resetLearn })));

    const grid = h('div', { class: 'lesson-grid' });
    for (const lesson of lessons[os()]) {
      const learned = lesson.commands.filter((c) => p.guided[c]).length;
      const complete = learned === lesson.commands.length;
      grid.append(h('article', { class: 'lesson-card' + (complete ? ' complete' : '') },
        h('h3', { text: lesson.category }),
        h('div', { class: 'meter' }, h('i', { style: `width:${(learned / lesson.commands.length) * 100}%` })),
        h('p', { class: 'lesson-count', text: `${learned} / ${lesson.commands.length} learned` }),
        h('ul', { class: 'chip-list' }, lesson.commands.map((c) => h('li', { class: p.guided[c] ? 'chip done' : 'chip', text: c }))),
        h('button', {
          class: 'btn ' + (complete ? '' : 'btn-primary'),
          text: complete ? 'Review' : learned ? 'Continue' : 'Start',
          onclick: () => startLesson(lesson),
        })));
    }
    root.append(grid);
  }

  function startLesson(lesson) {
    const p = prog();
    const first = lesson.commands.findIndex((c) => !p.guided[c]);
    ui.lesson = { category: lesson.category, commands: lesson.commands, i: Math.max(0, first), step: 'learn', misses: 0, solved: false };
    render();
  }

  function cheatSheet(tag) {
    const cards = decks[os()].filter((c) => c.tag === tag);
    if (!cards.length) return null;
    return h('table', { class: 'cheat' },
      h('tbody', null, cards.map((c) => h('tr', null, h('td', null, h('code', { text: c.cmd })), h('td', { text: c.meaning })))));
  }

  function renderLesson() {
    const L = ui.lesson;
    if (L.i >= L.commands.length) return renderLessonDone();
    const cmd = L.commands[L.i];
    const qs = questionsFor(os(), cmd);
    const tryQ = qs.find((q) => q.style === 'recall') || qs[0];
    const ownQ = qs.find((q) => q.id !== tryQ.id && q.style === 'scenario') || qs.find((q) => q.id !== tryQ.id) || tryQ;
    const steps = [['learn', 'Learn'], ['try', 'Try it'], ['own', 'On your own']];

    root.append(h('div', { class: 'lesson-top' },
      h('button', { class: 'btn btn-quiet', text: '← All lessons', onclick: () => { ui.lesson = null; render(); } }),
      h('span', { class: 'lesson-where', text: `${L.category} · command ${L.i + 1} of ${L.commands.length}` }),
      h('ol', { class: 'steps' }, steps.map(([key, name], n) => h('li', {
        class: key === L.step ? 'on' : steps.findIndex((s) => s[0] === L.step) > n ? 'past' : '',
        text: `${n + 1}. ${name}`,
      })))));

    const panel = h('section', { class: 'lesson-panel' });
    root.append(panel);

    if (L.step === 'learn') {
      const next = h('button', { class: 'btn btn-primary', text: 'Try it ▸', onclick: () => { L.step = 'try'; L.solved = false; render(); } });
      append(panel, 
        h('h2', { class: 'cmd-title' }, h('code', { text: cmd })),
        h('p', { class: 'about', text: BANK.info[os()][cmd] }),
        h('h3', { class: 'mini-head', text: 'Forms to know' }),
        cheatSheet(cmd),
        h('div', { class: 'row' }, next));
      next.focus();
      return;
    }

    const isTry = L.step === 'try';
    const q = isTry ? tryQ : ownQ;
    const nextLabel = isTry ? 'Next: on your own ▸' : L.i + 1 < L.commands.length ? 'Next command ▸' : 'Finish lesson ▸';
    const nextBtn = h('button', { class: 'btn btn-primary', text: nextLabel, hidden: !L.solved, onclick: advance });
    const hintBox = h('p', { class: 'guided-hint', hidden: true, text: 'Hint: ' + q.hint });

    function advance() {
      if (isTry) { L.step = 'own'; }
      else { L.i++; L.step = 'learn'; }
      L.misses = 0;
      L.solved = false;
      render();
    }

    const term = miniTerm((raw, t) => {
      if (L.solved) { advance(); return; }
      const text = Checker.normalize(raw);
      if (!text) return;
      const r = Checker.check(text, q);
      if (r.status === 'correct') {
        L.solved = true;
        t.print(trimOutput(q.output));
        t.print('✔ ' + q.why, 'game ok');
        if (!isTry) {
          prog().guided[cmd] = true;
          save();
          t.print(`You've learned ${cmd}. Press Enter or click ${nextLabel.replace(' ▸', '')}.`, 'game dim');
        } else {
          t.print('Press Enter to try it on your own.', 'game dim');
        }
        nextBtn.hidden = false;
        return;
      }
      if (r.status === 'case') { t.print(caseNote(), 'game warn'); return; }
      if (r.status === 'command') {
        t.print(isTry ? `Right command. Now type the whole example: ${q.answers[0]}` : 'Right command! Now add the rest: the switches or arguments the question asks for.', 'game warn');
        return;
      }
      if (isTry) { t.print(`Not quite. Type exactly: ${q.answers[0]}`, 'game bad'); return; }
      L.misses++;
      if (L.misses >= MISSES_BEFORE_REVEAL) t.print(`The answer is: ${q.answers[0]}. Type it to continue.`, 'game bad');
      else { t.print('Not quite. Try again, or open the hint.', 'game bad'); hintBox.hidden = false; }
    }, { tall: true });

    append(panel, 
      h('p', { class: 'step-intro', text: isTry ? 'Type this example and press Enter to see what it does:' : 'Now answer without the example. The answer appears after two misses.' }),
      isTry ? h('p', { class: 'copy-this' }, h('code', { text: q.answers[0] })) : null,
      h('p', { class: 'lesson-q', text: q.q }),
      term.el,
      hintBox,
      h('div', { class: 'row' },
        isTry ? null : h('button', { class: 'btn', text: 'Hint', onclick: () => { hintBox.hidden = false; term.focus(); } }),
        nextBtn));
    term.focus();
  }

  function renderLessonDone() {
    const L = ui.lesson;
    root.append(h('section', { class: 'lesson-panel done' },
      h('h2', { text: `${L.category} complete` }),
      h('p', { text: `You worked through ${L.commands.length} command${L.commands.length > 1 ? 's' : ''}:` }),
      h('ul', { class: 'chip-list' }, L.commands.map((c) => h('li', { class: 'chip done', text: c }))),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', text: 'Back to lessons', onclick: () => { ui.lesson = null; render(); } }),
        h('button', {
          class: 'btn',
          text: 'Flash cards for this lesson',
          onclick: () => { prog().cardCat = L.category; store.tab = 'cards'; ui.lesson = null; ui.card = null; save(); render(); },
        }))));
  }

  function resetLearn() {
    const label = Trainer.OS_META[os()].label;
    if (!window.confirm(`Reset ${label} Learn progress (lessons, flash cards, and mini-game bests)? Practice scores are not affected.`)) return;
    store.os[os()] = blankProgress();
    save();
    ui.os = null;
    render();
  }

  // ===================================================================
  // Flash cards (Leitner boxes: 0 new, 1-3 learning, 4-5 mastered)
  // ===================================================================
  const BOX_WEIGHT = [3, 6, 3, 2, 1, 0.5];
  const MASTERED = 4;

  function filteredDeck() {
    const cat = prog().cardCat;
    return decks[os()].filter((c) => cat === 'all' || c.category === cat);
  }

  function nextCard() {
    const boxes = prog().boxes;
    const pool = filteredDeck();
    const recent = new Set(ui.recent);
    const candidates = pool.length > 3 ? pool.filter((c) => !recent.has(c.id)) : pool;
    const weights = candidates.map((c) => BOX_WEIGHT[boxes[c.id] || 0]);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function renderCards() {
    const p = prog();
    const pool = filteredDeck();
    if (!pool.length) { p.cardCat = 'all'; save(); return renderCards(); }
    if (!ui.card || !pool.some((c) => c.id === ui.card.id)) { ui.card = nextCard(); ui.flipped = false; }

    const counts = { new: 0, learning: 0, mastered: 0 };
    for (const c of pool) {
      const b = p.boxes[c.id] || 0;
      counts[b === 0 ? 'new' : b >= MASTERED ? 'mastered' : 'learning']++;
    }

    const categories = ['all'].concat([...new Set(decks[os()].map((c) => c.category))]);
    const select = h('select', {
      class: 'select', 'aria-label': 'Category',
      onchange: (e) => { p.cardCat = e.target.value; ui.card = null; ui.recent = []; save(); render(); },
    }, categories.map((c) => h('option', { value: c, selected: c === p.cardCat, text: c === 'all' ? 'All categories' : c })));

    const dirBtn = (dir, label) => h('button', {
      class: 'seg' + (p.cardDir === dir ? ' on' : ''), text: label,
      onclick: () => { p.cardDir = dir; ui.flipped = false; save(); render(); },
    });

    root.append(sectionHead('Flash cards', 'Flip, then rate yourself. Cards you miss come back sooner. Keys: Space flips, 1 / 2 / 3 rate.',
      h('div', { class: 'card-controls' }, select, h('div', { class: 'segmented' }, dirBtn('cmd', 'Command → meaning'), dirBtn('meaning', 'Meaning → command')))));

    const total = pool.length;
    root.append(h('div', { class: 'deck-stats' },
      h('span', null, h('i', { class: 'dot new' }), `${counts.new} new`),
      h('span', null, h('i', { class: 'dot learning' }), `${counts.learning} learning`),
      h('span', null, h('i', { class: 'dot strong' }), `${counts.mastered} mastered`),
      h('div', { class: 'meter wide' }, h('i', { style: `width:${(counts.mastered / total) * 100}%` }))));

    const c = ui.card;
    const cmdFace = () => [h('code', { class: 'card-cmd', text: c.cmd }), c.also && c.also.length ? h('p', { class: 'card-also', text: 'Also: ' + c.also.join('  ·  ') }) : null];
    const meaningFace = () => [h('p', { class: 'card-meaning', text: c.meaning })];
    const front = p.cardDir === 'cmd' ? cmdFace() : meaningFace();
    const back = p.cardDir === 'cmd' ? meaningFace() : cmdFace();
    const info = BANK.info[os()][c.tag];

    const card = h('div', {
      class: 'flashcard' + (ui.flipped ? ' flipped' : ''), tabindex: '0', role: 'button',
      'aria-label': ui.flipped ? 'Card back' : 'Card front. Press Space to flip.',
      onclick: flip,
    },
      h('div', { class: 'face front' }, h('span', { class: 'face-tag', text: c.category }), front, h('span', { class: 'face-foot', text: 'Click or press Space to flip' })),
      h('div', { class: 'face back' }, h('span', { class: 'face-tag', text: c.category }), back,
        info ? h('p', { class: 'card-info', text: info }) : null));

    root.append(h('div', { class: 'card-stage' }, card), cardActions());
  }

  function cardActions() {
    const grade = (label, key, cls, fn) => h('button', { class: 'btn grade ' + cls, onclick: fn }, h('kbd', { text: key }), label);
    return ui.flipped
      ? h('div', { class: 'row center card-actions' },
          grade('Again', '1', 'again', () => rate(0)),
          grade('Good', '2', 'good', () => rate(1)),
          grade('Easy', '3', 'easy', () => rate(2)))
      : h('div', { class: 'row center card-actions' }, h('button', { class: 'btn btn-primary', text: 'Flip (Space)', onclick: flip }));
  }

  // Flip in place so the CSS turn animates.
  function flip() {
    ui.flipped = !ui.flipped;
    const card = root.querySelector('.flashcard');
    const actions = root.querySelector('.card-actions');
    if (!card || !actions) return render();
    card.classList.toggle('flipped', ui.flipped);
    card.setAttribute('aria-label', ui.flipped ? 'Card back' : 'Card front. Press Space to flip.');
    actions.replaceWith(cardActions());
  }

  // 0 = again, 1 = good, 2 = easy
  function rate(level) {
    const p = prog();
    const id = ui.card.id;
    const box = p.boxes[id] || 0;
    p.boxes[id] = level === 0 ? 1 : Math.min(5, Math.max(1, box) + level);
    ui.recent = ui.recent.concat(id).slice(-3);
    ui.card = nextCard();
    ui.flipped = false;
    save();
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (Trainer.view !== 'learn' || store.tab !== 'cards' || ui.game) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || (e.key === 'Enter' && tag !== 'BUTTON')) {
      if (tag === 'BUTTON' && e.key === ' ') return;
      e.preventDefault();
      flip();
    } else if (ui.flipped && ['1', '2', '3'].includes(e.key)) {
      rate(Number(e.key) - 1);
    }
  });

  // ===================================================================
  // Mini games
  // ===================================================================
  const GAMES = [
    { id: 'match', name: 'Match-up', blurb: `Pair ${MATCH_PAIRS} commands with what they do, against the clock.`, best: (b) => (b != null ? `Best: ${b}s` : 'No best yet') },
    { id: 'speed', name: 'Speed Round', blurb: `${SPEED_SECONDS} seconds. Read what it does, type the command. Tab skips.`, best: (b) => (b != null ? `Best: ${b} commands` : 'No best yet') },
    { id: 'detective', name: 'Output Detective', blurb: `See real-looking output and pick the command that produced it. ${DETECTIVE_ROUNDS} rounds.`, best: (b) => (b != null ? `Best: ${b} / ${DETECTIVE_ROUNDS}` : 'No best yet') },
    { id: 'chmod', name: 'Permission Puzzle', blurb: `Convert chmod numbers and rwx strings both ways. ${CHMOD_ROUNDS} rounds.`, best: (b) => (b != null ? `Best: ${b} / ${CHMOD_ROUNDS}` : 'No best yet'), unix: true },
  ];

  function renderGames() {
    if (ui.game === 'match') return renderMatch();
    if (ui.game === 'speed') return renderSpeed();
    if (ui.game === 'detective') return renderDetective();
    if (ui.game === 'chmod') return renderChmod();
    const p = prog();
    root.append(sectionHead('Mini games', `Quick drills for ${Trainer.OS_META[os()].label}. Your best scores are saved.`));
    const grid = h('div', { class: 'game-grid' });
    for (const g of GAMES) {
      if (g.unix && os() === 'windows') continue;
      grid.append(h('article', { class: 'game-card' },
        h('h3', { text: g.name }),
        h('p', { text: g.blurb }),
        h('p', { class: 'best', text: g.best(p.best[g.id]) }),
        h('button', { class: 'btn btn-primary', text: 'Play', onclick: () => { closeGame(); ui.game = g.id; render(); } })));
    }
    root.append(grid);
  }

  function gameTop(name, extra) {
    return h('div', { class: 'lesson-top' },
      h('button', { class: 'btn btn-quiet', text: '← Games', onclick: () => { closeGame(); render(); } }),
      h('span', { class: 'lesson-where', text: name }),
      extra || null);
  }

  function recordBest(id, value, lowerIsBetter) {
    const best = prog().best;
    const better = best[id] == null || (lowerIsBetter ? value < best[id] : value > best[id]);
    if (better) { best[id] = value; save(); }
    return better;
  }

  function gameOver(title, lines, isBest, again) {
    root.append(h('section', { class: 'lesson-panel done' },
      h('h2', { text: title }),
      lines.map((l) => (typeof l === 'string' ? h('p', { text: l }) : l)),
      isBest ? h('p', { class: 'new-best', text: '★ New best!' }) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary', text: 'Play again', onclick: again }),
        h('button', { class: 'btn', text: 'Back to games', onclick: () => { closeGame(); render(); } }))));
  }

  // ---------- Match-up ----------
  function renderMatch() {
    // Unique meanings and, where possible, one card per command.
    const byTag = new Map();
    for (const c of shuffle(decks[os()])) if (!byTag.has(c.tag)) byTag.set(c.tag, c);
    const cards = shuffle([...byTag.values()]).slice(0, MATCH_PAIRS);
    const state = { left: null, right: null, matched: 0, mistakes: 0, start: Date.now() };

    const clock = h('span', { class: 'clock', text: '0s' });
    const misses = h('span', { class: 'clock', text: '0 misses' });
    root.append(gameTop('Match-up', h('span', { class: 'game-stats' }, clock, misses)));
    root.append(h('p', { class: 'learn-sub', text: 'Click a command, then the description it matches (either order works).' }));

    const timer = setInterval(() => { clock.textContent = Math.floor((Date.now() - state.start) / 1000) + 's'; }, 250);
    ui.cleanup = () => clearInterval(timer);

    const tile = (c, side, text, isCode) => h('button', {
      class: 'tile' + (isCode ? ' code' : ''), 'data-id': c.id, 'data-side': side,
      onclick: (e) => choose(side, c.id, e.currentTarget),
    }, text);
    const left = h('div', { class: 'match-col' }, shuffle(cards).map((c) => tile(c, 'left', c.cmd, true)));
    const right = h('div', { class: 'match-col' }, shuffle(cards).map((c) => tile(c, 'right', c.meaning, false)));
    root.append(h('div', { class: 'match-board' }, left, right));

    function choose(side, id, el) {
      if (el.classList.contains('matched')) return;
      const prev = state[side];
      if (prev) prev.el.classList.remove('selected');
      state[side] = { id, el };
      el.classList.add('selected');
      if (!state.left || !state.right) return;
      const a = state.left;
      const b = state.right;
      state.left = state.right = null;
      a.el.classList.remove('selected');
      b.el.classList.remove('selected');
      if (a.id === b.id) {
        a.el.classList.add('matched');
        b.el.classList.add('matched');
        a.el.disabled = b.el.disabled = true;
        if (++state.matched === cards.length) finish();
      } else {
        state.mistakes++;
        misses.textContent = `${state.mistakes} miss${state.mistakes === 1 ? '' : 'es'}`;
        for (const t of [a.el, b.el]) {
          t.classList.add('wrong');
          setTimeout(() => t.classList.remove('wrong'), 450);
        }
      }
    }

    function finish() {
      clearInterval(timer);
      const secs = Math.round((Date.now() - state.start) / 1000);
      const total = secs + state.mistakes * 3;
      const isBest = recordBest('match', total, true);
      setTimeout(() => {
        root.textContent = '';
        ui.cleanup = null;
        gameOver('All matched!', [
          `Time ${secs}s + ${state.mistakes} miss${state.mistakes === 1 ? '' : 'es'} × 3s = ${total}s (lower is better).`,
          h('table', { class: 'cheat' }, h('tbody', null, cards.map((c) => h('tr', null, h('td', null, h('code', { text: c.cmd })), h('td', { text: c.meaning }))))),
        ], isBest, () => render());
      }, 350);
    }
  }

  // ---------- Speed Round ----------
  function renderSpeed() {
    const st = ui.speed;
    if (!st) {
      root.append(gameTop('Speed Round'));
      root.append(h('section', { class: 'lesson-panel' },
        h('h2', { text: `${SPEED_SECONDS} seconds on the clock` }),
        h('p', { text: 'Each prompt describes a command. Type it exactly and press Enter. Press Tab to skip one. Commands, files, and hosts in the description are the ones to use.' }),
        Trainer.mode === 'windows' ? null : h('p', { class: 'learn-sub', text: 'Case counts on Linux and macOS.' }),
        h('div', { class: 'row' }, h('button', {
          class: 'btn btn-primary', text: 'Start',
          onclick: () => { ui.speed = { score: 0, missed: [], end: Date.now() + SPEED_SECONDS * 1000, card: null, recent: [] }; render(); },
        }))));
      return;
    }
    if (st.done) return speedOver();

    const deck = decks[os()];
    const nextSpeedCard = () => {
      const pool = deck.filter((c) => !st.recent.includes(c.id));
      st.card = pick(pool);
      st.recent = st.recent.concat(st.card.id).slice(-10);
      prompt.textContent = st.card.meaning;
    };

    const clock = h('span', { class: 'clock big' });
    const score = h('span', { class: 'clock big', text: `${st.score} ✓` });
    const bar = h('i');
    root.append(gameTop('Speed Round', h('span', { class: 'game-stats' }, clock, score)));
    root.append(h('div', { class: 'meter wide timer' }, bar));
    const prompt = h('p', { class: 'speed-prompt' });
    root.append(prompt);

    const asQuestion = (c) => ({ os: os(), answers: c.answers, command: c.tag === 'System folders' ? 'ls' : c.tag });
    const term = miniTerm((raw, t) => {
      const text = Checker.normalize(raw);
      if (!text) return;
      const r = Checker.check(text, asQuestion(st.card));
      if (r.status === 'correct') {
        st.score++;
        score.textContent = `${st.score} ✓`;
        t.print('✔ ' + st.card.cmd, 'game ok');
        nextSpeedCard();
      } else if (r.status === 'case') {
        t.print(caseNote(), 'game warn');
      } else if (r.status === 'command') {
        t.print('Right command. It needs the full form; check the description again.', 'game warn');
      } else {
        t.print('✗ Not it. Try again, or Tab to skip.', 'game bad');
      }
    }, {
      onTab: (t) => {
        st.missed.push(st.card);
        t.print(`↷ Skipped: ${st.card.cmd}`, 'game dim');
        nextSpeedCard();
      },
    });
    root.append(term.el);
    if (!st.card) nextSpeedCard(); else prompt.textContent = st.card.meaning;
    term.focus();

    const tick = () => {
      const left = Math.max(0, st.end - Date.now());
      clock.textContent = Math.ceil(left / 1000) + 's';
      bar.style.width = (left / (SPEED_SECONDS * 1000)) * 100 + '%';
      if (left <= 0) {
        st.done = true;
        render();
      }
    };
    tick();
    const timer = setInterval(tick, 200);
    ui.cleanup = () => clearInterval(timer);
  }

  function speedOver() {
    const st = ui.speed;
    if (st.isBest == null) st.isBest = recordBest('speed', st.score, false);
    const lines = [`You typed ${st.score} command${st.score === 1 ? '' : 's'} correctly in ${SPEED_SECONDS} seconds.`];
    if (st.missed.length) {
      lines.push(h('h3', { class: 'mini-head', text: 'Skipped. Review these:' }));
      lines.push(h('table', { class: 'cheat' }, h('tbody', null, st.missed.map((c) => h('tr', null, h('td', null, h('code', { text: c.cmd })), h('td', { text: c.meaning }))))));
    }
    root.append(gameTop('Speed Round'));
    gameOver('Time!', lines, st.isBest, () => { ui.speed = null; render(); });
  }

  // ---------- Output Detective ----------
  const PROMPT_ECHO = /student@|C:\\Users\\student>|^Password:|\[sudo\]/m;

  // Commands whose output can look identical, so they never appear as each other's distractor.
  const LOOKALIKES = [['grep', 'cat']];
  const lookalike = (a, b) => LOOKALIKES.some((set) => set.includes(a) && set.includes(b));

  // Outputs several commands could have printed don't make fair rounds.
  const AMBIGUOUS = /^([A-Z]:\\[^\n]*>|The command completed successfully\.)$/;

  function detectivePool() {
    return BANK.questions.filter((q) => q.os === os()
      && q.command !== '/?' && q.command !== 'sudo' && !q.command.startsWith('/etc/')
      && !PROMPT_ECHO.test(q.output)
      && !AMBIGUOUS.test(trimOutput(q.output).trim())
      && !mentions(q.output, q.command));
  }

  function renderDetective() {
    if (!ui.detective) {
      const rounds = shuffle(detectivePool()).slice(0, DETECTIVE_ROUNDS);
      ui.detective = { rounds, i: 0, score: 0, answered: false };
    }
    const D = ui.detective;
    if (D.i >= D.rounds.length) {
      if (D.isBest == null) D.isBest = recordBest('detective', D.score, false);
      root.append(gameTop('Output Detective'));
      gameOver('Case closed', [`You identified ${D.score} of ${D.rounds.length} outputs.`], D.isBest, () => { ui.detective = null; render(); });
      return;
    }
    const q = D.rounds[D.i];
    if (!D.options || D.optionsFor !== q.id) {
      const tags = Object.keys(BANK.info[os()]).filter((t) => t !== q.command && t !== '/?' && t !== 'sudo'
        && !t.startsWith('/etc/') && !mentions(q.output, t) && !lookalike(t, q.command));
      const same = shuffle(tags.filter((t) => categoryOf[os()][t] === q.category));
      const other = shuffle(tags.filter((t) => categoryOf[os()][t] !== q.category));
      D.options = shuffle([q.command].concat(same.concat(other).slice(0, 3)));
      D.optionsFor = q.id;
      D.answered = false;
    }

    root.append(gameTop('Output Detective', h('span', { class: 'game-stats' },
      h('span', { class: 'clock', text: `Round ${D.i + 1} / ${D.rounds.length}` }),
      h('span', { class: 'clock', text: `${D.score} ✓` }))));
    root.append(h('p', { class: 'learn-sub', text: 'Which command produced this output?' }));
    root.append(h('div', { class: 'terminal' },
      h('div', { class: 'term-titlebar' },
        h('span', { class: 'lights', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('span', { class: 'term-title', text: Trainer.OS_META[os()].title }),
        h('span', { class: 'win-controls', 'aria-hidden': 'true' }, h('i', { text: '–' }), h('i', { text: '□' }), h('i', { text: '✕' }))),
      h('div', { class: 'term-body lt-body' }, h('div', { class: 'term-output', text: trimOutput(q.output) }))));

    const feedback = h('div', { class: 'detective-feedback' });
    const choices = h('div', { class: 'choice-grid' }, D.options.map((t) => h('button', {
      class: 'tile code', text: t,
      onclick: (e) => {
        if (D.answered) return;
        D.answered = true;
        const right = t === q.command;
        if (right) D.score++;
        for (const b of choices.children) {
          b.disabled = true;
          if (b.textContent === q.command) b.classList.add('matched');
        }
        if (!right) e.currentTarget.classList.add('wrong-final');
        feedback.append(
          h('p', { class: right ? 'game ok' : 'game bad', text: right ? '✔ Correct.' : `✗ It was ${q.command}.` }),
          h('p', null, 'Command: ', h('code', { text: q.answers[0] }), '. ', q.why),
          h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', text: D.i + 1 < D.rounds.length ? 'Next ▸' : 'See results ▸', onclick: () => { D.i++; render(); }, autofocus: true })));
        feedback.querySelector('.btn-primary').focus();
      },
    })));
    root.append(choices, feedback);
  }

  // ---------- Permission Puzzle ----------
  const COMMON_MODES = ['755', '644', '600', '700', '750', '640', '775', '664', '444', '400', '711', '777'];
  const toSym = (mode) => mode.split('').map((d) => {
    const n = Number(d);
    return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
  }).join('');
  const explain = (mode) => ['owner', 'group', 'others'].map((who, i) => {
    const n = Number(mode[i]);
    const parts = [n & 4 ? 4 : 0, n & 2 ? 2 : 0, n & 1 ? 1 : 0].filter(Boolean);
    return `${who} ${toSym(mode).slice(i * 3, i * 3 + 3)} = ${parts.length ? parts.join('+') : '0'}${parts.length > 1 ? ' = ' + n : ''}`;
  }).join(' · ');

  function renderChmod() {
    if (!ui.chmod) {
      const rounds = [];
      for (let i = 0; i < CHMOD_ROUNDS; i++) {
        const mode = Math.random() < 0.7 ? pick(COMMON_MODES) : [0, 1, 2].map(() => Math.floor(Math.random() * 8)).join('');
        rounds.push({ mode, ask: Math.random() < 0.5 ? 'num' : 'sym' });
      }
      ui.chmod = { rounds, i: 0, score: 0, answered: false };
    }
    const C = ui.chmod;
    if (C.i >= C.rounds.length) {
      if (C.isBest == null) C.isBest = recordBest('chmod', C.score, false);
      root.append(gameTop('Permission Puzzle'));
      gameOver('Puzzle done', [`${C.score} of ${C.rounds.length} correct.`], C.isBest, () => { ui.chmod = null; render(); });
      return;
    }
    const r = C.rounds[C.i];
    const sym = toSym(r.mode);
    root.append(gameTop('Permission Puzzle', h('span', { class: 'game-stats' },
      h('span', { class: 'clock', text: `Round ${C.i + 1} / ${C.rounds.length}` }),
      h('span', { class: 'clock', text: `${C.score} ✓` }))));

    const input = h('input', {
      class: 'puzzle-input', type: 'text', autocomplete: 'off', spellcheck: 'false',
      maxlength: r.ask === 'num' ? '3' : '9', 'aria-label': 'Your answer',
      placeholder: r.ask === 'num' ? 'e.g. 750' : 'e.g. rwxr-x---',
    });
    const feedback = h('div', { class: 'detective-feedback' });
    const nextBtn = h('button', { class: 'btn btn-primary', text: C.i + 1 < C.rounds.length ? 'Next ▸' : 'See results ▸', hidden: true, onclick: () => { C.i++; render(); } });

    const submit = () => {
      if (C.answered) { C.i++; render(); return; }
      const v = input.value.trim();
      if (!v) return;
      const right = r.ask === 'num' ? v === r.mode : v === sym;
      C.answered = true;
      if (right) C.score++;
      input.disabled = true;
      feedback.append(
        h('p', { class: right ? 'game ok' : 'game bad', text: right ? '✔ Correct.' : `✗ The answer is ${r.ask === 'num' ? r.mode : sym}.` }),
        h('p', null, h('code', { text: `chmod ${r.mode} file` }), ' → ', h('code', { text: '-' + sym })),
        h('p', { class: 'learn-sub', text: explain(r.mode) }));
      nextBtn.hidden = false;
      nextBtn.focus();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    C.answered = false;

    root.append(h('section', { class: 'lesson-panel puzzle' },
      h('p', { class: 'puzzle-key' }, 'r = 4   w = 2   x = 1   (owner · group · others)'),
      h('p', { class: 'step-intro', text: r.ask === 'num' ? 'What number do you give chmod for these permissions?' : 'What permissions does this chmod number set? Type 9 characters, like rwxr-x---.' }),
      h('p', { class: 'puzzle-show' }, h('code', { text: r.ask === 'num' ? sym : r.mode })),
      h('div', { class: 'row' }, input, h('button', { class: 'btn', text: 'Check', onclick: submit }), nextBtn),
      feedback));
    input.focus();
  }

  // ---------- Boot ----------
  render();

  // Exposed for automated play-testing.
  window.__learn = { store, ui, decks, lessons, detectivePool, toSym };
})();
