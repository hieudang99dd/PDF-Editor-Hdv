// PDF HVD native preflight: pure, read-only diagnostics.
// Keep this module independent of the editor so a failed inspection never changes text.
export const MAX_BYTES = 80 * 1024 * 1024;
export const MAX_PAGES = 50;

const finite = value => typeof value === 'number' && Number.isFinite(value);
const stringLength = value => typeof value === 'string' ? [...value].length : 0;

export function summarizePage(index, width, height, rotation, paragraphs) {
  const count = { paragraphs: 0, characters: 0, notEditable: 0, multiline: 0,
    vertical: 0, unknownGlyphs: 0, invalidGeometry: 0 };
  for (const p of Array.isArray(paragraphs) ? paragraphs : []) {
    count.paragraphs++;
    if (p.editable === false) count.notEditable++;
    if (p.vertical) count.vertical++;
    if (Array.isArray(p.lines) && p.lines.length > 1) count.multiline++;
    const runs = Array.isArray(p.runs) ? p.runs : [];
    for (const r of runs) {
      count.characters += stringLength(r.text);
      if (typeof r.text === 'string') count.unknownGlyphs += [...r.text].filter(c => c === '\uFFFD').length;
    }
    const b = p.box;
    if (b && (!finite(b.x) || !finite(b.top) || !finite(b.w) || !finite(b.h) || b.w < 0 || b.h < 0)) {
      count.invalidGeometry++;
    }
  }
  return { page: index + 1, width: finite(width) ? Math.round(width * 100) / 100 : null,
    height: finite(height) ? Math.round(height * 100) / 100 : null,
    rotation: finite(rotation) ? rotation : null, ...count };
}

export function compileReport({ info = {}, totalPages, pages = [], pdfAClaimed = false }) {
  if (!Number.isInteger(totalPages) || totalPages < 1 || pages.length > totalPages) {
    throw new Error('Số trang PDF không hợp lệ.');
  }
  const sum = { paragraphs: 0, characters: 0, notEditable: 0, multiline: 0,
    vertical: 0, unknownGlyphs: 0, invalidGeometry: 0 };
  for (const p of pages) for (const k of Object.keys(sum)) sum[k] += p[k] || 0;
  const signatureCount = Array.isArray(info.signatures) ? info.signatures.length :
    Number.isFinite(Number(info.signatures)) ? Number(info.signatures) : (info.signatures ? 1 : 0);
  const warnings = [];
  const push = (level, code, message, matching) => warnings.push({
    level, code, message, pages: matching || []
  });
  if (signatureCount > 0) push('warning', 'SIGNED',
    'Tài liệu có dấu hiệu chữ ký số. Chỉnh sửa có thể làm mất hiệu lực chữ ký.');
  if (info.encrypted) push('warning', 'ENCRYPTED',
    'Tài liệu có cơ chế bảo vệ/mã hóa; cần kiểm tra quyền chỉnh sửa.');
  const empty = pages.filter(p => p.paragraphs === 0).map(p => p.page);
  if (empty.length) push('info', 'NO_TEXT',
    'Một số trang không có cụm chữ trích xuất được (có thể là ảnh quét, hình vẽ hoặc trang trắng).', empty);
  const complex = pages.filter(p => p.notEditable > 0 || p.multiline > 0 || p.vertical > 0).map(p => p.page);
  if (complex.length) push('warning', 'COMPLEX_TEXT',
    'Có vùng chữ phức tạp hoặc không được engine đánh dấu là có thể sửa an toàn.', complex);
  const glyphs = pages.filter(p => p.unknownGlyphs > 0).map(p => p.page);
  if (glyphs.length) push('warning', 'UNKNOWN_GLYPHS',
    'Có ký tự Unicode thay thế; nên kiểm tra phông và ánh xạ chữ.', glyphs);
  const geometry = pages.filter(p => p.invalidGeometry > 0).map(p => p.page);
  if (geometry.length) push('warning', 'INVALID_BOX',
    'Có hộp văn bản với thông số hình học bất thường.', geometry);
  if (pages.length < totalPages) push('info', 'SAMPLE',
    'Chỉ quét một phần tài liệu để giới hạn thời gian và bộ nhớ. Kết luận chỉ áp dụng cho các trang đã quét.');
  if (pdfAClaimed) push('info', 'PDFA_MARKER',
    'Phát hiện dấu hiệu khai báo PDF/A; đây không phải kết quả xác nhận tuân thủ PDF/A.');
  return { engine: 'PDFium WASM', readOnly: true, totalPages, scannedPages: pages.length,
    limited: pages.length < totalPages, security: {
      encrypted: !!info.encrypted, signatureCount, pdfAClaimed: !!pdfAClaimed
    }, summary: sum, pages, warnings };
}
