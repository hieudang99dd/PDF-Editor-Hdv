# PDF HVD — Quy trình sửa văn bản PDF

> Tài liệu tổng hợp kỹ thuật theo quy trình, cập nhật ngày 2026-10-16. Các mục có nhãn "Hồ sơ nguồn" giữ nguyên mô tả ở từng giai đoạn phát triển, không đồng nghĩa tất cả chức năng đều có trong phiên bản website mới nhất. Khi thực thi, ưu tiên mã thực tế, kiểm thử CI, [tiến độ dự án](../IMPLEMENTATION_PROGRESS.md), và [giấy phép](../NOTICE.md).

## Hồ sơ nguồn — CIT-INTEGRATION.md (lịch sử triển khai)

# Đánh giá và tích hợp CIT-PDF 1.0.0 vào HDV

## 2026-10-15 — Giao diện chỉnh Text tách riêng

Đã tách ra [text-editor.html](../text-editor.html) với UI làm việc theo bố cục CIT (PDF giữa, panel định dạng phải), nhưng vẫn dùng **engine PDFium/CIT hiện tại** cùng kiểm tra hình học CAD. Tài liệu chi tiết [CIT-TEXT-WORKSPACE.md](TEXT_ENGINE.md). Không nhận là copy đầy đủ frontend Vite và paragraph reflow của CIT. Bộ test riêng gồm Node và Chromium cho thao tác thật.


## Nâng cấp thuật toán sửa chữ CIT (2026-10-15)

Đã bổ sung sửa **nhiều dòng gốc trong một lượt** (batch/Undo atomic), tìm và xem trước thay thế, bảo toàn các style run kế bên khi sửa run riêng biệt trong paragraph rich text, kiểm tra chữ ký số trước khi rewrite và chỉ thị rõ vùng Type3 không chỉnh sửa an toàn. Chi tiết: [CIT-TEXT-EDITING-UPDATE.md](TEXT_ENGINE.md). **Chưa có paragraph reflow tự do hoặc native edit cho mọi font Type3.**

## Cập nhật đợt 2026-10-15 — Advanced Browser Tools

Đã tích hợp thêm **14 thao tác chuyên biệt** (12 nhóm thuật toán) vào giao diện chính: đảo/lọc trang, ghép xen kẽ, N-up, crop, xem/sửa/xóa metadata, xóa chú thích, Bates, chèn trang trắng, overlay, xoay góc tự do. Nguồn và giới hạn: [CIT-ADVANCED-INTEGRATION.md](PROCESSING_AND_QA.md). Bộ **30 bài kiểm thử Node** chạy trên GitHub Actions đã đạt, gồm PDF thật và luồng giao diện. Nhóm này chạy trong browser không cần backend; đây **không phải** bản tích hợp toàn bộ 119 công cụ của CIT.


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
| OCR, Office, Ghostscript, cpdf, ký số, Electron | Không thuộc **engine sửa chữ CIT**; HVD có backend OCR/Office riêng nhưng chưa mang toàn bộ các module CIT tương ứng vào browser |

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

Giấy phép và nguồn: xem [NOTICE.md](../NOTICE.md). Việc dùng mã AGPL trong bản kết hợp
này đi kèm việc phân phối mã nguồn công khai, không phù hợp với mục tiêu đóng mã.

---

## Hồ sơ nguồn — CIT-TEXT-WORKSPACE.md (lịch sử triển khai)

# PDF HVD – Chỉnh sửa Text chuyên sâu (workspace riêng)

Ngày: 2026-10-15. Thiết kế theo màn hình CIT-PDF desktop do người dùng cung cấp: khung xem PDF trung tâm, panel ĐỊNH DẠNG bên phải, thanh công cụ trên và điều khiển trang dưới.

## Kết quả kiến trúc

- Trang riêng: [text-editor.html](../text-editor.html), đường dẫn public `/PDF-Editor-Hdv/text-editor.html`. Mục "Chỉnh sửa Text chuyên sâu" và nút "T Chỉnh Text" trên trang chủ mở trực tiếp trang này, không yêu cầu đi qua công cụ sắp xếp trang.
- UI và CSS: [text-editor-shell.js](../text-editor-shell.js) + [text-editor.css](../text-editor.css). Bố cục giao diện lấy cảm hứng trực tiếp từ ảnh CIT, dark gray với nhấn xanh ngọc, cố định panel định dạng bên phải.
- **Engine sửa PDF gốc**: gọi nguyên luồng native CIT đang sử dụng trong [pdf-native-text.mjs](../pdf-native-text.mjs), [pdf-native-client.mjs](../pdf-native-client.mjs), [pdf-native-worker.mjs](../pdf-native-worker.mjs), và `vendor/cit-pdf/editcore/`. Không viết engine thay thế, không chuyển trang thành ảnh để lưu.
- Phân tích vùng chữ và geometry: [pdf-text-layout.js](../pdf-text-layout.js), PDF.js text layer, kiểm tra fontkit, bounding box, baseline, CropBox, bảng, font Type3, Undo/Redo và lưu.
- Sửa nhiều vùng hiện hữu: [pdf-batch-text.js](../pdf-batch-text.js). Mỗi lượt là một giao dịch atomic, lỗi nào cũng không ghi dở các vùng khác.

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
- CI: [pages-smoke.yml](../.github/workflows/pages-smoke.yml) (Node), [text-editor-live.yml](../.github/workflows/text-editor-live.yml) (Playwright Chromium, lưu screenshots/PDF artifact).
- Cần kiểm tra thêm PDF kỹ thuật A0/A1, bảng phức tạp, Type3, font subset, PDF ký số và tệp lớn trên Chrome/Edge Windows.

## Giới hạn có chủ đích

- Các vùng chữ Type3 không có ánh xạ font an toàn không được mở sửa đại trà.
- Chưa có live paragraph reflow đa dòng tự do như CIT upstream; trong hồ sơ CAD cần kiểm tra không thay đổi đường bảng, khung tên và nét vector.
- Một đoạn nhiều run/màu chỉ sửa được trong phạm vi engine CIT gốc xác định duy nhất mà không phá các run khác.
- Các thao tác liên quan khoảng cách đoạn/giãn dòng từ ảnh CIT chưa bật trong panel bởi chưa đủ kiểm chứng hình học; không dựng nút giả.
- Bộ công cụ sắp xếp/chú thích cũ vẫn được giữ nguyên vì tương thích dự án; workspace mới là luồng chính để sửa văn bản.
- Giấy phép: GNU AGPL-3.0; xem NOTICE.md.

---

## Hồ sơ nguồn — CIT-TEXT-EDITING-UPDATE.md (lịch sử triển khai)

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
