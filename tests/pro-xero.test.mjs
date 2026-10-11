// P4 tests: the Xero invoice CSV (Pro only).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startServer } from '../scripts/serve.mjs';
import { XERO_COLUMNS, buildXeroCsv, xeroFileName } from '../site/pro/js/xero-csv.js';

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

/** Xero's template columns, written out by hand so a mistake in the code cannot hide itself. */
const XERO_HEADER = '*ContactName,EmailAddress,POAddressLine1,POAddressLine2,POAddressLine3,POAddressLine4,POCity,PORegion,POPostalCode,POCountry,*InvoiceNumber,Reference,*InvoiceDate,*DueDate,Total,InventoryItemCode,*Description,*Quantity,*UnitAmount,Discount,*AccountCode,*TaxType,TaxAmount,TrackingName1,TrackingOption1,TrackingName2,TrackingOption2,Currency,BrandingTheme'.split(',');

/** A small CSV reader, so the tests check real cells and not just text. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const asObjects = (text) => {
  const [head, ...rest] = parseCsv(text);
  return rest.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
};

/* ---------- the file, no browser ---------- */
const base = {
  contact: 'A. Customer', address: '1 Example St, Parramatta NSW 2150', site: '12 Job Rd', number: 'INV-014', issue: '2026-10-06', terms: '7',
  lines: [{ d: 'Labour', q: '1.5', p: '110', g: 'Yes' }, { d: 'Mixer tap supplied', q: '1', p: '$120.00', g: 'No' }, { d: '', q: '', p: '', g: 'Yes' }],
};

await test('file: Xero columns in Xero order, one row per used line, Australian dates', () => {
  const out = buildXeroCsv(base);
  assert.deepEqual(out.missing, []);
  assert.equal(out.rows, 2);
  assert.ok(out.csv.endsWith('\r\n') && !out.csv.startsWith('\uFEFF'));
  assert.deepEqual(parseCsv(out.csv)[0], XERO_HEADER);
  assert.deepEqual(XERO_COLUMNS, XERO_HEADER);
  const [a, b] = asObjects(out.csv);
  assert.deepEqual(
    [a['*ContactName'], a.POAddressLine1, a['*InvoiceNumber'], a.Reference, a['*InvoiceDate'], a['*DueDate'], a['*Description'], a['*Quantity'], a['*UnitAmount'], a['*AccountCode'], a['*TaxType']],
    ['A. Customer', '1 Example St, Parramatta NSW 2150', 'INV-014', '12 Job Rd', '06/10/2026', '13/10/2026', 'Labour', '1.5', '110.00', '200', 'GST on Income'],
  );
  assert.deepEqual([b['*Description'], b['*Quantity'], b['*UnitAmount'], b['*TaxType']], ['Mixer tap supplied', '1', '120.00', 'GST Free Income']);
  const filled = new Set(['*ContactName', 'POAddressLine1', '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType']);
  for (const col of XERO_HEADER) if (!filled.has(col)) assert.equal(a[col], '', col + ' should stay empty');
});

await test('file: the person own account code and tax names are used', () => {
  const [a, b] = asObjects(buildXeroCsv({ ...base, account: ' 210 ', gstName: 'GST (Sales)', freeName: 'No GST (Sales)' }).csv);
  assert.deepEqual([a['*AccountCode'], a['*TaxType'], b['*TaxType']], ['210', 'GST (Sales)', 'No GST (Sales)']);
});

await test('file: missing details are listed and no file is made', () => {
  const none = buildXeroCsv({ contact: '', address: '', site: '', number: '', issue: '', terms: '7', lines: [] });
  assert.equal(none.csv, '');
  assert.deepEqual(none.missing, ['customer name', 'invoice number', 'issue date', 'at least one line with a quantity and price']);
  assert.deepEqual(buildXeroCsv({ ...base, number: ' ' }).missing, ['invoice number']);
});

await test('file: commas, quotes and new lines are safe, and formulas are switched off', () => {
  const out = buildXeroCsv({ ...base, contact: 'Smith, "Bob" & Co', address: '1 Example St\nParramatta', lines: [{ d: '=HYPERLINK("http://x")', q: '1', p: '10', g: 'Yes' }] });
  const [a] = asObjects(out.csv);
  assert.equal(a['*ContactName'], 'Smith, "Bob" & Co');
  assert.equal(a.POAddressLine1, '1 Example St Parramatta');
  assert.equal(a['*Description'], ' =HYPERLINK("http://x")');
  assert.equal(parseCsv(out.csv).length, 2);
});

await test('file: blank description, big amounts and no payment terms', () => {
  const out = buildXeroCsv({ ...base, terms: '', lines: [{ d: '', q: '2', p: '$1,350.5', g: 'Yes' }] });
  const [a] = asObjects(out.csv);
  assert.deepEqual([a['*Description'], a['*Quantity'], a['*UnitAmount'], a['*DueDate']], ['Item 1', '2', '1350.50', '06/10/2026']);
});

await test('file name is safe', () => {
  assert.equal(xeroFileName('INV-014'), 'xero-invoice-INV-014.csv');
  assert.equal(xeroFileName('../../etc/passwd x'), 'xero-invoice-etc-passwd-x.csv');
  assert.equal(xeroFileName(''), 'xero-invoice-export.csv');
});

/* ---------- the button in a real browser ---------- */
const server = await startServer('site', 0);
const ORIGIN = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const DESKTOP = { viewport: { width: 1100, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };

async function open(url, kind = DESKTOP) {
  const page = await (await browser.newContext({ ...kind, acceptDownloads: true })).newPage();
  page.problems = [];
  page.outside = [];
  page.on('pageerror', (e) => page.problems.push('page error: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && page.problems.push('console: ' + m.text()));
  page.on('request', (r) => !r.url().startsWith(ORIGIN) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && page.outside.push(r.url()));
  await page.goto(ORIGIN + url);
  await page.waitForSelector('nav button');
  return page;
}
const tab = (pg, name) => pg.click(`nav button[data-t="${name}"]`);
const line = (pg, i, d, q, p) => pg.fill(`[data-k="d${i}"]`, d).then(() => pg.fill(`[data-k="q${i}"]`, q)).then(() => pg.fill(`[data-k="p${i}"]`, p));
async function fillInvoice(pg) {
  await tab(pg, 'Tax Invoice');
  await pg.fill('#i-no', 'INV-014');
  await pg.fill('#i-date', '2026-10-06');
  await pg.fill('#i-cust', 'A. Customer');
  await pg.fill('#i-addr', '1 Example St, Parramatta NSW 2150');
  await pg.fill('#i-site', '12 Job Rd');
  await line(pg, 1, 'Labour', '1.5', '110');
  await line(pg, 2, 'Mixer tap supplied', '1', '120');
  await pg.selectOption('[data-k="g2"]', 'No');
}
const gotDownload = (pg, ms = 700) => pg.waitForEvent('download', { timeout: ms }).then((d) => d, () => null);

await test('the button is on the Pro Tax Invoice only; the settings are on the Pro My Details only', async () => {
  const pro = await open('/pro/');
  await tab(pro, 'Tax Invoice');
  assert.equal(await pro.locator('#xe-csv').count(), 1);
  for (const t of ['Quote', 'Invoice', 'Variation', 'Progress Claim']) {
    await tab(pro, t);
    assert.equal(await pro.locator('#xe-csv').count(), 0, t + ' should not have the Xero button');
  }
  await tab(pro, 'My Details');
  assert.deepEqual([await pro.inputValue('#i-xacct'), await pro.inputValue('#i-xtax'), await pro.inputValue('#i-xfree')], ['200', 'GST on Income', 'GST Free Income']);
  const lite = await open('/app/');
  await tab(lite, 'Tax Invoice');
  assert.equal(await lite.locator('#xe-csv').count(), 0);
  await tab(lite, 'My Details');
  assert.equal(await lite.locator('#i-xacct').count(), 0);
});

await test('an unfinished invoice says what Xero needs and makes no file', async () => {
  const pg = await open('/pro/');
  await tab(pg, 'Tax Invoice');
  const waiting = gotDownload(pg);
  await pg.click('#xe-csv');
  assert.equal(await pg.locator('#xe-msg').textContent(), 'Xero needs: customer name, invoice number, issue date, at least one line with a quantity and price.');
  assert.equal(await waiting, null, 'a file was made');
  await pg.fill('#i-cust', 'A. Customer');
  await pg.click('#xe-csv');
  assert.match(await pg.locator('#xe-msg').textContent(), /^Xero needs: invoice number, issue date/);
});

for (const [label, kind] of [['desktop', DESKTOP], ['phone', PHONE]]) {
  await test(`a finished invoice downloads the right file on ${label}`, async () => {
    const pg = await open('/pro/', kind);
    await fillInvoice(pg);
    const waiting = gotDownload(pg, 4000);
    await pg.click('#xe-csv');
    const file = await waiting;
    assert.ok(file, 'no file was downloaded');
    assert.equal(file.suggestedFilename(), 'xero-invoice-INV-014.csv');
    const text = readFileSync(await file.path(), 'utf8');
    assert.ok(!text.startsWith('\uFEFF') && text.endsWith('\r\n'));
    const [a, b] = asObjects(text);
    assert.deepEqual(parseCsv(text)[0], XERO_HEADER);
    assert.deepEqual([a['*ContactName'], a['*InvoiceNumber'], a['*InvoiceDate'], a['*DueDate'], a['*Description'], a['*Quantity'], a['*UnitAmount'], a['*AccountCode'], a['*TaxType']],
      ['A. Customer', 'INV-014', '06/10/2026', '13/10/2026', 'Labour', '1.5', '110.00', '200', 'GST on Income']);
    assert.deepEqual([b['*Description'], b['*UnitAmount'], b['*TaxType']], ['Mixer tap supplied', '120.00', 'GST Free Income']);
    assert.equal(a.POAddressLine1, '1 Example St, Parramatta NSW 2150');
    assert.equal(a.Reference, '12 Job Rd');
    assert.equal(await pg.locator('#xe-msg').textContent(), '');
    assert.deepEqual(pg.problems, []);
    assert.deepEqual(pg.outside, []);
  });
}

await test('the settings change the file and are still there after a reload', async () => {
  const pg = await open('/pro/');
  await tab(pg, 'My Details');
  await pg.fill('#i-xacct', '210');
  await pg.fill('#i-xtax', 'GST on Income (Sales)');
  await pg.fill('#i-xfree', 'No GST Sales');
  await fillInvoice(pg);
  let waiting = gotDownload(pg, 4000);
  await pg.click('#xe-csv');
  let [a, b] = asObjects(readFileSync(await (await waiting).path(), 'utf8'));
  assert.deepEqual([a['*AccountCode'], a['*TaxType'], b['*TaxType']], ['210', 'GST on Income (Sales)', 'No GST Sales']);
  await pg.reload();
  await tab(pg, 'My Details');
  assert.equal(await pg.inputValue('#i-xacct'), '210');
  await pg.fill('#i-xacct', '');
  await tab(pg, 'Tax Invoice');
  waiting = gotDownload(pg, 4000);
  await pg.click('#xe-csv');
  [a, b] = asObjects(readFileSync(await (await waiting).path(), 'utf8'));
  assert.equal(a['*AccountCode'], '200', 'an empty box should fall back to 200');
});

await test('a customer name that looks like a formula cannot run in a spreadsheet', async () => {
  const pg = await open('/pro/');
  await fillInvoice(pg);
  await pg.fill('#i-cust', '=1+1');
  const waiting = gotDownload(pg, 4000);
  await pg.click('#xe-csv');
  const [a] = asObjects(readFileSync(await (await waiting).path(), 'utf8'));
  assert.equal(a['*ContactName'], ' =1+1');
});

await browser.close();
server.close();
if (failed) {
  console.error('\n' + failed + ' Xero test(s) failed');
  process.exit(1);
}
console.log('Xero tests passed');
