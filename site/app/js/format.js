// Small pure helpers used everywhere. No page code in here, so they are easy to test.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Make text safe to put inside HTML. */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** True when the value has something in it besides spaces. */
export const has = (v) => String(v ?? '').trim() !== '';

/** Read a number out of text like "$1,350.50". Anything unreadable becomes 0. */
export const num = (v) => parseFloat(String(v ?? '').replace(/[$,\s]/g, '')) || 0;

/** Round to whole cents. */
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Dollars the Australian way: $1,350.00 */
export function money(n) {
  const v = round2(Math.abs(n));
  const [whole, cents] = v.toFixed(2).split('.');
  return (n < 0 && v !== 0 ? '-' : '') + '$' + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + cents;
}

/** "2026-10-06" becomes "6 Oct 2026". Bad or empty input gives "". */
export function fmtDate(iso) {
  const m = ISO.exec(String(iso ?? ''));
  if (!m || +m[2] < 1 || +m[2] > 12) return '';
  return +m[3] + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];
}

/** Add days to an ISO date and give an ISO date back. */
export function addDays(iso, n) {
  const m = ISO.exec(String(iso ?? ''));
  if (!m) return '';
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);
}

const digits = (v, max) => String(v ?? '').replace(/\D/g, '').slice(0, max);

/** ABN with spaces: 51 824 753 556 */
export function formatAbn(v) {
  const d = digits(v, 11);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 11)].filter(Boolean).join(' ');
}

/** The ATO's own ABN check sum. It only tells us the number is well formed. */
export function abnLooksValid(v) {
  const d = digits(v, 20);
  if (d.length !== 11) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const sum = [...d].reduce((a, c, i) => a + (i === 0 ? +c - 1 : +c) * weights[i], 0);
  return sum % 89 === 0;
}

/** BSB with a dash: 062-000 */
export function formatBsb(v) {
  const d = digits(v, 6);
  return d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
}

/** Only allow web links. Anything else (like javascript:) gives "". */
export function safeUrl(v) {
  let s = String(v ?? '').trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}
