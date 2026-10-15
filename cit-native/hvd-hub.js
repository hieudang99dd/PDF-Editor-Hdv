/* PDF HVD navigation adapter for the ORIGINAL CIT-PDF v1.0.0 frontend.
 * AGPL-3.0-only. Does not alter or replace CIT's editor, CSS internals,
 * PdfEngine, render logic, rich-run handling, or export routines.
 */
(() => {
  'use strict';
  const home = new URL('../index.html', window.location.href).href;
  const prefix = 'HVD CIT Hub';
  const goHome = () => { window.location.assign(home); };

  // Original CIT's Vite editor maps this action to import.meta.env.BASE_URL,
  // which points into cit-native/ and NOT to the parent HVD homepage. Install
  // a capture handler: prevent *only* this navigation; preserve all other
  // upstream events and controls unchanged.
  document.addEventListener('click', event => {
    const element = event.target;
    const back = element instanceof Element && element.closest('#back-to-tools');
    if (!back) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goHome();
  }, true);

  function addAnchor(host, id, label, title) {
    if (!host || document.getElementById(id)) return;
    const link = document.createElement('a');
    link.id = id;
    link.className = 'hvd-cit-hub-link';
    link.href = home;
    link.title = title;
    link.setAttribute('aria-label', title);
    link.textContent = label;
    host.appendChild(link);
  }

  function install() {
    if (document.body.dataset.hvdCitHub) return;
    document.body.dataset.hvdCitHub = 'original';
    const backLabel = document.querySelector('#back-to-tools span');
    if (backLabel) {
      backLabel.removeAttribute('data-i18n');
      backLabel.textContent = 'Trở về PDF HVD';
    }
    const toolbarGroup = document.querySelector('#toolbar .tgroup');
    addAnchor(toolbarGroup, 'hvd-cit-home', 'PDF HVD',
      'Quay về bộ công cụ PDF HVD');
    const landing = document.querySelector('#tool-uploader');
    addAnchor(landing, 'hvd-cit-uploader-home', '↖ PDF HVD',
      'Quay về trang chủ PDF HVD');

    // Only alter the document title; original CIT menu/layout/font controls
    // and all related event listeners remain owned by upstream CIT.
    const initialTitle = document.title;
    if (!/^JSERROR:|^UNHANDLED:/.test(initialTitle))
      document.title = 'Chỉnh sửa Text – PDF HVD × CIT';
    window.dispatchEvent(new CustomEvent('hvd-cit-hub:ready',
      {detail:{source:'CIT-PDF v1.0.0',home}}));
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
