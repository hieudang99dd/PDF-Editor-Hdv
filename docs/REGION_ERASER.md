# PDF HVD — Đặc tả Xóa vector theo vùng v1

Ngày: 16/10/2026. Phạm vi: công cụ Chỉnh sửa PDF (Organizer).

## 1. Mục tiêu và ranh giới

Xóa chính xác phần đường vector giao vùng chọn. Phần nằm ngoài phải tiếp tục tồn tại dưới dạng PATH vector trong cấu trúc PDF; KHÔNG tô nền trắng, KHÔNG raster hóa trang, KHÔNG xóa toàn bộ object nếu chỉ một đoạn giao vùng.

Phiên bản v1 xử lý PATH stroke-only với MoveTo và LineTo (đường thẳng/polyline, không tô kín, không nét đứt, không clip path), trang có /Rotate=0. Các đối tượng text, image, annotation, Form XObject giữ nguyên và được báo trong thống kê; PATH Bézier, hatch/fill, nét đứt và clipping giao vùng dẫn đến lỗi an toàn, không tạo kết quả giả. Không dùng tính năng này để xóa dữ liệu mật (redaction).

## 2. Định nghĩa miền

Vùng chọn nằm trong hệ tọa độ [0,1] x [0,1] của ảnh PDF hiển thị; gốc ở góc trái-trên.

E_i: đa giác xóa.
K_j: đa giác bảo vệ phần nằm trong.
Miền xóa D = (union E_i) minus (union K_j).

Trường hợp xóa giữa hai đường bao khép kín: D = A minus B, trong đó A là đường ngoài, B là đường trong. Có thể nối thêm nhiều vùng E và K, tối đa 64 vùng/trang.

Với một đoạn S(t)=A+t(B-A), t thuộc [0,1], tính tập tham số t giao với mọi cạnh của E_i và K_j, bổ sung t=0 và t=1; sắp xếp, khử các giao điểm trùng nhau theo epsilon. Thử điểm giữa của từng khoảng. Khoảng có trung điểm thuộc D bị loại khỏi output; khoảng còn lại là vector mới. Trường hợp collinear xử lý bằng chiếu hai đỉnh cạnh lên đoạn, kết hợp point-on-edge.

Kiểm tra polygon: tối thiểu 3 đỉnh, diện tích không bằng 0, không tự cắt nhau; các điểm hữu hạn, thuộc phạm vi trang. Không sửa/tự động làm tròn polygon lỗi.

## 3. Tọa độ PDF và ma trận

Chuyển điểm màn hình (u,v) sang model-space X=u·pageWidth, Y=(1-v)·pageHeight; dùng PdfEngine.toUser để hoàn nguyên page/crop transform. Sau đó chuyển tọa độ PATH local-space sang page-user qua FS_MATRIX=[a,b,c,d,e,f] đọc bằng FPDFPageObj_GetMatrix:

x' = a·x + c·y + e
y' = b·x + d·y + f

Thực hiện cắt bằng giao điểm trong page-user-space. Nội suy cùng tham số t ngược vào tọa độ PATH local-space để tạo các object mới và gán lại ma trận nguồn. Từ chối ma trận suy biến và /Rotate khác 0 trong v1.

Lưu ý: thuật toán cắt trên tâm đường. Biên stroke thực tế có thể còn nhô vào vùng khoảng nửa bề rộng nét. Chưa phải phép boolean chính xác cho toàn bộ diện tích stroke với join/cap/phối màu phức tạp.

## 4. Pipeline native PDFium

1. Sao chép bytes từ PDF do Organizer chuẩn bị; chạy một Worker riêng. Không gửi lên server, không sửa PDF nguồn.
2. Kiểm tra dung lượng tối đa 80MB, số vùng/đỉnh, chữ ký số ByteRange và mã hóa. Chặn file ký số/bảo vệ.
3. Đọc từng trang cần xử lý; từ phải sang trái theo thứ tự object để giữ z-index.
4. Lọc object có bounds giao vùng và type PATH. Text, image, Form được bỏ qua, không xóa.
5. Kiểm tra mode stroke-only, solid, không fill, không clipping; đọc các điểm MoveTo, LineTo và FS_MATRIX. Path không hỗ trợ dẫn tới lỗi, không ghi file.
6. Tính các đoạn giữ lại, bỏ phần giao vùng. Nếu không có thay đổi trên path thì giữ nguyên object.
7. Nếu có thay đổi: FPDFPage_RemoveObject, FPDFPageObj_CreateNewPath, FPDFPath_LineTo, FPDFPageObj_SetMatrix, FPDFPage_InsertObjectAtIndex. Sao chép màu stroke RGBA, bề rộng nét, line-cap/join.
8. Gọi FPDFPage_GenerateContent và PdfEngine.save không incremental. Đọc lại PDF đầu ra để kiểm định.
9. Trả bytes và report có changedObjects/newFragments/skippedNonVector. Không có vector thực sự bị cắt thì báo lỗi.

PDFium WASM của dự án đã xuất các API đọc path, tạo/xóa page object. Không cần nhúng PDFium trùng lặp.

## 5. Tích hợp UI và lịch sử

- Thanh công cụ Organizer bổ sung “Xóa vector theo vùng”.
- Người dùng chọn hình chữ nhật hoặc đa giác; bấm “Vẽ vùng”; kéo thả chữ nhật hoặc chọn từng đỉnh đa giác, kết thúc bằng Enter/nhấp đúp hoặc nút hoàn thành.
- Chọn “Xóa trong vùng” để thêm vùng đỏ; chọn “Giữ vùng bên trong” để thêm vùng xanh. Hai thao tác này phối hợp thành miền giữa hai biên.
- Có Bỏ vùng cuối, Xóa các vùng và Undo/Redo của Organizer. UI hiển thị vùng chọn, không tô trắng trang.
- Page state có danh sách eraseRegions, mỗi phần tử gồm mode (erase/protect) và points (tọa độ tỷ lệ).
- Khi Lưu: pdf-lib tổ chức trang, native text editor sửa chữ (nếu có), region worker cắt vector thực, sau đó PDF-lib chèn annotation. Nếu region worker thất bại, không xuất file sửa sai.
- Worker được đóng sau khi xử lý hoặc timeout.

## 6. Module

- pdf-region-geometry.mjs: polygon, giao cạnh, phép union/difference theo đoạn.
- pdf-region-native.mjs: đọc/sửa PDFium PATH thật.
- pdf-region-worker.mjs: worker độc lập.
- pdf-region-client.mjs: timeout và giải phóng worker.
- pdf-region-ui.js: UI vùng chọn đa giác/chữ nhật và vùng bảo vệ.
- organizer.js: quản lý eraseRegions trong lịch sử Undo/Redo, gọi worker khi lưu.
- organizer.css: overlay và bảng thao tác responsive.

## 7. Nghiệm thu

- Geometry test: giao đa giác, nhiều vùng xóa, vùng bảo vệ ở giữa, polygon lỗi.
- Native PDFium test: tạo PDF chứa hai đường vector; cắt một đường, kiểm tra các PATH mới ở ngoài vùng, PATH khác không đổi, output vẫn là PDF vector.
- Chromium test: mở PDF thật trên Organizer, vẽ vùng xóa + bảo vệ, lưu file, kiểm tra vẫn ở công cụ và PDF có nội dung hợp lệ.
- GitHub Actions phải PASS; phải kiểm tra riêng deployment GitHub Pages.
- Đối với hồ sơ sản xuất CAD A0/A1: cần test hình học, layer, clip, XObject, font, hairline/miter, nhiều trang, CropBox/MediaBox và so sánh render trước/sau.

## 8. Roadmap

v2: Bézier với De Casteljau và tolerance; hatch và các vùng fill qua boolean contour/fill rules; dash phase và exact joins.
v3: nested XObject, ảnh vùng, glyph chữ, transparency/blend và PDF redaction có kiểm chứng dữ liệu bị xóa khỏi cả content stream.

Tham khảo API chính thức: https://pdfium.googlesource.com/pdfium/+/refs/heads/main/public/fpdf_edit.h

Bản quyền: ../NOTICE.md. Nhật ký tiến độ: ../IMPLEMENTATION_PROGRESS.md.
