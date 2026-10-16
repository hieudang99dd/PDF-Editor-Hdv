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
