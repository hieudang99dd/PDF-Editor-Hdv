# PDF HVD — Đặc tả Xóa vector theo vùng v1

Ngày: 16/10/2026. Phạm vi: trang `region-eraser.html` độc lập, không tích hợp vào Chỉnh sửa PDF (Organizer).

## 1. Mục tiêu và ranh giới

Xóa chính xác phần đường vector giao vùng chọn. Phần nằm ngoài phải tiếp tục tồn tại dưới dạng PATH vector trong cấu trúc PDF; KHÔNG tô nền trắng, KHÔNG raster hóa trang, KHÔNG xóa toàn bộ object nếu chỉ một đoạn giao vùng.

Phiên bản v1 xử lý PATH stroke-only với MoveTo và LineTo (đường thẳng/polyline, không tô kín, không nét đứt, không clip path), trang có /Rotate=0/90/180/270 (tự nhận từ PDF.js). Các đối tượng text, image, annotation, Form XObject giữ nguyên và được báo trong thống kê; PATH Bézier, hatch/fill, nét đứt và clipping giao vùng dẫn đến lỗi an toàn, không tạo kết quả giả. Không dùng tính năng này để xóa dữ liệu mật (redaction).

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

Thực hiện cắt bằng giao điểm trong page-user-space. Nội suy cùng tham số t ngược vào tọa độ PATH local-space để tạo các object mới và gán lại ma trận nguồn. Từ chối ma trận hiển thị suy biến; trang /Rotate 0°/90°/180°/270° được xử lý từ ma trận ngược PDF.js PageViewport.

Lưu ý: thuật toán cắt trên tâm đường. Biên stroke thực tế có thể còn nhô vào vùng khoảng nửa bề rộng nét. Chưa phải phép boolean chính xác cho toàn bộ diện tích stroke với join/cap/phối màu phức tạp.

## 4. Pipeline native PDFium

1. Sao chép bytes từ PDF do Organizer chuẩn bị; chạy một Worker riêng. Không gửi lên server, không sửa PDF nguồn.
2. Kiểm tra dung lượng tối đa 512 MiB, số vùng/đỉnh, chữ ký số ByteRange và mã hóa. Chặn file ký số/bảo vệ.
3. Đọc từng trang cần xử lý; từ phải sang trái theo thứ tự object để giữ z-index.
4. Lọc object có bounds giao vùng và type PATH. Text, image, Form được bỏ qua, không xóa.
5. Kiểm tra mode stroke-only, solid, không fill, không clipping; đọc các điểm MoveTo, LineTo và FS_MATRIX. Path không hỗ trợ dẫn tới lỗi, không ghi file.
6. Tính các đoạn giữ lại, bỏ phần giao vùng. Nếu không có thay đổi trên path thì giữ nguyên object.
7. Nếu có thay đổi: FPDFPage_RemoveObject, FPDFPageObj_CreateNewPath, FPDFPath_LineTo, FPDFPageObj_SetMatrix, FPDFPage_InsertObjectAtIndex. Sao chép màu stroke RGBA, bề rộng nét, line-cap/join.
8. Gọi FPDFPage_GenerateContent và PdfEngine.save không incremental. Đọc lại PDF đầu ra để kiểm định.
9. Trả bytes và report có changedObjects/newFragments/skippedNonVector. Không có vector thực sự bị cắt thì báo lỗi.

PDFium WASM của dự án đã xuất các API đọc path, tạo/xóa page object. Không cần nhúng PDFium trùng lặp.

## 5. Tích hợp UI và lịch sử

- Trang chủ có công cụ riêng **Xóa vector theo vùng**, dẫn đến `region-eraser.html`; không hiển thị trên thanh Organizer.
- Người dùng chọn hình chữ nhật hoặc đa giác; bấm “Vẽ vùng”; kéo thả chữ nhật hoặc chọn từng đỉnh đa giác, kết thúc bằng Enter/nhấp đúp hoặc nút hoàn thành.
- Chọn “Xóa trong vùng” để thêm vùng đỏ; chọn “Giữ vùng bên trong” để thêm vùng xanh. Hai thao tác này phối hợp thành miền giữa hai biên.
- Có xóa từng vùng, xóa tất cả vùng trên trang và Undo/Redo độc lập của công cụ. UI hiển thị vùng chọn, không tô trắng trang.
- State độc lập là `Map<pageIndex, regions[]>`, mỗi phần tử gồm mode (erase/protect) và points (tọa độ tỷ lệ); không lưu trong state Organizer.
- Khi **Áp dụng & xuất PDF**: truyền bản sao bytes PDF nguồn cùng vùng chọn trực tiếp cho region worker, không đi qua Organizer, native text editor hay bước thêm annotation. Nếu worker thất bại, không tạo file đầu ra. Kết quả có nút tải xuống riêng; người dùng vẫn trong công cụ.
- Worker được đóng sau khi xử lý hoặc timeout.

## 6. Module

- pdf-region-geometry.mjs: polygon, giao cạnh, phép union/difference theo đoạn.
- pdf-region-native.mjs: đọc/sửa PDFium PATH thật.
- pdf-region-worker.mjs: worker độc lập.
- pdf-region-client.mjs: timeout và giải phóng worker.
- region-eraser.html / region-eraser.css / region-eraser.js: giao diện độc lập, vùng chọn đa giác/chữ nhật, xem trước PDF bằng PDF.js, Undo/Redo và xuất kết quả.
- organizer.js: không import, không lưu `eraseRegions`, không gọi PDFium region worker.
- organizer.css: không chứa overlay hoặc bảng của công cụ xóa vùng.

## 7. Nghiệm thu

- Geometry test: giao đa giác, nhiều vùng xóa, vùng bảo vệ ở giữa, polygon lỗi.
- Native PDFium test: tạo PDF chứa hai đường vector; cắt một đường, kiểm tra các PATH mới ở ngoài vùng, PATH khác không đổi, output vẫn là PDF vector.
- Chromium test: truy cập `region-eraser.html`, chọn PDF, vẽ vùng xóa + bảo vệ, áp dụng/xuất và xác nhận PATH cắt thật; đồng thời kiểm tra Organizer không còn nút vùng.
- GitHub Actions phải PASS; phải kiểm tra riêng deployment GitHub Pages.
- Đối với hồ sơ sản xuất CAD A0/A1: cần test hình học, layer, clip, XObject, font, hairline/miter, nhiều trang, CropBox/MediaBox và so sánh render trước/sau.

## 8. Roadmap

v2: Bézier với De Casteljau và tolerance; hatch và các vùng fill qua boolean contour/fill rules; dash phase và exact joins.
v3: nested XObject, ảnh vùng, glyph chữ, transparency/blend và PDF redaction có kiểm chứng dữ liệu bị xóa khỏi cả content stream.

Tham khảo API chính thức: https://pdfium.googlesource.com/pdfium/+/refs/heads/main/public/fpdf_edit.h

Bản quyền: ../NOTICE.md. Nhật ký tiến độ: ../IMPLEMENTATION_PROGRESS.md.

## 9. Tách độc lập khỏi trình Chỉnh sửa PDF (2026-10-16)

- Phân tách hoàn toàn UI/UX, lưu dữ liệu trạng thái, lựa chọn tệp, lịch sử Undo/Redo và tác vụ xuất PDF.
- `index.html` khai báo `region-eraser-route` hướng tới `region-eraser.html`; `organizer.js` không có `eraseRegions` hoặc `eraseRegionsInWorker`.
- Giữ nguyên core `pdf-region-native.mjs`, `pdf-region-worker.mjs`, `pdf-region-geometry.mjs` đã kiểm thử; thay adapter Organizer bằng `region-eraser.js`.
- Đường dẫn truy cập: `https://hieudang99dd.github.io/PDF-Editor1/region-eraser.html` sau khi GitHub Pages triển khai.


## 10. Tệp lớn 512 MiB — tối ưu bộ nhớ và Worker (2026-10-16)

- Giới hạn đầu vào **512 MiB (536.870.912 byte)**, dùng chung `pdf-region-limits.mjs` tại UI và engine. Đây là **giới hạn chấp nhận tệp, không bảo đảm** mọi tệp 512 MiB đều đủ RAM để thực thi. PDFium WASM và các bản sao bộ nhớ bên trong engine vẫn cần bộ nhớ trống.
- Tệp từ **256 MiB** trở lên hiển thị xác nhận/cảnh báo dung lượng và RAM; không tự động từ chối nếu trong ngưỡng 512 MiB.
- PDF.js xem trước từ `Blob URL`, tránh `file.arrayBuffer()` toàn tệp trên luồng giao diện. Tùy trình duyệt, PDF.js có thể tải nhiều phần hoặc toàn bộ Blob; không cam kết streaming thực nếu không được hỗ trợ.
- Canvas PDF.js được chặn ở mức **16 triệu pixel vật lý**, đã tính devicePixelRatio. Các bản vẽ A0/A1 hiển thị ở tỷ lệ thấp hơn khi cần, vẫn lưu tọa độ vùng chuẩn hóa.
- Khi xuất: gửi `File` qua structured clone (không tạo Uint8Array/copy thứ hai ở main thread), Worker tự đọc một lần rồi đưa buffer vào PDFium. Đối với input dạng ArrayBuffer, chỉ chuyển quyền sở hữu qua transferable khi có toàn bộ buffer; view rời mới copy.
- PDFium worker gửi tiến trình khởi tạo, mở PDF, duyệt đối tượng theo từng 500 objects, hoàn thành từng trang và lưu; giao diện có progress bar + nút Hủy. Người dùng ở lại công cụ trong khi xử lý.
- Timeout hoạt động: watchdog **8 phút không có tín hiệu**, timeout tổng thích ứng theo dung lượng/trang và chặn tối đa **30 phút**. Khi Worker lỗi, hủy hoặc quá thời gian, file nguồn giữ nguyên.
- Đầu ra PDF trong bộ nhớ vẫn là một `Uint8Array` cho tới lúc tải; trình duyệt có thể tiêu thụ nhiều RAM hơn kích thước tệp nguồn vì WASM, render, buffers và kết quả.
- QA: `tests/pdf-region-512mb.test.cjs` kiểm tra giới hạn 512 MiB không cấp phát tệp giả khổng lồ, thời gian và giới hạn canvas. `tests/pdf-region-large.test.cjs` tạo PDF thật có luồng dữ liệu >80 MiB, chạy vector surgery và xác nhận PDF có thể đọc lại. Đây chưa phải nghiệm thu 512 MiB thực tế; cần kiểm thử trên máy 8/16/32GB RAM và hồ sơ CAD A0/A1 với ảnh/XObject/hatch phức tạp trước khi công bố chứng nhận hiệu năng.


## 11. Dàn trang, phép vùng, phạm vi trang và xem đầu ra thực (2026-10-16)

### Các phép xóa

- **Hợp vùng (Union):** hợp tất cả vùng đỏ để xóa cùng lúc, giữ nguyên phần nằm ngoài. Có thể thêm các vùng xanh `protect` để bảo vệ các phần nằm trong.
- **Giữa hai đường bao (A \\ B):** vẽ đúng hai vùng đỏ: vùng ngoài trước, vùng trong sau; vùng trong bắt buộc được bao hoàn toàn, không chạm/cắt biên ngoài. Chỉ xóa dải giữa hai đường bao.
- **Giao hai vùng (Intersection):** vẽ hai vùng đỏ có phần chồng lên nhau; chỉ phần giao có diện tích dương bị xóa. Vùng rời nhau/chỉ chạm cạnh phải báo lỗi.
- Trong `pdf-region-geometry.mjs`, nghiệm giao cạnh vẫn chia đoạn theo t. Giữa/Giao thay điều kiện xóa trung điểm, `pdf-region-native.mjs` nhận `req.operation` và giữ các PATH ở ngoài.

### Quy trình người dùng

1. Mở PDF; dàn trang hiển thị các ô trang, theo nhóm 24, thumbnails PDF.js chỉ render khi ô hiển thị.
2. Nhấp vào bất kỳ trang nào → mở cửa sổ biên tập phóng to, chọn chữ nhật/đa giác và phép xóa.
3. Chọn **Các trang có vùng đã vẽ** hoặc **Áp dụng vùng của trang đang mở cho khoảng Từ–Đến**. Khoảng Từ–Đến tính 1-based, inclusive. Cảnh báo chỉ sao chép cùng tọa độ chuẩn hóa, không tự nhận dạng đối tượng tương ứng giữa các trang.
4. Nhấn **Áp dụng & xuất PDF**: worker PDFium cắt đối tượng thật, trả tệp PDF mới; PDF.js mở chính PDF đó ngay trong không gian biên tập. Giao diện mặc định hiển thị **Sau xử lý**.
5. Nút **Bản gốc / Sau xử lý** chuyển giữa hai PDF thật; overlay vùng chỉ hiển thị trên bản gốc, không giả làm kết quả. Người dùng kiểm tra rồi tải PDF bằng nút riêng.
6. Dữ liệu đầu ra giữ ở dạng `Blob` để xem/tải; URL blob cùng PDF.js document được giải phóng khi thay vùng, làm mới hoặc thay PDF.

### Giới hạn

- Tối đa 24 thumbnails tồn tại đồng thời trong dàn trang; dàn trang 500–1000 trang không cố dựng mọi preview ngay.
- Tối đa 500 trang trong một lần xử lý range; nếu nhiều hơn cần chia thành các lượt.
- Các phép xóa vẫn chỉ hỗ trợ PATH stroke-only MoveTo/LineTo (chưa xóa chữ, ảnh, hatch, Bézier). Với một phần giao, chỉ cắt path ngoài vùng không bị xóa.
- Kiểm tra `tests/pdf-region-boolean-gallery.test.cjs` và Chromium E2E. PDF 512 MiB vẫn có thể thiếu RAM trên máy nhỏ.


## 12. Sửa lỗi trang xoay /Rotate và trang CropBox lệch (2026-10-16)

- Vấn đề: phiên bản trước từ chối mọi trang `FPDFPage_GetRotation != 0` với lỗi phải chuẩn hóa PDF; người dùng không thể chọn vùng trên các hồ sơ xoay 90/180/270 độ (kể cả trang 28 trong tài liệu thử).
- Giải pháp: UI dùng **ma trận affine PDF.js PageViewport** `[a,b,c,d,e,f]` của đúng từng trang nguồn, ở scale 1, width/height của trang đã dựng. Với điểm chuẩn hóa `(u,v)`, tọa độ PDF user-space được xác định bằng `inverse([a,b,c,d,e,f])·[u*width,v*height,1]`. Điều này đồng thời xử lý page rotation kế thừa, crop origin khác (0,0), CropBox/MediaBox khác nhau và UserUnit nếu PDF.js cung cấp.
- Worker nhận `req.viewport` theo từng trang và đối chiếu góc xoay PDFium/PDF.js trước khi xóa, từ chối nếu hai nguồn không khớp thay vì xóa lệch. Chỉ cho phép phép biến đổi có ma trận hữu hạn, khả nghịch. Code cũ nếu không truyền viewport chỉ được phép xử lý trang không xoay.
- Áp dụng cho **Các trang đã vẽ vùng** và **Khoảng trang**: mỗi trang đều có viewport riêng; vùng chuẩn hóa tái sử dụng theo khung nhìn của từng trang. Trang xoay lẫn lộn không bắt người dùng xoay/chuẩn hóa PDF bằng công cụ khác.
- QA: `tests/pdf-region-rotation.test.cjs` kiểm thử ma trận cho 0°,90°,180°,270° cùng CropBox có tọa độ gốc lệch, xuất PDFium và xác nhận các PATH ngoài vùng còn nguyên. Chromium kiểm thử tác vụ 2 trang trong cùng khoảng với trang thứ hai xoay 90°.
- Ranh giới: phần mềm vẫn chỉ cắt PATH vector stroke-only chứa MoveTo/LineTo, không tự xóa text, ảnh, hatch, curve hoặc clipping path chưa được hỗ trợ; các trường hợp đó sẽ báo lỗi riêng thay vì trả PDF sai.


## 13. Xóa rộng mọi PageObject và bản sao PDF có chữ ký (2026-10-16)

### Phương thức độc lập

1. **Xóa mọi đối tượng giao vùng** (`mode=whole-object`): PDFium liệt kê `FPDFPage_CountObjects/FPDFPage_GetObject`, xác định `FPDFPageObj_GetBounds` và cắt hình chữ nhật bao đối tượng với miền boolean người dùng chọn. Chỉ khi có giao diện tích dương, thực hiện `FPDFPage_RemoveObject` cùng `FPDFPageObj_Destroy`. Hỗ trợ page-object loại Text (1), Path (2, kể cả fill/hatch như path), Image (3), Shading (4), Form XObject (5) nếu PDFium biểu diễn dưới dạng page-object. `regionIntersectsRect` tôn trọng hợp vùng/vùng bảo vệ, giữa hai biên và chỉ vùng giao. Giao polygon/cạnh được tiền tính một lần mỗi trang (cache WeakMap) để tránh làm chậm nhiều page objects.
2. **Cắt vector chính xác** (`mode=precise`): giữ thuật toán tách MoveTo/LineTo ngoài miền xóa, giữ nguyên các loại khác và báo lỗi khi đường thuộc loại chưa xử lý; không thay đổi hành vi.
3. Khi chọn **whole-object**, một dòng chữ, khối ảnh, shape hoặc Form XObject đi ngang biên sẽ bị loại bỏ NGUYÊN ĐỐI TƯỢNG, nên có thể mất cả dữ liệu nằm ngoài vùng. Đây là đặc điểm kỹ thuật bắt buộc công khai, không được gọi là xóa chính xác từng pixel/ký tự. Chỉ hiển thị bản PDF sau xử lý thực từ worker để kiểm tra.

### PDF có chữ ký số

- Mặc định tài liệu có `/ByteRange` bị chặn; UI cho phép tích rõ checkbox **Cho phép xuất bản sao từ PDF đã ký số**. Chỉ khi tích, worker truyền `allowInvalidSignatures:true` và PDFium xuất bản sao đầy đủ (`incremental:false`).
- Chữ ký cũ chắc chắn không còn chứng thực nội dung bản sao sau thay đổi. Chữ ký hiển thị/metadata có thể vẫn nằm trong PDF và trình xem PDF có thể báo chữ ký không hợp lệ; **không có cơ chế làm lại chữ ký hay giả mạo tính hợp lệ**.
- Tệp nguồn không bị thay đổi. Chưa xác nhận mọi thuật toán chữ ký/giới hạn quyền PDF có thể mở hoặc sửa.
- `report.signatureInvalidated` thể hiện thông tin này một lần trong màn hình kết quả thay vì toast lặp lại.

### Ranh giới vẫn giữ

- Đây là **object deletion**, chưa phải redaction an toàn tuyệt đối: nested resources, annotation/widget, OCR layer, metadata, incremental revisions hoặc bytes không tham chiếu vẫn có thể chứa dữ liệu. Không dùng cho thông tin bí mật nếu chưa có bước audit/redaction riêng.
- Nhánh mới không thay đổi phần mềm Organizer, text editor, không bỏ kiểm tra dữ liệu đầu vào, dung lượng 512 MiB, bảo vệ ma trận trang xoay, thời gian Worker.
- QA: `tests/pdf-region-all-objects.test.cjs` trên PDF chứa chữ/ảnh/vector tô thật và tài liệu /ByteRange; Chromium xác nhận xóa text object thật và giữ chế độ precise như trước.


## 14. Quy trình Áp dụng → Kiểm tra → Chỉnh sửa lại → Xuất PDF (2026-10-16)

- Giao diện có **hai nút trên thanh công cụ**: `✂ Áp dụng` và `↓ Xuất PDF`; hoàn toàn không dùng chung một nút.
- **Áp dụng** gọi PDFium Worker xóa vật lý và tạo PDF kết quả trong bộ nhớ, sau đó trình xem PDF.js lập tức hiển thị **Sau xử lý**. Không có lệnh tải xuống khi Áp dụng. Có thể dùng **Bản gốc / Sau xử lý** để đối chiếu.
- Khi chưa áp dụng: `Xuất PDF` bị disable; khi Worker xử lý hoặc bị lỗi: vẫn disable. Khi PDF kết quả hợp lệ và xem được: `Xuất PDF` mới được enable. `Áp dụng` được khóa trong trạng thái đã có bản kết quả để không lặp xử lý không chủ đích.
- **Chỉnh sửa lại**: gỡ tài liệu kết quả tạm và Blob URL, đưa trình xem về PDF gốc nhưng **giữ nguyên các vùng chọn**, lịch sử Undo/Redo, trang và cấu hình. Mở khóa để người dùng sửa vùng và **Áp dụng** lại; `Xuất PDF` khóa cho đến khi lần xử lý mới thành công.
- Trong trạng thái kết quả đã áp dụng: khóa chỉnh vùng, Undo/Redo và cấu hình xử lý, buộc dùng `Chỉnh sửa lại` để không vô tình xuất một kết quả không tương ứng với lựa chọn đang hiển thị.
- **Xuất PDF**: chỉ tải bản `Blob` của lần áp dụng gần nhất, không tự chạy PDFium, không xuất PDF nguồn. Sau tải vẫn ở công cụ, người dùng có thể tạo lượt khác. Cảnh báo trước khi rời trang khi còn thay đổi chưa xuất.
- Thanh bước 1 **Vẽ vùng** → 2 **Áp dụng** → 3 **Kiểm tra / Chỉnh lại** → 4 **Xuất PDF** hiển thị trạng thái trực quan, cùng nút quay lại dàn trang hiện có.
- QA: `tests/pdf-region-apply-export.test.cjs`, Chromium E2E xác minh xuất bị khóa trước Áp dụng, xem trước thực, giữ nguyên vùng khi chỉnh lại, áp dụng lần hai rồi mới Xuất. Tính năng xử lý PDF ký số và hai chế độ precise/whole-object giữ nguyên.


## 15. Workspace có hai panel cố định, cuộn độc lập (2026-10-16)

- Khi đã tải PDF, body nhận class `re-workspace-open`. Chỉ trong chế độ này giao diện chuyển thành flex container chiều cao `100dvh` và `overflow:hidden`; trang chọn tệp ban đầu vẫn được cuộn bình thường. Xóa class khi làm mới/thay tệp hoặc tải thất bại.
- Thanh tên tệp, các nút Hoàn tác/Làm lại, Áp dụng, Xuất PDF, thanh quy trình và tiêu đề “Quay lại dàn trang” không trôi khỏi màn hình. Workspace phụ thuộc kích thước viewport thực, không đặt chiều cao px cố định.
- **Panel trái** `.re-tools`: cùng chiều cao panel phải, chỉ nội dung tùy chọn, các trường và danh sách vùng được cuộn bằng `overflow-y:auto` và `overscroll-behavior:contain`.
- **Panel phải** `.re-preview`: toolbar chọn trang/zoom và footer trạng thái giữ cố định; chỉ canvas `#re-viewport` cuộn cả dọc/ngang để thao tác PDF lớn. Không có `max-height` cứng cũ.
- **Dàn trang** `.re-gallery-grid` cũng cuộn nội bộ, header và điều hướng 24 trang giữ nguyên vị trí.
- Kết quả sau **Áp dụng** mở dạng review card `position:absolute` trong workspace, không làm hai panel co ngắn lại; ô này cuộn riêng khi dài.
- Ở màn hình hẹp dưới 760 px, hai panel xếp theo chiều dọc trong cùng khung cao cố định: khu tác vụ chiếm khoảng 36%, PDF lấy phần còn lại; cả hai giữ vùng cuộn riêng.
- QA: `tests/pdf-region-fixed-layout.test.cjs` kiểm tra CSS/scoping/overflow; `tests/ux-browser.cjs` đo vị trí & chiều cao panel thật, cuộn tác vụ và PDF mà body không dịch, áp dụng PDF rồi xác nhận không bị thay đổi chiều cao.


## 16. Chỉnh sửa đường bao sau khi vẽ bằng kéo đỉnh/cạnh (2026-10-16)

- Sau khi hoàn thành chữ nhật hoặc đa giác, vùng vừa vẽ **được chọn tự động** và hiện các tay nắm đỉnh (tròn trắng) cùng tay nắm giữa cạnh (cam nhạt) trên overlay SVG. Có thể chọn vùng khác bằng cách nhấp vùng trên PDF hoặc bấm **✥ Sửa** tại danh sách.
- Kéo **đỉnh** chỉ thay đổi một tọa độ; kéo **cạnh** di chuyển cả hai điểm cuối theo cùng vector. Tay nắm được dựng theo kích thước pixel màn hình, vẫn dễ chọn trên bản vẽ zoom/A0/A1, có hit area cho thao tác chạm.
- `pdf-region-handles.mjs` tính toàn bộ phép kéo trên một bản sao polygon bất biến, giới hạn delta theo biên trang chuẩn hóa 0–1. Kiểm tra `validateRegions` theo phép Hợp/Giữa/Giao sau mỗi thay đổi. Từ chối vùng tự cắt, diện tích bằng 0, cạnh quá ngắn, hoặc vùng trong chạm/cắt vùng ngoài; không đưa hình học hỏng vào PDFium.
- **Trong lúc kéo** chỉ hiển thị đường bao dự thảo trên SVG. **Khi thả chuột** mới cập nhật `state.regions` và thêm một snapshot vào lịch sử Undo/Redo; một cử chỉ kéo chỉ tương ứng một lần Hoàn tác. Escape, pointercancel hoặc điều hướng giữa trang sẽ hủy kéo đang thực hiện.
- Khi đã **Áp dụng**, tay nắm chỉnh sửa bị khóa nhằm tránh kết quả PDF không tương ứng. Bấm **Chỉnh sửa lại** trước khi sửa đường bao và áp dụng lại.
- Test: `tests/pdf-region-handles.test.cjs` kiểm tra chỉnh đỉnh/cạnh, immutable, giới hạn trang, topo union/between/intersection; Chromium E2E kéo thật trên PDF và xác minh Undo/Redo, rồi áp dụng PDFium.


## 17. Compact drawing workspace và căn toàn trang theo viewport (2026-10-16)

- Khi nhấn thumbnail để **Vẽ vùng / Chỉnh sửa**, trang chuyển `body.re-editor-active` và rút gọn 5 hàng chrome gồm logo/topbar, thanh tệp và nút áp dụng, chỉ dẫn quy trình, hàng Dàn trang và toolbar PDF. Bảng tác vụ còn ~248px thay vì 315px, cuộn riêng. Chỉ thay CSS giao diện editor, không rút các thông báo chữ ký, nội dung pháp lý hay giới hạn thuật toán.
- **Vừa trang** là phép căn trang thật, tính từ `page.getViewport({scale:1})` (đúng rotation của PDF.js), trừ padding thực ở `#re-viewport`, sau đó lấy `min(usableWidth/pageWidth, usableHeight/pageHeight)`. Không còn mã cũ căn duy nhất theo width. `pdf-region-view.mjs` là helper đơn vị hình học, áp dụng tiếp `state.zoom` khi người dùng nhấn +/-.
- **Vừa rộng** là phép `usableWidth/pageWidth` cho trường hợp muốn đọc nét/chữ lớn và cho phép cuộn theo chiều dọc. Phân biệt với `Vừa trang` bằng nút trạng thái `aria-pressed`; nhãn zoom thể hiện tỉ lệ render thực, có chỉ báo RAM khi cappedPreviewScale phải hạ độ phân giải.
- **☷ Ẩn tác vụ / Hiện tác vụ** chuyển sang canvas chiếm toàn bộ chiều ngang mà không bỏ vùng chọn, không thay đổi engine xóa; bật lại panel khi muốn chọn phép xóa. `ResizeObserver` quan sát `#re-viewport`, tự căn lại theo chiều cao/rộng mới sau khi đóng/mở panel hoặc resize cửa sổ. Không tăng dung lượng canvas vượt giới hạn megapixel của PDF.js.
- Bản vẽ có trang lớn hơn viewport do zoom sẽ cuộn ngang/dọc đúng trục, căn giữa khi vừa trang bằng `margin:auto` thay vì mất nội dung ngoài mép trái. Overlay SVG và tay nắm đỉnh/cạnh luôn có cùng bounding box với canvas PDF.
- Từ dàn trang vào editor tự chọn `Vừa trang`; đổi trang khác khôi phục `Vừa trang` mặc định. Khi quay lại dàn trang, thoát chế độ editor compact. Khi làm mới/tệp khác, xóa trạng thái compact/focus.
- QA: `tests/pdf-region-fit-layout.test.cjs` kiểm tra landscape, portrait, page/width, chiều rộng/chiều cao thực; Chromium `tests/ux-browser.cjs` xác minh nhìn toàn trang, thu/phóng, ẩn/hiện tác vụ, resize browser và thao tác kéo vùng/áp dụng PDFium.


## 18. Không che vùng chỉnh sửa PDF bằng hộp kết quả/trạng thái (2026-10-16)

- Sửa lỗi giao diện khi bấm **Áp dụng**: thẻ báo cáo `#re-results` từng dùng `position:absolute` ở góc phải dưới làm che một phần trang PDF và cả chữ/ký tên; thông báo `#re-status` từng dùng `position:fixed` tại đáy cửa sổ tiếp tục che bản vẽ.
- **Kết quả xử lý** được đặt cố định trong DOM ở đầu **panel tác vụ bên trái**, theo luồng cuộn của panel, với `position:static`; không làm thay đổi chiều cao hai panel, không tạo lớp overlay lên canvas. Panel tác vụ cuộn đến đầu báo cáo sau Áp dụng.
- **Nút Chỉnh sửa lại** nằm trên thanh `re-editor-header` phía trên bản vẽ cùng nút Bản gốc / Sau xử lý, được bật khi có PDF kết quả và luôn truy cập được ngay cả khi người dùng bật `Ẩn tác vụ`.
- **Trạng thái** chỉ hiện bên trong hàng footer **dưới viewport PDF** khi đang chỉnh sửa và bên trong tiêu đề dàn trang khi xem gallery; bản toast floating ẩn trong chế độ đã mở tài liệu. Trạng thái lỗi vẫn có màu cảnh báo, `role=status`, `aria-live=polite`, có tooltip để đọc đầy đủ câu bị ellipsis.
- Trên uploader chưa mở tài liệu, status hiện thông thường, phục vụ lỗi nhập PDF. Không sửa PDFium Worker hay vùng/tọa độ PDF.
- QA: Node `tests/pdf-region-notification-dock.test.cjs`; Chromium xác minh báo cáo nằm trong `.re-tools`, nằm **bên trái** PDF viewport, footer **bên dưới** viewport, toast cũ ẩn; nút Chỉnh sửa lại vẫn thấy được khi sidebar đang ẩn.
