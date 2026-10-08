// Safety checks. "syntax" = does the code parse. "lock" = has any locked feature been dropped.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const mode = process.argv[2] || 'all';
const bad = [];
const src = readFileSync('app/app.js', 'utf8');
if (mode === 'syntax' || mode === 'all') {
  const r = spawnSync(process.execPath, ['--check', 'app/app.js'], { encoding: 'utf8' });
  if (r.status !== 0) bad.push('Syntax error in app/app.js:\n' + r.stderr);
  for (const f of ['app/index.html', 'app/app.css', 'app/app.js']) if (!existsSync(f)) bad.push('Missing file: ' + f);
}
if (mode === 'lock' || mode === 'all') {
  for (const re of [/console\.log/, /\bdebugger\b/, /\bTODO\b/, /\bFIXME\b/]) if (re.test(src)) bad.push('Forbidden leftover in app.js: ' + re);
  const lock = JSON.parse(readFileSync('spec/lock.json', 'utf8'));
  for (const s of lock.strings) if (!src.includes(s)) bad.push('Locked text is gone from app.js: "' + s + '"');
  for (const k of lock.keys) if (!src.includes("'" + k + "'")) bad.push('Locked field is gone from app.js: ' + k);
  for (const id of lock.ids) if (!src.includes('id="' + id + '"') && !src.includes("id='" + id + "'")) bad.push('Locked button is gone from app.js: #' + id);
}
if (bad.length) { console.error('\nCHECK FAILED\n' + bad.map(b => ' - ' + b).join('\n') + '\n'); process.exit(1); }
console.log('guard ok (' + mode + ')');
