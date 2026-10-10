// Runs the three checks in order and stops at the first failure.
import { spawnSync } from 'node:child_process';

const steps = [
  ['typecheck', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']],
  ['lint', ['scripts/lint.mjs']],
  ['test', ['tests/run.mjs']],
];

for (const [name, args] of steps) {
  console.log('\n=== ' + name + ' ===');
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('\nCHECK FAILED at: ' + name);
    process.exit(1);
  }
}
console.log('\nALL CHECKS PASSED');
