// Tiny page helpers.

/** Find one element, or null. */
export const $ = (sel, root = document) => root.querySelector(sel);

/** Find all matching elements as a real array. */
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Put plain text into the element with this id (if it is on the page). */
export function setText(id, text) {
  const e = document.getElementById(id);
  if (e) e.textContent = text;
}
