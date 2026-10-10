// P2: the client draws their signature with a finger or Apple Pencil.
// Strokes are saved as small numbers (0 to 1) so the drawing keeps its shape on any screen size.
import { $ } from '../../app/js/dom.js';
import { has } from '../../app/js/format.js';
import { refresh } from '../../app/js/live.js';
import { get, put } from '../../app/js/state.js';

/** Tabs that have a client sign-off. */
export const SIGN_TABS = ['Quote', 'Variation'];

const RATIO = 2.5; // the pad is 2.5 times wider than it is tall
const EXPORT_WIDTH = 600; // the saved picture is 600 px wide
const MAX_POINTS = 2000;
const MAX_STROKES = 60;
const PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

/** @typedef {number[][]} Stroke */

/** Read saved strokes. Anything odd is ignored, never trusted. */
function readStrokes(tab) {
  try {
    const raw = JSON.parse(get(tab, 'sigstrokes') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(Array.isArray)
      .map((s) => s.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])).slice(0, MAX_POINTS))
      .filter((s) => s.length > 0)
      .slice(0, MAX_STROKES);
  } catch {
    return [];
  }
}

/** Draw the strokes smoothly onto a canvas. */
function paint(ctx, w, h, /** @type {Stroke[]} */ strokes) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#111';
  ctx.lineWidth = Math.max(1.6, w * 0.006);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0][0] * w, s[0][1] * h, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(s[0][0] * w, s[0][1] * h);
    for (let i = 1; i < s.length - 1; i++) {
      ctx.quadraticCurveTo(s[i][0] * w, s[i][1] * h, ((s[i][0] + s[i + 1][0]) / 2) * w, ((s[i][1] + s[i + 1][1]) / 2) * h);
    }
    const last = s[s.length - 1];
    ctx.lineTo(last[0] * w, last[1] * h);
    ctx.stroke();
  }
}

/** A small picture of the signature with a see-through background. */
function toPng(/** @type {Stroke[]} */ strokes) {
  const c = document.createElement('canvas');
  c.width = EXPORT_WIDTH;
  c.height = Math.round(EXPORT_WIDTH / RATIO);
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  paint(ctx, c.width, c.height, strokes);
  return c.toDataURL('image/png');
}

/** Today as 2026-10-10, in the phone's own time. */
function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

const clamp = (n) => Math.min(1, Math.max(0, Math.round(n * 10000) / 10000));

/** Put the drawing pad above the typed name, signature and date. */
export function mountPad(/** @type {string} */ tab) {
  const anchor = SIGN_TABS.includes(tab) ? $('.sg.edit') : null;
  if (!anchor) return;
  const box = document.createElement('div');
  box.className = 'sigpad';
  box.innerHTML =
    '<div class="sigpad-h">Draw the client signature here (finger or Apple Pencil)</div>' +
    '<canvas id="sg-pad" role="img" aria-label="Signature pad"></canvas>' +
    '<div class="btns tight"><button class="b g" id="sg-undo">Undo</button><button class="b g" id="sg-clear">Clear signature</button></div>';
  anchor.before(box);
  const canvas = box.querySelector('canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (!canvas || !ctx) return;

  let strokes = readStrokes(tab);
  /** @type {Stroke | null} */
  let current = null;

  const repaint = () => paint(ctx, canvas.width, canvas.height, strokes);
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    repaint();
  };
  new ResizeObserver(fit).observe(canvas);
  fit();

  /** Save the strokes and the picture. Add today's date if the date box is empty. */
  const save = () => {
    put(tab, 'sigstrokes', JSON.stringify(strokes));
    put(tab, 'sigimg', strokes.length ? toPng(strokes) : '');
    const dateBox = $('#i-ad');
    if (strokes.length && !has(get(tab, 'ad'))) {
      put(tab, 'ad', today());
      put(tab, 'sigdate', today());
      if (dateBox instanceof HTMLInputElement) dateBox.value = today();
    }
    if (!strokes.length && has(get(tab, 'sigdate')) && get(tab, 'ad') === get(tab, 'sigdate')) {
      put(tab, 'ad', '');
      put(tab, 'sigdate', '');
      if (dateBox instanceof HTMLInputElement) dateBox.value = '';
    }
    refresh(tab);
  };

  const point = (/** @type {PointerEvent} */ e) => {
    const r = canvas.getBoundingClientRect();
    return [clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height)];
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (strokes.length >= MAX_STROKES) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    current = [point(e)];
    strokes.push(current);
    repaint();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    e.preventDefault();
    const moves = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const m of moves.length ? moves : [e]) if (current.length < MAX_POINTS) current.push(point(m));
    repaint();
  });
  const end = () => {
    if (!current) return;
    current = null;
    save();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const undo = box.querySelector('#sg-undo');
  const clear = box.querySelector('#sg-clear');
  if (undo) undo.addEventListener('click', () => { strokes.pop(); repaint(); save(); });
  if (clear) clear.addEventListener('click', () => { strokes = []; repaint(); save(); });
}

/** On the finished document, show the drawn signature above the line. */
export function signaturePaper(/** @type {string} */ html, /** @type {string} */ tab) {
  if (!SIGN_TABS.includes(tab)) return html;
  const img = get(tab, 'sigimg');
  if (!PNG.test(img)) return html;
  const cell = /<div class="c"><em>[^<]*<\/em>(<span>Client \/ customer signature<\/span>)/;
  return html.replace(cell, (_all, label) => `<div class="c"><em class="sigem"><img class="sigimg" alt="Client signature" src="${img}"></em>${label}`);
}
