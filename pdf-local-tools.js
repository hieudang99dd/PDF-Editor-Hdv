/* PDF HDV: opt-in localhost PDF/Office/OCR processing. No remote upload. */
(() => {
  'use strict';
  const URL_BASE = 'http://localhost:8000';
  const supported = new Map([
    ['Giảm dung lượng PDF', ['/compress', null]],
    ['Chuyển đổi PDF', ['/api/convert', null]],
    ['PDF OCR', ['/api/ocr', null]],
    ['PDF sang Word', ['/api/convert', 'docx']],
    ['PDF sang TXT', ['/api/convert', 'txt']],
    ['PDF sang TIFF', ['/api/convert', 'tiff']],
    ['Word sang PDF', ['/api/convert', 'pdf']],
    ['Excel sang PDF', ['/api/convert', 'pdf']],
    ['PPT sang PDF', ['/api/convert', 'pdf']]
  ]);
  T.push(['PDF sang TXT', 'Trích xuất chữ thành văn bản UTF-8', 'Chuyển đổi', 'TXT', 'local', '.pdf']);
  T.push(['PDF sang TIFF', 'Xuất TIFF nhiều trang, 150 DPI', 'Chuyển đổi', 'TIF', 'local', '.pdf']);
  OPT.compress = `<label>Tối ưu an toàn cho bản vẽ kỹ thuật</label>
    <div class="r"><label><input type="radio" name="lv" value="basic" checked> Nén cấu trúc, giữ nguyên hình học vector và chất lượng ảnh</label></div>
    <small>Chế độ nén JPEG giảm chất lượng chưa được triển khai.</small>`;
  OPT.fmt = `<label>Định dạng đầu ra<select id="fmt-sel">
    <option value="docx">Word (.docx) – văn bản có thể sửa, không bảo đảm bố cục</option>
    <option value="txt">Văn bản (.txt)</option>
    <option value="tiff">TIFF nhiều trang (.tiff)</option>
  </select></label>`;
  OPT.lang = `<label>Ngôn ngữ OCR<select id="ocr-lang">
    <option value="vie+eng">Tiếng Việt + English</option>
    <option value="vie">Tiếng Việt</option>
    <option value="eng">English</option>
  </select></label><label>Định dạng OCR<select id="ocr-target">
    <option value="pdf">PDF tìm kiếm được (tạo lại trang từ ảnh)</option>
    <option value="txt">TXT (chỉ văn bản)</option>
  </select></label>`;

  function formatForTool(name) {
    if (name === 'Chuyển đổi PDF') return document.getElementById('fmt-sel')?.value || 'docx';
    return supported.get(name)?.[1] || null;
  }
  function filenameFor(original, target, ocr) {
    const stem = (original || 'document').replace(/\.[^.]+$/, '').slice(0, 80);
    if (ocr) return `${stem}_ocr.${target}`;
    if (target === 'compress') return `compressed_${original}`;
    return `${stem}.${target}`;
  }

  // Keep common PDF tools available on GitHub Pages without a native backend.
  async function runInBrowser(name, file, target) {
    if (!file || !file.size) throw new Error('Chưa chọn tệp hợp lệ');
    const bytes = await file.arrayBuffer();
    if (name === 'Giảm dung lượng PDF') {
      if (!window.PDFLib || !window.PDFLib.PDFDocument) {
        throw new Error('Thư viện xử lý PDF chưa tải. Hãy tải lại trang');
      }
      const document = await window.PDFLib.PDFDocument.load(bytes);
      const saved = await document.save({ useObjectStreams: true });
      // Rewriting PDFs can affect signatures; never claim a size reduction without one.
      const compressed = saved.byteLength < bytes.byteLength
        ? new Blob([saved], { type: 'application/pdf' })
        : new Blob([bytes], { type: 'application/pdf' });
      return { blob: compressed, extension: 'pdf',
        filename: 'optimized_' + file.name.replace(/[^a-zA-Z0-9._()\-\u00C0-\u1EF9 ]/g, '_'),
        note: saved.byteLength < bytes.byteLength
          ? 'Đã tối ưu cấu trúc PDF ngay trên trình duyệt.'
          : 'Không tìm thấy cách giảm dung lượng an toàn; đã giữ nguyên bản gốc.' };
    }
    if (target === 'txt') {
      const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (!pdfjs || !pdfjs.getDocument) {
        throw new Error('PDF.js chưa tải. Hãy tải lại trang');
      }
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
      const pages = [];
      try {
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const layer = await page.getTextContent();
          const lines = [];
          let current = '', lastY = null;
          for (const item of layer.items) {
            if (typeof item.str !== 'string') continue;
            const y = Array.isArray(item.transform) ? item.transform[5] : null;
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 2.5) {
              lines.push(current.trim());
              current = '';
            }
            if (current && !item.str.startsWith(' ')) current += ' ';
            current += item.str;
            if (item.hasEOL) { lines.push(current.trim()); current = ''; }
            if (y !== null) lastY = y;
          }
          if (current) lines.push(current.trim());
          pages.push(lines.join('\n'));
          page.cleanup?.();
        }
      } finally {
        await pdf.destroy();
      }
      const txt = '\uFEFF' + pages.join('\n\n------ Trang tiếp theo ------\n\n');
      return { blob: new Blob([txt], { type: 'text/plain;charset=utf-8' }),
        extension: 'txt', filename: file.name.replace(/\.pdf$/i, '') + '.txt',
        note: 'Đã trích xuất lớp chữ có sẵn. PDF ảnh cần OCR riêng.' };
    }
    throw new Error('Định dạng này cần engine PDF HDV cục bộ');
  }

  function showDownload(result, output) {
    const url = window.hvdTrackDownloadUrl?.(result.blob) || URL.createObjectURL(result.blob);
    const wrapper = document.createElement('div');
    wrapper.className = 'res';
    const heading = document.createElement('b');
    heading.textContent = 'Đã tạo tệp. ';
    const detail = document.createElement('span');
    detail.textContent = (result.note || '') + ' Kích thước: ' + sz(result.blob.size) + '. ';
    const row = document.createElement('div');
    row.style.marginTop = '12px';
    const link = document.createElement('a');
    link.className = 'btn';
    link.href = url;
    link.download = result.filename;
    link.textContent = 'Tải xuống';
    link.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(url), 120000), {once:true});
    row.append(link);
    wrapper.append(heading, detail, row);
    output.replaceChildren(wrapper);
  }

  async function runLocal() {
    const name = tool[0];
    const [endpoint] = supported.get(name);
    const button = document.getElementById('go');
    const output = document.getElementById('out');
    if (!files.length) return;
    button.disabled = true;
    window.hvdReleaseWorkspaceDownloads?.();
    output.replaceChildren();
    const status = document.createElement('p');
    status.textContent = 'Đang kiểm tra engine tại máy của bạn…';
    output.append(status);
    try {
      const target = formatForTool(name);
      if (name === 'Giảm dung lượng PDF' || target === 'txt' && !['PDF OCR'].includes(name)) {
        status.textContent = 'Đang xử lý trực tiếp trên trình duyệt…';
        const result = await runInBrowser(name, files[0], target);
        showDownload(result, output);
        return;
      }
      const ready = await fetch(URL_BASE + '/api/capabilities', { signal: AbortSignal.timeout(4500), cache: 'no-store' });
      if (!ready.ok) throw new Error('Engine cục bộ chưa sẵn sàng');
      const capabilities = await ready.json();
      const isOcr = name === 'PDF OCR';
      if (isOcr) {
        const lang = document.getElementById('ocr-lang')?.value || 'vie+eng';
        if (!lang.split('+').every(code => (capabilities.ocr_languages || []).includes(code))) {
          throw new Error('Thiếu bộ ngôn ngữ OCR ' + lang + ' trên máy chạy engine');
        }
      }
      if (target === 'pdf' && !capabilities.libreoffice) {
        throw new Error('Chưa cài LibreOffice để chuyển Office thành PDF');
      }
      status.textContent = 'Đang xử lý tại localhost, tài liệu không gửi tới dịch vụ trực tuyến…';
      const form = new FormData();
      form.append('file', files[0], files[0].name);
      if (endpoint === '/compress') {
        const lv = document.querySelector('input[name="lv"]:checked')?.value || 'basic';
        form.append('level', lv === 'strong' ? 'Mạnh' : 'Cơ bản');
      } else if (isOcr) {
        form.append('language', document.getElementById('ocr-lang')?.value || 'vie+eng');
        form.append('target', document.getElementById('ocr-target')?.value || 'pdf');
      } else {
        form.append('target', target);
      }
      const reply = await fetch(URL_BASE + endpoint, { method: 'POST', body: form });
      if (!reply.ok) {
        const data = await reply.json().catch(() => ({}));
        throw new Error(typeof data.detail === 'string' ? data.detail : `Engine báo lỗi ${reply.status}`);
      }
      const blob = await reply.blob();
      if (!blob.size) throw new Error('Engine trả về tệp rỗng');
      const suffix = isOcr ? (document.getElementById('ocr-target')?.value || 'pdf') : target;
      const nameOut = filenameFor(files[0].name, endpoint === '/compress' ? 'compress' : suffix, isOcr);
      const objectUrl = window.hvdTrackDownloadUrl?.(blob) || URL.createObjectURL(blob);
      const wrapper = document.createElement('div');
      wrapper.className = 'res';
      const title = document.createElement('b');
      title.textContent = 'Đã tạo tệp thành công. ';
      const detail = document.createElement('span');
      detail.textContent = `Kết quả: ${sz(blob.size)}. `;
      const link = document.createElement('a');
      link.className = 'btn';
      link.href = objectUrl;
      link.download = nameOut;
      link.textContent = 'Tải tệp kết quả';
      link.style.display = 'inline-block';
      link.style.marginTop = '12px';
      link.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(objectUrl), 60000), { once: true });
      wrapper.append(title, detail, document.createElement('div'), link);
      output.replaceChildren(wrapper);
    } catch (error) {
      status.textContent = 'Chưa xử lý: ' + (error.message || String(error)) + '. Mở backend tại localhost:8000 theo backend/README.md.';
      status.style.color = 'var(--acc)';
    } finally {
      button.disabled = false;
    }
  }
  const originalRun = run;
  run = function () {
    return supported.has(tool?.[0]) ? runLocal() : originalRun();
  };
  home();
})();
