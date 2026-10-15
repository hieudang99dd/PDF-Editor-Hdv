# PDF HDV — Integration Progress

## 2026-10-15: CIT-PDF 1.0.0 → PDF HDV

Nguồn: Cuongyd196/cit-pdf, tag 1.0.0, commit 3c9c138d980a417de7439f383f37882a1d730ab6. Repo đích: hieudang99dd/PDF-Editor-Hdv, nhánh master.

### Đã có trước đợt này

- Sửa lỗi lưu/tải PDF: 606e519.
- Native text CIT: f1cc44a, c1599ec. PDFium WASM, font/baseline, table bounds, rotation, worker/undo, kiểm thử JS. Xem CIT-INTEGRATION.md.
- Các công cụ cơ bản trong trình duyệt: ghép, tách, xoay, ảnh JPG/PNG, chữ ký, watermark, đánh số trang (tùy công cụ).

### Thực hiện trong đợt tiếp tục

- backend/main.py: FastAPI localhost, API capabilities, PDF → TXT/DOCX/TIFF, Office → PDF, OCR tiếng Việt/Anh → TXT/PDF có chữ, nén không làm tăng file. Giới hạn input/trang, hạn chế CORS, xóa thư mục tạm.
- pdf-local-tools.js: kết nối giao diện với engine localhost, thông báo lỗi và download thật, thêm TXT/TIFF.
- index.html: nạp module cục bộ, sửa nhãn, giải thích khác biệt browser/localhost.
- tests/test_local_backend.py: 9 bài test Python đã đạt gồm DOCX → PDF thật. tests/local-bridge.test.cjs: 3 bài test JavaScript đã đạt, kiểm chứng route, request và download. OCR tiếng Anh đã kiểm chứng thực tế trả TXT/PDF tìm kiếm được.
- backend/README.md: cách chạy, API, giới hạn.
- Commits: 6296d35, e53fa29, 1a8835f, 57c1c98, fb9cb3a (và tài liệu tiếp theo).

### Chưa hoàn thành / kế tiếp

1. Test browser + localhost trên Windows Chrome, kiểm tra CORS / Local Network Access, vòng đời download và file URI.
2. So sánh PDF CAD nhiều trang, tiếng Việt, bảng/trắc dọc; tách chế độ giữ vector và raster.
3. Office conversion fidelity: bảng, ảnh, columns, định dạng Word/Excel/PPT. DOCX từ PDF hiện ưu tiên editable text.
4. Các module CIT có engine thật phù hợp HDV: bảo mật qpdf, flatten annotations, sửa form, crop, redaction thật, kiểm tra PDF/A, batch.
5. Kiểm tra giấy phép AGPL-3.0, mã nguồn/phiên bản và tests cho từng module trước khi gắn nhãn hoạt động; chưa hoàn thành 119 công cụ.
6. Mỗi vòng sửa code: test Python/Node, smoke browser, ghi commit, cập nhật tài liệu tiến độ.

### Ranh giới kỹ thuật

GitHub Pages chỉ chạy frontend tĩnh. Office/Tesseract/LibreOffice chạy native nên phải có backend localhost (hoặc máy chủ riêng). Nếu triển khai cloud, cần thiết kế xác thực, cách ly, hàng đợi, giới hạn CPU/tệp và chính sách dữ liệu. Không tự kích hoạt tải lên cloud.
