// P2 tests: the client signature pad (Pro only).
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from '../scripts/serve.mjs';

const server = await startServer('site', 0);
const ORIGIN = 'http://127.0.0.1:' + server.address().port;
const LITE = ORIGIN + '/app/';
const PRO = ORIGIN + '/pro/';
const browser = await chromium.launch();
const DESKTOP = { viewport: { width: 1100, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log('  ok    ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL  ' + name + '\n        ' + String(e.message).split('\n').slice(0, 6).join('\n        '));
  }
}

async function open(url, kind = DESKTOP, context) {
  const ctx = context || (await browser.newContext(kind));
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push('page error: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && page.problems.push('console: ' + m.text()));
  await page.goto(url);
  await page.waitForSelector('nav button');
  return page;
}
const tab = (pg, name) => pg.click(`nav button[data-t="${name}"]`);
const saved = (pg, t) => pg.evaluate((name) => (JSON.parse(localStorage.getItem('utedocs.v1') || '{}').T || {})[name] || {}, t);
const todayIso = (pg) => pg.evaluate(() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
});
/** How many pixels on the pad have ink on them. */
const ink = (pg) => pg.evaluate(() => {
  const c = document.getElementById('sg-pad');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n;
});

/** Draw one stroke with the mouse (the same pointer events a finger or pencil sends). */
async function stroke(pg, points) {
  await pg.locator('#sg-pad').scrollIntoViewIfNeeded();
  const box = await pg.locator('#sg-pad').boundingBox();
  const at = ([fx, fy]) => [box.x + box.width * fx, box.y + box.height * fy];
  await pg.mouse.move(...at(points[0]));
  await pg.mouse.down();
  for (const p of points.slice(1)) await pg.mouse.move(...at(p), { steps: 4 });
  await pg.mouse.up();
}
const SQUIGGLE = [[0.1, 0.6], [0.25, 0.3], [0.4, 0.7], [0.55, 0.3], [0.7, 0.65], [0.9, 0.4]];
const UNDERLINE = [[0.1, 0.85], [0.9, 0.85]];

for (const [label, kind] of [['desktop', DESKTOP], ['phone', PHONE]]) {
  await test(`pad shows on Quote and Variation only, fits the screen, on ${label}`, async () => {
    const pg = await open(PRO, kind);
    for (const t of ['Quote', 'Variation']) {
      await tab(pg, t);
      assert.equal(await pg.locator('#sg-pad').count(), 1, t + ' should have the pad');
      assert.ok((await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, t + ': sideways scroll');
      const pad = await pg.locator('#sg-pad').boundingBox();
      const typed = await pg.locator('.sg.edit').boundingBox();
      assert.ok(pad.y + pad.height <= typed.y, t + ': pad should sit above the typed boxes');
    }
    for (const t of ['Tax Invoice', 'Invoice', 'Rate Calculator']) {
      await tab(pg, t);
      assert.equal(await pg.locator('#sg-pad').count(), 0, t + ' should not have the pad');
    }
    assert.deepEqual(pg.problems, []);
  });
}

await test('Lite has no pad', async () => {
  const pg = await open(LITE);
  await tab(pg, 'Quote');
  assert.equal(await pg.locator('#sg-pad').count(), 0);
});

await test('drawing saves the signature, adds today as the accepted date, and shows above the line', async () => {
  const pg = await open(PRO);
  await tab(pg, 'Quote');
  assert.equal(await ink(pg), 0);
  await stroke(pg, SQUIGGLE);
  await stroke(pg, UNDERLINE);
  assert.ok((await ink(pg)) > 200, 'nothing was drawn');
  const s = await saved(pg, 'Quote');
  assert.equal(JSON.parse(s.sigstrokes).length, 2);
  assert.match(s.sigimg, /^data:image\/png;base64,/);
  const today = await todayIso(pg);
  assert.equal(await pg.inputValue('#i-ad'), today);
  assert.notEqual(await pg.locator('#c-adf').textContent(), 'Pick a date');
  await pg.fill('#i-an', 'A. Customer');
  await pg.click('#pv');
  const img = pg.locator('#paper .sg .c img.sigimg');
  assert.equal(await img.count(), 1);
  assert.ok(await img.evaluate((e) => e.complete && e.naturalWidth > 0), 'the picture did not load');
  const imgBox = await img.boundingBox();
  const label = await pg.locator('#paper .sg .c span').nth(1).boundingBox();
  assert.ok(imgBox.y + imgBox.height <= label.y + 1, 'signature picture is not above the line');
  assert.deepEqual(await pg.locator('#paper .sg .c span').allTextContents(), ['Client / customer name', 'Client / customer signature', 'Date']);
  assert.equal(await pg.locator('#paper .sg .c em').first().textContent(), 'A. Customer');
  assert.equal(await pg.locator('#paper .sg .c em').nth(2).textContent(), (await pg.evaluate((iso) => { const [y, m, d] = iso.split('-'); return +d + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1] + ' ' + y; }, today)));
  assert.deepEqual(pg.problems, []);
});

await test('a date the person already typed is never replaced', async () => {
  const pg = await open(PRO);
  await tab(pg, 'Quote');
  await pg.fill('#i-ad', '2026-03-04');
  await stroke(pg, SQUIGGLE);
  assert.equal(await pg.inputValue('#i-ad'), '2026-03-04');
  await pg.click('#sg-clear');
  assert.equal(await pg.inputValue('#i-ad'), '2026-03-04');
});

await test('Undo takes off the last stroke, Clear takes off everything and the automatic date', async () => {
  const pg = await open(PRO);
  await tab(pg, 'Variation');
  await stroke(pg, SQUIGGLE);
  await stroke(pg, UNDERLINE);
  const both = await ink(pg);
  await pg.click('#sg-undo');
  assert.equal(JSON.parse((await saved(pg, 'Variation')).sigstrokes).length, 1);
  assert.ok((await ink(pg)) < both, 'undo did not remove ink');
  await pg.click('#sg-undo');
  assert.equal(await ink(pg), 0);
  assert.equal((await saved(pg, 'Variation')).sigimg, '');
  assert.equal(await pg.inputValue('#i-ad'), '', 'the automatic date should go with the signature');
  await stroke(pg, SQUIGGLE);
  await pg.click('#sg-clear');
  assert.equal(await ink(pg), 0);
  await pg.click('#pv');
  assert.equal(await pg.locator('#paper img').count(), 0);
});

await test('the drawing is still there after a reload, and Clear this document removes it', async () => {
  const pg = await open(PRO, PHONE);
  await tab(pg, 'Quote');
  await stroke(pg, SQUIGGLE);
  const before = await ink(pg);
  await pg.reload();
  await tab(pg, 'Quote');
  assert.ok((await ink(pg)) > before / 3, 'the drawing did not come back');
  await tab(pg, 'Variation');
  assert.equal(await ink(pg), 0, 'Quote signature leaked into Variation');
  await tab(pg, 'Quote');
  pg.once('dialog', (d) => d.accept());
  await pg.click('#clr');
  assert.equal(await ink(pg), 0);
  assert.equal((await saved(pg, 'Quote')).sigimg, undefined);
});

await test('a finger drag on the pad draws and does not scroll the page; a drag elsewhere does scroll', async () => {
  const pg = await open(PRO, PHONE);
  await tab(pg, 'Quote');
  await pg.locator('#sg-pad').scrollIntoViewIfNeeded();
  await pg.evaluate(() => window.scrollBy(0, -120));
  const cdp = await pg.context().newCDPSession(pg);
  const drag = async (x, y, dy) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / 10 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pg.waitForTimeout(150);
  };
  const box = await pg.locator('#sg-pad').boundingBox();
  const y0 = await pg.evaluate(() => window.scrollY);
  await drag(box.x + box.width / 2, box.y + 12, box.height - 30);
  assert.equal(await pg.evaluate(() => window.scrollY), y0, 'the page scrolled while drawing');
  assert.ok((await ink(pg)) > 50, 'the finger drag did not draw');
  // control: the same drag on the page above the pad must scroll, so we know this test can see scrolling
  const head = await pg.locator('.sigpad-h').boundingBox();
  await drag(40, Math.max(60, head.y - 150), -(box.height - 30));
  assert.notEqual(await pg.evaluate(() => window.scrollY), y0, 'test cannot detect scrolling');
});

await test('the finished Quote with a signature still prints on one A4 page', async () => {
  const pg = await open(PRO);
  await tab(pg, 'Quote');
  for (let i = 1; i <= 6; i++) {
    await pg.fill(`[data-k="d${i}"]`, 'Item number ' + i);
    await pg.fill(`[data-k="q${i}"]`, '2');
    await pg.fill(`[data-k="p${i}"]`, '45.50');
  }
  await pg.fill('#i-an', 'A. Customer');
  await stroke(pg, SQUIGGLE);
  await pg.emulateMedia({ media: 'print' });
  const pdf = await pg.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length, 1);
  assert.ok(pdf.toString('latin1').includes('/Subtype /Image') || pdf.toString('latin1').includes('/Subtype/Image'), 'the signature picture is not in the PDF');
});

await test('bad saved data cannot break the page or sneak in a link', async () => {
  const ctx = await browser.newContext(DESKTOP);
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('utedocs.v1')) {
      localStorage.setItem('utedocs.v1', JSON.stringify({ D: {}, T: { Quote: { sigstrokes: 'garbage{', sigimg: 'javascript:alert(1)' }, Variation: { sigstrokes: '[[[1,2],[null,"x"]], 5]', sigimg: 'data:image/png;base64,AAAA"><script>window.hacked=1</script>' } } }));
    }
  });
  const pg = await open(PRO, DESKTOP, ctx);
  for (const t of ['Quote', 'Variation']) {
    await tab(pg, t);
    assert.equal(await pg.locator('#sg-pad').count(), 1);
    await pg.click('#pv');
    assert.equal(await pg.locator('#paper img').count(), 0, t + ': a bad picture was shown');
    assert.ok(!(await pg.evaluate(() => document.getElementById('paper').innerHTML)).includes('javascript:'));
    await pg.click('#bk');
  }
  assert.equal(await pg.evaluate(() => window.hacked), undefined);
  assert.deepEqual(pg.problems, []);
});

await browser.close();
server.close();
if (failed) {
  console.error('\n' + failed + ' signature test(s) failed');
  process.exit(1);
}
console.log('signature tests passed');
