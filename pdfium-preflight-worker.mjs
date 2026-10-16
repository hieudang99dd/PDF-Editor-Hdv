// Independent PDFium worker. No write APIs and no upload endpoints.
// The existing text editor and its worker are deliberately untouched.
import { PdfEngine } from './vendor/cit-pdf/editcore/core.js';
import { MAX_BYTES, MAX_PAGES, summarizePage, compileReport } from './pdfium-preflight-core.mjs';

let busy = false;
self.onmessage = async ({ data }) => {
  if (!data || data.type !== 'inspect') return;
  const id = data.id;
  if (busy) {
    self.postMessage({ id, error: 'Đang có một lượt kiểm tra khác.' });
    return;
  }
  busy = true;
  let engine;
  try {
    const bytes = new Uint8Array(data.bytes);
    if (!bytes.length || bytes.byteLength > MAX_BYTES) {
      throw new Error('Tệp không hợp lệ hoặc vượt giới hạn 80 MB.');
    }
    const prefix = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(1024, bytes.length)));
    if (!prefix.includes('%PDF-')) throw new Error('Tệp không có định dạng PDF hợp lệ.');
    self.postMessage({ id, progress: 'Đang khởi tạo bộ máy đọc PDF…' });
    engine = await PdfEngine.create();
    engine.open(bytes);
    const info = engine.documentInfo() || {};
    const totalPages = engine.pageCount;
    if (!Number.isInteger(totalPages) || totalPages < 1) {
      throw new Error('PDF không chứa trang hợp lệ.');
    }
    const pages = [];
    const limit = Math.min(totalPages, MAX_PAGES);
    for (let i = 0; i < limit; i++) {
      engine.loadPage(i);
      const rotation = engine.M._FPDFPage_GetRotation(engine.page);
      pages.push(summarizePage(i, engine.pageWidth, engine.pageHeight,
        rotation * 90, engine.buildModel()));
      if (i === limit - 1 || i % 5 === 4) {
        self.postMessage({ id, progress: 'Đã kiểm tra ' + (i + 1) + '/' + limit + ' trang…' });
      }
    }
    const report = compileReport({ info, totalPages, pages,
      pdfAClaimed: PdfEngine.sniffPdfA(bytes) });
    self.postMessage({ id, result: report });
  } catch (e) {
    self.postMessage({ id, error: e && e.message ? e.message : String(e) });
  } finally {
    try { if (engine) engine.close(); } catch (_) { /* No document mutation. */ }
    busy = false;
  }
};
