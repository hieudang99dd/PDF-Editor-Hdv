# PDF Đạo Chích — Khắc phục trang Chỉnh sửa văn bản PDF (16/10/2026)

## Triệu chứng

Trang `studio/edit-pdf-text.html` hiển thị nền tối với chữ/ô tải tệp HTML mặc định; phần điều khiển không được định dạng và trình chỉnh sửa không khởi chạy.

## Nguyên nhân xác định trong mã nguồn

Repository hiện là `hieudang99dd/PDF-Editor1` (URL `PDF-Editor-Hdv` đã chuyển hướng), trong khi HTML, bundle, PDF.js worker, PDFium WASM, font và manifest vẫn tham chiếu `/PDF-Editor-Hdv/studio/...`. Khi website chạy ở base khác, tài nguyên có thể tải sai đường dẫn. Triệu chứng trên ảnh phù hợp với lỗi không tải được stylesheet/script.

## Thay đổi đã thực hiện

- Chuyển asset URL trong `studio/edit-pdf-text.html` thành đường dẫn tương đối `./assets/...`; chuyển canonical/điều hướng và Việt hóa nội dung mặc định của vùng tải PDF.
- Chuyển PDF.js worker, qpdf và các route trong bundle chung sang đường dẫn tương đối với trang Studio.
- Chỉnh `editcore-Uyyxl379.wasm` trong `core-ClKb89zT.js` dùng đường dẫn **tương đối với module** (`new URL('./editcore...', import.meta.url)`), không phải tương đối với tài liệu.
- Chỉnh font-loader, wasm-provider, bundle trình chỉnh sửa, URL font trong stylesheet, manifest.
- Chỉ điều chỉnh CSS vùng tải tệp và thanh thương hiệu, không thay thế thuật toán chỉnh sửa text hoặc style bên trong PDF canvas.
- Giữ thông tin giấy phép ở nguồn dự án.

## Kiểm tra tự động

Chạy:

```bash
node tests/text-editor-asset-paths.cjs
```

Các kiểm tra xác nhận tham chiếu script/stylesheet, PDF.js worker, PDFium và qpdf WASM, cũng như loại bỏ tiền tố URL cố định cũ. Đây là **kiểm tra tĩnh**, không thay thế QA chạy trên trình duyệt.

## QA trình duyệt bắt buộc sau GitHub Pages deploy

- [ ] Mở `text-editor.html` ở GitHub Pages hiện tại, hard refresh và xác nhận không có HTTP 404/CORS/MIME errors trong DevTools Network/Console.
- [ ] Trang upload có màu sắc, nút và drop zone bố trí chuẩn trên màn hình desktop/mobile.
- [ ] Mở PDF có lớp văn bản gốc; click đoạn chữ, chỉnh sửa chữ và kiểm tra tiếng Việt có dấu.
- [ ] Kiểm tra đổi font, cỡ chữ, giãn dòng, Undo/Redo, tìm/thay thế, zoom và chuyển trang.
- [ ] Xuất PDF rồi mở lại kiểm tra các chữ đã thực sự thay đổi, không phải chỉ phủ hình lên; bố cục vùng xung quanh không bị lệch.
- [ ] Kiểm tra PDF scan không có text layer, PDF có mật khẩu, font nhúng hiếm và PDF có chữ ký số (cảnh báo phù hợp).
- [ ] Khi lưu xong quay lại trang chủ không bị lỗi đường dẫn.

**Tình trạng:** Đã sửa và đối chiếu lại mã nguồn GitHub; chưa xác nhận đầy đủ các bước QA tương tác trong trình duyệt sau khi deploy. Không coi tính năng đã vượt qua E2E cho đến khi các ô kiểm thử được đánh dấu hoàn thành.

## 16/10/2026 — Kiểm tra tiếp sau phản ánh website vẫn mất giao diện

**Kết quả:** đã thực hiện kiểm thử thật từ GitHub-hosted Chromium against `https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html`; **PASS** đối với PDF mẫu 2 đoạn, sửa text, xuất PDF và kiểm tra glyph độc lập qua PyMuPDF.

### Nguyên nhân gốc đã được kiểm chứng

1. GitHub Pages thực tế phục vụ HTML, CSS, JavaScript đúng `200 OK` và MIME đúng. Vì thế cần phân biệt lỗi client cache với lỗi máy chủ, không chỉ suy đoán rằng Pages chưa cập nhật.
2. Vite module preloader trong `studio/assets/main-DwO0x_KA.js` tính base sai: `./assets/...` được áp dụng từ thư mục module `studio/assets/`, gây đường dẫn lặp `studio/assets/assets/...` (404). Chromium log ghi `Unable to preload CSS ... /studio/assets/assets/lucide-...css` và `Error loading PDF Text Editor`. Đã sửa thành `new URL('../' + dependency, import.meta.url).href`.
3. Tệp `studio/assets/lucide-DZsz3ibU.css` có 130 tham chiếu font từ base cũ `/PDF-Editor-Hdv/studio/assets/`, trả 404. Đã chuyển thành URL tương đối với chính stylesheet (tải font từ `studio/assets/`).
4. Service Worker bản cũ có cache-first cho CSS/JS và có thể tái sử dụng cached asset qua **tên tệp** dù URL xuất phát từ bản triển khai khác. Đã tăng cache version thành `pdf-dao-chich-v12`, xóa cache cũ khi kích hoạt, cho CSS/JS mạng ưu tiên và chỉ tra cache chính xác theo URL.

### Nghiệm thu đầu-cuối

- Workflow Chromium: `https://github.com/hieudang99dd/PDF-Editor1/actions/runs/38877687215` — PASS giao diện, nạp PDF thật, chọn text, sửa và xuất PDF.
- Workflow bổ sung PyMuPDF: `https://github.com/hieudang99dd/PDF-Editor1/actions/runs/38877840669` — PASS: chuỗi mới `PDF DAO CHICH EDITED` được trích xuất, chuỗi cũ `PDF DAO CHICH ORIGINAL` không còn, `ANOTHER TEXT LINE` giữ nguyên, số trang không đổi.
- `tests/studio-live-browser.cjs` chạy trên URL đang phục vụ thực, có ảnh và PDF xuất ở GitHub Action artifact; `tests/text-editor-asset-paths.cjs` được đưa vào Pages smoke CI.
- `studio/repair-editor.html` là điểm khôi phục cache nếu trình duyệt người dùng còn giữ bản lỗi, chỉ unregister Studio SW và xóa các cache asset dành cho ứng dụng, không đụng đến file PDF lưu trên máy.
- Chặn fail-closed nhánh phát hành bundle upstream CIT với base **cũ** trước bước push vào master: `.github/workflows/cit-original-build.yml`. Cần di chuyển đầy đủ `BASE_URL`, `brand_site.py`, `verify_build.py` và test upstream về `/PDF-Editor1/studio/` trong một đợt riêng trước khi tái biên dịch vendor.

**Giới hạn QA:** bài test xác minh hai đoạn Helvetica Latin đơn giản; chưa khẳng định các PDF font subset CJK, Type3, trang scan, text chạy dọc, mật khẩu, PDF ký số hoặc bố cục CAD phức tạp. Với các tệp như vậy cần test riêng. Không có sửa đổi nào vào PDF nội dung người dùng đang lưu cục bộ.
