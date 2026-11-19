// Checks the web app pieces: manifest, icons, and the service worker's offline file list.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const manifest = JSON.parse(read('manifest.webmanifest'));
// sw.js runs in a service worker (it uses `self`), so read its file list from the source.
const FILES = new Function('return ' + read('sw.js').match(/const FILES = (\[[\s\S]*?\]);/)[1])();
const html = read('index.html');

// PNG width and height live at fixed offsets in the IHDR chunk.
function pngSize(file) {
  const b = fs.readFileSync(path.join(ROOT, file));
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${file} is not a PNG`);
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
}

test('manifest has what browsers need to install the app', () => {
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color']) {
    assert.ok(manifest[k], `manifest missing ${k}`);
  }
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), '192 and 512 icons required');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'maskable icon for Android');
});

test('every manifest icon exists and PNG sizes match what the manifest says', () => {
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(ROOT, icon.src)), `missing ${icon.src}`);
    if (icon.type === 'image/png') assert.equal(pngSize(icon.src), icon.sizes, icon.src);
  }
  assert.equal(pngSize('icons/apple-touch-icon.png'), '180x180');
});

test('the service worker caches every file the page loads', () => {
  const local = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1])
    .filter((u) => !/^(https?:|data:|\.\/?$)/.test(u));
  for (const f of local) assert.ok(FILES.includes(f), `sw.js FILES is missing ${f}`);
});

test('the manifest is cached even though app.js adds its link at runtime', () => {
  assert.ok(FILES.includes('manifest.webmanifest'));
  assert.ok(read('js/app.js').includes("link.href = 'manifest.webmanifest'"));
});

test('every file in the service worker list exists', () => {
  for (const f of FILES) {
    if (f === './') continue;
    assert.ok(fs.existsSync(path.join(ROOT, f)), `sw.js lists missing file ${f}`);
  }
});

test('scripts load in dependency order', () => {
  const order = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ['data/questions.js', 'js/checker.js', 'data/learn.js', 'js/app.js', 'js/game.js', 'js/learn.js', 'js/demo.js']);
});
