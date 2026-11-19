// Scoring rules: command-only partial credit, full-command bonus, and the skip / review-later queue.
const { openGame, suite, helpers } = require('./helpers');

(async () => {
  const t = suite('Scoring and skip');
  const { browser, page, errors } = await openGame();
  const { type, text, visible, current } = helpers(page);
  const progress = () => page.evaluate(() => {
    const s = window.__trainer.state.os[window.__trainer.state.mode];
    return { score: s.score, streak: s.streak, later: s.later, cmds: s.cmds };
  });

  // Put a specific question on screen so the checks are deterministic.
  const force = async (mode, id) => {
    await page.click(`.modes button[data-mode="${mode}"]`);
    await page.evaluate((id) => {
      const T = window.__trainer;
      const s = T.state.os[T.state.mode];
      s.current = id;
      s.attempt = { id, wrong: 0, hinted: false, solved: false, choices: null, points: 0, matched: null };
      localStorage.setItem('cli-practice-game-v1', JSON.stringify(T.state));
    }, id);
    await page.reload();
  };

  t.section('Command credit and bonus');
  await force('windows', 'w-ipconfig-3');
  t.expect((await text('#points-note')) === 'Command 60 pts · full command +40 bonus', 'points note explains command + bonus');
  await type('ipconfig');
  let out = await text('#term-output');
  let s = await progress();
  t.expect(out.includes('✔ Right command') && out.includes('+60 (first try)'), 'the command alone solves for 60');
  t.expect(out.includes('Full command for the +40 bonus: ipconfig /release'), 'shows the full command for the bonus');
  t.expect(out.includes('Sample output for the full command'), "labels the sample output as the full command's");
  t.expect(s.score === 60 && s.streak === 1, `score 60, streak 1 (got ${s.score}/${s.streak})`);

  await force('windows', 'w-ipconfig-5');
  await type('ipconfig /flushdns');
  out = await text('#term-output');
  s = await progress();
  t.expect(out.includes('+100 (first try, full-command bonus included)'), 'full command = 100');
  t.expect(s.score === 160 && s.streak === 2, `score 160, streak 2 (got ${s.score}/${s.streak})`);

  await force('windows', 'w-netuse-2');
  await type('net');
  t.expect((await text('#term-output')).includes('Not what this question needs'), '"net" alone is not the "net use" command');
  await type('net use');
  out = await text('#term-output');
  t.expect(out.includes('+30 (after 1 miss)') && out.includes('+20 bonus'), 'after a miss: 30 for the command, 20 bonus missed');

  await force('windows', 'w-help-2');
  await type('chkdsk');
  t.expect((await text('#term-output')).includes('Not what this question needs'), 'a /? question needs the full answer');

  await force('linux', 'l-chown-2');
  await type('Chown');
  t.expect((await text('#term-output')).includes('wrong capitalization'), 'wrong-case command is a case error, no credit');
  await type('chown');
  t.expect((await text('#term-output')).includes('✔ Right command'), 'sudo is optional for command credit');
  await force('linux', 'l-ls-2');
  await type('ls -L');
  t.expect((await text('#term-output')).includes('wrong capitalization'), 'ls -L for ls -l is a case error, not partial credit');
  await force('linux', 'l-hosts-1');
  await type('cat');
  t.expect((await text('#term-output')).includes('Not what this question needs'), 'config-file questions need the path');

  await force('macos', 'm-ping-1');
  await type('ping');
  await page.reload();
  out = await text('#term-output');
  t.expect(out.includes('✔ Right command') && out.includes('ping -c 4 1.1.1.1'), 'a partial solve is replayed after reload');

  t.section('Skip and review later');
  await page.click('.modes button[data-mode="windows"]');
  for (let i = 0; i < 2; i++) { // finish the open question, then bank one clean solve for a streak
    await type((await current()).answers[0]);
    await page.keyboard.press('Enter');
  }
  const skipped = await current();
  const streakBefore = (await progress()).streak;
  await type('nope');
  await page.click('#skip-btn');
  let after = await current();
  s = await progress();
  t.expect(streakBefore > 0 && s.streak === 0, 'skip resets the streak');
  t.expect(after.id !== skipped.id, 'skip moves to a new question');
  t.expect(s.later.length === 1 && s.later[0].id === skipped.id, 'skipped question is queued for review');
  t.expect(s.cmds[skipped.command].weak === 3, 'skip after a miss marks the command weak');
  t.expect(await visible('#later-summary'), 'review count shown in the panel');

  await page.reload();
  t.expect((await progress()).later.length === 1, 'review queue survives reload');
  const between = [];
  for (let i = 0; i < 3; i++) {
    const q = await current();
    between.push(q.id);
    await type(q.answers[0]);
    await page.keyboard.press('Enter');
  }
  t.expect(!between.includes(skipped.id), 'skipped question is held back for 3 questions');
  after = await current();
  t.expect(after.id === skipped.id, 'then it comes back');
  t.expect(await visible('#q-review'), 'with a Review tag');
  await type(after.answers[0]);
  t.expect((await progress()).later.length === 0, 'answering it clears the queue');
  t.expect(!(await visible('#skip-btn')), 'Skip is hidden once solved');

  await t.finish(browser, errors);
})();
