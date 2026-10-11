// P4: turn a finished Tax Invoice into a CSV file for Xero's sales invoice import.
// Pure functions only (no page code), so the numbers and columns are easy to test.
import { addDays, has, num } from '../../app/js/format.js';

/** Used when the person has not set their own. Xero's standard Sales account is 200. */
export const XERO_DEFAULTS = { xacct: '200', xtax: 'GST on Income', xfree: 'GST Free Income' };

/** Xero's sales invoice template columns, in Xero's order. A star means Xero requires it. */
export const XERO_COLUMNS = [
  '*ContactName', 'EmailAddress', 'POAddressLine1', 'POAddressLine2', 'POAddressLine3', 'POAddressLine4', 'POCity', 'PORegion', 'POPostalCode', 'POCountry',
  '*InvoiceNumber', 'Reference', '*InvoiceDate', '*DueDate', 'Total', 'InventoryItemCode', '*Description', '*Quantity', '*UnitAmount', 'Discount',
  '*AccountCode', '*TaxType', 'TaxAmount', 'TrackingName1', 'TrackingOption1', 'TrackingName2', 'TrackingOption2', 'Currency', 'BrandingTheme',
];

/** 2026-10-06 becomes 06/10/2026, the format Xero expects in Australia. */
function dmy(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/** One CSV cell. Quotes anything with a comma, quote or new line. */
function cell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Stop a spreadsheet treating typed words as a formula (a leading equals, plus, minus or at sign). */
function safeText(v) {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
  return /^[=+\-@]/.test(s) ? ' ' + s : s;
}

/**
 * @param {{ contact: string, address: string, site: string, number: string, issue: string, terms: string,
 *   lines: { d?: string, q?: string, p?: string, g?: string }[], account?: string, gstName?: string, freeName?: string }} i
 * @returns {{ csv: string, missing: string[], rows: number }}
 */
export function buildXeroCsv(i) {
  const used = i.lines.filter((l) => has(l.q) && has(l.p));
  const missing = [];
  if (!has(i.contact)) missing.push('customer name');
  if (!has(i.number)) missing.push('invoice number');
  if (!dmy(i.issue)) missing.push('issue date');
  if (!used.length) missing.push('at least one line with a quantity and price');
  if (missing.length) return { csv: '', missing, rows: 0 };

  const account = has(i.account) ? String(i.account).trim() : XERO_DEFAULTS.xacct;
  const gstName = has(i.gstName) ? String(i.gstName).trim() : XERO_DEFAULTS.xtax;
  const freeName = has(i.freeName) ? String(i.freeName).trim() : XERO_DEFAULTS.xfree;
  const due = dmy(addDays(i.issue, num(i.terms)));

  const rows = used.map((l, n) => {
    const r = Object.fromEntries(XERO_COLUMNS.map((c) => [c, '']));
    r['*ContactName'] = safeText(i.contact);
    r.POAddressLine1 = safeText(i.address);
    r['*InvoiceNumber'] = safeText(i.number);
    r.Reference = safeText(i.site);
    r['*InvoiceDate'] = dmy(i.issue);
    r['*DueDate'] = due;
    r['*Description'] = safeText(l.d) || 'Item ' + (n + 1);
    r['*Quantity'] = String(num(l.q));
    r['*UnitAmount'] = num(l.p).toFixed(2);
    r['*AccountCode'] = account;
    r['*TaxType'] = l.g === 'No' ? freeName : gstName;
    return XERO_COLUMNS.map((c) => cell(r[c])).join(',');
  });
  const csv = [XERO_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n';
  return { csv, missing: [], rows: rows.length };
}

/** A safe file name such as xero-invoice-INV-014.csv */
export function xeroFileName(number) {
  const clean = String(number || '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return 'xero-invoice-' + (clean || 'export') + '.csv';
}
