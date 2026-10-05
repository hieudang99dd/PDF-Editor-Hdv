---
name: pdf-editor-completion
description: >-
  Quy trình hoàn thiện giao diện và tính năng cho dự án PDF Hub (PDF-Editor-Hdv), một web app
  chạy 100% trên trình duyệt, deploy trên GitHub Pages. Dùng skill này khi người dùng yêu cầu
  sửa lỗi, tối ưu, nâng cấp UI/UX hoặc thêm tính năng cho công cụ "Chỉnh sửa PDF" / "Sắp xếp PDF"
  (organizer.js), hoặc các công cụ khác trên trang chủ (index.html), hoặc khi người dùng nói
  "làm tiếp lộ trình", "làm task tiếp theo", "hoàn thiện phần chỉnh sửa".
---

# Hoàn thiện PDF Hub — bắt đầu từ công cụ Chỉnh sửa PDF

## Bối cảnh nhanh

- **Repo:** thư mục gốc chứa `.agents/` này (`pdf-frontend-only`), remote `https://github.com/hieudang99dd/PDF-Editor-Hdv.git`, nhánh `master`.
- **Site:** https://hieudang99dd.github.io/PDF-Editor-Hdv/ (GitHub Pages, phục vụ từ thư mục gốc).
- **File chính:** `index.html` (trang chủ + các công cụ đơn giản), `organizer.js` (class `PDFOrganizer`), `organizer.css`.
- **Thư viện (CDN, không có bước build):** pdf.js 3.11.174 (hiển thị), pdf-lib 1.17.1 (ghi PDF), SortableJS (kéo thả).
- Thư mục `pdf-editor-web/` cũ (FastAPI + `main.py`) đã **lỗi thời**, không sửa ở đó.

Chi tiết kiến trúc, mô hình dữ liệu và các bẫy kỹ thuật: [references/architecture.md](references/architecture.md).

## Ràng buộc bắt buộc

1. **Không backend.** Mọi xử lý chạy trên trình duyệt. Không thêm server, không gửi file ra ngoài.
2. **Đường dẫn tương đối** (`organizer.js`, `fonts/x.ttf`). Không bao giờ dùng `/static/...` hoặc `/x` vì site nằm dưới subpath `/PDF-Editor-Hdv/`.
3. **Vanilla JS, không bước build.** Thư viện mới nạp từ CDN với **phiên bản cố định** (không dùng `@latest`) hoặc đặt file vào repo.
4. **Giao diện và thông báo bằng tiếng Việt có dấu.** Trả lời người dùng bằng tiếng Việt.
5. **Không phá tính năng đang chạy.** Chạy checklist hồi quy (bên dưới) trước khi deploy.
6. **Trung thực về tính năng:** không quảng cáo tính năng chưa có. Tính năng còn mô phỏng phải gắn nhãn rõ ràng.
7. Commit message viết **tiếng Anh, không dấu** (PowerShell 5.1 dễ làm hỏng ký tự Unicode khi truyền vào git).

## Quy trình mỗi lần làm việc

1. **Chọn task.** Mở [references/roadmap-editor.md](references/roadmap-editor.md). Nếu người dùng không chỉ định, lấy task **chưa tick đầu tiên ở giai đoạn thấp nhất**. Mỗi lần chỉ làm một task, hoặc một nhóm task nhỏ liên quan chặt với nhau.
2. **Đọc mã liên quan** trước khi sửa. Số dòng thay đổi liên tục nên tìm theo tên method, không theo số dòng.
3. **Nếu task thuộc Giai đoạn 4 (chỉnh sửa nội dung)**, đọc thêm [references/annotation-design.md](references/annotation-design.md) và tuân theo mô hình dữ liệu ở đó.
4. **Cài đặt.** Giữ phong cách code hiện có. Mọi phần tử DOM của organizer dùng tiền tố `po-`.
5. **Kiểm tra tĩnh:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/skills/pdf-editor-completion/scripts/deploy.ps1 -CheckOnly
   ```
   Script kiểm tra cú pháp mọi file `.js` ở thư mục gốc và các `<script>` inline trong `index.html`.
6. **Kiểm tra chạy thật** (khuyến nghị cho mọi task có thay đổi hành vi):
   ```powershell
   npx --yes http-server . -p 8080 -c-1
   ```
   Mở `http://localhost:8080/`, chạy các mục liên quan trong ma trận kiểm thử ở roadmap. Nếu có công cụ trình duyệt thì tự kiểm tra; nếu không thì đưa người dùng các bước kiểm tra cụ thể.
7. **Cập nhật roadmap:** tick `[x]` và ghi một dòng ghi chú (ngày, cách làm, giới hạn còn lại).
8. **Deploy** (tự tăng cache-buster `?v=N`, commit, push và chờ Pages cập nhật):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/skills/pdf-editor-completion/scripts/deploy.ps1 -Message "Short english summary"
   ```
   Script chờ tối đa khoảng 150 giây. Nếu chạy quá thời gian chờ đồng bộ, để nó chạy nền và đợi thông báo. **Không** dùng `Invoke-WebRequest` không có `-UseBasicParsing` để kiểm tra site vì lệnh có thể treo vô thời hạn.
9. **Báo cáo** cho người dùng bằng tiếng Việt: đã làm gì, cách kiểm tra, giới hạn còn lại. Nhắc nhấn `Ctrl + F5`.

## Checklist hồi quy (chạy trước mỗi lần deploy)

- [ ] Trang chủ hiển thị, tìm kiếm và lọc theo nhóm hoạt động; nút "Làm mới" hoạt động.
- [ ] Ghép / Cắt / Xoay / Xóa trang / Trích xuất trên trang chủ vẫn tải được file kết quả.
- [ ] Mở "Chỉnh sửa PDF" → tải file → thumbnail hiện dần khi cuộn (lazy).
- [ ] Chọn 1 / Shift / Ctrl / Ctrl+A; phím mũi tên; thanh điều hướng trang đồng bộ hai chiều với thumbnail.
- [ ] Kéo thả đổi thứ tự; xoay; nhân đôi; xóa; chèn trang trống; chèn từ PDF.
- [ ] Hoàn tác / Làm lại qua nhiều bước.
- [ ] Lưu file → mở bằng trình xem PDF khác → đúng thứ tự, đúng góc xoay, không mất trang.
- [ ] Nút "Quay lại" đưa về trang chủ đầy đủ (có header), mở lại công cụ không bị lỗi.
- [ ] Console trình duyệt không có lỗi đỏ mới.

## Sau phần Chỉnh sửa

Khi roadmap của organizer xong Giai đoạn 1–3, tạo `references/roadmap-tools.md` cho các công cụ khác trên trang chủ. Hướng khả thi hoàn toàn trên trình duyệt (đã ghi ở cuối roadmap-editor): PDF→JPG/PNG, JPG→PDF, Watermark, Đánh số trang, Ký tên, OCR (tesseract.js). Các công cụ Office↔PDF, nén mạnh, PDF/A và đặt mật khẩu **không làm tốt được** nếu chỉ dùng pdf-lib, nên phải gắn nhãn "Sắp ra mắt" thay vì mô phỏng.
