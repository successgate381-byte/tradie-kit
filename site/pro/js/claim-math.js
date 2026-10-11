// P3: the money rules for a progress claim. Numbers in, numbers out, so they are easy to test.
import { num, round2 } from '../../app/js/format.js';

/**
 * Amounts are dollars including GST when the business is registered for GST.
 * "Work complete to date" is everything finished so far, including work already claimed.
 * @param {{ contract: string, pct: string, prev: string, registered: boolean, gstRate: number }} i
 */
export function claimMaths(i) {
  const contract = num(i.contract);
  const asked = num(i.pct);
  const percent = Math.min(100, Math.max(0, asked));
  const toDate = round2((contract * percent) / 100);
  const earlier = num(i.prev);
  const thisClaim = round2(toDate - earlier);
  const remaining = round2(contract - toDate);
  const gst = i.registered ? round2((thisClaim * i.gstRate) / (1 + i.gstRate)) : 0;
  const exGst = round2(thisClaim - gst);
  let warning = '';
  if (asked > 100) warning = 'Work complete cannot be more than 100%. Using 100%.';
  else if (thisClaim < 0) warning = 'Your earlier claims are more than the work done to date. Check the percentage and the earlier claims.';
  return { contract, percent, toDate, earlier, thisClaim, remaining, gst, exGst, warning };
}
