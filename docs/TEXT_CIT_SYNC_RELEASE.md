# PDF Đạo Chích — Đồng bộ sửa text với cit-pdf 1.0.0

**Ngày:** 2026-10-16  
**Upstream cố định:** [cit-pdf 1.0.0, commit 3c9c138](https://github.com/Cuongyd196/cit-pdf/tree/3c9c138d980a417de7439f383f37882a1d730ab6)  
**Repository phát hành:** [PDF-Editor1](https://github.com/hieudang99dd/PDF-Editor1)  
**Build nguồn đã hoàn tất:** [GitHub Actions run 38914907967](https://github.com/hieudang99dd/PDF-Editor1/actions/runs/38914907967)  
**Commit đồng bộ:** `8e8a51465a3851a805e65e6e25baca91ea99473a`

## Thuật toán, trình tự sử dụng

1. Mở PDF qua route riêng `text-editor.html` → `studio/edit-pdf-text.html`.
2. Bộ phân tích, hiển thị, font/rich runs và preview dùng nguyên lõi nguồn cit-pdf + PDFium, không thay bằng lớp che hoặc lệnh `drawText`.
3. Người dùng chọn đoạn, sửa và nhấn **Áp dụng vào PDF**. Cầu nối gọi đúng native CIT instance qua `window.__HVD_CIT_TEXT_API` do bản build nguồn công bố, tránh tên chunk hash cố định.
4. Phiên native trả `{ok:true|false}`; khi bộ biên tập báo lỗi, UI không báo thành công, nút **Xuất** không được đi tiếp. Bộ kiểm tra giữ lịch sử UI và cố phục hồi vùng nhập khi bị từ chối; **không** tuyên bố rollback WASM nguyên tử trong mọi trường hợp.
5. **Hủy nhập** không chờ font; **Áp dụng** đợi font cần thiết. Ctrl+Enter áp dụng, Esc hủy; Xuất hoặc Ctrl+S sẽ áp dụng vùng nhập hiện hành trước khi lưu PDF.
6. Tùy chọn **Tự dồn đoạn bên dưới** mặc định **tắt** để tránh dịch chữ ra khỏi khung bảng CAD. Chỉ bật khi sửa văn bản dài và người dùng chủ động yêu cầu; đường kẻ/shape không tự dịch theo chữ.
7. Xuất giữ nguyên tài liệu đang mở, thông báo nằm trong thanh trạng thái thay vì che vùng PDF; Blob URL được thu hồi chậm thay vì ngay tức thì.

## Bảo toàn dự án và build tái lập

- `scripts/cit-original/patch_source.py`: buộc đúng SHA upstream và checksum app.js trước khi vá bản nguồn; chỉ sửa mã nguồn và assertion kiểu TypeScript, không chỉnh minified bundle.
- `scripts/cit-original/sync_text_build.py`: chỉ đồng bộ tài nguyên đầu vào text, không chép đè HTML/CSS thương hiệu đã chốt hoặc ứng dụng Organizer/các công cụ khác.
- `studio/hvd-text-build.json`: manifest 676 tài nguyên, SHA-256, base URL, commit upstream và danh sách Vite entrypoint dependencies.
- `.github/workflows/cit-original-build.yml`: npm ci, tsc, Vite build với base `/PDF-Editor1/studio/`, kiểm tra asset/Node/Chromium, PyMuPDF và chỉ push khi HEAD nhánh master chưa có sửa mới.
- `LICENSE` và `NOTICE.md` giữ nguyên nghĩa vụ bản quyền.

## Kết quả QA thực tế

Tại run [38914907967](https://github.com/hieudang99dd/PDF-Editor1/actions/runs/38914907967), **tất cả các bước** thành công: checkout đúng upstream, patch nguồn, TypeScript, Vite, asset paths, Node regression, Chromium tạo PDF thật và native Apply, PyMuPDF xác nhận chữ mới thay chữ cũ và giữ dòng khác, commit phát hành không ghi đè nhánh có thay đổi đồng thời.

## Giới hạn nghiệm thu

Bộ fixture nguồn mới xác minh chữ Latin, PDF có đường vector và một trang. **Chưa** chứng minh đầy đủ trên PDF CAD/Type3, font subset lỗi, chữ tiếng Việt, PDF nhiều trang/xoay 90°, tài liệu scan hoặc vùng lồng nhau. Những trường hợp này phải tiếp tục thử trên tệp PDF thực tế; scan cần OCR riêng. Đặc biệt, ghi text có thể làm mất hiệu lực chữ ký số, PDF/A hoặc PDF/UA; thao tác sửa text không phải xóa bảo mật.

## Phát hành

- GitHub Pages: https://hieudang99dd.github.io/PDF-Editor1/text-editor.html
- Link dự án cũ `PDF-Editor-Hdv` chuyển hướng về repository `PDF-Editor1`.
- Khi gặp cache: mở `studio/repair-editor.html` để xử lý Service Worker.
