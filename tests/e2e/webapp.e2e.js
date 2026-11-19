// Web app: served over http, the manifest loads, the service worker installs, and the app works offline.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { openGame, suite, sleep } = require('./helpers');

const ROOT = path.resolve(__dirname, '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html')));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  const t = suite('Web app (PWA)');
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const { browser, page, errors } = await openGame({ url: base });

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]').href;
    const r = await fetch(href);
    return { ok: r.ok, json: await r.json() };
  });
  t.expect(manifest.ok && manifest.json.short_name === 'CLI Practice', 'manifest is served and parses');

  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return { active: !!reg.active, scope: reg.scope };
  });
  t.expect(sw.active, `service worker active (scope ${sw.scope})`);
  // Wait until the page is controlled so the next load goes through the worker.
  for (let i = 0; i < 50 && !(await page.evaluate(() => !!navigator.serviceWorker.controller)); i++) await sleep(100);
  const cached = await page.evaluate(async () => (await (await caches.open('cli-practice-v1')).keys()).length);
  t.expect(cached >= 16, `app files cached for offline use (${cached} entries)`);

  await page.setOfflineMode(true);
  await page.reload();
  t.expect((await page.$eval('h1', (e) => e.textContent)) === 'Cross-Platform CLI Practice Game', 'page loads while offline');
  const answer = await page.evaluate(() => window.__trainer.byId[window.__trainer.state.os.windows.current].answers[0]);
  await page.keyboard.type(answer);
  await page.keyboard.press('Enter');
  t.expect((await page.$eval('#term-output', (e) => e.innerText)).includes('✔ Correct'), 'game is playable offline');
  await page.goto(base + '?demo');
  await sleep(600);
  t.expect(await page.evaluate(() => window.APP.demo && window.DemoTour.open), 'demo mode works offline too');
  await page.setOfflineMode(false);

  await t.finish(browser, errors);
  server.close();
})();
