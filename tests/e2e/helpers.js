// Shared setup for the browser tests: find Chrome, open the game, collect page errors, count checks.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const GAME_URL = 'file://' + path.resolve(__dirname, '../../index.html');
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

function chromePath() {
  const found = CHROME_CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium executable.');
  return found;
}

// Opens the game with empty storage. Dialogs (reset confirmations) are accepted.
// query is appended to the URL (e.g. '?demo'); url replaces it entirely (e.g. an http:// server).
async function openGame({ width = 1280, height = 900, query = '', url = GAME_URL } = {}) {
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  await page.setViewport({ width, height });
  await page.goto(url + query);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  return { browser, page, errors };
}

function suite(name) {
  let passed = 0;
  let failed = 0;
  console.log(`\n# ${name}`);
  return {
    section(title) { console.log(`\n== ${title} ==`); },
    expect(cond, msg) {
      console.log((cond ? '  PASS ' : '  FAIL ') + msg);
      if (cond) passed++; else failed++;
    },
    async finish(browser, errors) {
      await browser.close();
      if (errors.length) { console.log('  FAIL page errors:', errors); failed++; }
      console.log(`\n${name}: ${passed} passed, ${failed} failed`);
      process.exitCode = failed ? 1 : 0;
    },
  };
}

// Small page helpers shared by the suites.
const helpers = (page) => ({
  async type(text) { await page.keyboard.type(text); await page.keyboard.press('Enter'); },
  text: (sel) => page.$eval(sel, (e) => e.innerText),
  visible: (sel) => page.$eval(sel, (e) => !e.hidden),
  async clickText(sel, label) {
    const ok = await page.evaluate((sel, label) => {
      const el = [...document.querySelectorAll(sel)].find((x) => x.textContent.trim().startsWith(label) && !x.hidden);
      if (el) el.click();
      return !!el;
    }, sel, label);
    if (!ok) throw new Error(`No ${sel} starting with "${label}"`);
  },
  // Current practice question and progress for the active OS.
  current: () => page.evaluate(() => {
    const s = window.__trainer.state;
    const p = s.os[s.mode];
    const q = window.__trainer.byId[p.current];
    return { mode: s.mode, id: q.id, answers: q.answers, command: q.command, prog: p };
  }),
  stats: () => page.evaluate(() => ['score', 'streak', 'best'].map((id) => +document.getElementById(id).textContent)),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { openGame, suite, helpers, sleep, chromePath, GAME_URL };
