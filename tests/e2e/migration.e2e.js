// Progress saved under the old storage keys loads under the new ones, then the old keys are removed.
const { openGame, suite } = require('./helpers');

(async () => {
  const t = suite('Storage migration');
  const { browser, page, errors } = await openGame();

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('aplus-cli-trainer-v1', JSON.stringify({ mode: 'linux', os: { linux: { score: 420, streak: 3, best: 7 } } }));
    localStorage.setItem('aplus-cli-learn-v1', JSON.stringify({ tab: 'cards', os: { linux: { guided: { ls: true } } } }));
  });
  await page.reload();

  const s = await page.evaluate(() => ({
    mode: window.__trainer.state.mode,
    score: window.__trainer.state.os.linux.score,
    learned: window.__learn.store.os.linux.guided.ls,
    tab: window.__learn.store.tab,
  }));
  t.expect(s.mode === 'linux' && s.score === 420, 'practice progress carried over from the old key');
  t.expect(s.learned === true && s.tab === 'cards', 'learn progress carried over from the old key');

  // Any save writes the new keys and drops the old ones.
  await page.click('.views button[data-view="learn"]');
  await page.click('.learn-tabs button[data-tab="guided"]');
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  t.expect(JSON.stringify(keys) === JSON.stringify(['cli-practice-game-v1', 'cli-practice-learn-v1']), `only the new keys remain: ${keys}`);

  await t.finish(browser, errors);
})();
