# PDF HVD — Product Personalization & Branding (2026-10-16)

## Quyết định sản phẩm

- Thương hiệu sử dụng trên toàn bộ giao diện: **PDF HVD**.
- Trọng tâm: chỉnh sửa văn bản PDF gốc, công cụ tổ chức, chuyển đổi và kiểm tra.
- Giữ nguyên engine PDFium/CIT đã hoạt động; cá nhân hóa giao diện không đồng nghĩa với tái viết thuật toán gốc.
- Loại khỏi màn hình thao tác các mục quảng bá, liên kết mạng xã hội và menu sản phẩm không thuộc HDV.
- **Không giả nhận quyền tác giả đối với mã nguồn đóng góp từ các bên thứ ba.**
- File `LICENSE`, `NOTICE.md`, thư mục vendor, chú thích bản quyền và lịch sử Git phải được giữ phù hợp giấy phép thực tế.

## Đã thay đổi

| Tệp | Nội dung |
| --- | --- |
| `studio/edit-pdf-text.html` | Topbar HDV, metadata chính xác hơn, title/description, footer pháp lý tùy chọn, liên kết nội bộ |
| `studio/hvd-brand.css` | CSS thương hiệu riêng, ẩn marketing footer/menu gốc (không xóa DOM), responsive |
| `tests/studio-brand.test.cjs` | Bảo vệ editor DOM, asset Vite, đường dẫn trang và NOTICE.md |
| `.github/workflows/pages-smoke.yml` | Chạy regression branding cùng PDFium, native text và các tác vụ hiện có |

Không sửa `pdf-native-text.mjs`, `pdf-native-worker.mjs`, `pdf-native-client.mjs`,
`organizer.js`, `vendor/cit-pdf/`, compiled Vite bundle hoặc phần luồng xử lý sửa văn bản.

## Cấu trúc nhìn từ người sử dụng

1. Trang chủ: danh mục `PDF HVD`, tab `Chỉnh sửa văn bản PDF` tách riêng.
2. Trang sửa text: thanh tiêu đề HDV với ba lối đi (Tất cả công cụ / Chỉnh sửa văn bản / Kiểm tra PDF).
3. Chọn tệp / edit / áp dụng / xuất PDF: giữ nguyên workflow native hiện hữu.
4. Bỏ menu khác dự án, thương hiệu thừa, badge cộng đồng, referral link, footer marketing và phần quảng bá dài vốn dễ tuyên bố chức năng chưa hỗ trợ.
5. Chỉ dẫn `Thông tin giấy phép` nằm ở cuối giao diện, trỏ `NOTICE.md`.

## Quy tắc pháp lý

- **AGPL-3.0 không phải public domain**. Mã nguồn mở không cho phép tự ý xóa license hoặc
  thông báo bản quyền bên thứ ba khi điều khoản yêu cầu bảo lưu.
- Việc đặt tên sản phẩm PDF HVD, thiết kế UI, nội dung giới thiệu độc lập là hợp lệ
  nếu không tạo nhầm lẫn về quyền tác giả và không vi phạm quy định thương hiệu.
- Nguồn bên thứ ba tiếp tục được công bố ở NOTICE; phần mã gốc không bị sửa để che provenance.
- Phần fork kết hợp không mặc nhiên trở thành một phần mềm sở hữu độc quyền.
- Nếu thay đổi cách phân phối, bán bản license đóng hoặc cung cấp bản qua mạng,
  phải xem xét nghĩa vụ cung cấp nguồn tương ứng của AGPL-3.0 và giấy phép phụ thuộc.

## Giới hạn QA và kế hoạch tiếp theo

Kiểm thử tự động xác nhận DOM editor còn đầy đủ và route/assets không đổi; **không thay thế**
kiểm thử Chrome trực quan trên PDF bảng/CAD, bản scan, font Type3 và PDF ký số.
Cần kiểm thử người dùng trên Windows Chrome/Edge ở 100/125/150% zoom, màn hình
1366x768, 1920x1080, mobile, dark mode.

Nâng cấp thuật toán chỉ được tiến hành theo module riêng, xác minh trước/sau và có
cơ chế quay lại. Không quảng cáo `live paragraph reflow` tự do khi engine chưa đảm bảo.
