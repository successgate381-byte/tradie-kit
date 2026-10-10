// All the money rules live here. Pure functions: numbers in, numbers out.
import { has, num, round2 } from './format.js';

/** @typedef {{ d?: string, q?: string, p?: string, g?: string }} Line */

/** A line only counts when both quantity and price are filled in. */
export const lineUsed = (/** @type {Line} */ l) => has(l.q) && has(l.p);

/** Quantity times price, to the cent. */
export const lineAmount = (/** @type {Line} */ l) => (lineUsed(l) ? round2(num(l.q) * num(l.p)) : 0);

/**
 * Add up the lines. GST is charged only on lines not marked "No".
 * @param {Line[]} lines
 * @param {boolean} gstOn  does GST apply to this document?
 * @param {number} rate    0.1 for 10%
 */
export function sumLines(lines, gstOn, rate) {
  let sub = 0;
  let taxable = 0;
  let gstFree = false;
  for (const l of lines) {
    if (!lineUsed(l)) continue;
    const a = lineAmount(l);
    sub += a;
    if (l.g === 'No') gstFree = true;
    else taxable += a;
  }
  sub = round2(sub);
  const gst = gstOn ? round2(taxable * rate) : 0;
  return { sub, gst, total: round2(sub + gst), gstFree };
}

/** Deposit box: 20 means 20%. A small figure like 0.2 also means 20%. Result is 0 to 1. */
export function depositFraction(v) {
  const x = num(v);
  if (x <= 0) return 0;
  return x < 1 ? x : Math.min(x, 100) / 100;
}

/** What a markup really earns as a margin: a 30% markup is about a 23% margin. */
export const marginForMarkup = (m) => (m / (100 + m)) * 100;

/**
 * Minimum hourly rate and parts markup.
 * @param {{ wage: string, costs: string, weeks: string, hrs: string, part: string, mk: string, registered: boolean, gstRate: number }} i
 */
export function rateCalc(i) {
  const need = num(i.wage) + num(i.costs);
  const hoursYear = num(i.weeks) * num(i.hrs);
  const hourly = hoursYear > 0 ? round2(need / hoursYear) : 0;
  const hourlyIncl = i.registered ? round2(hourly * (1 + i.gstRate)) : hourly;
  const part = num(i.part);
  const sell = round2(part * (1 + num(i.mk) / 100));
  const profit = round2(sell - part);
  const margin = sell > 0 ? (profit / sell) * 100 : 0;
  return { need, hoursYear, hourly, hourlyIncl, sell, profit, margin };
}

/** New contract total after a variation. */
export const variationNewTotal = (original, earlier, thisOne) => round2(original + earlier + thisOne);

/** Quote fee kept separate from the total. Left to pay if the fee is credited. */
export const leftToPay = (total, fee) => round2(total - fee);
