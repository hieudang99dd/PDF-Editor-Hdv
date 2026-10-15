# Đánh giá lõi sửa chữ CIT-PDF 1.0.0 vào HDV

> Cập nhật: bộ 119 công cụ web đã được tích hợp tiếp. Xem [CIT-TOOLS.md](CIT-TOOLS.md) để biết phạm vi và kiểm thử hiện tại. Báo cáo dưới đây mô tả riêng đợt thay engine sửa chữ, các mục “chưa bật” nói về trình sửa bảng HDV.

Ngày: 2026-10-15. Tham chiếu tag `1.0.0`, không dùng nhánh `main` thay đổi theo thời gian.

## Kết quả đánh giá

Engine sửa chữ gốc của CIT tốt hơn lớp che nền/viết đè cũ của HDV: sửa đối tượng
chữ trong nội dung PDF, có font provider, preview dàn chữ và ghi theo stream-splice
khi đáp ứng điều kiện. CIT không tự bảo đảm giữ cấu trúc bảng: dàn đoạn có thể
xuống dòng và cơ chế cascade chỉ di chuyển đoạn chữ, không di chuyển đường kẻ bảng.
Vì vậy bản tích hợp dùng engine CIT cùng các ràng buộc hình học của HDV.

| Thành phần | Quyết định và hành vi thực tế |
|---|---|
| Native text/PDFium WASM | Đã tích hợp, thay đường xuất chữ overlay trong organizer |
| Preview/commit paragraph | Đã tích hợp; phải nhận diện đúng nội dung và tọa độ, một dòng, cùng định dạng |
| Font gốc, Unicode/cmap | Đã tích hợp font provider và kiểm tra ký tự; giữ font nguồn khi khả dụng, Tinos/Noto Sans khi thay thế |
| Thuộc tính run | Giữ render mode, stroke, hScale, rise, strike và thông tin nguồn do engine cung cấp; thay những thuộc tính người dùng chọn |
| Stream-splice `Tj`/`TJ` | Đã tích hợp; sửa stream khi engine cho phép, còn lại ghi bằng native engine |
| Object streams/shared forms | Đi qua bộ phân tích và kiểm tra của stream-splice; không đoán khi không xác định được cụm chữ |
| Content arrays | Chạy bước consolidation trước khi mở tài liệu cho native editing |
| Pattern artwork | Chạy lớp bảo vệ artwork của CIT trước khi sửa |
| Type3/fragile text | Chạy preprocessing và đăng ký segmentation/fragile pages; vùng HDV đang khóa vẫn chưa mở sửa |
| Baseline và xoay trang | Bổ sung riêng cho HDV: tạm đưa `/Rotate` về 0 khi sửa, khôi phục khi ghi; ghim baseline sau đổi cỡ/font |
| Ô bảng/chống tràn | Giữ HDV và kiểm tra thêm box native; không tự xuống dòng; thu nhỏ chỉ khi chọn và không dưới 60% |
| Worker/cache | Thêm worker cục bộ, một hàng đợi, cache tối đa bốn trạng thái; WASM chỉ nạp khi áp dụng lần sửa đầu |
| Undo/redo | Giữ snapshot dữ liệu thuần của HDV; replay từ nguồn nguyên vẹn, không tích lũy lớp che |
| Preview/thumbnail | Render chính PDF đã sửa bằng PDF.js, dùng cùng engine với xuất file |
| Cascade paragraph growth | Không bật: có thể làm lệch nội dung trong bảng kỹ thuật |
| Rich paragraph nhiều dòng/nhiều style | Chưa bật; báo không hỗ trợ khi không tách an toàn được vùng đang chọn |
| Accessibility/tag surgery | Chưa tích hợp; không tuyên bố bảo toàn cấu trúc accessibility/PDF/UA sau chỉnh sửa |
| OCR, Office, Ghostscript, cpdf, ký số | Đã tích hợp tiếp trong mô-đun web; xem CIT-TOOLS.md. Electron desktop không áp dụng |

## Luồng xử lý

Khi áp dụng: dựng descriptor → kiểm tra font và kích thước → worker mở nguồn gốc
và replay các thay đổi của trang → preview/commit native → kiểm tra hình học →
chỉ ghi lịch sử khi tạo được PDF hợp lệ. Lỗi giữ nguyên tài liệu và vùng nhập.
Không tự chuyển sang lớp che nền nếu native không xử lý được.

Khi lưu: HDV sắp xếp/nhân đôi/ghép các trang → native sửa chữ theo từng trang đầu ra
→ ghi annotation của HDV → lưu bằng các chế độ chọn file/thư mục/download hiện có.
Nhân đôi có descriptor riêng; thay đổi trang này không được áp sang bản sao khác.

Tất cả xử lý tài liệu diễn ra tại trình duyệt. Không có API tải PDF lên máy chủ.

## Kiểm chứng và giới hạn

- `node --test tests/*.test.cjs`: kiểm thử lưu, bố cục và native rewrite bằng WASM thật.
- `PDF_EDITOR_CHROMIUM=/path/to/chromium node tests/text-editor-browser.cjs`:
  thao tác thật, worker, tiếng Việt, thu nhỏ, hủy, undo/redo, lưu và trang xoay.
- PDF.js độc lập đọc lại nội dung để kiểm tra chữ mới và baseline, chữ cũ chỉ còn
  ở những hàng chưa sửa; CropBox lệch gốc và bốn góc xoay được kiểm tra.
- Kiểm tra ảnh đầu ra bằng Poppler để phát hiện thay đổi ngoài ô.

Chưa có PDF gốc từ ảnh lỗi của người dùng. Không bảo đảm cho mọi PDF CAD, font
Type3, ký số, PDF/A hay tài liệu có tag. Chưa chạy toàn bộ ứng dụng desktop CIT
hoặc chứng minh hiệu năng trên PDF hàng trăm MB. Đây là sửa nội dung, **không phải
redaction an toàn**: dữ liệu cũ có thể tồn tại ở revision/object không còn được dùng.

Giấy phép và nguồn: xem [NOTICE.md](NOTICE.md). Việc dùng mã AGPL trong bản kết hợp
này đi kèm việc phân phối mã nguồn công khai, không phù hợp với mục tiêu đóng mã.
