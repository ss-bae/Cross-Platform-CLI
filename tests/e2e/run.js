// Runs every *.e2e.js suite in its own process and exits non-zero if any fail.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const suites = fs.readdirSync(__dirname).filter((f) => f.endsWith('.e2e.js')).sort();
let failed = 0;
for (const file of suites) {
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(`\n${suites.length - failed}/${suites.length} browser suites passed`);
process.exit(failed ? 1 : 0);
