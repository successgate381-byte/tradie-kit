// Number, date and GST tests. No browser needed.
import assert from 'node:assert/strict';
import { abnLooksValid, addDays, esc, fmtDate, formatAbn, formatBsb, has, money, num, round2, safeUrl } from '../site/app/js/format.js';
import { depositFraction, leftToPay, marginForMarkup, rateCalc, sumLines, variationNewTotal } from '../site/app/js/calc.js';

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok    ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL  ' + name + '\n        ' + e.message);
  }
}

test('money shows dollars the Australian way', () => {
  assert.equal(money(1350), '$1,350.00');
  assert.equal(money(0.5), '$0.50');
  assert.equal(money(-12.3), '-$12.30');
  assert.equal(money(1234567.891), '$1,234,567.89');
  assert.equal(money(0), '$0.00');
});

test('num reads typed amounts', () => {
  assert.equal(num('$1,350.00'), 1350);
  assert.equal(num(' 20% '), 20);
  assert.equal(num('abc'), 0);
  assert.equal(num(undefined), 0);
});

test('round2 and has', () => {
  assert.equal(round2(3 * 0.1), 0.3);
  assert.equal(has('  '), false);
  assert.equal(has('x'), true);
});

test('dates show as 6 Oct 2026 and add days', () => {
  assert.equal(fmtDate('2026-10-06'), '6 Oct 2026');
  assert.equal(fmtDate('2026-09-01'), '1 Sep 2026');
  assert.equal(fmtDate(''), '');
  assert.equal(fmtDate('06/10/2026'), '');
  assert.equal(addDays('2026-10-06', 30), '2026-11-05');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('', 5), '');
});

test('ABN and BSB tidy up and the ABN check works', () => {
  assert.equal(formatAbn('51824753556'), '51 824 753 556');
  assert.equal(formatAbn('5182'), '51 82');
  assert.equal(abnLooksValid('51 824 753 556'), true);
  assert.equal(abnLooksValid('51 824 753 557'), false);
  assert.equal(abnLooksValid('1234'), false);
  assert.equal(formatBsb('062000'), '062-000');
  assert.equal(formatBsb('0620'), '062-0');
});

test('links: only web links are kept', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('https://pay.example.com/x'), 'https://pay.example.com/x');
  assert.equal(safeUrl('pay.example.com'), 'https://pay.example.com/');
  assert.equal(safeUrl('hello world'), '');
  assert.equal(safeUrl(''), '');
});

test('esc blocks HTML', () => {
  assert.equal(esc('<b>"x" & \'y\'</b>'), '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
});

test('tax invoice example: 1 x $1,350 + 4 x $110 + GST = $1,969.00', () => {
  const r = sumLines([{ q: '1', p: '1350', g: 'Yes' }, { q: '4', p: '110', g: 'Yes' }, { q: '', p: '', g: 'Yes' }], true, 0.1);
  assert.deepEqual([r.sub, r.gst, r.total, r.gstFree], [1790, 179, 1969, false]);
});

test('quote example: 3 x $95 + GST = $313.50 and a 20% deposit is $62.70', () => {
  const r = sumLines([{ q: '3', p: '95', g: 'Yes' }], true, 0.1);
  assert.equal(r.total, 313.5);
  assert.equal(round2(r.total * depositFraction('20')), 62.7);
});

test('GST-free lines and not-registered documents', () => {
  const lines = [{ q: '1', p: '1000', g: 'No' }, { q: '1', p: '100', g: 'Yes' }];
  const a = sumLines(lines, true, 0.1);
  assert.deepEqual([a.gst, a.total, a.gstFree], [10, 1110, true]);
  const b = sumLines(lines, false, 0.1);
  assert.deepEqual([b.gst, b.total], [0, 1100]);
});

test('deposit box: 20 and 0.2 both mean 20%, 1 means 1%', () => {
  assert.equal(depositFraction('20'), 0.2);
  assert.equal(depositFraction('0.2'), 0.2);
  assert.equal(depositFraction('1'), 0.01);
  assert.equal(depositFraction('150'), 1);
  assert.equal(depositFraction(''), 0);
});

test('rate calculator starting numbers', () => {
  const r = rateCalc({ wage: '$90,000.00', costs: '$25,000.00', weeks: '46', hrs: '25', part: '$120.00', mk: '30', registered: true, gstRate: 0.1 });
  assert.deepEqual([r.need, r.hoursYear, r.hourly, r.hourlyIncl, r.sell, r.profit], [115000, 1150, 100, 110, 156, 36]);
  assert.equal(r.margin.toFixed(1), '23.1');
  const z = rateCalc({ wage: '1', costs: '1', weeks: '0', hrs: '0', part: '', mk: '', registered: false, gstRate: 0.1 });
  assert.deepEqual([z.hourly, z.sell, z.margin], [0, 0, 0]);
});

test('markup versus margin table', () => {
  assert.equal(marginForMarkup(25).toFixed(1), '20.0');
  assert.equal(marginForMarkup(30).toFixed(1), '23.1');
  assert.equal(marginForMarkup(100 / 3).toFixed(1), '25.0');
});

test('variation and quote fee totals', () => {
  assert.equal(variationNewTotal(511.5, 0, 170.5), 682);
  assert.equal(leftToPay(313.5, 50), 263.5);
});

if (failed) {
  console.error('\n' + failed + ' unit test(s) failed');
  process.exit(1);
}
console.log('unit tests passed');
