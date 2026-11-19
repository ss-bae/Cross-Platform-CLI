// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize, check, coreOf, commandName } = require('../js/checker.js');

// The command tag defaults to the first word of the first answer, like most bank questions.
const tagOf = (answers) => answers[0].trim().split(/\s+/)[0];
const win = (answers, command = tagOf(answers)) => ({ os: 'windows', answers, command });
const linux = (answers, command = tagOf(answers)) => ({ os: 'linux', answers, command });
const mac = (answers, command = tagOf(answers)) => ({ os: 'macos', answers, command });

test('normalize trims and collapses whitespace', () => {
  assert.equal(normalize('  ipconfig   /all  '), 'ipconfig /all');
  assert.equal(normalize('ls\t-l\n'), 'ls -l');
  assert.equal(normalize(''), '');
  assert.equal(normalize(null), '');
});

test('whitespace differences still pass', () => {
  assert.equal(check('   ipconfig    /all ', win(['ipconfig /all'])).status, 'correct');
  assert.equal(check('ls     -l', linux(['ls -l'])).status, 'correct');
  assert.equal(check('\tchmod  755   script.sh  ', mac(['chmod 755 script.sh'])).status, 'correct');
});

test('whitespace inside a token is not ignored', () => {
  assert.equal(check('ipconfig/all', win(['ipconfig /all'])).status, 'wrong');
  assert.equal(check('l s', linux(['ls'])).status, 'wrong');
});

test('empty input is reported as empty, not wrong', () => {
  assert.equal(check('   ', win(['dir'])).status, 'empty');
  assert.equal(check('', linux(['ls'])).status, 'empty');
});

test('Windows is case-insensitive', () => {
  assert.equal(check('IPCONFIG /ALL', win(['ipconfig /all'])).status, 'correct');
  assert.equal(check('SfC /ScanNow', win(['sfc /scannow'])).status, 'correct');
  assert.equal(check('ipconfig /all', win(['IPCONFIG /ALL'])).status, 'correct');
});

test('Linux is case-sensitive and reports a case mistake', () => {
  assert.equal(check('ls -l', linux(['ls -l'])).status, 'correct');
  assert.equal(check('LS -l', linux(['ls -l'])).status, 'case');
  assert.equal(check('ls -L', linux(['ls -l'])).status, 'case');
  assert.equal(check('Pwd', linux(['pwd'])).status, 'case');
});

test('macOS is case-sensitive and reports a case mistake', () => {
  assert.equal(check('ls /Applications', mac(['ls /Applications'])).status, 'correct');
  assert.equal(check('ls /applications', mac(['ls /Applications'])).status, 'case');
  assert.equal(check('SUDO ls', mac(['sudo ls'])).status, 'case');
});

test('case mistake returns the answer it nearly matched', () => {
  const r = check('Ls -A', linux(['ls -a', 'ls --all']));
  assert.equal(r.status, 'case');
  assert.equal(r.matched, 'ls -a');
});

test('a different command is wrong', () => {
  assert.equal(check('dir', win(['cd ..'])).status, 'wrong');
  assert.equal(check('tracert 8.8.8.8', win(['pathping 8.8.8.8'])).status, 'wrong');
  assert.equal(check('cp a b', linux(['mv a b'])).status, 'wrong');
  assert.equal(check('ipconfig/all', win(['ipconfig /all'])).status, 'wrong');
});

test('the right command alone earns command credit, not full credit', () => {
  assert.equal(check('ipconfig', win(['ipconfig /release'])).status, 'command');
  assert.equal(check('ping', linux(['ping -c 4 8.8.8.8'])).status, 'command');
  assert.equal(check('chmod', mac(['chmod 755 cleanup.sh'])).status, 'command');
});

test('the right command with wrong arguments still earns command credit', () => {
  assert.equal(check('ipconfig /renew', win(['ipconfig /release'])).status, 'command');
  assert.equal(check('ls -la', linux(['ls -l'])).status, 'command');
  assert.equal(check('ipconfig /all /renew', win(['ipconfig /all'])).status, 'command');
});

test('command credit reports the answer it matched, for showing the full form', () => {
  const r = check('mkdir', win(['md Reports', 'mkdir Reports'], 'md'));
  assert.equal(r.status, 'command');
  assert.equal(r.matched, 'mkdir Reports');
});

test('two-word Windows commands need both words', () => {
  const q = win([String.raw`net use Z: \\fileserver\shared`], 'net use');
  assert.equal(check('net use', q).status, 'command');
  assert.equal(check('NET USE', q).status, 'command');
  assert.equal(check('net', q).status, 'wrong');
  assert.equal(check('net user', q).status, 'wrong');
});

test('sudo is optional for command credit unless sudo is the point', () => {
  const chown = linux(['sudo chown alice report.txt'], 'chown');
  assert.equal(check('chown', chown).status, 'command');
  assert.equal(check('sudo chown', chown).status, 'command');
  assert.equal(check('sudo chown alice report.txt', chown).status, 'correct');
  const sudo = linux(['sudo reboot'], 'sudo');
  assert.equal(check('sudo', sudo).status, 'command');
  assert.equal(check('reboot', sudo).status, 'wrong');
});

test('when the tag is the point, the whole answer is required', () => {
  const help = win(['chkdsk /?'], '/?');
  assert.deepEqual(coreOf('chkdsk /?', help), ['chkdsk', '/?']);
  assert.equal(check('chkdsk', help).status, 'wrong');
  assert.equal(check('chkdsk /?', help).status, 'correct');
  const hosts = linux(['cat /etc/hosts'], '/etc/hosts');
  assert.equal(check('cat', hosts).status, 'wrong');
  assert.equal(check('cat /etc/hostname', hosts).status, 'wrong');
});

test('command credit is case-sensitive on Linux/macOS and reports case', () => {
  assert.equal(check('Ping', linux(['ping -c 4 8.8.8.8'])).status, 'case');
  assert.equal(check('TOP -o cpu', mac(['top -o cpu'])).status, 'case');
  assert.equal(check('IPCONFIG', win(['ipconfig /all'])).status, 'command');
});

test('alternate spellings of the command count', () => {
  const rd = win(['rmdir /s /q Temp2023', 'rd /s /q Temp2023'], 'rmdir');
  assert.equal(check('rd', rd).status, 'command');
  assert.equal(check('rmdir', rd).status, 'command');
});

test('equivalent answers in the accepted list pass', () => {
  const mkdir = win(['md Reports', 'mkdir Reports']);
  assert.equal(check('md Reports', mkdir).status, 'correct');
  assert.equal(check('MKDIR reports', mkdir).status, 'correct');

  const rd = win(['rmdir /s Old', 'rd /s Old']);
  assert.equal(check('rd /s Old', rd).status, 'correct');
  assert.equal(check('rmdir /S old', rd).status, 'correct');
});

test('switch order variants pass when listed', () => {
  const la = linux(['ls -la', 'ls -al', 'ls -l -a', 'ls -a -l']);
  for (const a of ['ls -la', 'ls -al', 'ls -l -a', 'ls -a -l']) {
    assert.equal(check(a, la).status, 'correct', a);
  }
  const chk = win(['chkdsk C: /f /r', 'chkdsk C: /r /f']);
  assert.equal(check('chkdsk c: /R /F', chk).status, 'correct');
});

test('accepted answers are themselves normalized', () => {
  assert.equal(check('ping 8.8.8.8', linux(['  ping   8.8.8.8 '])).status, 'correct');
});

test('commandName returns the first word', () => {
  assert.equal(commandName('  net   use Z: \\\\srv\\share'), 'net');
  assert.equal(commandName(''), '');
});
