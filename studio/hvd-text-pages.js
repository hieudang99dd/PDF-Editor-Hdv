/*
 * PDF Đạo Chích — lazy left-hand page navigator for the native CIT editor.
 * Thumbnails are read-only PDF.js previews. Editing and page changes remain
 * in PDFium; the sidebar never inserts/replaces PDF content.
 */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const api = () => window.__HVD_CIT_TEXT_API;
  let root, list, jump, label, toggle, count = 0, active = -1;
  let io = null, generation = 0, rendering = 0, navBusy = false;
  const MAX_PARALLEL = 2;
  const jobs = [];
  const scheduled = new Set();
  const buttons = [];
  let failedCount = 0;

  const isOpened = () => root && !root.hidden;
  const pageCount = () => Number(api()?.getPageCount?.() || 0);
  const pageIndex = () => Number(api()?.getPageIndex?.() ?? 0);

  function setOpen(value) {
    if (!root) return;
    root.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
    toggle.classList.toggle('hvd-on', value);
    toggle.title = value ? 'Ẩn danh sách trang' : 'Mở danh sách trang';
    if (value) {
      observeAll();
      scrollToActive();
    } else {
      io?.disconnect();
    }
  }

  function scrollToActive() {
    if (active < 0 || !list || !buttons[active]) return;
    const button = buttons[active];
    const top = button.offsetTop, bottom = top + button.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = Math.max(0, top - list.clientHeight / 2 + button.offsetHeight / 2);
  }

  function syncNativePage(force = false) {
    if (!root) return;
    const total = pageCount();
    if (total !== count || force) rebuild(total);
    if (!total) return;
    const index = Math.max(0, Math.min(pageIndex(), total - 1));
    if (index !== active || force) {
      if (buttons[active]) {
        buttons[active].classList.remove('hvd-current');
        buttons[active].removeAttribute('aria-current');
      }
      active = index;
      if (buttons[active]) {
        buttons[active].classList.add('hvd-current');
        buttons[active].setAttribute('aria-current', 'page');
      }
      jump.value = String(index + 1);
      label.textContent = 'Trang ' + (index + 1) + ' / ' + total;
      if (isOpened()) scrollToActive();
    }
  }

  async function navigate(index) {
    if (navBusy || !Number.isInteger(index) || index < 0 || index >= count) return;
    if (pageIndex() === index) return;
    navBusy = true;
    try {
      const finish = window.__HVD_COMMIT_BEFORE_PAGE_NAV;
      if (typeof finish === 'function') {
        const ok = await finish();
        if (!ok) return;
      }
      const native = api();
      if (!native || typeof native.navigateToPage !== 'function')
        throw new Error('Bộ biên tập PDFium chưa sẵn sàng');
      native.navigateToPage(index);
      syncNativePage();
    } catch (error) {
      console.warn('[PDF Đạo Chích] Jump to PDF page failed:', error);
      label.textContent = 'Không thể chuyển trang; kiểm tra vùng chữ đang sửa';
    } finally {
      navBusy = false;
      jump.value = String(pageIndex() + 1);
    }
  }

  function thumbButton(index) {
    const b = document.createElement('button');
    b.className = 'hvd-page-thumb';
    b.type = 'button';
    b.dataset.index = String(index);
    b.title = 'Chuyển tới trang ' + (index + 1);
    b.setAttribute('aria-label', 'Mở trang ' + (index + 1));
    const preview = document.createElement('div');
    preview.className = 'hvd-thumb-preview';
    const spinner = document.createElement('span');
    spinner.className = 'hvd-thumb-placeholder';
    spinner.textContent = 'Trang ' + (index + 1);
    preview.appendChild(spinner);
    const caption = document.createElement('span');
    caption.className = 'hvd-thumb-number';
    caption.textContent = String(index + 1);
    b.append(preview, caption);
    b.addEventListener('click', () => { void navigate(index); });
    return b;
  }

  function clearQueue() {
    generation++;
    jobs.length = 0;
    scheduled.clear();
    io?.disconnect();
    io = null;
  }

  function rebuild(total) {
    clearQueue();
    count = Math.max(0, Math.min(20000, Math.floor(total)));
    active = -1;
    failedCount = 0;
    buttons.length = 0;
    list.replaceChildren();
    if (!count) {
      label.textContent = 'Chưa mở PDF';
      jump.value = '';
      jump.disabled = true;
      return;
    }
    jump.disabled = false;
    jump.max = String(count);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const b = thumbButton(i);
      buttons.push(b);
      fragment.appendChild(b);
    }
    list.appendChild(fragment);
    if (isOpened()) observeAll();
  }

  function observeAll() {
    if (!isOpened() || !('IntersectionObserver' in window)) {
      if (isOpened() && buttons.length) scheduleThumb(active >= 0 ? active : 0);
      return;
    }
    io?.disconnect();
    io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) scheduleThumb(Number(entry.target.dataset.index));
      }
    }, {root:list, rootMargin:'240px 0px', threshold:0.01});
    for (const b of buttons) if (b.dataset.done !== 'true') io.observe(b);
  }

  function scheduleThumb(index) {
    if (!isOpened() || index < 0 || index >= count || scheduled.has(index)) return;
    const b = buttons[index];
    if (!b || b.dataset.done === 'true') return;
    scheduled.add(index);
    jobs.push({index, generation});
    drain();
  }

  function drain() {
    while (rendering < MAX_PARALLEL && jobs.length) {
      const job = jobs.shift();
      if (job.generation !== generation || !isOpened()) {
        scheduled.delete(job.index);
        continue;
      }
      rendering++;
      render(job).finally(() => {
        rendering--;
        scheduled.delete(job.index);
        drain();
      });
    }
  }

  async function render(job) {
    const b = buttons[job.index];
    if (!b || b.dataset.done === 'true') return;
    try {
      const service = window.__HVD_PDF_THUMBNAILS;
      if (typeof service?.render !== 'function')
        throw new Error('PDF.js thumbnails not initialized');
      const src = await service.render(job.index);
      if (job.generation !== generation || !b.isConnected || !src) return;
      const img = new Image();
      img.alt = 'Hình thu nhỏ trang ' + (job.index + 1);
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = src;
      b.querySelector('.hvd-thumb-preview').replaceChildren(img);
      b.dataset.done = 'true';
      io?.unobserve(b);
    } catch (error) {
      if (job.generation !== generation || !b?.isConnected) return;
      b.dataset.done = 'true';
      b.querySelector('.hvd-thumb-placeholder').textContent = 'Trang ' + (job.index + 1);
      b.title = 'Mở trang ' + (job.index + 1) + ' (không thể tạo ảnh thu nhỏ)';
      io?.unobserve(b);
      if (failedCount++ === 0)
        console.warn('[PDF Đạo Chích] Thumbnail preview unavailable; page navigation still works', error);
    }
  }

  function onDocOpen() {
    syncNativePage(true);
    // The source PDF might have the same count as the previous document.
    // Rebuild is forced so stale thumbnails never carry across documents.
    observeAll();
  }

  function init() {
    const app = byId('text-editor-app');
    const main = byId('main');
    const toolbar = byId('toolbar');
    if (!app || !main || !toolbar || byId('hvd-pages-rail')) return;
    toggle = document.createElement('button');
    toggle.id = 'hvd-pages-toggle';
    toggle.className = 'btn hvd-pages-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'hvd-pages-rail');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = '▤ Trang';
    toggle.title = 'Hiện hoặc ẩn danh sách trang PDF';
    const leftButtons = toolbar.querySelector('.tgroup');
    if (leftButtons) leftButtons.insertAdjacentElement('afterbegin', toggle);
    else toolbar.prepend(toggle);

    root = document.createElement('aside');
    root.id = 'hvd-pages-rail';
    root.setAttribute('aria-label', 'Danh sách trang PDF');
    const header = document.createElement('div');
    header.className = 'hvd-pages-head';
    const name = document.createElement('strong');
    name.textContent = 'TRANG PDF';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'hvd-pages-close';
    close.title = 'Thu gọn danh sách trang';
    close.textContent = '×';
    close.addEventListener('click', () => setOpen(false));
    header.append(name, close);
    const goto = document.createElement('form');
    goto.className = 'hvd-pages-jump';
    label = document.createElement('span');
    label.className = 'hvd-pages-counter';
    label.textContent = 'Chưa mở PDF';
    const field = document.createElement('label');
    field.textContent = 'Tới trang';
    jump = document.createElement('input');
    jump.type = 'number';
    jump.min = '1';
    jump.step = '1';
    jump.disabled = true;
    jump.setAttribute('aria-label','Nhập số trang muốn đến');
    const go = document.createElement('button');
    go.type = 'submit';
    go.textContent = 'Đến';
    field.appendChild(jump);
    goto.append(label, field, go);
    goto.addEventListener('submit', event => {
      event.preventDefault();
      const value = Number(jump.value);
      if (!Number.isInteger(value) || value < 1 || value > count) {
        jump.value = String(Math.max(1, pageIndex() + 1));
        return;
      }
      void navigate(value - 1);
    });
    list = document.createElement('div');
    list.id = 'hvd-pages-list';
    list.className = 'hvd-pages-list';
    list.setAttribute('role','navigation');
    list.setAttribute('aria-label','Hình thu nhỏ các trang');
    root.append(header,goto,list);
    main.insertAdjacentElement('afterbegin',root);

    toggle.addEventListener('click',()=>setOpen(!isOpened()));
    window.addEventListener('hvd:pagechange',()=>syncNativePage());
    window.addEventListener('hvd:document-open',onDocOpen);
    window.addEventListener('beforeunload',()=>clearQueue(),{once:true});
    setOpen(window.innerWidth >= 930);
    syncNativePage();
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
