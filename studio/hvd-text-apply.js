/*
 * PDF Dao Chich — native text apply bridge.
 * Retains the approved CIT/PDFium editor; only finishes its active edit session.
 * Nothing is painted onto the PDF by this module.
 */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const editorActive = () => !!$('#overlay .editor [contenteditable="true"]');
  let busy = false;
  let syncing = false;

  function updateControls() {
    const active = editorActive();
    for (const id of ['hvd-apply-now', 'hvd-cancel-now']) {
      const button = document.getElementById(id);
      if (!button) continue;
      button.hidden = !active;
      button.disabled = busy;
    }
  }

  function scheduleSync() {
    if (syncing) return;
    syncing = true;
    requestAnimationFrame(() => {
      syncing = false;
      updateControls();
    });
  }

  function announce(message, isError = false) {
    const status = $('#hvd-apply-state');
    if (!status) return;
    status.textContent = message;
    status.dataset.error = isError ? 'true' : 'false';
    status.hidden = !message;
  }

  async function finishEditing(accept) {
    if (busy) return false;
    if (!editorActive()) return true;
    busy = true;
    updateControls();
    try {
      // The original Vite application has already loaded this module to open
      // the PDF. Importing it again reuses that exact ESM singleton / PdfEngine.
      const module = await import('./assets/app-BS1uD-9J.js');
      if (typeof module.endEdit !== 'function') {
        throw new Error('Thiếu chức năng ghi thay đổi của bộ biên tập');
      }
      if (!editorActive()) return true; // Original editor committed on blur.
      module.endEdit(accept);
      if (editorActive()) throw new Error('Không thể kết thúc vùng nhập văn bản');
      if (accept) {
        announce('Đã kết thúc nhập và vẽ lại trang PDF. Kiểm tra chữ, ô bảng trước khi xuất.');
      } else {
        announce('Đã hủy phần chữ vừa nhập; PDF hiện tại được giữ nguyên.');
      }
      return true;
    } catch (error) {
      console.error('[PDF Dao Chich] native text apply failed:', error);
      announce('Không thể áp dụng trực tiếp: ' + (error?.message || String(error)), true);
      return false;
    } finally {
      busy = false;
      scheduleSync();
    }
  }

  function init() {
    const save = $('#save');
    const overlay = $('#overlay');
    if (!save || !overlay || $('#hvd-apply-now')) return;
    const apply = document.createElement('button');
    apply.id = 'hvd-apply-now';
    apply.className = 'btn hvd-native-apply';
    apply.type = 'button';
    apply.textContent = '✓ Áp dụng vào PDF';
    apply.title = 'Ghi chữ mới vào nội dung PDF đang xem (Ctrl+Enter)';
    apply.hidden = true;

    const cancel = document.createElement('button');
    cancel.id = 'hvd-cancel-now';
    cancel.className = 'btn hvd-native-cancel';
    cancel.type = 'button';
    cancel.textContent = 'Hủy nhập';
    cancel.title = 'Bỏ phần nhập chưa áp dụng (Esc)';
    cancel.hidden = true;

    const status = document.createElement('span');
    status.id = 'hvd-apply-state';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;

    save.insertAdjacentElement('afterend', apply);
    apply.insertAdjacentElement('afterend', cancel);
    cancel.insertAdjacentElement('afterend', status);

    // Prevent blur: native CIT may otherwise commit before the intended action.
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

    // An export must never silently skip the text currently being typed.
    // Run in capture phase before the vendor editor's original Save listener.
    save.addEventListener('click', event => {
      if (!editorActive()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void finishEditing(true).then(ok => { if (ok) save.click(); });
    }, true);

    window.addEventListener('keydown', event => {
      if (!editorActive() || busy) return;
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

    new MutationObserver(scheduleSync).observe(overlay, {
      childList: true,
      subtree: true
    });
    updateControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
