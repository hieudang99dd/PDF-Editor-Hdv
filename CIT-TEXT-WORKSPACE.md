# PDF HVD – Chỉnh sửa Text chuyên sâu (workspace riêng)

Ngày: 2026-10-15. Thiết kế theo màn hình CIT-PDF desktop do người dùng cung cấp: khung xem PDF trung tâm, panel ĐỊNH DẠNG bên phải, thanh công cụ trên và điều khiển trang dưới.

## Kết quả kiến trúc

- Trang riêng: [text-editor.html](text-editor.html), đường dẫn public `/PDF-Editor-Hdv/text-editor.html`. Mục "Chỉnh sửa Text chuyên sâu" và nút "T Chỉnh Text" trên trang chủ mở trực tiếp trang này, không yêu cầu đi qua công cụ sắp xếp trang.
- UI và CSS: [text-editor-shell.js](text-editor-shell.js) + [text-editor.css](text-editor.css). Bố cục giao diện lấy cảm hứng trực tiếp từ ảnh CIT, dark gray với nhấn xanh ngọc, cố định panel định dạng bên phải.
- **Engine sửa PDF gốc**: gọi nguyên luồng native CIT đang sử dụng trong [pdf-native-text.mjs](pdf-native-text.mjs), [pdf-native-client.mjs](pdf-native-client.mjs), [pdf-native-worker.mjs](pdf-native-worker.mjs), và `vendor/cit-pdf/editcore/`. Không viết engine thay thế, không chuyển trang thành ảnh để lưu.
- Phân tích vùng chữ và geometry: [pdf-text-layout.js](pdf-text-layout.js), PDF.js text layer, kiểm tra fontkit, bounding box, baseline, CropBox, bảng, font Type3, Undo/Redo và lưu.
- Sửa nhiều vùng hiện hữu: [pdf-batch-text.js](pdf-batch-text.js). Mỗi lượt là một giao dịch atomic, lỗi nào cũng không ghi dở các vùng khác.

## Đối chiếu với CIT-PDF tag 1.0.0

Upstream:
- `src/pages/edit-pdf-text.html`
- `src/js/logic/edit-pdf-text-page.ts`
- `src/js/logic/edit-pdf-text-dock.ts`
- `src/js/editcore/`

**Phân biệt rõ:** UI mới HVD mô phỏng bố cục vận hành và panel CIT. Native PdfEngine/PDFium và logic sửa text đã được kế thừa trực tiếp trong HVD từ trước. Đây **không phải** copy nguyên 100% frontend Vite/TypeScript, chưa phải mọi chức năng của ứng dụng CIT desktop như image/shape editing và text paragraph live reflow. Các phần phụ thuộc dock upstream, font manager và rich paragraph reflow cần đối chiếu rồi port riêng sau khi QA.

## Hướng dẫn sử dụng

1. Mở `https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor.html`.
2. Chọn PDF. Chương trình chuyển thẳng sang chế độ Edit Text, không mở tab sắp xếp.
3. Nhấp vào vùng chữ trên PDF; nội dung và định dạng hiển thị trên panel phải.
4. Sửa nội dung qua ô nhập hoặc trực tiếp trên dòng; chọn font/cỡ/màu/đậm/nghiêng/gạch chân/căn chỉnh.
5. Nhấn "Áp dụng". Worker CIT thử rewrite native, kiểm tra glyph/width/baseline/biên ô rồi mới ghi Undo.
6. Với nhiều dòng, chọn "Sửa nhiều dòng" và xem trước tìm/thay thế.
7. Nhấn "Xuất PDF" để lưu PDF thật qua cơ chế HVD, không chỉ xuất ảnh.

## QA

- `tests/text-editor-route.test.cjs`: đường dẫn độc lập, asset nội bộ, native-engine, sidebar wiring, điều kiện an toàn.
- `tests/text-editor-live.cjs`: mở file PDF thật, click text layer, sửa qua inspector, tạo PDF đầu ra và kiểm tra text mới bằng PDF.js.
- CI: [pages-smoke.yml](.github/workflows/pages-smoke.yml) (Node), [text-editor-live.yml](.github/workflows/text-editor-live.yml) (Playwright Chromium, lưu screenshots/PDF artifact).
- Cần kiểm tra thêm PDF kỹ thuật A0/A1, bảng phức tạp, Type3, font subset, PDF ký số và tệp lớn trên Chrome/Edge Windows.

## Giới hạn có chủ đích

- Các vùng chữ Type3 không có ánh xạ font an toàn không được mở sửa đại trà.
- Chưa có live paragraph reflow đa dòng tự do như CIT upstream; trong hồ sơ CAD cần kiểm tra không thay đổi đường bảng, khung tên và nét vector.
- Một đoạn nhiều run/màu chỉ sửa được trong phạm vi engine CIT gốc xác định duy nhất mà không phá các run khác.
- Các thao tác liên quan khoảng cách đoạn/giãn dòng từ ảnh CIT chưa bật trong panel bởi chưa đủ kiểm chứng hình học; không dựng nút giả.
- Bộ công cụ sắp xếp/chú thích cũ vẫn được giữ nguyên vì tương thích dự án; workspace mới là luồng chính để sửa văn bản.
- Giấy phép: GNU AGPL-3.0; xem NOTICE.md.
