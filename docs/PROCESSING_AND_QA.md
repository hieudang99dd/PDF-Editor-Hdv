# PDF HVD — Công cụ xử lý PDF và kiểm định chất lượng

> Tài liệu tổng hợp kỹ thuật theo quy trình, cập nhật ngày 2026-10-16. Các mục có nhãn "Hồ sơ nguồn" giữ nguyên mô tả ở từng giai đoạn phát triển, không đồng nghĩa tất cả chức năng đều có trong phiên bản website mới nhất. Khi thực thi, ưu tiên mã thực tế, kiểm thử CI, [tiến độ dự án](../IMPLEMENTATION_PROGRESS.md), và [giấy phép](../NOTICE.md).

## Hồ sơ nguồn — CIT-ADVANCED-INTEGRATION.md (lịch sử triển khai)

# CIT-PDF 1.0.0 → PDF HVD: Advanced Tool Integration

Ngày: 2026-10-15. Nguồn tham chiếu: Cuongyd196/cit-pdf tag 1.0.0 (commit 3c9c138d980a417de7439f383f37882a1d730ab6). Giấy phép GNU AGPL-3.0; ghi công trong NOTICE.md.

## Mục tiêu triển khai

Ưu tiên sửa PDF vector của bản vẽ đường, trắc dọc, trắc ngang và hồ sơ kỹ thuật Civil 3D. Giữ HVD là nền tảng; trích nguyên lý/công thức xử lý có ích từ CIT, không sao chép Vite/UI nguyên khối. Module xử lý thuần dùng PDFLib đã có trong HVD, không yêu cầu tài khoản và không gửi dữ liệu đến API cloud.

## Mã nguồn

- cit-advanced-core.js: engine thực thi trong browser; UMD dùng được trong Node.js tests.
- cit-advanced-ui.js: gắn công cụ vào danh mục hiện có, tái sử dụng upload, progress, download và CSS/JS của HVD.
- index.html: nạp module, đánh dấu công cụ chạy thật (không phải nút mô phỏng), kiểm soát phiên bản cache.
- tests/cit-advanced.test.cjs: test trên PDF thực bằng pdf-lib có sẵn.
- tests/cit-advanced-ui.test.cjs: test routing và tải file.
- .github/workflows/pages-smoke.yml: kiểm thử tự động mỗi khi push/PR vào master, trước khi chấp nhận kết quả.

## Thuật toán đã triển khai thực tế

| Nhóm | Chức năng HVD | Nguyên lý | Giới hạn |
|---|---|---|---|
| Page management | Đảo thứ tự, trích trang chẵn/lẻ | PDFDocument.copyPages | Có thể thay đổi catalog-level metadata/outline |
| Merge | Ghép PDF xen kẽ | copyPages từ 2 PDF theo thứ tự A1, B1, A2, B2 | Chỉ hai đầu vào |
| Print | In 2/4 trang trên tờ N-up | embedPages và drawPage dạng vector | Annotation / tag nguồn không theo sang form XObject |
| Crop | Cắt lề PDF | CropBox theo mm, không rasterize | Chỉ thay đổi vùng nhìn, KHÔNG xóa nội dung |
| Inspect | Thuộc tính PDF và khổ giấy | Đọc catalog và CropBox từng trang | Chỉ metadata và geometry cơ bản |
| Metadata | Sửa metadata | setTitle/Author/Creator/Subject/Keywords | Không đồng bộ XMP tùy biến |
| Metadata | Xóa metadata cơ bản | Xóa Info keys, XMP cấp tài liệu, PieceInfo và trailer ID | Không đảm bảo ẩn danh hoặc chống khôi phục |
| Annotations | Xóa chú thích | Lọc /Annots, giữ subtype /Widget | Không xóa nội dung vẽ trực tiếp trên trang |
| Numbering | Đánh mã Bates | Vẽ text ở chân trang (font Helvetica) | Tiền tố ASCII; PDF xoay đặc biệt cần QA |
| Page management | Chèn trang trắng | insertPage cùng khổ với trang liền kề | Chỉ một trang/lần |
| Overlay | Chồng 2 PDF | embedPage PDF lớp phủ lên file nền | Chỉ hai tệp, annotation không chuyển |
| Rotation | Xoay góc tùy chỉnh | Với 90°: Rotate; góc tự do: embedded vector + bounding rectangle | Góc tự do không chuyển annotation của nguồn |

**Những công cụ này mở ngay trên https://hieudang99dd.github.io/PDF-Editor-Hdv/ và xử lý trong browser.** Không cần khởi động FastAPI, Tesseract, Office hoặc API trả phí cho các thao tác trên.

## Sửa chữ CIT đã tích hợp từ trước

Native PDFium WASM, font/cmap, stream-splice Tj/TJ, bảo vệ dàn chữ bảng, baseline, page rotation, Type3 guard, local worker, undo/redo, kiểm thử bằng PDF.js. Xem CIT-INTEGRATION.md và NOTICE.md.

## Bảo đảm kỹ thuật và những gì KHÔNG được khẳng định

- Đọc, ghi PDF vector thay vì chuyển tất cả sang ảnh. Điều này **không đồng nghĩa** với việc luôn bảo toàn toàn bộ cấu trúc bookmarks, digital signatures, tags, form fields hay metadata qua mọi phép sao chép.
- Engine từ chối sửa file có dấu hiệu ByteRange của chữ ký số, nhưng không tuyên bố phát hiện hoàn toàn chữ ký ẩn trong object stream. Chữ ký số sau sửa thường không còn hợp lệ.
- Cắt lề và đặt khung trắng **không phải redaction bảo mật**.
- N-up, overlay, xoay góc tự do sử dụng Form XObject: nét vector được giữ, chú thích và accessibility có thể thay đổi. PDF CAD cần so sánh hình ảnh trước/sau.
- PDF lớn và CAD có font Type3, shadings, transparency, rotated crops hoặc shared XObjects cần regression corpus thực tế. Không khẳng định mọi PDF CAD đều chính xác.
- OCR, PDF/A, Word/Excel/PPT, Ghostscript/qpdf, cryptographic signatures, secure redaction, multi-language rich paragraph edits, Electron không thuộc nhóm browser-advanced đã hoàn thiện.
- Các backend Office/OCR cục bộ tồn tại riêng nhưng không thể hoạt động khi chỉ mở GitHub Pages trên máy chưa cài engine.
- Từ tag 1.0.0 của CIT có hơn 100 trang công cụ, nhưng số file/entrypoints không tương đương số thuật toán độc lập. Chưa tích hợp toàn bộ CIT.

## Quy trình kiểm thử

1. node --test tests/pages-smoke.test.cjs tests/cit-advanced.test.cjs tests/cit-advanced-ui.test.cjs
2. Kiểm tra GitHub Actions: PDF HDV Pages smoke checks (pass), pages build and deployment (pass).
3. Kiểm tra thực tế: PDF kỹ thuật A0/A1/A3, annotations, rotated page, mixed orientations, bookmarks, forms và signed PDFs trước khi gọi production-grade.
4. So sánh render trước/sau: crop (vùng nhìn), overlay, 2-up/4-up, rotation 45°, Bates; kiểm tra chữ không mất, file mở được trong PDF.js/Adobe/Poppler.

## Phần việc tiếp tục (P2+)

- Module qpdf WASM và Ghostscript/PyMuPDF: bản build tương thích static hosting, kiểm tra quyền/license, lazy load/worker và hạn mức RAM. Không sao chép binary thiếu nguồn tái tạo.
- Kiểm tra / sửa form và làm phẳng annotation thực sự theo AP, bảo toàn appearance.
- Bảo mật: redaction đúng nghĩa, chữ ký số, kiểm tra/chứng thực chữ ký, PDF/A có validator.
- OCR và Office ở web: giải quyết dependencies WASM, kích thước tải, thông báo chi phí bộ nhớ và fidelity.
- Kiểm thử thực địa từ PDF CAD/tiếng Việt của người dùng; ảnh hưởng bản vẽ trắc ngang, khung tên, ký hiệu vật liệu.

---

## Hồ sơ nguồn — PDFIUM-PREFLIGHT-INTEGRATION.md (lịch sử triển khai)

# PDF HVD – PDFium Read-only Preflight (2026-10-16)

## Mục tiêu và phạm vi

Tận dụng engine PDFium WebAssembly đã được đóng gói tại
`vendor/cit-pdf/pdfium/`. KHÔNG thêm binary khác, KHÔNG thay thuật toán sửa
text, KHÔNG sửa `pdf-native-text.mjs`, `pdf-native-worker.mjs`,
`pdf-native-client.mjs`, `organizer.js` hoặc workspace text.

Tính năng độc lập **Kiểm tra chất lượng PDF** ở trang chính mở
[`pdfium-preflight.html`](../pdfium-preflight.html). Đây là công cụ đọc/chẩn đoán,
không phải trình sửa nội dung PDF, không tự chữa lỗi hoặc chứng nhận tuân thủ.

## Thành phần mới

| Tệp | Trách nhiệm |
| --- | --- |
| `pdfium-preflight-core.mjs` | Tổng hợp thống kê, cảnh báo ở dạng dữ liệu thuần |
| `pdfium-preflight-worker.mjs` | Khởi tạo PDFium từ WASM có sẵn, quét từng trang trong worker, không ghi PDF |
| `pdfium-preflight.html` | Giao diện chọn PDF, hiển thị bảng, cảnh báo và xuất báo cáo JSON |
| `tests/pdfium-preflight.test.cjs` | Kiểm thử logic, routing, JavaScript và PDFium thật |
| `.github/workflows/pages-smoke.yml` | Kiểm tra syntax và chạy thêm bài thử |

## Quy trình

1. Người dùng chọn PDF cục bộ. File chưa được tải tới server.
2. File được giới hạn **80 MiB**. Worker được tạo khi bấm **Kiểm tra PDF**, không nạp
   PDFium cho đến thời điểm đó.
3. Worker dùng `PdfEngine.create()`, `open()`, `loadPage()`, `buildModel()`
   và `documentInfo()`; tất cả là API đã có trong runtime hiện tại.
4. Để giới hạn RAM và thời gian, chỉ quét tối đa **50 trang đầu**. Nếu còn trang khác,
   báo cáo đánh dấu kết quả là **chưa đầy đủ**.
5. Báo cáo ghi số trang, kích thước, góc xoay, số cụm chữ, số vùng không được engine
   đánh dấu sửa an toàn, vùng nhiều dòng, ký tự thay thế Unicode, hình học không hợp lệ.
6. Có các cảnh báo thận trọng về dấu hiệu chữ ký, mã hóa, trang thiếu chữ và nhãn
   PDF/A. **Nhãn PDF/A không phải bằng chứng tuân thủ PDF/A.**
7. Xuất báo cáo JSON chỉ chứa thống kê. Không lưu toàn văn hoặc dữ liệu tệp gốc.
8. Worker đóng tài liệu và hủy khi kết thúc, lỗi hoặc quá thời gian; PDF nguồn giữ nguyên.

## Giới hạn và quyết định thiết kế

- Cụm chữ PDFium (`paragraphs`) không đồng nhất với từng ký tự hoặc đối tượng
  `Tj`/`TJ`. Số liệu này là thống kê sơ bộ, không phải cam kết về khả năng sửa.
- `editable=false` hoặc nhiều dòng cho biết rủi ro chỉnh sửa; không phải một
  khẳng định PDF hỏng. Trang không có text có thể là ảnh quét hoặc trang trắng.
- Không tự động xác thực chữ ký, không sửa file PDF/A, không OCR, không redaction.
- PDF được bảo vệ bằng mật khẩu có thể bị PDFium từ chối mở; không vượt qua bảo vệ.
- Bản này không thêm mạng/API và không cần backend. Đường tải runtime là asset
  cùng origin thuộc kho mã nguồn đã tích hợp.
- Bộ kiểm tra là tác vụ **opt-in** và không chạy ngầm trong quy trình text, vì
  chạy native engine nhiều lần có thể tăng RAM và ảnh hưởng độ ổn định.
- Font Type3, font subset, PDF CAD A0/A1 lớn, XFA, XObject lồng và PDF hỏng cần
  tập dữ liệu thực để đánh giá sâu hơn.

## Kiểm thử

```bash
node --check pdfium-preflight-core.mjs
node --check pdfium-preflight-worker.mjs
node --test tests/pdfium-preflight.test.cjs
```

Workflow hiện có chạy các bài thử text/CIT khác để phòng ngừa hồi quy. Cần
xác nhận tình trạng GitHub Actions trên commit cuối cùng và thử trực tiếp trên
GitHub Pages sau khi merge/deploy. Không tuyên bố hoàn tất QA thực địa nếu chưa
có PDF CAD mẫu được kiểm tra.

## Giấy phép

Runtime sử dụng lại `vendor/cit-pdf/pdfium/` đang chịu các điều kiện và công bố
nguồn theo [NOTICE.md](../NOTICE.md) và LICENSE hiện tại. Mã nguồn mới là phần
phát triển trong dự án HVD; không sao chép thêm native binary.

## Tiếp theo

- Bộ dữ liệu kiểm tra hồi quy (bản vẽ trắc ngang, trắc dọc, bảng khối lượng,
  A0/A1, Type3), đo FPS/RAM và so sánh render hai engine.
- Có thể thêm bước so sánh hậu chỉnh sửa dưới dạng **tùy chọn** khi các chỉ số
  false positive và tiêu thụ RAM được xác minh từ PDF thực tế. Giữ nguyên
  text editor hiện có cho đến khi phần bổ sung được kiểm thử độc lập.
