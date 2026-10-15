# Toàn bộ frontend CIT-PDF v1.0.0 trong PDF HVD

Ngày: 2026-10-15 — nhánh master.

## Lựa chọn triển khai

**Không** mô phỏng / viết lại panel CIT bằng tay nữa. Tài liệu nguồn được ghim:

- CIT-PDF: https://github.com/Cuongyd196/cit-pdf
- Tag: 1.0.0
- Commit bắt buộc: `3c9c138d980a417de7439f383f37882a1d730ab6`
- License: GNU AGPL-3.0-only (cùng giấy phép dự án HVD)
- Dependency gốc: `package-lock.json`, `vendor/bentopdf-pdfium/*.tgz`, `vendor/bentopdf-viewer/*.tgz`.

GitHub Actions tải **đúng commit upstream** bằng git clone và `npm ci`, gọi Vite build nguyên bản với `BASE_URL=/PDF-Editor-Hdv/cit-native/`; **không sửa HTML/CSS/TypeScript/PDFium được biên dịch của CIT**. Phần `cit-native/` sau build chứa toàn bộ bundle frontend (đo được khoảng 176 MB), không phải bản HTML rút gọn. Đầu ra giữ đường dẫn tài nguyên, WASM và ứng dụng Editor của CIT.

Mã nguồn CIT không copy hàng nghìn tệp sang master HVD: chúng được tham chiếu bởi tag+SHA bất biến ở file `CIT-ORIGINAL-FRONTEND.lock.json`, được xây dựng và phân phối bởi workflow `.github/workflows/cit-original-build.yml`. Muốn sửa module CIT cần fork/upstream patch có kiểm thử, cập nhật nguồn và SHA; không chèn sửa minified JS thủ công.

## Cấu trúc website sau khi triển khai thành công

| Đường dẫn | Vai trò |
|---|---|
| `/PDF-Editor-Hdv/` | Trang chủ, toàn bộ công cụ HVD hiện có |
| `/PDF-Editor-Hdv/text-editor.html` | Route chính, tự chuyển vào frontend CIT gốc |
| `/PDF-Editor-Hdv/cit-native/edit-pdf-text.html` | Trang chỉnh sửa Text gốc CIT, HTML/CSS/JS/Viewer/PDFium original |
| `/PDF-Editor-Hdv/cit-native/` | Trọn bộ frontend CIT từ build upstream |
| `/PDF-Editor-Hdv/text-editor-hdv.html` | Bản HVD NativeTextEditor cũ để đối chiếu/khôi phục |

Chỉ sau khi toàn bộ bộ kiểm thử pass, workflow mới thay đổi GitHub Pages thành chế độ GitHub Actions và upload trang HVD cùng bundle CIT trong cùng artifact. Nếu CI thất bại, không triển khai.

## Kiểm tra tương đồng thuật toán và cách sử dụng

- **Tương đồng theo nguồn**: đảm bảo tất cả nguồn frontend CIT được build từ **cùng tag/commit**. Vì bytecode JS/CSS/Viewer/PDFium biên dịch nguyên gốc nên cách chọn đối tượng, điều chỉnh font/màu, spacing, reflow, Undo/Redo và Export là cách triển khai của CIT.
- **Tương đồng theo thao tác**: dùng Playwright/Chromium, mở trang từ route HVD → CIT, nạp PDF thật, tìm `#overlay .para-box`, click để kích hoạt editor `contenteditable`, gõ văn bản thay thế, quan sát `#inspector`, `#fFamily`, `#fSize`, `#fLine`, `#fPara`, `#fSwatches`, `#fAlign`, xuất PDF.
- **Tương đồng theo kết quả**: kiểm tra lại bản PDF xuất bằng **PyMuPDF độc lập**; phải xóa thực sự chuỗi chữ cũ, giữ chuỗi mới có thể trích xuất và giữ dòng lân cận; xác minh số trang và kích thước.
- **Tài nguyên**: kiểm tra trên CI bundle `dist/edit-pdf-text.html`, `assets/*.js` và `*.wasm`, route được đóng đúng base subpath.
- **Bằng chứng**: CI đính kèm screenshot và PDF `source.pdf`/`cit-edited.pdf` trong artifact `cit-original-browser-evidence`.
- **Hồi quy HVD**: giữ CI `pages-smoke.yml` (89 Node tests trước đợt này) và trang chỉnh sửa HVD cũ không xóa.

## Giới hạn đánh giá

Test không chứng minh **mọi** PDF CAD A0/A1, Unicode subset, Type3 glyph hay cấu trúc signed/PDF/A đều sửa được, bởi upstream cũng có giới hạn. Cần kiểm thử thực địa với hồ sơ người dùng đưa lên. Việc nguyên mẫu frontend CIT là tương đồng về thuật toán và cách dùng theo nguồn; không mặc định mọi input kỹ thuật đều thành công. Không được gọi bản website chính đã chuyển sang CIT nếu GitHub Pages deploy chưa báo thành công.

## Khôi phục khi cần

Bản editor HVD trước đây vẫn lưu trong repo tại `text-editor.html` và trong artifact site tại `text-editor-hdv.html`. Nếu CI build/deploy thất bại, Pages không nên đổi route chính. Khi muốn quay lại HVD, sửa `scripts/cit-original/publish_site.py` bỏ phần thay alias hoặc chuyển Pages về nguồn legacy, kiểm thử lại trước khi quảng bá.

## Nghiệm thu và xuất bản thực tế

- Bản chuẩn đã xác nhận qua Chromium (frontend nguyên gốc) và PyMuPDF (PDF thật); 9 bước kiểm tra nguyên lý thao tác và kết quả đầu ra.
- GitHub Actions: https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38744102098 — kết luận **success**, deploy-pages báo **Reported success!**.
- Commit triển khai: `c3cade1d0f42f637e708b982d90ac228ccb3c290`.
- Trang chính: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor.html (đi đến frontend CIT).
- Trình CIT gốc: https://hieudang99dd.github.io/PDF-Editor-Hdv/cit-native/edit-pdf-text.html
- Đường dự phòng HVD: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor-hdv.html
- Chưa dùng được khả năng quan sát trực tiếp từ môi trường trợ lý đối với CDN GitHub Pages; xác minh thực tế nguồn xuất bản thông qua GitHub Pages deployment và browser test đối với chính artifact đã đóng gói.
