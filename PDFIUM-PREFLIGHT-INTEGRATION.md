# PDF HVD – PDFium Read-only Preflight (2026-10-16)

## Mục tiêu và phạm vi

Tận dụng engine PDFium WebAssembly đã được đóng gói tại
`vendor/cit-pdf/pdfium/`. KHÔNG thêm binary khác, KHÔNG thay thuật toán sửa
text, KHÔNG sửa `pdf-native-text.mjs`, `pdf-native-worker.mjs`,
`pdf-native-client.mjs`, `organizer.js` hoặc workspace text.

Tính năng độc lập **Kiểm tra chất lượng PDF** ở trang chính mở
[`pdfium-preflight.html`](pdfium-preflight.html). Đây là công cụ đọc/chẩn đoán,
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
nguồn theo [NOTICE.md](NOTICE.md) và LICENSE hiện tại. Mã nguồn mới là phần
phát triển trong dự án HVD; không sao chép thêm native binary.

## Tiếp theo

- Bộ dữ liệu kiểm tra hồi quy (bản vẽ trắc ngang, trắc dọc, bảng khối lượng,
  A0/A1, Type3), đo FPS/RAM và so sánh render hai engine.
- Có thể thêm bước so sánh hậu chỉnh sửa dưới dạng **tùy chọn** khi các chỉ số
  false positive và tiêu thụ RAM được xác minh từ PDF thực tế. Giữ nguyên
  text editor hiện có cho đến khi phần bổ sung được kiểm thử độc lập.
