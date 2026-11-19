// Validates data/learn.js flash cards. Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { cards } = require('../data/learn.js');
const { info, questions } = require('../data/questions.js');
const { normalize } = require('../js/checker.js');

const OSES = ['windows', 'linux', 'macos'];
const deck = (os) => cards.filter((c) => c.os.includes(os));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, word) => new RegExp(`(^|[^\\w/.-])${escapeRe(word)}($|[^\\w/.-])`, 'i').test(text);

test('cards have valid fields and known tags', () => {
  for (const c of cards) {
    assert.ok(Array.isArray(c.os) && c.os.length && c.os.every((o) => OSES.includes(o)), `${c.cmd}: os`);
    assert.ok(c.cmd && c.meaning && c.tag, `${c.cmd}: missing field`);
    for (const os of c.os) {
      assert.ok(info[os][c.tag] || (os === 'macos' && c.tag === 'System folders'), `${c.cmd}: no ${os} INFO for tag ${c.tag}`);
    }
  }
});

test('no duplicate commands within a deck', () => {
  for (const os of OSES) {
    const seen = new Set();
    for (const c of deck(os)) {
      const key = os === 'windows' ? normalize(c.cmd).toLowerCase() : normalize(c.cmd);
      assert.ok(!seen.has(key), `${os}: duplicate card ${c.cmd}`);
      seen.add(key);
    }
  }
});

test('every drilled command has at least one card in each OS deck', () => {
  for (const os of OSES) {
    const tags = new Set(deck(os).map((c) => c.tag));
    for (const q of questions.filter((x) => x.os === os)) assert.ok(tags.has(q.command), `${os}: no card for ${q.command}`);
  }
});

test('macOS deck leaves out Linux-only tools', () => {
  for (const c of deck('macos')) {
    assert.ok(!/\b(apt|apt-get|dnf|ip|fsck|mount)\b|\/etc\/shadow/.test(c.cmd), `macOS card uses a Linux-only item: ${c.cmd}`);
  }
});

test('meanings do not name the command', () => {
  for (const c of cards) {
    if (c.tag === '/?') continue; // the help switch is the point, so the command is named
    const t = normalize(c.cmd).split(' ');
    const word = c.tag === 'sudo' ? 'sudo' : t[0] === 'sudo' && t.length > 1 ? t[1] : t[0];
    assert.ok(!mentions(c.meaning, word), `"${c.meaning}" names ${word}`);
  }
});

test('meanings mention the files, hosts, and paths the command uses (fair for Speed Round)', () => {
  for (const c of cards) {
    if (c.tag === 'System folders' || c.tag.startsWith('/etc/')) continue; // naming the file is the point
    for (const arg of normalize(c.cmd).split(' ').slice(1)) {
      if (/^[-/]/.test(arg) && !arg.includes('.') && arg.length < 6) continue; // switches
      if (/^\/[a-z]+:[a-z]+$/i.test(arg)) continue; // Windows switches with a value, like /fs:ntfs
      if (/^[\w-]+:[\w-]*$/.test(arg) && !/^[A-Z]:$/i.test(arg)) continue; // owner:group, described in words
      if (/^[/-]/.test(arg) && !/[.\\:]/.test(arg) && !/^\/(etc|var|mnt|dev|Users|Applications)/.test(arg)) continue;
      if (!/[.\\/:@~*]/.test(arg) || /^[.\\]+$/.test(arg)) continue; // words, numbers, . .. and \
      assert.ok(c.meaning.toLowerCase().includes(arg.replace(/^["']|["']$/g, '').toLowerCase()), `${c.cmd}: meaning should mention ${arg}`);
    }
  }
});
