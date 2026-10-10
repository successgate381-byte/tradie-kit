// House rules for the code. No downloads needed. Run with `pnpm lint`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const problems = [];
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (n === 'node_modules' || n.startsWith('.git')) return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = ['site', 'scripts', 'tests'].flatMap(walk);
// Files allowed to talk to a server. Added on purpose, one by one, in later Pro steps.
const ALLOW_NETWORK = [];
const appJs = files.filter((f) => (f.startsWith('site/app/') || f.startsWith('site/pro/')) && f.endsWith('.js'));
const tools = files.filter((f) => /^(scripts|tests)\/.*\.mjs$/.test(f));
const html = files.filter((f) => f.endsWith('.html'));
const css = files.filter((f) => f.endsWith('.css'));

// 1. Every JavaScript file must parse.
for (const f of [...appJs, ...tools]) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) problems.push(f + ': does not parse\n' + r.stderr);
}

// 2. Rules for the app code that visitors run.
const bans = [
  [/\bconsole\./, 'console left in the code'],
  [/\bdebugger\b/, 'debugger left in the code'],
  [/\b(TODO|FIXME)\b/, 'TODO or FIXME left in the code'],
  [/\beval\s*\(|new Function\s*\(/, 'eval is not allowed'],
  [/document\.write/, 'document.write is not allowed'],
  [/\bvar\s/, 'use const or let, not var'],
  [/(?<![=!<>])==(?!=)|!=(?!=)/, 'use === and !==, not == or !='],
  [/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/, 'the app must never send data anywhere'],
  [/\sstyle="/, 'inline style="" is blocked by the security policy, use a CSS class'],
  [/\son[a-z]+="/, 'inline event handlers are blocked by the security policy'],
];
for (const f of appJs) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    for (const [re, why] of bans) {
      if (why.includes('send data') && ALLOW_NETWORK.includes(f)) continue;
      if (re.test(line)) problems.push(`${f}:${i + 1}: ${why}`);
    }
  });
}

// 3. Pages: Australian English, phone friendly, nothing loaded from other websites.
for (const f of html) {
  const t = readFileSync(f, 'utf8');
  if (!t.includes('lang="en-AU"')) problems.push(f + ': needs lang="en-AU"');
  if (!t.includes('name="viewport"')) problems.push(f + ': needs a viewport tag');
  if (/(src|href)="https?:\/\//.test(t)) problems.push(f + ': loads something from another website');
}
for (const f of css) {
  if (/url\(\s*['"]?https?:|@import/.test(readFileSync(f, 'utf8'))) problems.push(f + ': loads something from another website');
}

if (problems.length) {
  console.error('LINT FAILED\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log(`lint ok (${appJs.length} app files, ${tools.length} tool files, ${html.length} pages)`);
