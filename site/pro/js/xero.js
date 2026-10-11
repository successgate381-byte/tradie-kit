// P4: the Export for Xero button on the Tax Invoice tab, and the three Xero settings on My Details.
import { $ } from '../../app/js/dom.js';
import { has } from '../../app/js/format.js';
import { get, linesOf } from '../../app/js/state.js';
import { row, sec } from '../../app/js/views.js';
import { XERO_DEFAULTS, buildXeroCsv, xeroFileName } from './xero-csv.js';

const TAB = 'Tax Invoice';

/** What the person typed, or Xero's usual value. */
const setting = (key) => (has(get('D', key)) ? get('D', key).trim() : XERO_DEFAULTS[key]);

/** Save a text file on the phone or computer. */
function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Three boxes on My Details, just after the GST rate. */
function mountSettings() {
  const rate = $('#i-rate');
  const after = rate ? rate.closest('.fr') : null;
  if (!after) return;
  after.insertAdjacentHTML(
    'afterend',
    sec('XERO EXPORT (PRO, OPTIONAL)') +
      row('D', 'xacct', 'Xero sales account code', 't', { ex: "The code of your sales account in Xero, as shown in your chart of accounts. 200 is Xero's standard Sales account." }) +
      row('D', 'xtax', 'Xero tax name for GST sales', 't', { ex: 'Must match the name in your Xero tax settings exactly, for example GST on Income.' }) +
      row('D', 'xfree', 'Xero tax name for GST-free sales', 't', { ex: 'Must match the name in your Xero tax settings exactly, for example GST Free Income.' }),
  );
  for (const key of Object.keys(XERO_DEFAULTS)) {
    const box = $('#i-' + key);
    if (box instanceof HTMLInputElement) box.value = setting(key);
  }
}

/** The export button, under Preview and Save as PDF. */
function mountButton() {
  const bar = $('#pv') ? $('#pv').closest('.btns') : null;
  if (!bar) return;
  bar.insertAdjacentHTML(
    'afterend',
    '<div class="xe"><div class="btns tight"><button class="b g" id="xe-csv">Export for Xero (CSV)</button></div>' +
      '<div class="warn" id="xe-msg"></div>' +
      '<div class="note">This file is for your own Xero, not for your customer. The customer still gets the PDF. In Xero, go to Business, then Invoices, then Import. The invoice arrives as a draft for you to check and approve.</div></div>',
  );
  const button = $('#xe-csv');
  const message = $('#xe-msg');
  if (!button || !message) return;
  button.addEventListener('click', () => {
    const out = buildXeroCsv({
      contact: get(TAB, 'cust'),
      address: get(TAB, 'addr'),
      site: get(TAB, 'site'),
      number: get(TAB, 'no'),
      issue: get(TAB, 'date'),
      terms: get('D', 'terms'),
      lines: linesOf(TAB),
      account: setting('xacct'),
      gstName: setting('xtax'),
      freeName: setting('xfree'),
    });
    if (out.missing.length) {
      message.textContent = 'Xero needs: ' + out.missing.join(', ') + '.';
      return;
    }
    message.textContent = '';
    download(out.csv, xeroFileName(get(TAB, 'no')));
  });
}

export function mountXero(/** @type {string} */ tab) {
  if (tab === 'My Details') mountSettings();
  if (tab === TAB) mountButton();
}
