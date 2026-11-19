// Learn mode: guided lessons, flash cards, all four mini games, OS switching, persistence.
const { openGame, suite, helpers, sleep } = require('./helpers');

const css = (s) => s.replace(/["\\]/g, '\\$&');
const mentions = (text, word) => new RegExp(`(^|[^\\w/.-])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\w/.-])`, 'i').test(text);

(async () => {
  const t = suite('Learn mode');
  const { browser, page, errors } = await openGame();
  const { type, text, clickText } = helpers(page);
  const learn = () => page.evaluate(() => window.__learn.store);
  const playGame = (name) => page.evaluate((name) => [...document.querySelectorAll('.game-card')]
    .find((c) => c.textContent.includes(name)).querySelector('button').click(), name);
  const openLesson = (name) => page.evaluate((name) => [...document.querySelectorAll('.lesson-card')]
    .find((c) => c.querySelector('h3').textContent === name).querySelector('button').click(), name);

  t.section('Switch to Learn');
  await clickText('.views button', 'Learn');
  t.expect(await page.$eval('body', (e) => e.dataset.view) === 'learn', 'learn view active');
  t.expect(await page.$eval('.layout', (e) => getComputedStyle(e).display) === 'none', 'practice layout hidden');
  await page.keyboard.type('zzz');
  t.expect(await page.$eval('#term-input', (e) => e.value) === '', 'typing does not leak into the practice terminal');

  t.section('Guided practice');
  const lessons = await page.$$eval('.lesson-card h3', (hs) => hs.map((x) => x.textContent));
  t.expect(lessons.length === 6, `6 Windows lessons: ${lessons.join(', ')}`);
  await openLesson('Network');
  t.expect((await text('.cmd-title')).trim() === 'ipconfig', 'Network lesson starts with ipconfig');
  t.expect((await page.$$('.cheat tr')).length >= 5, 'cheat sheet lists the ipconfig forms');
  await clickText('.lesson-panel .btn', 'Try it');
  const example = await text('.copy-this code');
  await type('ipconfig /bogus');
  t.expect((await text('.lt-body')).includes('Right command. Now type the whole example'), 'right command, wrong switch: asks for the whole example');
  await type('ping 8.8.8.8');
  t.expect((await text('.lt-body')).includes('Not quite. Type exactly'), 'wrong command: shows what to type');
  await type(example);
  t.expect((await text('.lt-body')).includes('Windows IP Configuration'), `copy step shows output for ${example}`);
  await page.keyboard.press('Enter');
  t.expect((await text('.steps .on')).includes('On your own'), 'moves to On your own');
  t.expect(!(await text('.lesson-panel')).includes('null'), 'no stray "null" text');
  await type('ping');
  await type('tracert');
  let out = await text('.lt-body');
  t.expect(out.includes('The answer is:'), 'answer revealed after two misses');
  await type(out.match(/The answer is: (.+?)\. Type it/)[1]);
  t.expect((await text('.lt-body')).includes("You've learned ipconfig"), 'command marked learned');
  await page.keyboard.press('Enter');
  t.expect((await text('.cmd-title')).trim() === 'ping', 'next command is ping');
  t.expect((await learn()).os.windows.guided.ipconfig === true, 'guided progress saved');

  t.section('Flash cards');
  await clickText('.learn-tabs button', 'Flash cards');
  await page.keyboard.press('Space');
  t.expect(await page.$eval('.flashcard', (e) => e.classList.contains('flipped')), 'Space flips the card');
  t.expect((await page.$$('.grade')).length === 3, 'Again / Good / Easy after the flip');
  await page.keyboard.press('3');
  t.expect(Object.values((await learn()).os.windows.boxes).includes(3), 'Easy moves a new card to box 3');
  t.expect(!(await page.$eval('.flashcard', (e) => e.classList.contains('flipped'))), 'next card starts face up');
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Space'); await page.keyboard.press('1'); }
  t.expect((await text('.deck-stats')).includes('learning'), 'deck stats count learning cards');
  await clickText('.seg', 'Meaning');
  t.expect(!(await page.$('.flashcard .front .card-cmd')), 'Meaning → command puts the meaning on the front');
  await page.select('.select', 'Disk management');
  const disk = await page.evaluate(() => window.__learn.decks.windows.filter((c) => c.category === 'Disk management').map((c) => c.meaning));
  t.expect(disk.includes((await text('.flashcard .front .card-meaning')).trim()), 'category filter limits the deck');

  t.section('Match-up');
  await clickText('.learn-tabs button', 'Mini games');
  const games = await page.$$eval('.game-card h3', (hs) => hs.map((x) => x.textContent));
  t.expect(games.length === 3 && !games.includes('Permission Puzzle'), `Windows games: ${games.join(', ')}`);
  await playGame('Match-up');
  const ids = await page.$$eval('.match-col:first-child .tile', (ts) => ts.map((x) => x.dataset.id));
  const rightIds = await page.$$eval('.match-col:last-child .tile', (ts) => ts.map((x) => x.dataset.id));
  t.expect(ids.length === 6, '6 pairs on the board');
  await page.click(`.match-col:first-child .tile[data-id="${css(ids[0])}"]`);
  await page.click(`.match-col:last-child .tile[data-id="${css(rightIds.find((id) => id !== ids[0]))}"]`);
  t.expect((await text('.game-stats')).includes('1 miss'), 'a wrong pair counts a miss');
  for (const id of ids) {
    await page.click(`.match-col:last-child .tile[data-id="${css(id)}"]`); // description first works too
    await page.click(`.match-col:first-child .tile[data-id="${css(id)}"]`);
  }
  await sleep(500);
  t.expect((await text('.learn-body')).includes('All matched!'), 'match finished');
  t.expect(typeof (await learn()).os.windows.best.match === 'number', 'best time saved');

  t.section('Speed Round');
  await clickText('.lesson-panel .btn', 'Back to games');
  await playGame('Speed Round');
  await clickText('.lesson-panel .btn', 'Start');
  for (let i = 0; i < 3; i++) {
    const meaning = await text('.speed-prompt');
    const card = await page.evaluate((m) => window.__learn.decks[window.Trainer.mode].find((c) => c.meaning === m), meaning);
    await type(card.cmd);
  }
  await type('nonsense');
  t.expect((await text('.lt-body')).includes('Not it'), 'wrong answer rejected');
  await page.keyboard.press('Tab');
  t.expect((await text('.lt-body')).includes('Skipped:'), 'Tab skips and reveals the answer');
  t.expect((await text('.game-stats')).includes('3 ✓'), 'score 3');
  await page.evaluate(() => { window.__learn.ui.speed.end = Date.now(); });
  await sleep(500);
  out = await text('.learn-body');
  t.expect(out.includes('Time!') && out.includes('3 commands correctly') && /review these/i.test(out), 'results show score and skipped cards');
  t.expect((await learn()).os.windows.best.speed === 3, 'best score saved');

  t.section('Output Detective');
  await clickText('.lesson-panel .btn', 'Back to games');
  await playGame('Output Detective');
  const rounds = await page.evaluate(() => window.__learn.ui.detective.rounds.map((q) => q.command));
  t.expect(rounds.length === 10, '10 rounds');
  for (let i = 0; i < rounds.length; i++) {
    const opts = await page.$$eval('.choice-grid .tile', (ts) => ts.map((x) => x.textContent));
    if (i === 0) {
      t.expect(opts.length === 4 && opts.includes(rounds[0]), 'four options including the answer');
      const shown = await text('.lt-body');
      t.expect(!opts.some((o) => mentions(shown, o)), 'no option is named in the output');
    }
    const choice = i === 1 ? opts.find((o) => o !== rounds[i]) : rounds[i];
    await page.evaluate((label) => [...document.querySelectorAll('.choice-grid .tile')].find((x) => x.textContent === label).click(), choice);
    if (i === 1) t.expect((await text('.detective-feedback')).includes('It was'), 'a wrong pick reveals the answer');
    await page.keyboard.press('Enter');
  }
  t.expect((await text('.learn-body')).includes('identified 9 of 10'), 'score 9 / 10');

  t.section('OS switching inside Learn');
  const pools = {};
  for (const os of ['linux', 'macos', 'windows']) {
    await page.click(`.modes button[data-mode="${os}"]`);
    pools[os] = await page.evaluate(() => window.__learn.detectivePool().length);
  }
  t.expect(Object.values(pools).every((n) => n >= 10), `every OS has 10+ detective outputs ${JSON.stringify(pools)}`);
  await page.click('.modes button[data-mode="linux"]');
  t.expect(await page.$eval('body', (e) => e.dataset.view) === 'learn', 'still in Learn after an OS switch');
  t.expect((await page.$$eval('.game-card h3', (hs) => hs.map((x) => x.textContent))).includes('Permission Puzzle'), 'Permission Puzzle on Linux');

  t.section('Permission Puzzle');
  await playGame('Permission');
  const chmod = await page.evaluate(() => window.__learn.ui.chmod.rounds);
  for (let i = 0; i < chmod.length; i++) {
    const r = chmod[i];
    const sym = await page.evaluate((m) => window.__learn.toSym(m), r.mode);
    await type(i === 2 ? 'xxx' : r.ask === 'num' ? r.mode : sym);
    if (i === 2) t.expect((await text('.detective-feedback')).includes('The answer is'), 'wrong answer corrected with a breakdown');
    await page.keyboard.press('Enter');
  }
  t.expect((await text('.learn-body')).includes('9 of 10 correct'), 'score 9 / 10');
  t.expect(await page.evaluate(() => window.__learn.toSym('750') === 'rwxr-x---' && window.__learn.toSym('644') === 'rw-r--r--'), 'toSym converts 750 and 644');

  t.section('Linux guided lesson');
  await clickText('.learn-tabs button', 'Guided');
  t.expect((await page.$$eval('.lesson-card h3', (hs) => hs.map((x) => x.textContent))).includes('Configuration files'), 'Linux has a Configuration files lesson');
  await openLesson('File management');
  await clickText('.lesson-panel .btn', 'Try it');
  await type((await text('.copy-this code')).toUpperCase());
  t.expect((await text('.lt-body')).includes('case-sensitive'), 'case mistake flagged in the guided step');

  t.section('Reload and return to Practice');
  await page.reload();
  t.expect(await page.$eval('body', (e) => e.dataset.view) === 'learn', 'Learn view persists');
  t.expect((await page.$eval('.learn-tabs button[aria-selected="true"]', (e) => e.textContent)) === 'Guided practice', 'Learn tab persists');
  await page.click('.modes button[data-mode="windows"]');
  const network = await page.evaluate(() => [...document.querySelectorAll('.lesson-card')]
    .find((c) => c.querySelector('h3').textContent === 'Network').querySelector('.lesson-count').textContent);
  t.expect(network.startsWith('1 /'), `lesson progress persists (${network})`);
  await clickText('.views button', 'Practice');
  t.expect(await page.evaluate(() => document.activeElement.id) === 'term-input', 'practice terminal focused again');
  const answer = await page.evaluate(() => {
    const s = window.__trainer.state.os.windows;
    return window.__trainer.byId[s.current].answers[0];
  });
  await type(answer);
  t.expect((await text('#term-output')).includes('✔ Correct'), 'practice still works');

  await page.setViewport({ width: 390, height: 844 });
  await clickText('.views button', 'Learn');
  await clickText('.learn-tabs button', 'Flash cards');
  t.expect(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal scroll at 390px');

  await t.finish(browser, errors);
})();
