// Everything that makes Pro different from Lite is added here, through the hooks.
import { $ } from '../../app/js/dom.js';
import { hooks } from '../../app/js/hooks.js';
import { mountPad, signaturePaper } from './signature.js';

hooks.afterRender.push((tab) => {
  if (tab !== 'Start Here') return;
  const title = $('.band b');
  if (title) title.textContent = 'UTEDOCS PRO';
});

// P2: client signature pad on Quote and Variation.
hooks.afterRender.push((tab) => mountPad(tab));
hooks.paperAfter.push((html, tab) => signaturePaper(html, tab));
