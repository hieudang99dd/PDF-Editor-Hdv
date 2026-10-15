# PDF HDV — Integration Progress

## 2026-10-15: CIT-PDF 1.0.0 → PDF HDV

Nguồn: Cuongyd196/cit-pdf, tag 1.0.0, commit 3c9c138d980a417de7439f383f37882a1d730ab6. Repo đích: hieudang99dd/PDF-Editor-Hdv, nhánh master.

### Đã có trước đợt này

- Sửa lỗi lưu/tải PDF: 606e519.
- Native text CIT: f1cc44a, c1599ec. PDFium WASM, font/baseline, table bounds, rotation, worker/undo, kiểm thử JS. Xem CIT-INTEGRATION.md.
- Các công cụ cơ bản trong trình duyệt: ghép, tách, xoay, ảnh JPG/PNG, chữ ký, watermark, đánh số trang (tùy công cụ).

### Thực hiện trong đợt tiếp tục

- backend/main.py: FastAPI localhost, API capabilities, PDF → TXT/DOCX/TIFF, Office → PDF, OCR tiếng Việt/Anh → TXT/PDF có chữ, nén không làm tăng file. Giới hạn input/trang, hạn chế CORS, xóa thư mục tạm.
- pdf-local-tools.js: kết nối giao diện với engine localhost, thông báo lỗi và download thật, thêm TXT/TIFF.
- index.html: nạp module cục bộ, sửa nhãn, giải thích khác biệt browser/localhost.
- tests/test_local_backend.py: 9 bài test Python đã đạt gồm DOCX → PDF thật. tests/local-bridge.test.cjs: 3 bài test JavaScript đã đạt, kiểm chứng route, request và download. OCR tiếng Anh đã kiểm chứng thực tế trả TXT/PDF tìm kiếm được.
- backend/README.md: cách chạy, API, giới hạn.
- Commits: 6296d35, e53fa29, 1a8835f, 57c1c98, fb9cb3a (và tài liệu tiếp theo).

### Chưa hoàn thành / kế tiếp

1. Test browser + localhost trên Windows Chrome, kiểm tra CORS / Local Network Access, vòng đời download và file URI.
2. So sánh PDF CAD nhiều trang, tiếng Việt, bảng/trắc dọc; tách chế độ giữ vector và raster.
3. Office conversion fidelity: bảng, ảnh, columns, định dạng Word/Excel/PPT. DOCX từ PDF hiện ưu tiên editable text.
4. Các module CIT có engine thật phù hợp HDV: bảo mật qpdf, flatten annotations, sửa form, crop, redaction thật, kiểm tra PDF/A, batch.
5. Kiểm tra giấy phép AGPL-3.0, mã nguồn/phiên bản và tests cho từng module trước khi gắn nhãn hoạt động; chưa hoàn thành 119 công cụ.
6. Mỗi vòng sửa code: test Python/Node, smoke browser, ghi commit, cập nhật tài liệu tiến độ.

### Ranh giới kỹ thuật

GitHub Pages chỉ chạy frontend tĩnh. Office/Tesseract/LibreOffice chạy native nên phải có backend localhost (hoặc máy chủ riêng). Nếu triển khai cloud, cần thiết kế xác thực, cách ly, hàng đợi, giới hạn CPU/tệp và chính sách dữ liệu. Không tự kích hoạt tải lên cloud.

## 2026-10-15: GitHub Pages online stability patch

- Verified that GitHub Pages deployment workflows completed successfully; this is distinct from browser-level feature testing.
- Reworked pdf-local-tools.js: browser-only lossless-structure PDF optimization and PDF→TXT text-layer extraction do **not** make calls to localhost:8000.
- Added truthful UI labels: PC-only OCR/Office/TIFF and hybrid Web/PC conversion, rather than promising all operations run on GitHub Pages.
- Updated index.html asset URL to version the local bridge and invalidate stale browser caches.
- Added tests/pages-smoke.test.cjs and GitHub Action pages-smoke.yml on each push for static scripts and browser-only flows.
- Browser PDF optimization may rewrite PDF internals and invalidate digital signatures; signed/archival PDFs should be retained and tested separately. PDF→TXT cannot OCR scanned images.
- Remaining verification: real Chrome on Windows; external website fetching from this environment is restricted, so deployment success must not be confused with pixel-perfect live-browser confirmation.


## 2026-10-15: Tích hợp CIT advanced browser tools và kiểm thử

- Đã thêm cit-advanced-core.js (UMD: page copying, crop, metadata, annotations, Bates, N-up, overlay, rotation) và cit-advanced-ui.js (gắn 14 tác vụ vào giao diện HVD). Các chức năng đủ điều kiện chạy trực tiếp trên GitHub Pages.
- Đã thay công cụ Cắt lề PDF (trước đó chỉ dẫn sang organizer) bằng engine CropBox. Có cảnh báo rõ: CropBox không phải xóa dữ liệu.
- Đã đổi diễn giải chức năng che nền, chữ ký dạng ảnh và làm phẳng form để không nhận nhầm thành redaction, chữ ký số hay xử lý mọi annotation.
- Đã bổ sung các test thực: tests/cit-advanced.test.cjs, tests/cit-advanced-ui.test.cjs. Bao gồm trang trắng N-up, Unicode metadata, crop theo mm, annotations, overlay, rotation, signature ByteRange và tải file browser.
- Workflow .github/workflows/pages-smoke.yml gọi tests/pages-smoke.test.cjs cùng hai test mới, tổng 31 bài Node đã đạt.
- Ghi nhận AGPL-3.0 và tài liệu xác minh tại CIT-ADVANCED-INTEGRATION.md.
- Chưa triển khai hoặc chưa hoàn thiện: qpdf/ Ghostscript, PPT/Office WASM browser, OCR trình duyệt, PDF/A validator, sửa đoạn văn phức tạp, secure redaction, cryptographic signing/validation, full flatten annotation, toàn bộ các trang công cụ CIT.
- Chỉ đóng dấu “hoàn thành” cho module có mã, đường đi UI, xuất PDF thật, kiểm thử PDF thật; không đánh đồng trang công cụ với thuật toán đã tích hợp.

### Quality gate: ngăn tính năng chia sẻ giả

- Bỏ chế độ giả lập "PDF sang QR" từng tạo đường dẫn không có thật `pdfhub.local`; đánh nhãn chưa hỗ trợ khi chưa có máy chủ chia sẻ thật.
- Trình duyệt không tải tài liệu lên server chỉ bằng thao tác tạo mã QR; không sử dụng QR để hàm ý chia sẻ thực.

## 2026-10-15 — Native CIT Text: multi-line batch & rich-run protection

- Integrated new `pdf-batch-text.js` into `index.html` and the existing `PDFOrganizer`. Provides editing across many **existing** text lines in one atomic batch, with preview find/replace, per-line selection and a single Undo step.
- Adapted `pdf-native-text.mjs` to preserve sibling style runs when a uniquely identified run within a mixed-font paragraph is replaced; retained strict native baseline and table boundaries. Rejected text mutations spanning style boundaries.
- Implemented signed-PDF preflight guard (ByteRange) in native rewrite; Type3/fragile text remains protected and uneditable if source cannot be safely identified.
- Added `tests/rich-native.test.cjs`, `tests/batch-text.test.cjs`, expanded `tests/native-text.test.cjs` for true WASM mixed-font and digital signatures; expanded GitHub Actions smoke suite to include all three and `tests/text-layout.test.cjs`.
- Verified GitHub CI **84/84 passing** in workflow after changes; follow final commit check for Pages. Details in [CIT-TEXT-EDITING-UPDATE.md](CIT-TEXT-EDITING-UPDATE.md).
- Important scope: edits multiple original one-line boxes in one transaction, **not** full multiline paragraph reflow. Font Type3 converted to vector outlines, arbitrary WYSIWYG restyling of multiple runs, and full PDF/A/PDF/UA compatibility are not claimed.

## 2026-10-15 — Separate CIT Native Text workspace

- Created independent, static GitHub Pages route [text-editor.html](text-editor.html) with [text-editor-shell.js](text-editor-shell.js) and [text-editor.css](text-editor.css); added main-site tool card **Chỉnh sửa Text chuyên sâu** plus header shortcut.
- Based layout on user-provided CIT-PDF desktop screenshot: top file/export/undo controls, central PDF document, bottom page/zoom navigation, persistent right-hand font/color/size/style/align inspector.
- Native algorithm is **not duplicated**: reuses upstream-derived PdfEngine/PDFium worker already integrated through NativeTextClient, PDFTextLayout checks, original Organizer persistence/history and batch editor.
- Fixed focus handoff from inline native editor to new right-hand dock so clicking font, color or size no longer auto-commits via blur before user presses Apply.
- Explicitly disabled unsafe/cosmetic controls: no fake paragraph spacing, no automatic rich paragraph reflow; Type3 and fragile text remain guarded.
- Added [tests/text-editor-route.test.cjs](tests/text-editor-route.test.cjs) to Node CI and [tests/text-editor-live.cjs](tests/text-editor-live.cjs) in Chromium CI for real PDF replacement/export validation.
- User operation now starts directly from separate module, without page organization. Legacy organizer retained for backward compatibility.
- Ref specification, licensing and QA boundary: [CIT-TEXT-WORKSPACE.md](CIT-TEXT-WORKSPACE.md). Check live-browser workflow status before marking deployment fully accepted.

### CIT Text workspace – nghiệm thu Chromium và phát hành (2026-10-15)

- ✅ **89/89 Node test** thành công, workflow [Pages smoke checks](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38715353221).
- ✅ **Chromium E2E thành công**, workflow [CIT Text Editor Browser QA](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38715250412). Đã chạy 9 điểm kiểm tra: trang độc lập, panel bên phải, mở PDF, chọn text, chỉnh qua panel, commit PDFium, tải PDF, xác minh xóa text gốc và giữ text dòng khác.
- ✅ Đã lưu artifact `cit-text-editor-browser` gồm PDF vào/ra và hai screenshot để QA trên GitHub Actions.
- ✅ Đường vào riêng: `text-editor.html`; đường dẫn từ card và shortcut trong `index.html`.
- ⚠ Chưa khẳng định parity toàn bộ frontend CIT v1.0.0: hỗ trợ văn bản an toàn giữ bố cục CAD, chưa chạy reflow tự do/Type3 nguy hiểm.

## 2026-10-15 — HOÀN THÀNH: Frontend CIT nguyên bản trên GitHub Pages

- **Source**: CIT-PDF tag `1.0.0`, SHA `3c9c138d980a417de7439f383f37882a1d730ab6`; ghim SHA, `npm ci` và Vite build nguyên gốc. Không mô phỏng frontend nữa.
- **Artifact**: toàn bộ CIT bundle (HTML, TypeScript biên dịch, CSS, PDFium WASM, assets) ~176 MB, ghép với website HVD bởi `scripts/cit-original/publish_site.py`.
- **Route**: `text-editor.html` → `cit-native/edit-pdf-text.html` dùng trình editor gốc CIT; `text-editor-hdv.html` giữ editor HVD trước đây làm fallback.
- **Acceptance**: Chromium mở trình CIT nguyên gốc, nạp PDF, chọn vùng chữ, dùng contenteditable, hiển thị dock font/size/spacing, xuất PDF thật; kiểm tra độc lập PyMuPDF phát hiện `CIT NATIVE EDITED`, không còn `CIT ORIGINAL LINE`, giữ `SECOND CAD LINE`, số trang/kích thước không đổi.
- **Deployment**: [GitHub Actions Run 38744102098](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38744102098) **success**, deploy-pages báo `Reported success!`, SHA `c3cade1d0f42f637e708b982d90ac228ccb3c290`.
- **Site**: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor.html ; original engine https://hieudang99dd.github.io/PDF-Editor-Hdv/cit-native/edit-pdf-text.html
- **E2E evidence**: workflow artifact `cit-original-browser-evidence` (PDF đầu vào/đầu ra + screenshot) cùng run trên.
- **Licensing / reproducibility**: xem `CIT-ORIGINAL-FRONTEND.lock.json`, `CIT-ORIGINAL-FRONTEND.md`; AGPL-3.0.
- **Scope**: tương đồng bằng cách build **cùng upstream frontend/engine**, không chỉ dựng giao diện tương tự. Không tuyên bố mọi PDF CAD bất kỳ đều sửa được. Đã chạy thử trong Chromium với artifact Pages; chưa kiểm tra tương tác trên CDN Github Pages trực tiếp từ môi trường này.
