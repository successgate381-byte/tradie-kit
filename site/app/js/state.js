// Everything the person types is kept here and saved in this browser only.
import { DEFAULTS } from './data.js';
import { has, num } from './format.js';

const KEY = 'utedocs.v1';

/** @type {{ D: Record<string, string>, T: Record<string, Record<string, string>> }} */
const data = { D: { ...DEFAULTS.D }, T: {} };

/** Which tab is open. */
export const view = { tab: 'Start Here' };

export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    data.D = { ...DEFAULTS.D, ...(saved.D || {}) };
    data.T = saved.T || {};
  } catch {
    data.D = { ...DEFAULTS.D };
    data.T = {};
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage can be full or blocked (private mode). The app still works for this visit.
  }
}

/** Read one value. Scope is "D" for My Details or a tab name. Falls back to the starting value. */
export function get(scope, key) {
  const v = scope === 'D' ? data.D[key] : (data.T[scope] || {})[key];
  if (v !== undefined) return v;
  return (DEFAULTS[scope] || {})[key] ?? '';
}

export function put(scope, key, value) {
  if (scope === 'D') data.D[key] = value;
  else (data.T[scope] = data.T[scope] || {})[key] = value;
  save();
}

/** Wipe one document. My Details stay. */
export function clearTab(tab) {
  data.T[tab] = {};
  save();
}

export const registered = () => get('D', 'gst') === 'Yes';
export const gstRate = () => (num(get('D', 'rate')) || 10) / 100;

/** Name of the trade to show, using the typed one when "Other" is picked. */
export function tradeName() {
  const t = get('D', 'trade');
  return t === 'Other' && has(get('D', 'tradeo')) ? get('D', 'tradeo') : t;
}

export const minLines = (tab) => (tab === 'Variation' ? 4 : 8);
export const MAX_LINES = 40;

/** How many line rows a document shows: at least the minimum, at most 40. */
export function lineCount(tab) {
  return Math.min(MAX_LINES, Math.max(minLines(tab), parseInt(get(tab, 'n'), 10) || 0));
}

/** The lines of a document as plain objects. */
export function linesOf(tab, count = lineCount(tab)) {
  return Array.from({ length: count }, (_, i) => ({
    d: get(tab, 'd' + (i + 1)),
    q: get(tab, 'q' + (i + 1)),
    p: get(tab, 'p' + (i + 1)),
    g: get(tab, 'g' + (i + 1)) || 'Yes',
  }));
}

/** Add one more line, or take the last one away (never below the minimum). */
export function changeLines(tab, delta) {
  const n = lineCount(tab);
  const t = (data.T[tab] = data.T[tab] || {});
  if (delta > 0 && n < MAX_LINES) t.n = String(n + 1);
  if (delta < 0 && n > minLines(tab)) {
    for (const c of ['d', 'q', 'p', 'g']) delete t[c + n];
    t.n = String(n - 1);
  }
  save();
}
