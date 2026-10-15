/* PDF HVD: non-intrusive access to license and attribution.
 * All notices remain available through LICENSE, NOTICE.md, and source.
 */
(() => {
  'use strict';
  const toggle = document.getElementById('hvd-legal-toggle');
  const dialog = document.getElementById('hvd-legal-dialog');
  const closeButton = document.getElementById('hvd-legal-close');
  if (!toggle || !dialog || !closeButton) return;
  const close = () => {
    if (!dialog.open) return;
    dialog.close();
    toggle.focus({preventScroll:true});
  };
  toggle.addEventListener('click', () => {
    if (dialog.open) {close();return;}
    dialog.showModal();
    closeButton.focus({preventScroll:true});
  });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded','false');
  });
  dialog.addEventListener('cancel', () => {
    toggle.setAttribute('aria-expanded','false');
  });
  toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded',dialog.open ? 'true':'false');
  });
})();
