# PDF HDV — Integration Progress

## 2026-10-15: CIT-PDF 1.0.0 → PDF HDV

Nguồn: Cuongyd196/cit-pdf, tag 1.0.0, commit 3c9c138d980a417de7439f383f37882a1d730ab6. Repo đích: hieudang99dd/PDF-Editor-Hdv, nhánh master.

### Đã có trước đợt này

- Sửa lỗi lưu/tải PDF: 606e519.
- Native text CIT: f1cc44a, c1599ec. PDFium WASM, font/baseline, table bounds, rotation, worker/undo, kiểm thử JS. Xem docs/TEXT_ENGINE.md.
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
- Ghi nhận AGPL-3.0 và tài liệu xác minh tại docs/PROCESSING_AND_QA.md.
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
- Verified GitHub CI **84/84 passing** in workflow after changes; follow final commit check for Pages. Details in [docs/TEXT_ENGINE.md](docs/TEXT_ENGINE.md).
- Important scope: edits multiple original one-line boxes in one transaction, **not** full multiline paragraph reflow. Font Type3 converted to vector outlines, arbitrary WYSIWYG restyling of multiple runs, and full PDF/A/PDF/UA compatibility are not claimed.

## 2026-10-15 — Separate CIT Native Text workspace

- Created independent, static GitHub Pages route [text-editor.html](text-editor.html) with [text-editor-shell.js](text-editor-shell.js) and [text-editor.css](text-editor.css); added main-site tool card **Chỉnh sửa Text chuyên sâu** plus header shortcut.
- Based layout on user-provided CIT-PDF desktop screenshot: top file/export/undo controls, central PDF document, bottom page/zoom navigation, persistent right-hand font/color/size/style/align inspector.
- Native algorithm is **not duplicated**: reuses upstream-derived PdfEngine/PDFium worker already integrated through NativeTextClient, PDFTextLayout checks, original Organizer persistence/history and batch editor.
- Fixed focus handoff from inline native editor to new right-hand dock so clicking font, color or size no longer auto-commits via blur before user presses Apply.
- Explicitly disabled unsafe/cosmetic controls: no fake paragraph spacing, no automatic rich paragraph reflow; Type3 and fragile text remain guarded.
- Added [tests/text-editor-route.test.cjs](tests/text-editor-route.test.cjs) to Node CI and [tests/text-editor-live.cjs](tests/text-editor-live.cjs) in Chromium CI for real PDF replacement/export validation.
- User operation now starts directly from separate module, without page organization. Legacy organizer retained for backward compatibility.
- Ref specification, licensing and QA boundary: [docs/TEXT_ENGINE.md](docs/TEXT_ENGINE.md). Check live-browser workflow status before marking deployment fully accepted.

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
- **Licensing / reproducibility**: xem `CIT-ORIGINAL-FRONTEND.lock.json`, `docs/STUDIO_DEPLOYMENT.md`; AGPL-3.0.
- **Scope**: tương đồng bằng cách build **cùng upstream frontend/engine**, không chỉ dựng giao diện tương tự. Không tuyên bố mọi PDF CAD bất kỳ đều sửa được. Đã chạy thử trong Chromium với artifact Pages; chưa kiểm tra tương tác trên CDN Github Pages trực tiếp từ môi trường này.

### 2026-10-15 — ĐÃ KHẮC PHỤC trôi phiên bản Pages legacy (kết quả cuối)

- GitHub Pages có **hai cơ chế**: custom Actions và legacy branch `master`. Vì `GITHUB_TOKEN` không có quyền đổi `build_type` (HTTP 403), không chỉ dùng `deploy-pages`.
- Sau khi mọi test Chromium và PyMuPDF pass, CI đồng bộ **toàn bộ frontend CIT đã build nguyên bản** vào repo `master/cit-native/` rồi tạo commit bot `bee0f8291ebd38780aafbbfacbbfefc9128d17e5`.
- Đường dẫn `master/text-editor.html` thay bằng redirect sang `./cit-native/edit-pdf-text.html`, giữ editor HVD cũ tại `master/text-editor-hdv.html`, thêm `.nojekyll` để Pages legacy phục vụ đúng asset.
- Từ đây dù lần cập nhật tiếp theo vẫn kích hoạt Pages legacy, **frontend CIT hiện nằm sẵn trong chính nguồn của branch**, không còn phụ thuộc chỉ vào artifact tạm.
- Workflow [38744823470](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38744823470): **success**; bước PDFium edit + PyMuPDF nội dung, Git push, upload, deploy đều thành công.
- Commit nhúng CIT: https://github.com/hieudang99dd/PDF-Editor-Hdv/commit/bee0f8291ebd38780aafbbfacbbfefc9128d17e5
- Cách phát triển: nguồn CIT gốc được ghim tag/commit trong `CIT-ORIGINAL-FRONTEND.lock.json`; `cit-native/` là **compiled distribution**, không phải file TypeScript source.

## 2026-10-15 — Frontend CIT × PDF HVD: bản nâng cấp điều hướng, fallback, CI

- **Hướng nâng cấp**: dùng frontend CIT-PDF v1.0.0 (đóng băng SHA upstream `3c9c138d980a417de7439f383f37882a1d730ab6`) với nguyên các module biên tập, WASM, font, reflow, Undo/Redo và Export; không tự tạo bản sao HTML/JS mới.
- **HVD bridge**: tạo `scripts/cit-original/hvd-hub.js` và `hvd-hub.css`; bổ sung nút quay về HVD trong toolbar CIT và landing, bắt sự kiện `#back-to-tools` ở capture phase để không chuyển nhầm đến trang CIT.
- **An toàn PDF**: không chỉnh các thuật toán `editcore`, `PdfEngine`, engine worker, rich paragraphs; module HVD chỉ điều hướng và nhận diện. Font/layout/Export là của upstream CIT.
- **Đã sửa bug lớn** trong `publish_site.py`: từ lần build thứ hai, `text-editor.html` đã là redirect; trước đây có thể đổi tên redirect thành `text-editor-hdv.html` và phá fallback. Mới có fail-closed guard và kiểm chứng fallback thật.
- **Bundle sạch**: không copy lại `cit-native/` cũ; build từ upstream sạch rồi thêm bridge. CI persist chính `cit-stage/cit-native` đã kiểm tra lên `master`.
- **Deploy nhất quán**: loại bỏ lần xuất bản Pages từ riêng pipeline CIT để không chạy đua với `pages build and deployment` mặc định từ master. Chỉ commit code đã kiểm thử, để nguồn master xuất bản tự động.
- **Bộ test**: `tests/hvd-cit-hub.test.cjs` (unit navigation/capture, không can thiệp PDF engine) và `tests/cit-original-browser.cjs` (Chromium native CIT real PDF, panel font, HVD route, export); PyMuPDF độc lập tiếp tục xác minh text gốc bị thay và dòng bên cạnh còn nguyên.
- **Xác nhận QA**: workflow CIT [38754383598](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38754383598) **success** (bao gồm real Chromium và PyMuPDF); smoke test HVD [38754383650](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38754383650) **success**.
- **Bot build đã đồng bộ GitHub**: commit `8af167eea08572d326e508ebd1c02a5a42227bfb` chứa `cit-native/hvd-hub.js`, `hvd-hub.css`, HTML CIT tích hợp mới, route chính và fallback.
- **GitHub Pages**: theo dõi workflow `38754751823` cho bản bot build. Nếu workflow chưa báo xanh thì chưa khẳng định CDN trực tiếp đã cập nhật mới.
- **Giới hạn**: chưa QA từng loại file CAD thực có font Type3, table hỗn hợp, PDF ký số; nguồn frontend gốc CIT được kế thừa chứ không mặc nhiên là engine sửa được mọi PDF.

## 2026-10-15 — Cá nhân hóa giao diện PDF HVD, giữ nguyên thuật toán

- **Yêu cầu:** mọi tên thương mại, logo, mô tả UI của công cụ đều sử dụng **PDF HVD**. Thuật toán xử lý PDF được giữ nguyên như bản gốc đã qua kiểm thử; không thay thế bằng công cụ mô phỏng.
- **Frontend branding tự động:** `scripts/cit-original/brand_site.py` chỉnh tên trang, meta title/author, OpenGraph, Twitter metadata, canonical, manifest, favicon và brand trước first paint của bản Vite. `hvd-mark.svg` và `hvd-site.webmanifest` được tạo cho HVD. `hvd-hub.js` đổi tên thanh điều hướng/footer, giữ nút quay về HVD và không đụng PDFium/algorithms.
- **Đường dẫn mới:** `text-editor.html` → `studio/edit-pdf-text.html`; đổi BASE_URL Vite thành `/PDF-Editor-Hdv/studio/`. Commit bot `c8c0ce35c1fbe95cb5b0d2a8d54d508e7716bfdd` đã tạo thư mục `studio/` và xóa thư mục xuất bản `cit-native/` cũ.
- **Giao diện HVD hiện hữu:** trang chủ và editor dự phòng được đổi tên hiển thị PDF HVD (tên công cụ, tiêu đề, chú thích font, thông báo UI), không phá code gốc.
- **Bản quyền / pháp lý:** các thông báo bản quyền gốc, giấy phép AGPL-3.0, `NOTICE.md` và khả năng truy cập mã nguồn được giữ lại theo nghĩa vụ phân phối. Việc thương hiệu hiển thị thành PDF HVD **không** có nghĩa sở hữu tác quyền của phần mềm nguồn mở.
- **Kiểm thử:** Python unit kiểm tra cách brand và giữ copyright, Vite build pinned source, Chromium mở `/studio/` kiểm tra logo/title/font panel/Undo-Redo và thay chữ PDF thật, PyMuPDF kiểm tra chữ đầu ra và hình học, Node smoke test HVD.
- **Đã đạt:** [CI native editor](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38758092102) = `success`; Node smoke [38758215338](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38758215338) = `success`. Commit chứa frontend đã đóng gói: [c8c0ce3](https://github.com/hieudang99dd/PDF-Editor-Hdv/commit/c8c0ce35c1fbe95cb5b0d2a8d54d508e7716bfdd).
- **Cần theo dõi** Pages legacy build trên commit mới nhất đến khi GitHub xác nhận thành công. Kiểm chứng PDF A0/A1, font Type3 và file CAD thực vẫn là công việc QA tiếp theo.

## 2026-10-15 — Thiết kế lại trang chủ PDF HVD (UI v2)

- Nguồn yêu cầu: ảnh chụp giao diện hiện tại; mục tiêu giao diện chuyên nghiệp, tiết kiệm diện tích, rõ ràng thứ bậc, phù hợp desktop/tablet/mobile.
- Tệp mới: `hvd-ui-v2.css` (responsive typography, layout 4/2/1 cột, hero gọn, theme, thẻ công cụ và trạng thái); `hvd-ui-v2.js` (đặt tên tiếng Việt rõ nghĩa, công cụ thường dùng, tìm kiếm, lọc nhóm, đánh dấu web/PC/chưa phát triển).
- `index.html` nạp hai tệp này sau script gốc, không thay đổi xử lý tệp, thư viện PDF hay thuật toán. Tác vụ vẫn giữ `data-i` gốc nên dùng lại `openTool`/router.
- Danh mục nổi bật không bị lặp trong danh mục bên dưới khi đang xem Tất cả.
- Hạn chế: trạng thái web/PC dựa trên registry frontend, chưa có health-check thời gian thực; nhãn 'Trình duyệt' chỉ cho biết phương thức xử lý, không đảm bảo mọi file PDF đều được hỗ trợ. Các chức năng chưa triển khai được vô hiệu hóa ở catalog.
- QA: workflow Pages smoke tại commit `d01971f8` đã đạt; workflow commit cuối `398c8b63` và Pages deployment cần kiểm tra khi hoàn tất.

## 2026-10-15 — Sửa bố cục nút chỉnh Text sai vị trí trên header

- Yêu cầu người dùng từ ảnh: nút "T Chỉnh Text" ở góc phải header là sai phân cấp; phải bỏ khỏi thanh ứng dụng chung.
- Đã kiểm tra và xác nhận `index.html` không còn `#shortcut-text`. Trình **Chỉnh sửa văn bản PDF** là thẻ công cụ trong nhóm **Chỉnh sửa**, đường xử lý `cit-text-route` vẫn mở `text-editor.html`.
- Thêm `header #shortcut-text{display:none!important}` làm biện pháp phòng trường hợp trình duyệt còn cache HTML cũ. Không dùng CSS thay cho việc xóa khỏi markup.
- Sửa `hvd-ui-v2.js`: tên và mô tả thương mại chỉ dùng khi **render**. Không được ghi đè `T[i][0]` vì `pdf-local-tools.js` và các module xử lý PDF dispatch bằng đúng tên tác vụ. Đồng thời bảo toàn `data-i` để routing không đổi, thẻ Text chỉ hiển thị một lần ở mục nổi bật.
- Kiểm tra hồi quy qua `tests/home-layout.test.cjs`: header không có Text CTA, tồn tại thẻ Text đúng nhóm, mã định tuyến và engine key không bị sửa, tìm kiếm nhóm hoạt động. Thêm vào `pages-smoke.yml`.
- CI [run 38765064531](https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38765064531) **success**. Pages deployment tại commit tiếp theo cần chờ kiểm tra.

## 2026-10-15 — Loại bỏ footer chữ dài trên trang chủ, giữ thông báo giấy phép theo yêu cầu

- Đã xóa hẳn `<footer>` chứa mô tả kỹ thuật, "Mã nguồn", "AGPL-3.0", "Ghi nhận tác giả" khỏi `<main id="home">`; không chỉ dùng `display:none` để che nội dung.
- Giao diện chính chỉ hiển thị nút thông tin nhỏ **ⓘ** ở header. Mở khi được nhấn, hiển thị một `<dialog>` gọn gàng và có thể đóng bằng nút ×, Escape hoặc click nền.
- Đảm bảo nghĩa vụ nguồn mở: popup vẫn cung cấp thông báo bản quyền (BentoPDF Contributors, Cường IT), điều khoản không bảo hành, link `LICENSE`, `NOTICE.md` và repository chứa mã nguồn/thay đổi. Files pháp lý không bị sửa/xóa.
- Mã mới: `hvd-legal.js`; CSS bổ sung trong `hvd-ui-v2.css`; HTML chỉ sửa `index.html`, không động đến engine PDF.
- Bổ sung hồi quy `tests/home-legal.test.cjs` vào workflow `pages-smoke.yml`. Phải xác nhận kiểm thử và GitHub Pages CI trước khi báo đã lên trang công khai.

## 2026-10-16 — Thông tin giấy phép không che giao diện

- Bỏ hoàn toàn bảng `<dialog id="hvd-legal-dialog">` và không nạp `hvd-legal.js` từ trang chủ. Không còn hộp thoại pháp lý phủ lên công cụ xử lý PDF.
- Giữ biểu tượng thông tin nhỏ, mở `NOTICE.md` trong tab mới khi người dùng chủ động chọn; không tự bật, không làm gián đoạn quá trình thao tác.
- Giữ nguyên `LICENSE`, `NOTICE.md` và ghi nhận tác giả trong repository. Không thay đổi thuật toán xử lý PDF.
- Cập nhật CSS, cache version và kiểm thử để ngăn hộp thoại xuất hiện trở lại.

## 2026-10-16 — Tinh gọn giao diện, Sửa Text là công cụ riêng

- Chốt giữ tính năng Sửa Text PDF gốc độc lập; đi thẳng `text-editor.html` qua định tuyến `cit-text-route` như cũ, không gộp với nhóm Chỉnh sửa PDF.
- Giảm giao diện chính xuống 15 thẻ (cấu hình tĩnh), 5 mục lọc: Sửa Text, Biên tập, Tổ chức, Chuyển đổi và Nâng cao.
- Gộp các thao tác trang, ghép, đánh số/Bates/watermark, chuyển đổi Office, xuất ảnh, N-up/Overlay, metadata thành nhóm có submenu; lựa chọn vẫn gọi đúng `openTool(i)` cũ.
- Ẩn tính năng chưa có engine bằng allowlist; không xóa mã nguồn/thuật toán, không sửa `T`, `organizer.js`, PDFium/CIT hay Local Engine. OCR/Office/TIFF tiếp tục gắn nhãn cần PC; không hứa chạy toàn bộ trên Pages.
- Thay `hvd-ui-v2.js`, CSS, cache phiên bản của `index.html`, cập nhật kiểm thử `tests/home-layout.test.cjs` và ghi tiến độ; chờ CI và Pages xác thực.

### CI sửa Text native sau khi tinh gọn danh mục

- Test Chromium cũ kiểm tra `#shortcut-text` vốn đã bị bỏ khỏi header theo quyết định UI trước đó, gây báo lỗi giả ở bước quay về trang HVD.
- Sửa `tests/cit-original-browser.cjs` để xác minh trang đích bằng `#logo` có chữ PDF HVD và tồn tại `#tools` thay vì nút header đã bị xóa. Không thay đổi thao tác PDFium, file kết quả hoặc kiểm tra nội dung PDF.

## 2026-10-16 — Repository cleanup / workflow consolidation

- Đã kiểm kê nguồn của frontend `studio/` được build cố định; xác định đây là bundle dùng thật, **không xóa** JS chunk/CSS/WASM/font hay các file `.br` mà chưa có đối chiếu manifest.
- Gộp **7 file tài liệu** theo 3 workflow: `docs/TEXT_ENGINE.md`, `docs/STUDIO_DEPLOYMENT.md`, `docs/PROCESSING_AND_QA.md`; giữ nguyên các quyết định cũ với nhãn lịch sử. Cập nhật liên kết từ `NOTICE.md`, `backend/README.md`, ma trận tính năng và nhật ký tiến độ.
- Xóa **19 script vá thử** ở `scratch/`, xóa `debug_run.py` và `debug_run2.py`, `hvd-home-v2.css` và `hvd-legal.js` vì không còn nằm trong đường tải chính. Nội dung vẫn có thể phục hồi qua lịch sử Git trước khi merge.
- Tạo `README.md` (điểm vào duy nhất cho người mới) và `docs/REPOSITORY_MAP.md` (mô hình folder/cleanup). Điều chỉnh `.gitignore`, cập nhật skill agent về kiến trúc Hybrid để tránh sửa nhầm production artifact.
- Không sửa code thuật toán, PDFium, `organizer.js`, `text-editor.html`, frontend Vite đã build, backend hoặc `vendor/` trong lần dọn dẹp này.
- QA: test Node toàn repo qua GitHub Actions và kiểm tra link/route/syntax; kiểm thử trên GitHub Pages và CAD A0/A1 cần thực hiện riêng. Không xem smoke test là chứng minh tính tương đương giao diện đã triển khai.


## 2026-10-16 — UX Workflow (in-place output, refresh, Back/Forward)

- Tạo đặc tả `docs/UX_WORKFLOW.md`: vòng đời tác vụ EMPTY → READY → PROCESSING → RESULT/ERROR, các hành động Reset/New File/Back/Download, kiểm soát unsaved và cách nghiệm thu browser.
- `index.html`: workspace có nút Danh mục công cụ, Làm mới tác vụ (giữ file), Tệp khác (không thoát công cụ); header refresh không còn reload nguyên trang. Route `#hvd-tool=N` hỗ trợ Back/Forward; trong cùng phiên, giữ file khi forward lại đúng tool. Không lưu dữ liệu PDF vào browser storage.
- `index.html`, `pdf-local-tools.js`, `cit-advanced-ui.js`: kết quả download ở nguyên tool; theo dõi và thu hồi Blob URL sau 120 giây khi không còn hiển thị, không thu hồi tức thời khiến tải file lớn lỗi. Trước khi rời khi kết quả chưa được yêu cầu tải có cảnh báo.
- `pdfium-preflight.html`: Làm mới báo cáo vẫn giữ file, Tệp khác không điều hướng. `hvd-ui-v2.css`: nút refresh có thể sử dụng trên mobile; theme ghi preference không nhạy cảm.
- **Không thay** các engine/JS minified `studio/`, `organizer.js`, native text worker hoặc API save. `#save` và `#exitEditor` Studio cần E2E riêng trước khi cải tổ sâu.
- `tests/ux-session.test.cjs`: hồi quy các trạng thái, in-place downloads, refresh, history; GitHub Actions pages-smoke để nghiệm thu tĩnh. Kiểm thử Chrome/Edge + PDF kỹ thuật thực tế vẫn là hạng mục tiếp theo.

## 2026-10-16 — Khắc phục Organizer không thoát tài liệu khi Làm mới

- Phát hiện `#po-tb-reset` trước đây chỉ hoàn nguyên cấu trúc trang trong history, không xóa tài liệu và không trở về khu vực upload.
- Tạo `PDFOrganizer.newDocument()`: khóa khi đang đọc/lưu, xác nhận nếu có PDF, `destroy()` instance cũ (PDF.js/worker/cache/URL/listeners), khởi tạo lại cùng tính năng bằng `window.initOrganizer([])`; không reload website và không tự về trang chủ.
- Đưa **Làm mới** lên thanh quản lý tài liệu; đổi nhãn nút cũ thành **Hoàn nguyên trang** cho đúng phạm vi; bỏ mũi tên back icon cực nhỏ, thay bằng **Danh mục công cụ** có nhãn và kích thước rõ ràng, phân bố responsive.
- Thiết kế lại màn hình upload, hỗ trợ Enter/Space; thu gọn header Studio thừa tại `studio/hvd-brand.css` (không đụng dữ liệu/engine).
- `tests/organizer-reset.test.cjs` kiểm tra hủy và cho phép, trạng thái đang đọc/lưu; cập nhật Chromium E2E với PDF thật và workflow `ux-browser.yml` tự chạy khi sửa organizer; tài liệu quy trình `docs/UX_WORKFLOW.md` đã cập nhật.
- QA cần xác nhận Node/Chromium trước khi gộp; các tài liệu CAD A0/A1 với font Type3 và thay đổi text phức tạp vẫn cần thử riêng.


- Tách điều kiện tự chạy `cit-original-build.yml`: thay đổi `organizer.js` hoặc trang chủ không còn gây build lại và ghi đè `studio/`; workflow vẫn có `workflow_dispatch` và triggers theo nguồn Studio. Tăng cache version `organizer.js` trong cả trang chính lẫn trình editor dự phòng, và `hvd-brand.css` trong Studio.


## 2026-10-16 — Native Vector Region Eraser v1

- Thêm chức năng Xóa vector theo vùng tại Organizer: vẽ hình chữ nhật/đa giác, nhiều vùng xóa union và vùng giữ bên trong (difference). Bảo vệ mảng vùng qua Undo/Redo. Không dùng whiteout hoặc raster overlay làm kết quả PDF.
- Geometry: pdf-region-geometry.mjs giao polygon với đường thẳng, tách parametric intervals, kiểm tra polygon tự cắt, giới hạn 64 vùng/trang và 256 đỉnh/vùng.
- PDFium: pdf-region-native.mjs dùng các API PATH segment/object đang xuất trong WASM CIT, xóa PATH nguồn và thêm các đoạn giữ ngoài vùng, bảo toàn màu/width/matrix/z-index. Worker/client độc lập. Cắt sau native text rewrite, trước annotation.
- Phạm vi v1: PATH line/polyline nét liền, không tô kín, trang /Rotate=0. Báo lỗi thay vì xóa sai cho Bézier, hatch/fill, dashed, clip, matrix suy biến; text/image/Form không bị sửa. Không phải PDF redaction.
- CI: tests/pdf-region-geometry.test.cjs, tests/pdf-region-native.test.cjs kiểm tra PDF vector thực; UX Browser QA tương tác vẽ vùng + export, cùng Pages smoke.
- Đặc tả kiến trúc/tọa độ/giới hạn/QA: docs/REGION_ERASER.md. Kiểm tra A0/A1, layered CAD, stroke hairline, CropBox và XObject lồng vẫn cần bộ dữ liệu nghiệm thu riêng.


## 2026-10-16 — Tách Native Region Eraser thành công cụ độc lập

- Tạo trang độc lập `region-eraser.html`, style `region-eraser.css`, controller `region-eraser.js`: tải/chọn PDF, xem trước theo trang bằng PDF.js, chọn vùng chữ nhật hoặc đa giác, nhiều vùng xóa/protect, Undo/Redo, chọn tệp mới, Làm mới và xuất PDF không điều hướng.
- Chuyển công cụ trên trang chủ sang route `region-eraser-route` trỏ trực tiếp tới trang mới, có thẻ riêng trong danh mục Chỉnh sửa.
- Gỡ plugin UI `pdf-region-ui.js`, styles `po-region-*`, mọi trường `eraseRegions` và xử lý `eraseRegionsInWorker` khỏi `organizer.js`; Organizer giữ nguyên chức năng sửa text, trang và chú thích.
- Bảo toàn thuật toán lõi `pdf-region-geometry.mjs`, `pdf-region-native.mjs`, `pdf-region-worker.mjs`; adapter riêng không dùng PDFLib, để xuất từ PDF nguồn, tránh làm ảnh hưởng tới nội dung chỉnh sửa khác.
- Cập nhật test Node kiểm tra sự độc lập và bài Chromium cho luồng route độc lập → vẽ vùng → xem kết quả → tải PDF thực → làm mới.


## 2026-10-16 — Nâng dung lượng Region Eraser lên 512 MiB

- Đồng bộ cấu hình 512 MiB ở UI và PDFium qua `pdf-region-limits.mjs`, cảnh báo RAM từ 256 MiB.
- Xem trước PDF.js qua Blob URL, giới hạn canvas 16 triệu pixel, giải phóng preview URL khi đóng PDF. Không nhân bản `file.arrayBuffer()` trên main thread ở bước xuất; Worker nhận File rồi tự đọc, transferable output PDF.
- Cải tiến `pdf-region-worker/client`: progress theo trang/đối tượng, AbortController hủy tác vụ, watchdog 8 phút và deadline thích ứng đến 30 phút, báo lỗi thiếu RAM mà không thay đổi file nguồn.
- Bổ sung regression `tests/pdf-region-512mb.test.cjs` và workflow `region-large.yml` kiểm tra PDF thật >80 MiB; kỹ thuật kiểm thử và giới hạn được ghi trong `docs/REGION_ERASER.md`.
- **Lưu ý:** 512 MiB là ngưỡng nhận tệp; không có chứng chỉ thực thi mọi PDF 512 MiB và không kiểm tra mọi tổ hợp trình duyệt/thiết bị.


## 2026-10-16 — Boolean regions + dàn trang + range + xem kết quả trước tải

- `pdf-region-geometry.mjs`: hỗ trợ union (nhiều vùng riêng), between (vùng giữa hai đường bao), intersection (chỉ vùng giao), chặn polygon lỗi hoặc không giao nhau.
- `pdf-region-plan.mjs` mới: kế hoạch xóa theo các trang đã vẽ hoặc nhân vùng từ trang đang chọn qua khoảng Từ–Đến (inclusive, tối đa 500 trang), không thay đổi dữ liệu vùng nguồn.
- `region-eraser.html/js/css`: chuyển mặc định sang dàn trang 24 thumbnail/lượt, lazy render, nhấp trang để mở biên tập phóng to và quay lại gallery.
- Sau **Áp dụng & xuất PDF**, mở PDF kết quả thật bằng PDF.js, cho phép Bản gốc/Sau xử lý để kiểm tra chính xác trước khi tải xuống, không dùng phủ trắng.
- Thêm `tests/pdf-region-boolean-gallery.test.cjs`, nâng Chromium E2E cho PDF 2 trang với dải giữa hai biên, khoảng 1–2 và xem trước/sau.
- Giữ nguyên tách biệt khỏi Organizer, giới hạn 512 MiB, worker cancellation, cùng chính sách không sửa file PDF gốc.


## 2026-10-16 — Sửa lỗi /Rotate ở Region Eraser

- Loại bỏ chặn /Rotate của PDFium; chuyển UI viewport PDF.js theo từng trang tới worker để nghịch đảo chính xác vùng khoanh trên trang xoay, CropBox và UserUnit.
- Xác minh góc xoay PDFium/PDF.js; không đoán tọa độ khi thiếu/ma trận suy biến. Hỗ trợ trang 0°/90°/180°/270° lẫn trong cùng khoảng trang.
- Node/PDFium QA: `tests/pdf-region-rotation.test.cjs`, thêm Chromium fixture trang thứ hai xoay 90° và xác nhận xóa vật lý trong toàn khoảng.
- Không sửa Organizer, core Native Text và giới hạn đầu vào 512 MiB.


## 2026-10-16 — Bổ sung xóa rộng và PDF có chữ ký

- `pdf-region-native.mjs` bổ sung mode `whole-object`: loại bỏ thật các page object chữ, ảnh, fill/path, Form giao vùng bằng PDFium. Giữ mode `precise` để cắt vector đúng biên; không dùng phủ trắng.
- `pdf-region-geometry.mjs` kiểm tra vùng giao với bounding rect theo phép boolean, cache giao cạnh để tránh lặp tính toán với PDF nhiều đối tượng.
- Checkbox cho phép tạo bản sao PDF có chữ ký số, với thông báo chữ ký cũ mất hiệu lực; không mặc định bỏ chặn, không tuyên bố giữ chữ ký hợp lệ.
- Giao diện có hai chế độ và cảnh báo tường minh về xóa nguyên đối tượng có thể mất nội dung ngoài vùng; báo cáo số page object đã gỡ và xem PDF kết quả.
- Tests `pdf-region-all-objects.test.cjs` và Chromium E2E thêm tình huống chữ bị xóa thực, không thay đổi Organizer.
