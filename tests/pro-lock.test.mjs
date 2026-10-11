// Pro lock list: every Pro-only text, field and button must stay. Visits every tab in the Pro menu.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from '../scripts/serve.mjs';

const lock = JSON.parse(readFileSync('tests/pro-lock.json', 'utf8'));
const server = await startServer('site', 0);
const ORIGIN = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
await page.goto(ORIGIN + '/pro/');
await page.waitForSelector('nav button');

const names = await page.locator('nav button').allTextContents();
const seen = { text: '', keys: new Set(), ids: new Set() };
for (const name of names) {
  await page.click(`nav button[data-t="${name}"]`);
  const grab = () => page.evaluate(() => ({
    text: document.body.textContent + ' ' + [...document.querySelectorAll('[placeholder]')].map((e) => e.getAttribute('placeholder')).join(' | '),
    keys: [...document.querySelectorAll('#m [data-k]')].map((e) => e.dataset.k),
    ids: [...document.querySelectorAll('#m [id]')].map((e) => e.id),
  }));
  const r = await grab();
  seen.text += ' ' + r.text;
  r.keys.forEach((k) => seen.keys.add(k));
  r.ids.forEach((i) => seen.ids.add(i));
  if ((await page.locator('#pv').count()) > 0) {
    await page.click('#pv');
    seen.text += ' ' + (await page.evaluate(() => document.getElementById('paper').textContent));
    await page.click('#bk');
  }
}
const flat = seen.text.replace(/\s+/g, ' ');
let failed = 0;
const check = (label, lost) => {
  if (lost.length) {
    failed++;
    console.error('  FAIL  ' + label + ': ' + JSON.stringify(lost));
  } else {
    console.log('  ok    ' + label);
  }
};
check('Pro texts still there (' + lock.strings.length + ')', lock.strings.filter((s) => !flat.includes(s.replace(/\s+/g, ' ').trim())));
check('Pro fields still there (' + lock.keys.length + ')', lock.keys.filter((k) => !seen.keys.has(k)));
check('Pro buttons still there (' + lock.ids.length + ')', lock.ids.filter((i) => !seen.ids.has(i)));
await browser.close();
server.close();
if (failed) process.exit(1);
console.log('Pro lock passed');
