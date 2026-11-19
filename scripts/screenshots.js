// Regenerates the README screenshots in docs/screenshots/. Run: npm run screenshots
const path = require('path');
const { openGame, helpers, sleep } = require('../tests/e2e/helpers');

const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

(async () => {
  const { browser, page } = await openGame({ width: 1280, height: 860 });
  const { type, clickText } = helpers(page);
  const shot = (name) => page.screenshot({ path: path.join(OUT, name + '.png') });

  // Put a specific practice question on screen.
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

  // Seed a little progress so the strength panel isn't empty.
  await page.evaluate(() => {
    const s = window.__trainer.state;
    s.os.windows.cmds = {
      cd: { seen: 3, clean: 3, missed: 0, hinted: 0, weak: 0 }, dir: { seen: 2, clean: 2, missed: 0, hinted: 0, weak: 0 },
      ping: { seen: 2, clean: 1, missed: 1, hinted: 0, weak: 2 }, netstat: { seen: 1, clean: 1, missed: 0, hinted: 0, weak: 0 },
      tracert: { seen: 2, clean: 2, missed: 0, hinted: 0, weak: 0 }, sfc: { seen: 1, clean: 1, missed: 0, hinted: 0, weak: 0 },
    };
    Object.assign(s.os.windows, { score: 840, streak: 4, best: 9, answered: 11, clean: 9 });
    localStorage.setItem('cli-practice-game-v1', JSON.stringify(s));
  });

  await force('windows', 'w-ipconfig-2');
  await type('ipconfig /all');
  await shot('practice-windows');

  await force('linux', 'l-chmod-1');
  await type('chown 755 deploy.sh');
  await page.click('#hint-btn');
  await shot('practice-linux-hint');

  await force('macos', 'm-dig-2');
  await type('Dig @8.8.8.8 example.net');
  await type('dig');
  await shot('practice-macos-partial');

  await clickText('.views button', 'Learn');
  await page.click('.modes button[data-mode="windows"]');
  await clickText('.learn-tabs button', 'Guided');
  await page.evaluate(() => [...document.querySelectorAll('.lesson-card')].find((c) => c.querySelector('h3').textContent === 'Network').querySelector('button').click());
  await shot('learn-guided');

  await clickText('.learn-tabs button', 'Flash cards');
  await page.keyboard.press('Space');
  await sleep(600);
  await shot('learn-flashcards');

  await clickText('.learn-tabs button', 'Mini games');
  await page.click('.modes button[data-mode="linux"]');
  await shot('learn-games');
  await page.evaluate(() => [...document.querySelectorAll('.game-card')].find((c) => c.textContent.includes('Output Detective')).querySelector('button').click());
  await shot('learn-detective');

  await browser.close();
  console.log('Screenshots written to docs/screenshots/');
})();
