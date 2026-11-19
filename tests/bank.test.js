// Validates data/questions.js against the command lists the game covers.
// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { info, questions } = require('../data/questions.js');
const { check, coreOf } = require('../js/checker.js');

// Windows and Linux command lists, plus the Linux commands that also run in the macOS Terminal.
const REQUIRED = {
  windows: ['cd', 'dir', 'ipconfig', 'ping', 'netstat', 'nslookup', 'net use', 'tracert', 'pathping',
    'chkdsk', 'format', 'diskpart', 'md', 'rmdir', 'robocopy', 'hostname', 'net user', 'winver',
    'whoami', '/?', 'gpupdate', 'gpresult', 'sfc'],
  linux: ['ls', 'pwd', 'mv', 'cp', 'rm', 'chmod', 'chown', 'grep', 'find', 'fsck', 'mount', 'su', 'sudo',
    'apt', 'dnf', 'ip', 'ping', 'curl', 'dig', 'traceroute', 'man', 'cat', 'top', 'ps', 'du', 'df', 'nano',
    '/etc/passwd', '/etc/shadow', '/etc/hosts', '/etc/fstab', '/etc/resolv.conf'],
  macos: ['ls', 'pwd', 'mv', 'cp', 'rm', 'chmod', 'chown', 'grep', 'find', 'su', 'sudo', 'ping', 'curl',
    'dig', 'traceroute', 'man', 'cat', 'top', 'ps', 'du', 'df', 'nano'],
};
const MAC_EXCLUDED = /\b(apt|apt-get|dnf|ip)\b|\/etc\/shadow/;
const FIELDS = ['id', 'os', 'command', 'category', 'style', 'q', 'answers', 'hint', 'why', 'output'];

test('every question has all fields with valid values', () => {
  for (const q of questions) {
    for (const f of FIELDS) assert.ok(q[f] !== undefined && q[f] !== '', `${q.id || '?'} missing ${f}`);
    assert.ok(['windows', 'linux', 'macos'].includes(q.os), `${q.id} bad os`);
    assert.ok(['scenario', 'recall'].includes(q.style), `${q.id} bad style`);
    assert.ok(Array.isArray(q.answers) && q.answers.length > 0, `${q.id} answers`);
    assert.ok(info[q.os] && info[q.os][q.command], `${q.id} has no INFO entry for ${q.command}`);
  }
});

test('ids are unique', () => {
  const seen = new Set();
  for (const q of questions) {
    assert.ok(!seen.has(q.id), `duplicate id ${q.id}`);
    seen.add(q.id);
  }
});

test('only listed commands are drilled', () => {
  for (const q of questions) {
    assert.ok(REQUIRED[q.os].includes(q.command), `${q.id}: ${q.command} is not on the ${q.os} list`);
  }
});

test('every listed command has both a scenario and a recall question', () => {
  for (const [os, commands] of Object.entries(REQUIRED)) {
    for (const cmd of commands) {
      const styles = new Set(questions.filter((q) => q.os === os && q.command === cmd).map((q) => q.style));
      assert.ok(styles.has('scenario'), `${os} ${cmd} has no scenario question`);
      assert.ok(styles.has('recall'), `${os} ${cmd} has no recall question`);
    }
  }
});

test('style mix is roughly half and half per OS', () => {
  for (const os of Object.keys(REQUIRED)) {
    const pool = questions.filter((q) => q.os === os);
    const scenario = pool.filter((q) => q.style === 'scenario').length / pool.length;
    assert.ok(scenario >= 0.4 && scenario <= 0.6, `${os} scenario share ${scenario.toFixed(2)}`);
  }
});

test('macOS leaves out Linux-only items', () => {
  for (const q of questions.filter((x) => x.os === 'macos')) {
    for (const a of q.answers) assert.ok(!MAC_EXCLUDED.test(a), `${q.id} answer uses a Linux-only item: ${a}`);
  }
});

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, phrase) => new RegExp(`(^|[^\\w/.-])${escapeRe(phrase)}($|[^\\w/.-])`, 'i').test(text);

test('hints do not contain the answer or name the command', () => {
  for (const q of questions) {
    for (const a of q.answers) assert.ok(!mentions(q.hint, a), `${q.id} hint contains "${a}"`);
    const word = q.answers[0].split(' ').find((t) => t !== 'sudo');
    if (word.length > 2) assert.ok(!mentions(q.hint, word), `${q.id} hint names the command "${word}"`);
  }
});

test('every OS can build four distinct hint choices for every question', () => {
  for (const q of questions) {
    const others = new Set(questions.filter((x) => x.os === q.os && x.answers[0] !== q.answers[0]).map((x) => x.answers[0]));
    assert.ok(others.size >= 3, `${q.id} lacks distractors`);
  }
});

test('each full answer scores as correct, and typing just the command earns command credit', () => {
  for (const q of questions) {
    for (const a of q.answers) assert.equal(check(a, q).status, 'correct', `${q.id}: "${a}"`);
    const core = coreOf(q.answers[0], q).join(' ');
    const status = check(core, q).status;
    assert.ok(status === 'command' || (status === 'correct' && core === q.answers[0].trim()), `${q.id}: core "${core}" -> ${status}`);
  }
});
