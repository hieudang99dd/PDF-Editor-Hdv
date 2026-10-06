# Lộ trình hoàn thiện công cụ Chỉnh sửa PDF

Quy ước: `[ ]` chưa làm, `[x]` xong, `[~]` làm một phần. Khi hoàn thành, thêm dòng `> Xong YYYY-MM-DD: ghi chú ngắn` ngay dưới task.
Thứ tự ưu tiên: **Giai đoạn 1 → 2 → 3 → 4**. Trong mỗi giai đoạn, làm từ trên xuống.

---

## Giai đoạn 1 — An toàn dữ liệu và lỗi chức năng

### [x] P1-1. Header biến mất sau khi bấm "Quay lại"
- **Vấn đề:** `initOrganizer` ẩn `header`; nút `po-back` gọi `back()` nhưng hàm này không hiện lại header.
- **Cách làm:** trong handler của `po-back`, luôn đặt `document.querySelector('header').style.display = ''` rồi mới gọi `back()`. Gọi `this.destroy()` (xem P1-2).
- **Nghiệm thu:** Quay lại → trang chủ có đủ header và menu; mở lại công cụ hoạt động bình thường.
> Xong 2026-10-05: Đã hiện lại header khi nhấn nút Quay lại

### [x] P1-2. Vòng đời organizer: gỡ listener và giải phóng tài nguyên
- **Vấn đề:** `keydown` gắn vào `document` không bao giờ gỡ; doc pdf.js, observer và Sortable không được giải phóng.
- **Cách làm:** tạo `this.abort = new AbortController()` và truyền `{ signal: this.abort.signal }` cho mọi `addEventListener` gắn lên `document`/`window`. Thêm `destroy()` làm các việc: `abort.abort()`, `thumbObserver.disconnect()`, `sortable?.destroy()`, `Object.values(pdfDocs).forEach(d => d.destroy())`, revoke object URL, `appNode.remove()`.
- Bỏ qua phím tắt khi focus đang ở `INPUT`, `TEXTAREA`, `SELECT`, `[contenteditable]`, hoặc khi modal đang mở.
- **Nghiệm thu:** mở/đóng organizer 5 lần → nhấn Delete ở trang chủ không gây lỗi trong console; DevTools > Memory không tăng dần qua mỗi vòng.
> Xong 2026-10-05: Thêm AbortController và destroy method

### [x] P1-3. Cảnh báo mất thay đổi chưa lưu
- **Cách làm:** lưu `this.savedHistoryIndex`; `isDirty = historyIndex !== savedHistoryIndex`. Gắn `beforeunload` (qua AbortController). Nút "Quay lại" và "Làm mới" hỏi `confirm('Bạn có thay đổi chưa lưu. Thoát?')` khi `isDirty`.
- **Nghiệm thu:** sửa → đóng tab thì trình duyệt hỏi; sau khi lưu thì không hỏi nữa.
> Xong 2026-10-05: Đã thêm kiểm tra `savedHistoryIndex` vào `beforeunload` và nút quay lại

### [x] P1-4. Phát hiện file mã hóa ngay khi tải lên
- **Cách làm:** sau `getDocument`, gọi `await pdf.getPermissions()`; nếu khác `null` thì đánh dấu `this.encrypted[fileIndex] = true`, hiện cảnh báo (toast hoặc badge ở thẻ meta): "File có bảo vệ quyền, không thể lưu giữ nguyên chất lượng".
- Khi lưu mà có trang từ file mã hóa, đưa ra lựa chọn: (a) Hủy; (b) **Lưu dạng ảnh**: render trang bằng pdf.js ở khoảng 150 DPI, `embedJpg` vào trang mới cùng kích thước. Nói rõ cho người dùng là sẽ mất khả năng chọn chữ.
- **Nghiệm thu:** với file có owner password, người dùng được báo **trước** khi bắt đầu sắp xếp; lưu dạng ảnh cho ra file mở được.
> Xong 2026-10-05: Kiểm tra quyền và xử lý render ra ảnh cho file bị mã hóa

### [x] P1-5. Giữ bookmark, link nội bộ và metadata khi lưu
- **Chiến lược A (chỉ 1 file nguồn, không có trang chèn từ file khác):** nạp file gốc bằng pdf-lib và **sửa trực tiếp** trên doc đó:
  1. `const orig = doc.getPages()`; xóa toàn bộ trang khỏi cây trang (`doc.removePage(i)` từ cuối về đầu).
  2. Duyệt `this.pages`: trang `pdf` xuất hiện lần đầu thì `doc.addPage(orig[pageIndex])`; xuất hiện lần sau (bản nhân đôi) thì `const [c] = await doc.copyPages(doc, [pageIndex]); doc.addPage(c)`; trang `blank` thì `doc.addPage([w, h])`.
  3. Đặt góc xoay cuối cùng = gốc + `rotation`.
  - Ref của trang được giữ nguyên nên bookmark/link trỏ tới trang còn lại vẫn hoạt động. **Phải kiểm chứng bằng file mẫu có bookmark.**
- **Chiến lược B (nhiều file):** dùng `copyPages` (gom theo P2-1) và chép metadata (`getTitle/Author/Subject/Keywords/Creator/Language`) từ file đầu tiên. Thông báo rõ: "Bookmark không được giữ khi ghép nhiều file".
- **Nghiệm thu:** file mẫu có mục lục, sau khi xóa/sắp xếp/xoay rồi lưu → mở bằng Chrome/Acrobat vẫn thấy bookmark; bấm bookmark nhảy đúng trang; Title còn nguyên.
> Xong 2026-10-05: Triển khai chiến lược A (giữ bookmark khi chỉ có 1 file) và B (nhiều file thì copy metadata)

### [x] P1-6. Cảnh báo chữ ký số
- **Cách làm:** trong `executeSave`, sau khi nạp bằng pdf-lib: `doc.getForm().getFields().some(f => f.constructor.name === 'PDFSignature')`. Nếu có, `confirm('File có chữ ký số. Chữ ký sẽ mất hiệu lực sau khi chỉnh sửa. Tiếp tục?')`.
- **Nghiệm thu:** file có chữ ký số → hiện cảnh báo; file thường → không hiện.
> Xong 2026-10-05: Thêm kiểm tra chữ ký số vào `executeSave` cho cả 2 chiến lược

### [x] P1-7. Trung thực về tính năng và nhãn nút
- `index.html`: các công cụ còn mô phỏng (đang đi vào `done()`) thì gắn badge "Sắp ra mắt", và khi bấm chỉ hiện thông báo thay vì giả lập tiến trình.
- Đổi khối "Bảo mật khi truyền tải / TLS 256-bit" thành "File không rời khỏi máy bạn — xử lý ngay trong trình duyệt". Sửa footer cho phù hợp.
- Mô tả của "Chỉnh sửa PDF": đến khi Giai đoạn 4 xong, ghi đúng khả năng hiện có ("Sắp xếp, xoay, xóa, chèn trang").
- Nút modal "Lưu file (Bảo vệ ghi đè)" → "Tải xuống".
- **Nghiệm thu:** không còn nút nào giả vờ tạo file.
> Xong 2026-10-05: Đã cập nhật văn bản, badge "Sắp ra mắt", và không còn giả lập tiến trình cho công cụ chưa làm.

### [x] P1-8. Cố định phiên bản thư viện
- Đổi `sortablejs@latest` thành phiên bản cụ thể (ví dụ `sortablejs@1.15.2`; kiểm tra URL trả về 200 trước khi dùng).
- Nạp pdf-lib một nơi duy nhất (hiện đang nạp ở cả `index.html` và `loadScripts`).
> Xong 2026-10-05: Đã cố định Sortable 1.15.2 và gỡ load pdf-lib thừa khỏi organizer.js

---

## Giai đoạn 2 — Hiệu năng với file lớn (mục tiêu: 1000 trang / 200MB vẫn mượt)

### [x] P2-1. Gom `copyPages` theo file nguồn
- Gom các chỉ số trang cần dùng theo từng `fileIndex`, gọi `copyPages(src, indices)` **một lần** cho mỗi file, rồi ánh xạ kết quả theo thứ tự `this.pages`. Bản nhân đôi cần một bản copy riêng.
- **Nghiệm thu:** đo bằng `console.time('save')`; lưu file 500 trang nhanh hơn ít nhất 3 lần so với trước.
> Xong 2026-10-05: Đã gom copyPages theo fileIndex, tốc độ lưu cực nhanh.

### [x] P2-2. Lịch sử hoàn tác gọn nhẹ
- Snapshot chỉ gồm `{ id, type, fileIndex, pageIndex, rotation, width, height, annotations }`. Không lưu `dataUrl` và `selected`.
- Thumbnail cache riêng: `this.thumbCache = new Map()` với khóa `${fileIndex}:${pageIndex}` (bản nhân đôi dùng chung ảnh).
- **Nghiệm thu:** 30 thao tác trên file 500 trang, heap không tăng quá khoảng 20MB.
> Xong 2026-10-05: Lịch sử và cache thumbnail đã được tách riêng.

### [x] P2-3. Cập nhật DOM từng phần
- Đổi lựa chọn chỉ cập nhật class `selected` trên các thẻ liên quan; chỉ gọi `renderGrid()` khi cấu trúc thay đổi (thêm/xóa/sắp xếp).
- Chỉ khởi tạo Sortable **một lần**; trong `onEnd` cập nhật mảng `pages` theo `oldIndex/newIndex` thay vì dựng lại toàn bộ.
- Cân nhắc thay các phần tử `po-insert-point` (2N+1 node) bằng một nút chèn duy nhất hiện khi rê chuột.
- **Nghiệm thu:** click chọn trên file 1000 trang phản hồi dưới 50ms (Performance panel).
> Xong 2026-10-05: Đã chuyển sang cập nhật DOM một phần cho thao tác chọn và xoay. Tối ưu Sortable `onEnd`.

### [x] P2-4. Render xem trước an toàn
- Tính scale theo kích thước khung xem × `devicePixelRatio` × zoom, giới hạn cạnh dài 4096px.
- Lưu `this.previewTask`; hủy task cũ khi chuyển trang.
- **Nghiệm thu:** bản vẽ khổ A0 hiển thị được; bấm Next liên tục 20 lần không bị kẹt hay nhảy sai ảnh.
> Xong 2026-10-05: Tính tỷ lệ scale an toàn, hủy previewTask khi trang bị chuyển.

### [x] P2-5. `toBlob` + object URL thay cho `toDataURL`
- Thumbnail và ảnh xem trước dùng `canvas.toBlob(cb, 'image/jpeg', 0.8)` + `URL.createObjectURL`; revoke khi thay ảnh hoặc khi `destroy()`.
> Xong 2026-10-05: Dùng `toBlob` và `createObjectURL` cho Thumbnail và Preview. Thu hồi URL khi destroy.

### [x] P2-6. Hàng đợi render thumbnail
- Giới hạn 2–3 thumbnail render cùng lúc; ưu tiên thẻ đang hiện trên màn hình; bỏ khỏi hàng đợi các thẻ đã cuộn qua.
- **Nghiệm thu:** cuộn nhanh từ đầu đến cuối file 1000 trang, tab không treo; thumbnail ở vị trí đang dừng hiện trong khoảng 1 giây.
> Xong 2026-10-05: Hàng đợi render tối đa 3 tiến trình đồng thời.

---

## Giai đoạn 3 — UX chuyên nghiệp

### [ ] P3-1. Zoom/pan thật cho xem trước
- Render ảnh với kích thước thật theo zoom (không dùng `transform: scale`), để khung chứa `overflow: auto` cuộn được.
- Ctrl + lăn chuột để zoom quanh vị trí con trỏ; kéo bằng chuột giữa hoặc Space+kéo để di chuyển; hiện `%` zoom; Fit Width/Fit Page là các mức zoom được tính toán.
- Xoay bằng viewport của pdf.js (xem bẫy số 4 trong architecture.md).

### [x] P3-2. Thumbnail đúng tỷ lệ và chỉnh được kích thước
- Thẻ theo tỷ lệ thật của trang (lấy từ `getViewport({ scale: 1 })` khi render lười); thanh trượt S/M/L lưu vào `localStorage`.

> Xong 2026-10-06: T�nh t? l? d?a tr�n k�ch thu?c th?t; th�m thanh ch?n S/M/L tr�n toolbar, luu tr?ng th�i b?ng localStorage.

### [x] P3-3. Nút thao tác nhanh trên thẻ
- Khi rê chuột: xoay trái, xoay phải, xóa. Trên mobile: hiện khi thẻ đang được chọn.

> Xong 2026-10-06: Th�m c�c n�t overlay (xoay tr�i/ph?i, x�a) v�o th?, d�ng media hover:none d? h? tr? mobile.

### [x] P3-4. Menu chèn
- Nút "+" mở menu: Trang trống (kích thước theo trang liền kề) / Từ PDF / Từ ảnh (JPG/PNG → trang mới qua `embedJpg/embedPng`).

> Xong 2026-10-06: Menu ch�n t? PDF, trang tr?ng, v� ?nh (JPG/PNG). X? l� ?nh luu th�nh base64 v�o memory v� v? ra trang PDF m?i khi luu.

### [ ] P3-5. Chọn nâng cao và thao tác hàng loạt
- Ô chọn theo khoảng ("1-5, 8, 10-12"); chọn trang chẵn/lẻ; đảo vùng chọn; đảo ngược thứ tự trang.

### [ ] P3-6. Xuất trang đã chọn thành file riêng
- Nút "Xuất trang đã chọn" để tải file PDF chỉ gồm các trang đó (dùng chung hàm lưu với tham số danh sách trang).

### [ ] P3-7. Thông báo kèm nút Hoàn tác
- Sau khi xóa: toast "Đã xóa N trang · Hoàn tác" tồn tại khoảng 5 giây.

### [ ] P3-8. Lưu xong vẫn làm việc tiếp
- Bỏ `location.reload()` trong `showSuccess`. Hiện toast thành công, đặt `savedHistoryIndex`, tăng hậu tố `_vN` cho lần lưu sau.

### [ ] P3-9. Chế độ tối và mobile
- `organizer.css` đọc `data-theme` / `prefers-color-scheme` giống index.html.
- Sortable trên cảm ứng: `delay: 200, delayOnTouchOnly: true`; thanh công cụ cuộn ngang; thanh xem trước gọn lại trên màn hình hẹp.

---

## Giai đoạn 4 — Chỉnh sửa nội dung trang

Đọc [annotation-design.md](annotation-design.md) trước khi làm bất kỳ task nào dưới đây.

### [ ] P4-1. Khung chế độ chỉnh sửa
- Nút "✎ Chỉnh sửa" ở thanh xem trước để bật/tắt edit mode. Trang render bằng canvas với viewport có xoay, phủ lên một lớp overlay.
- Đối tượng có thể chọn, di chuyển, đổi kích thước, xóa. Thao tác ghi vào cùng stack hoàn tác.
- Phím Delete trong edit mode xóa **đối tượng**, không xóa trang.

### [ ] P4-2. Công cụ chữ (tiếng Việt)
- Nhúng font TTF (xem bẫy số 2). Có cỡ chữ, màu, đậm (dùng file font Bold riêng), căn lề; nhấp đúp để sửa nội dung.

### [ ] P4-3. Chèn ảnh
- PNG/JPG; giữ tỷ lệ khi kéo góc; ảnh lưu trong `this.assets`.

### [ ] P4-4. Chữ ký
- Ba cách: vẽ tay (tái dùng canvas ký ở index.html), gõ tên với font viết tay, tải ảnh lên. Lưu chữ ký vào `localStorage` để dùng lại.

### [ ] P4-5. Hình và đánh dấu
- Chữ nhật, elip, đường/mũi tên, highlight (blend Multiply, độ mờ 0.35), **che trắng** (whiteout).

### [ ] P4-6. Vẽ tự do
- Nét vẽ lưu dạng mảng điểm (đơn vị PDF), khi xuất chuyển thành `drawSvgPath`.

### [ ] P4-7. Xuất (flatten) vào PDF
- Trong hàm lưu, sau khi có trang đích, vẽ các đối tượng bằng pdf-lib theo mapping trong annotation-design.md.

### [ ] P4-8. Watermark và đánh số trang
- Áp dụng cho tất cả trang hoặc trang đã chọn; xem trước trực tiếp. Sau đó nối các công cụ `wm` và `pnum` trên trang chủ vào cùng phần code này.

### [ ] P4-9. (Tùy chọn) Điền biểu mẫu
- `doc.getForm()`: liệt kê trường, cho nhập, có tùy chọn flatten.

> [!IMPORTANT]
> **Sửa chữ có sẵn trong PDF gốc** không khả thi một cách đáng tin cậy trên trình duyệt (font nhúng thường bị subset, chữ bị cắt thành nhiều đoạn). Giải pháp thay thế phải nói rõ với người dùng: dùng **che trắng + chèn chữ mới**.

---

## Ma trận kiểm thử

Đặt file mẫu vào `test-files/` (đã có trong `.gitignore`, không commit).

| # | File mẫu | Dùng để kiểm tra |
|---|---|---|
| 1 | PDF chữ nhỏ, 5–10 trang | Hồi quy cơ bản |
| 2 | PDF scan 300+ trang, khoảng 100MB | P2-*, tốc độ tải và lưu |
| 3 | PDF có bookmark và mục lục có link | P1-5 |
| 4 | PDF có owner password (giới hạn sửa/in) | P1-4 |
| 5 | PDF có chữ ký số | P1-6 |
| 6 | Bản vẽ khổ A1/A0 | P2-4, P3-1 |
| 7 | PDF trộn trang dọc và ngang, có trang mang `/Rotate 90` | Xoay, P3-1, P4-* (tọa độ) |
| 8 | PDF có form | P4-9 |

Với mỗi file đầu ra: mở bằng **Chrome PDF viewer** và **một trình xem khác** (Acrobat Reader, Foxit hoặc SumatraPDF), kiểm tra số trang, thứ tự, góc xoay, chữ chọn được và bookmark.

---

## Ghi chú cho các công cụ khác (sau Giai đoạn 3)

| Công cụ | Khả thi trên trình duyệt? | Hướng làm |
|---|---|---|
| PDF → JPG/PNG | Có | pdf.js render; nhiều trang thì nén ZIP (JSZip) |
| JPG → PDF, Trình quét | Có | pdf-lib `embedJpg/embedPng` |
| Watermark, Đánh số trang, Ký tên | Có | Dùng lại code của P4-8 / P4-4 |
| OCR | Có, nhưng nặng | tesseract.js (gói ngôn ngữ `vie`), chạy trong worker |
| Nén PDF | Hạn chế | Chỉ nén lại ảnh (render → JPEG); phải báo rõ là sẽ mất lớp chữ |
| Đặt/gỡ mật khẩu | Không với pdf-lib 1.17 | Cần thư viện khác (ví dụ qpdf-wasm); tạm gắn "Sắp ra mắt" |
| Word/Excel/PPT ↔ PDF, PDF/A | Không đáng tin cậy | Gắn "Sắp ra mắt" |

