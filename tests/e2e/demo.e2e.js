// Demo mode: banner, sample progress, the guided tour, "Show me", isolation from real progress.
const { openGame, suite, helpers, sleep } = require('./helpers');

(async () => {
  const t = suite('Demo mode');
  const { browser, page, errors } = await openGame({ query: '?demo' });
  const { text, visible, stats } = helpers(page);
  const tour = () => page.evaluate(() => ({ open: window.DemoTour.open, step: window.DemoTour.step, busy: window.DemoTour.busy }));
  const waitIdle = async () => { for (let i = 0; i < 100 && (await tour()).busy; i++) await sleep(100); };
  const title = () => text('.tour-title');
  const next = async () => { await waitIdle(); await page.click('.tour-next'); await sleep(50); await waitIdle(); };

  t.section('Landing');
  await sleep(600);
  t.expect(await page.$eval('.demo-banner', (e) => getComputedStyle(e).display !== 'none'), 'demo banner shown');
  t.expect(await page.$eval('.tour-link', (e) => getComputedStyle(e).display === 'none'), '"Take the tour" link hidden inside the demo');
  const [score, , best] = await stats();
  t.expect(score === 1240 && best === 8, `sample progress loaded (score ${score}, best ${best})`);
  t.expect((await page.$$('#strength-list li[data-strength="strong"]')).length >= 5, 'strength panel shows sample strong commands');
  t.expect((await tour()).open, 'tour starts automatically on the first visit');
  t.expect((await title()) === 'Welcome to the demo', 'tour opens on the welcome card');

  t.section('Tour');
  await next();
  t.expect((await title()) === 'Three operating systems', 'step 2: OS tabs');
  await next();
  t.expect((await page.$eval('#q-text', (e) => e.textContent)).includes('ping 8.8.8.8'), 'step 3: shows the DNS scenario');
  await next();
  t.expect((await text('#term-output')).includes('Error: unrecognized or incomplete command line.'), 'step 4: auto-typed wrong answer prints a realistic error');
  await next();
  t.expect(await visible('#hint-panel'), 'step 5: hint panel opened');
  t.expect((await page.$$('#hint-choices li')).length === 4, 'four hint choices');
  await next();
  t.expect((await text('#term-output')).includes('✔ Correct') && (await text('#term-output')).includes('Non-authoritative answer'), 'step 6: auto-typed correct answer shows output');
  await next();
  t.expect((await title()) === 'Weak-spot tracking', 'step 7: strength panel');
  await next();
  t.expect(await page.$eval('body', (e) => e.dataset.os) === 'linux', 'step 8: switched to Linux');
  t.expect((await text('#term-output')).includes('wrong capitalization'), 'step 8: case mistake demonstrated');
  await next();
  t.expect(await page.$eval('body', (e) => e.dataset.view) === 'learn' && (await page.$$('.lesson-card')).length > 0, 'step 9: Learn mode lessons');
  await next();
  t.expect((await page.$$('.game-card')).length === 4, 'step 10: mini games (Linux has all four)');
  await next();
  t.expect((await title()) === 'Your turn', 'step 11: final card');
  await sleep(400); // spotlight animates closed
  const spot = await page.$eval('.tour-spot', (e) => e.getBoundingClientRect().width);
  t.expect(spot === 0, 'final card is centered with no spotlight');
  await page.click('.tour-next');
  await sleep(200);
  t.expect(!(await tour()).open, 'tour closes');
  t.expect(await page.$eval('body', (e) => e.dataset.view) === 'practice' && await page.$eval('body', (e) => e.dataset.os) === 'windows', 'back to Windows practice');
  t.expect(await page.evaluate(() => document.activeElement.id) === 'term-input', 'terminal focused after the tour');

  t.section('Show me');
  t.expect(await visible('#showme-btn'), '"Show me" button visible in demo mode');
  const before = (await stats())[0];
  await page.click('#showme-btn');
  await sleep(100);
  for (let i = 0; i < 60 && !(await text('#term-output')).includes('✔'); i++) await sleep(100);
  const out = await text('#term-output');
  const after = (await stats())[0];
  t.expect(out.includes('✔ Correct') && out.includes('with hint'), '"Show me" types the answer and is scored as a hint');
  t.expect(after - before === 25, `+25 points (got ${after - before})`);
  t.expect(!(await visible('#showme-btn')), '"Show me" hidden once solved');

  t.section('Isolation and reload');
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage).sort() }));
  t.expect(storage.local.length === 0, 'nothing written to localStorage (real progress untouched)');
  t.expect(storage.session.includes('demo:cli-practice-game-v1') && storage.session.includes('demo:toured'), `demo progress kept in sessionStorage: ${storage.session}`);
  await page.reload();
  await sleep(600);
  t.expect(!(await tour()).open, 'tour does not reopen on reload');
  t.expect((await stats())[0] === after, 'demo score survives a reload in the same tab');
  await page.click('#demo-replay');
  await sleep(300);
  t.expect((await tour()).open && (await title()) === 'Welcome to the demo', '"Replay tour" restarts it');
  await page.keyboard.press('Escape');
  await sleep(300);
  t.expect(!(await tour()).open, 'Escape closes the tour');

  await page.click('#demo-reset');
  await page.waitForNavigation().catch(() => {});
  await sleep(600);
  t.expect((await stats())[0] === 1240 && (await tour()).open, '"Reset demo" restores the sample progress and the tour');
  await page.keyboard.press('Escape');

  t.section('Exit demo');
  await sleep(300);
  await Promise.all([page.waitForNavigation(), page.click('#demo-exit')]);
  t.expect(!(await page.evaluate(() => location.search.includes('demo'))), 'exit link drops ?demo');
  t.expect(await page.$eval('.demo-banner', (e) => getComputedStyle(e).display === 'none'), 'no banner outside demo mode');
  t.expect((await stats())[0] === 0, 'real progress starts at 0, unaffected by the demo');
  t.expect(!(await visible('#showme-btn')), '"Show me" is demo-only');
  t.expect(await page.$eval('.tour-link', (e) => getComputedStyle(e).display !== 'none'), '"Take the tour" link offered outside the demo');

  t.section('Phone width');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(page.url().split('?')[0] + '?demo');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await sleep(700);
  const pop = await page.$eval('.tour-pop', (e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, w: window.innerWidth }; });
  t.expect(pop.left >= 0 && pop.right <= pop.w, 'tour card fits on a phone screen');
  t.expect(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no horizontal scroll');

  await t.finish(browser, errors);
})();
