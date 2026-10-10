// Everything that makes Pro different from Lite is added here, through the hooks.
import { $ } from '../../app/js/dom.js';
import { hooks } from '../../app/js/hooks.js';

hooks.afterRender.push((tab) => {
  if (tab !== 'Start Here') return;
  const title = $('.band b');
  if (title) title.textContent = 'UTEDOCS PRO';
});
