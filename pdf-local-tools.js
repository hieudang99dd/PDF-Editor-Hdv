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
  async function runLocal() {
    const name = tool[0];
    const [endpoint] = supported.get(name);
    const button = document.getElementById('go');
    const output = document.getElementById('out');
    if (!files.length) return;
    button.disabled = true;
    output.replaceChildren();
    const status = document.createElement('p');
    status.textContent = 'Đang kiểm tra engine tại máy của bạn…';
    output.append(status);
    try {
      const ready = await fetch(URL_BASE + '/api/capabilities', { signal: AbortSignal.timeout(4500), cache: 'no-store' });
      if (!ready.ok) throw new Error('Engine cục bộ chưa sẵn sàng');
      const capabilities = await ready.json();
      const target = formatForTool(name);
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
      const objectUrl = URL.createObjectURL(blob);
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
