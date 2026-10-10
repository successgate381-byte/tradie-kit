// Finds every tests/*.test.mjs file and runs them one after another. Stops at the first failure.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('tests')
  .filter((n) => n.endsWith('.test.mjs'))
  .sort((a, b) => (a.startsWith('unit') ? -1 : b.startsWith('unit') ? 1 : a.localeCompare(b)));

if (!files.length) {
  console.error('No test files found in tests/');
  process.exit(1);
}
for (const f of files) {
  console.log('\n--- tests/' + f + ' ---');
  const r = spawnSync(process.execPath, ['tests/' + f], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
}
console.log('\nALL TESTS PASSED');
