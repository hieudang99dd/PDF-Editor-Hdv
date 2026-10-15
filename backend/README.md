# PDF HDV Local Engine – Office, OCR và chuyển đổi PDF

Engine **Office/OCR/TIFF** chạy trên máy của người dùng, không phải GitHub Pages. Riêng **Nén PDF** và **PDF → TXT** có nhánh chạy trực tiếp trong trình duyệt không yêu cầu cài backend. PDF sửa chữ gốc vẫn xử lý ngay trong trình duyệt theo CIT-INTEGRATION.md. Các công cụ chuyển đổi nặng chỉ gửi file đến **http://localhost:8000** trên máy chạy backend; không có endpoint upload tài liệu lên dịch vụ ngoài.

## Yêu cầu

- Python 3.10+ và các thư viện trong backend/requirements.txt.
- LibreOffice (lệnh soffice trong PATH): DOC/DOCX/XLS/XLSX/PPT/PPTX/ODT/ODS/ODP → PDF.
- Tesseract OCR: kiểm tra tesseract --list-langs; cài dữ liệu vie và eng để chọn tiếng Việt + tiếng Anh.
- Trình duyệt hiện đại hỗ trợ fetch + FormData. GitHub Pages có thể cần cấp quyền truy cập local network; nếu bị chặn, mở giao diện bằng HTTP local.

## Chạy

    cd backend
    python -m pip install -r requirements.txt
    uvicorn main:app --host 127.0.0.1 --port 8000

Thử http://localhost:8000/api/capabilities. Mở https://hieudang99dd.github.io/PDF-Editor-Hdv/ hoặc chạy giao diện trên cùng PC bằng một terminal khác tại thư mục gốc:

    python -m http.server 5500 --bind 127.0.0.1

Mở http://127.0.0.1:5500/. Dừng backend khi không cần. Không xuất bản cổng 8000 ra Internet.

## API thực thi

| API | Chức năng | Output |
|---|---|---|
| GET /api/capabilities | kiểm tra LibreOffice, ngôn ngữ Tesseract | JSON |
| POST /api/convert (file, target=txt/docx/tiff) | PDF → TXT/DOCX/TIFF | attachment |
| POST /api/convert (target=pdf) | tài liệu Office → PDF qua LibreOffice | PDF |
| POST /api/ocr (file, language=vie+eng, target=txt/pdf) | OCR PDF quét | TXT hoặc PDF có text layer |
| POST /compress (file, level) | tối ưu cấu trúc PDF không phá đồ họa vector | PDF |

Giới hạn 50 MB mỗi lần tải, 300 trang PDF; riêng OCR và TIFF giới hạn 60 trang để tránh hao tài nguyên. Đầu ra trả từ bộ nhớ, các tệp tạm Office được xóa sau khi chuyển đổi.

## Giới hạn kỹ thuật

- **PDF → DOCX**: văn bản có thể chỉnh sửa; chưa tái dựng bảng/ảnh/cột/kiểu chữ gốc chuẩn xác.
- **PDF → TXT**: chỉ lấy text layer, PDF ảnh phải OCR.
- **OCR → PDF**: render từng trang thành ảnh 180 DPI rồi thêm lớp chữ; không giữ nguyên vector của PDF đầu vào. Dùng OCR → TXT hoặc giữ PDF gốc nếu cần hình học chính xác.
- **Nén**: tối ưu đối tượng/stream không mất chất lượng; nếu tăng dung lượng, trả lại bản gốc. Chưa có chế độ nén ảnh JPEG mất dữ liệu riêng.
- **Office → PDF**: phụ thuộc LibreOffice, không khẳng định tương đương tuyệt đối với MS Office.
- Công cụ chưa có engine thực tế vẫn ghi Sắp ra mắt, không xuất file giả.

## Test

    python -m pip install pytest httpx
    python -m pytest -q tests/test_local_backend.py
    node --test tests/*.test.cjs

9 kiểm thử Python đã chạy thành công trong môi trường phát triển 2026-10-15. Chưa có kiểm thử browser end-to-end trên Windows/Chrome với GitHub Pages và quyền local-network.

Đây là bước phát triển bổ sung vào HDV sau khi tham khảo CIT-PDF v1.0.0; không khẳng định chuyển toàn bộ 119 công cụ thành mã thực thi.
