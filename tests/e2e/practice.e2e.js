// Practice mode: wrong answers, hints, case errors, mode switches, persistence, reset, weak-spot scheduling.
const { openGame, suite, helpers } = require('./helpers');

(async () => {
  const t = suite('Practice mode');
  const { browser, page, errors } = await openGame();
  const { type, text, visible, current, stats } = helpers(page);
  const focused = () => page.evaluate(() => document.activeElement.id);

  t.section('Windows');
  let q = await current();
  t.expect(q.mode === 'windows', 'starts in Windows mode');
  t.expect(await focused() === 'term-input', 'terminal input has focus on load');
  t.expect((await page.$eval('#term-prompt', (e) => e.textContent)) === 'C:\\Users\\student>', 'Windows prompt');

  await type('foobar /x');
  t.expect((await text('#term-output')).includes("'foobar' is not recognized as an internal or external command"), 'unknown command error');
  t.expect(await visible('#hint-btn'), 'hint button appears after a wrong answer');
  t.expect(!(await visible('#hint-panel')), 'hint panel stays closed until asked');

  await page.click('#hint-btn');
  const choices = await page.$$eval('#hint-choices li', (ls) => ls.map((l) => l.textContent));
  t.expect(choices.length === 4 && new Set(choices).size === 4, `hint shows 4 distinct choices: ${JSON.stringify(choices)}`);
  t.expect(choices.includes(q.answers[0]), 'hint includes the correct answer');
  t.expect((await page.$$('#hint-choices button, #hint-choices a')).length === 0, 'hint choices are not clickable answers');
  t.expect(await focused() === 'term-input', 'focus returns to the terminal after the hint');

  await type(q.answers[0].toUpperCase());
  let out = await text('#term-output');
  t.expect(out.includes('✔ Correct') && out.includes('+25 (with hint'), 'Windows ignores case; 25 pts with hint');
  let [score, streak] = await stats();
  t.expect(score === 25 && streak === 0, `score 25, streak 0 (got ${score}/${streak})`);

  await page.keyboard.press('Enter');
  const q2 = await current();
  t.expect(q2.id !== q.id, 'Enter moves to the next question');
  await page.keyboard.press('ArrowUp');
  t.expect((await page.$eval('#term-input', (e) => e.value)) === q.answers[0].toUpperCase(), 'up-arrow recalls the previous entry');
  await page.evaluate(() => { document.getElementById('term-input').value = ''; });

  const badSwitch = q2.command === 'ipconfig' ? 'ping /bogus' : 'ipconfig /bogus';
  await type(badSwitch);
  out = await text('#term-output');
  t.expect(out.includes('Error: unrecognized or incomplete command line.') || out.includes('Bad option /bogus.'), `realistic bad-switch error (${badSwitch})`);
  await type(q2.answers[0]);
  [score] = await stats();
  t.expect(score === 75, `50 pts after a miss (score ${score})`);

  await page.click('#next-btn');
  const q3 = await current();
  await type('  ' + q3.answers[0].replace(/ /g, '   ') + '  ');
  [score, streak] = await stats();
  t.expect(score === 175 && streak === 1, `first try with messy whitespace: +100, streak 1 (got ${score}/${streak})`);
  const winScore = score;

  t.section('Linux');
  await page.click('.modes button[data-mode="linux"]');
  t.expect(await page.$eval('body', (b) => b.dataset.os) === 'linux', 'theme switches to Linux');
  t.expect((await page.$eval('#term-prompt', (e) => e.textContent)) === 'student@ubuntu:~$ ', 'Linux prompt');
  t.expect(await focused() === 'term-input', 'focus stays in the terminal after a mode switch');
  [score] = await stats();
  t.expect(score === 0, 'Linux keeps its own score');
  q = await current();

  const wrongCase = q.answers[0].replace(/[a-z]/, (c) => c.toUpperCase());
  await type(wrongCase);
  t.expect((await text('#term-output')).includes('wrong capitalization'), `case mistake flagged for "${wrongCase}"`);
  const wrongUnix = q.command === 'ls' ? 'cp -Z' : 'ls -Z';
  await type(wrongUnix);
  t.expect(/invalid option -- 'Z'|cannot access|missing operand/.test(await text('#term-output')), `GNU-style error for ${wrongUnix}`);
  await type('ipconfig');
  t.expect((await text('#term-output')).includes('ipconfig: command not found'), 'Windows command is not found on Linux');
  await type(q.answers[0]);
  [score] = await stats();
  t.expect(score === 50, `solve after misses = 50 (got ${score})`);
  await page.keyboard.press('Enter');
  q = await current();
  await type(q.answers[0]);
  [score, streak] = await stats();
  t.expect(score === 150 && streak === 1, `first try on Linux (got ${score}/${streak})`);
  const linuxScore = score;

  t.section('macOS');
  await page.click('.modes button[data-mode="macos"]');
  t.expect((await page.$eval('#term-prompt', (e) => e.textContent)) === 'student@MacBook ~ % ', 'macOS prompt');
  q = await current();
  await type('sudo apt install nmap');
  out = await text('#term-output');
  t.expect(out.includes('zsh: command not found: apt') && out.includes('Linux tool'), 'apt is flagged as Linux-only on macOS');
  await page.click('#hint-btn');
  await type(q.answers[0]);
  [score] = await stats();
  t.expect(score === 25, `hinted solve = 25 (got ${score})`);
  await page.click('#next-btn');
  q = await current();
  await type(q.answers[0]);
  [score] = await stats();
  const macScore = score;
  const macQ = (await current()).id;
  const weak = await page.$$eval('#strength-list li[data-strength="weak"] .cmd', (ls) => ls.map((l) => l.textContent));
  t.expect(weak.length >= 1, `strength view lists weak commands: ${weak}`);

  t.section('Reload');
  await page.reload();
  const after = await current();
  t.expect(after.mode === 'macos' && after.id === macQ, 'mode and current question persist');
  [score] = await stats();
  t.expect(score === macScore, `macOS score persists (${score})`);
  t.expect((await text('#term-output')).includes('✔ Correct'), 'solved state is replayed');
  await page.click('.modes button[data-mode="windows"]');
  [score] = await stats();
  t.expect(score === winScore, `Windows score persists (${score})`);
  await page.click('.modes button[data-mode="linux"]');
  [score] = await stats();
  t.expect(score === linuxScore, `Linux score persists (${score})`);

  t.section('Reset one OS');
  await page.click('#reset-btn');
  [score] = await stats();
  t.expect(score === 0, 'Linux reset to 0');
  await page.click('.modes button[data-mode="windows"]');
  [score] = await stats();
  t.expect(score === winScore, 'Windows untouched by the Linux reset');

  t.section('Weak-spot scheduling');
  const freq = await page.evaluate(() => {
    const T = window.__trainer;
    const s = T.state.os.windows;
    const pool = Object.values(T.byId).filter((x) => x.os === 'windows');
    for (const x of pool) s.qseen[x.id] = 1;
    s.recent = [];
    s.current = 'w-hostname-1';
    const share = (weak) => {
      s.cmds = { sfc: { seen: 1, clean: 0, missed: 1, hinted: 0, weak } };
      let n = 0;
      for (let i = 0; i < 4000; i++) if (T.pickQuestion('windows').command === 'sfc') n++;
      return n / 4000;
    };
    return { weak3: share(3), weak0: share(0) };
  });
  t.expect(freq.weak3 > freq.weak0 * 3, `a weak command comes up far more often (${(freq.weak3 * 100).toFixed(1)}% vs ${(freq.weak0 * 100).toFixed(1)}%)`);

  t.section('Phone width');
  await page.setViewport({ width: 390, height: 844 });
  t.expect(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal scroll at 390px');

  await t.finish(browser, errors);
})();
