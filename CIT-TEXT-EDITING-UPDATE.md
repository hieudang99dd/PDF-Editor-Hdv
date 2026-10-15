# CIT Native Text – PDF HVD (2026-10-15)

Nguồn: CIT-PDF 1.0.0; tích hợp với native PDFium WASM, stream-splice, font provider và Type3 surgery. Giấy phép GNU AGPL-3.0.

## Những gì đã cập nhật thực tế

- **Sửa nhiều dòng trên cùng trang PDF**: thêm file `pdf-batch-text.js`, nút "☷ Sửa nhiều dòng" trong organizer sau khi bật chế độ Chỉnh sửa nội dung. Giao diện hiển thị tối đa 500 vùng chữ có thể chỉnh sửa, mỗi vùng có ô nhập và checkbox. Có tìm và xem trước thay thế. Giới hạn 80 dòng mỗi lượt.
- **Giao dịch atomic**: từng vùng vẫn được kiểm tra bằng PDFTextLayout và bộ preview/commit PDFium; tạo candidate PDF trước khi ghi page.textEdits. Nếu bất kỳ dòng nào lỗi font, giới hạn ô bảng, baseline, hoặc native engine, toàn bộ lượt bị từ chối; không thêm Undo và không thay đổi PDF đang mở. Một lượt thành công ứng với một bước Undo.
- **Giữ style của các dòng đã sửa trước đó**: nếu người dùng đã chọn font, size, màu hay căn lề trên một dòng, sửa hàng loạt chỉ thay newText; không reset định dạng.
- **Rich text bảo toàn run**: thay `replacementRuns` và `findParagraph` trong `pdf-native-text.mjs`. Cho phép đổi chuỗi thuộc một run xác định duy nhất, giữ font, màu, script, render mode, stroke và các run liền kề. Không tự dàn lại paragraph và không cho phép thay xuyên qua ranh giới hai kiểu font.
- **Bảo vệ Type3**: vẫn chạy `protectType3Text` và `protectFragileText` từ CIT. Vùng Type3, text outline và các vùng nhận dạng chưa đáng tin cậy vẫn bị chặn, không tự viết đè; giao diện mới có thông tin số lượng vùng bị khóa.
- **Chữ ký số**: từ chối native rewrite khi phát hiện marker PDF signature `/ByteRange`; đây là biện pháp tránh phá chữ ký, không phải validator chữ ký toàn diện.
- **Version cache**: cập nhật đường dẫn organizer -> native worker -> native text engine để trình duyệt không dùng engine đã cache.

## Kiểm thử và trạng thái

Workflow: `.github/workflows/pages-smoke.yml` chạy thêm:
- `tests/native-text.test.cjs`: PDFium WASM thật, bảng/tiếng Việt, trang xoay và CropBox, mixed-font và signed-PDF.
- `tests/rich-native.test.cjs`: đa run, bảo toàn format và strict geometry.
- `tests/batch-text.test.cjs`: atomic commit, rollback.
- `tests/text-layout.test.cjs`: layout guard không đè bảng.
- Các kiểm thử GitHub Pages/CIT Advanced hiện hữu.

Đã xác nhận **84/84 bài kiểm thử Node đạt** ở commit `4970958`. Cần chạy lại sau mỗi thay đổi tiếp theo và xác minh kết quả Pages trên commit cuối.

## Giới hạn minh bạch

"Sửa nhiều dòng" là sửa **nhiều vùng chữ nguyên thủy** của PDF trong một lượt, KHÔNG phải reflow cả đoạn thành số dòng mới hay tự dồn bảng. Đây là thiết kế cố ý để bảo vệ hình học CAD.

Rich text vẫn không cho đổi đồng thời nhiều kiểu font, màu trong một đoạn theo kiểu WYSIWYG. Các vùng Type3 đã convert thành path hoặc glyph không có ánh xạ Unicode đáng tin cậy vẫn chưa thể chỉnh sửa native mà giữ chính xác hình học. Không nên tuyên bố đã hoàn thiện tuyệt đối tất cả PDF CAD, PDF/A, PDF/UA hoặc chữ ký số. Cần QA bằng các bản vẽ CAD A0/A1 thực, so sánh render trước/sau và đọc lại bằng PDF.js/Poppler.
