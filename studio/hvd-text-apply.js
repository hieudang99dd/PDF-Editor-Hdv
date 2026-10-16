/*
 * PDF Đạo Chích — safe bridge to the CIT/PDFium editing session.
 * No replacement PDF text rendering or graphical erasure is performed here.
 * The editor's source-built API is preferred; current CIT bundles are discovered
 * by URL rather than coupled to a Vite chunk hash.
 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const activeEditor = () => $('#overlay .editor [contenteditable="true"]');
  const byId = id => document.getElementById(id);
  let busy = false;
  let syncing = false;
  let nativeModulePromise = null;
  let replayingSave = false;

  function updateControls() {
    const active = !!activeEditor();
    for (const id of ['hvd-apply-now', 'hvd-cancel-now']) {
      const button = byId(id);
      if (button) {
        button.hidden = !active;
        button.disabled = busy;
      }
    }
    const save = byId('save');
    if (save) save.dataset.hvdNativeBusy = busy ? 'true' : 'false';
  }

  function scheduleSync() {
    if (syncing) return;
    syncing = true;
    requestAnimationFrame(() => {
      syncing = false;
      updateControls();
    });
  }

  function announce(message, error = false) {
    const status = byId('hvd-apply-state');
    if (!status) return;
    status.textContent = message;
    status.dataset.error = error ? 'true' : 'false';
    status.hidden = !message;
  }

  // Never depend on app-<hash>.js: Vite legitimately changes chunk hashes.
  function discoveredChunkUrls() {
    const urls = new Set();
    const add = raw => {
      try {
        const url = new URL(raw, document.baseURI);
        if (url.origin === location.origin && /\/assets\/app-[\w-]+\.js$/.test(url.pathname))
          urls.add(url.href);
      } catch {}
    };
    for (const resource of performance.getEntriesByType('resource')) add(resource.name);
    for (const tag of document.querySelectorAll('script[src],link[href]'))
      add(tag.src || tag.href);
    return [...urls];
  }

  async function resolveLegacyModule() {
    let urls = discoveredChunkUrls();
    if (!urls.length) {
      const entry = document.querySelector('script[type="module"][src*="edit-pdf-text-"]');
      if (entry?.src) {
        const response = await fetch(entry.src, { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Không tải được thành phần CIT hiện tại');
        const source = await response.text();
        const chunks = [...source.matchAll(/app-[\w-]+\.js/g)];
        urls = chunks.map(match => new URL('./' + match[0], entry.src).href);
      }
    }
    for (const url of [...new Set(urls)]) {
      try {
        const module = await import(url);
        if (typeof module.endEdit === 'function') return module;
      } catch (error) {
        console.warn('[PDF Dao Chich] Candidate editor module unavailable:', url, error);
      }
    }
    throw new Error('Không tìm được phiên sửa text PDFium đang sử dụng');
  }

  async function nativeApi() {
    // Reproducibly rebuilt CIT installs the stable API directly in app.js.
    const stable = window.__HVD_CIT_TEXT_API;
    if (stable && typeof stable.endEdit === 'function') return stable;
    nativeModulePromise ||= resolveLegacyModule().catch(error => {
      nativeModulePromise = null;
      throw error;
    });
    return nativeModulePromise;
  }

  async function finishEditing(commit) {
    if (busy) return false;
    const editor = activeEditor();
    if (!editor) return true;
    busy = true;
    updateControls();
    try {
      // Cancel must not block on remote font requests. Commit must allow
      // outstanding document fonts to become available before text serialization.
      if (commit && document.fonts?.ready) await document.fonts.ready;
      if (activeEditor() !== editor)
        throw new Error('Vùng nhập đã thay đổi; vui lòng thao tác lại');
      const api = await nativeApi();
      if (activeEditor() !== editor)
        throw new Error('Phiên sửa text đã thay đổi trong khi tải bộ biên tập');
      const result = await api.endEdit(commit);
      if (result === false || (result && typeof result === 'object' && result.ok === false))
        throw new Error(result?.message || 'Bộ biên tập PDFium từ chối ghi thay đổi');
      if (activeEditor() === editor)
        throw new Error('Phiên nhập chưa kết thúc; chưa thể xác nhận nội dung PDF');
      const confirmed = result === true || (result && typeof result === 'object' && result.ok === true);
      window.__HVD_TEXT_LAST_RESULT = { committed: !!commit, confirmed: !!confirmed };
      if (commit) {
        announce(confirmed
          ? 'Đã áp dụng vào nội dung PDF. Có thể kiểm tra và xuất.'
          : 'Đã kết thúc nhập; kiểm tra nội dung trên trang trước khi xuất.');
      } else {
        announce('Đã hủy vùng nhập đang mở.');
      }
      return true;
    } catch (error) {
      console.error('[PDF Dao Chich] Native edit failed:', error);
      window.__HVD_TEXT_LAST_RESULT = { committed: false, error: String(error?.message || error) };
      announce('Chưa áp dụng: ' + (error?.message || String(error)), true);
      return false;
    } finally {
      busy = false;
      scheduleSync();
    }
  }

  function init() {
    const save = byId('save');
    const overlay = byId('overlay');
    if (!save || !overlay || byId('hvd-apply-now')) return;
    const apply = document.createElement('button');
    apply.id = 'hvd-apply-now';
    apply.className = 'btn hvd-native-apply';
    apply.type = 'button';
    apply.textContent = '✓ Áp dụng vào PDF';
    apply.title = 'Ghi nội dung vào PDF đang mở (Ctrl+Enter)';
    apply.hidden = true;
    const cancel = document.createElement('button');
    cancel.id = 'hvd-cancel-now';
    cancel.className = 'btn hvd-native-cancel';
    cancel.type = 'button';
    cancel.textContent = 'Hủy nhập';
    cancel.title = 'Hủy nội dung chưa áp dụng (Escape)';
    cancel.hidden = true;
    const status = document.createElement('span');
    status.id = 'hvd-apply-state';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    save.insertAdjacentElement('afterend', apply);
    apply.insertAdjacentElement('afterend', cancel);
    cancel.insertAdjacentElement('afterend', status);
    // Suppress native blur auto-commit until the desired action is explicit.
    for (const button of [apply, cancel]) {
      button.addEventListener('mousedown', event => event.preventDefault());
      button.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') event.preventDefault();
      });
    }
    apply.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void finishEditing(true);
    });
    cancel.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      void finishEditing(false);
    });
    // Capture before vendor Save; failed edits must NOT proceed to export.
    save.addEventListener('click', event => {
      if (replayingSave) {
        replayingSave = false;
        return;
      }
      if (!activeEditor()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void finishEditing(true).then(ok => {
        if (!ok) return;
        replayingSave = true;
        save.click();
        // Guard against engines that suppress a synthetic click entirely.
        replayingSave = false;
      });
    }, true);
    window.addEventListener('keydown', event => {
      if (!activeEditor() || busy) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && (key === 'enter' || key === 's')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void finishEditing(true).then(ok => {
          if (ok && key === 's') save.click();
        });
      } else if (key === 'escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        void finishEditing(false);
      }
    }, true);
    new MutationObserver(scheduleSync).observe(overlay, { childList: true, subtree: true });
    updateControls();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
