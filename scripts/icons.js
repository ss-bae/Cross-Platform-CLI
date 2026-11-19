// Renders icons/icon.svg to the PNG sizes the web app manifest and iOS need. Run: node scripts/icons.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { chromePath } = require('../tests/e2e/helpers');

const DIR = path.join(__dirname, '..', 'icons');
const svg = fs.readFileSync(path.join(DIR, 'icon.svg'), 'utf8');
// Maskable icons get cropped to a circle or squircle, so they need a safe zone: shrink and pad.
const SIZES = [
  { file: 'icon-192.png', size: 192, inset: 0 },
  { file: 'icon-512.png', size: 512, inset: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.12, bg: '#11141a' },
  { file: 'apple-touch-icon.png', size: 180, inset: 0.06, bg: '#11141a' },
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const { file, size, inset, bg } of SIZES) {
    await page.setViewport({ width: size, height: size });
    const pad = Math.round(size * inset);
    await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}">
      <div style="padding:${pad}px;width:${size - pad * 2}px;height:${size - pad * 2}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
    await page.screenshot({ path: path.join(DIR, file), omitBackground: !bg });
    console.log('wrote icons/' + file);
  }
  await browser.close();
})();
