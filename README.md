# PDF Editor HDV — Bộ Công Cụ Xử Lý PDF & Hồ Sơ Kỹ Thuật Đa Năng

**PDF Editor HDV** ([hieudang99dd/PDF-Editor-Hdv](https://github.com/hieudang99dd/PDF-Editor-Hdv)) là nền tảng chỉnh sửa, tối ưu hóa và chuyển đổi tài liệu PDF theo kiến trúc **Hybrid Client-Side + Local Engine**, được phát hành dưới giấy phép **GNU AGPL-3.0**. Hệ thống kết hợp sức mạnh của **PDFium WebAssembly** (từ nhánh [Cuongyd196/cit-pdf](https://github.com/Cuongyd196/cit-pdf) / BentoPDF v1.0.0) chạy trực tiếp trên trình duyệt cùng **Python FastAPI Local Engine** chạy cục bộ tại máy người dùng (`127.0.0.1:8000`), đảm bảo 100% tài liệu nhạy cảm và bản vẽ kỹ thuật không bao giờ rời khỏi thiết bị.

## Kiến Trúc Tổng Quan & Cấu Trúc Thư Mục (Đã Chuẩn Hóa)

Sau khi dọn dẹp các tệp tạm (`scratch/`, `debug_run*.py`) và hợp nhất 8 tệp Markdown rời rạc thành 3 tài liệu chuẩn theo nhóm, cấu trúc kho lưu trữ được tổ chức tinh gọn như sau:

| Đường dẫn | Phân loại | Vai trò trong hệ thống |
| :--- | :--- | :--- |
| `index.html` | Giao diện chính (SPA v3) | Bảng điều khiển hiện đại tích hợp tìm kiếm nhanh, kéo-thả tệp, giám sát trạng thái Local Engine thời gian thực và chuyển đổi giao diện Sáng/Tối |
| `text-editor.html` | Không gian Native Text | Giao diện chuyên sâu để chỉnh sửa trực tiếp đối tượng chữ gốc trên trang PDF qua PDFium WASM |
| `studio/` | CIT-PDF Static Build | Bản build nguyên bản từ upstream `cit-pdf` v1.0.0 (`Vite 8` + `TypeScript` + `bentopdf-viewer`) |
| `vendor/cit-pdf/` | Core Engine & WASM | Chứa runtime `bentopdf-pdfium` (WASM) và các mô-đun can thiệp stream (`streamsplice.js`, `type3surgery.js`, `shadingsurgery.js`) |
| `pdf-native-*.mjs` | Lớp Adapter HDV | Cầu nối điều phối Web Worker, khóa đường cơ sở (baseline pinning), bảo toàn khung bảng và Undo/Redo nguyên tử |
| `cit-advanced-core.js` | Thuật toán Cấp Trang | Bộ 16+ thuật toán xử lý cấu trúc trang PDF (`pdf-lib`): N-up, Booklet, Bates Numbering, Interleave, Auto-Deskew, Overlay CAD |
| `pdf-local-tools.js` | Cầu nối Local Engine | Quản lý kết nối HTTP, tự động kiểm tra `/api/capabilities`, kết nối lại thông minh và chuyển đổi dự phòng (Fallback) khi offline |
| `backend/` | Python Local Engine | Máy chủ FastAPI xử lý chuyển đổi Office (`soffice`), OCR giữ nguyên vector (`pytesseract`), xuất TIFF phân trang và nén PDF đa tầng |
| `docs/` | Tài liệu Kỹ thuật | Chứa `ARCHITECTURE_AND_CIT_INTEGRATION.md` và `FEATURE_MATRIX_AND_ROADMAP.md` (hợp nhất từ các tệp `.md` riêng lẻ) |
| `scripts/cleanup_repo.sh` | Kịch bản Dọn dẹp | Tự động xóa `scratch/`, `debug_run.py`, `debug_run2.py`, các tệp `.md` cũ trùng lặp và di chuyển thư viện rời về đúng cấu trúc |
| `tests/` | Kiểm thử Tự động | Bộ kiểm thử đơn vị & tích hợp với Node.js (`*.test.cjs`) và Pytest (`test_local_backend.py`) |

## Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Chạy Trực Tiếp Giao Diện Web (Client-Side Mode)

Các công cụ chỉnh sửa văn bản gốc (Native Text), ghép/tách trang, xoay tự do, N-up, đóng dấu Bates, so sánh bản vẽ Overlay và nén cấu trúc stream hoạt động hoàn toàn trên trình duyệt mà không cần cài đặt backend:

```bash
# Phục vụ tĩnh thư mục gốc bằng Python hoặc npx serve
python3 -m http.server 5500
# Mở trình duyệt tại: http://localhost:5500
```

### Cách 2: Khởi Chạy Đầy Đủ Với Local Engine (Hỗ Trợ Office, OCR Tiếng Việt & Nén Sâu)

Để mở khóa toàn bộ tính năng chuyển đổi Word/Excel/PowerPoint sang PDF, chuyển đổi PDF sang DOCX giữ bố cục, xuất ảnh TIFF đa trang và OCR giữ nguyên nét vẽ vector CAD:

#### Yêu cầu hệ thống
* **Python**: Phiên bản 3.10 trở lên
* **LibreOffice**: Đã cài đặt và có lệnh `soffice` trong biến môi trường `PATH`
* **Tesseract OCR**: Đã cài đặt `tesseract` kèm gói ngôn ngữ Tiếng Việt (`vie`) và Tiếng Anh (`eng`)

#### Khởi chạy bằng Python Virtual Environment
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Trên Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Khởi chạy nhanh bằng Docker (Khuyên dùng — Không cần cài thủ công LibreOffice/Tesseract)
```bash
docker compose up --build -d
# Backend sẵn sàng tại http://127.0.0.1:8000/api/capabilities
```

## Đặc Tả API Local Engine (`127.0.0.1:8000`)

| Endpoint | Phương thức | Tham số chính | Mô tả thuật toán đã tối ưu |
| :--- | :--- | :--- | :--- |
| `/api/capabilities` | `GET` | Không có | Trả về trạng thái sẵn sàng của LibreOffice, danh sách ngôn ngữ OCR, giới hạn dung lượng (50MB) và giới hạn trang |
| `/api/convert` | `POST` | `file`, `target` (`pdf`, `docx`, `txt`, `tiff`), `dpi` | Chuyển đổi Office sang PDF với profile cô lập; chuyển PDF sang DOCX bảo toàn bảng biểu/định dạng; xuất TIFF bằng bộ sinh (generator) tiết kiệm RAM |
| `/api/ocr` | `POST` | `file`, `lang` (`vie+eng`), `output` (`pdf`, `txt`), `preserve_vectors` (`true`) | Nhận dạng chữ viết song song đa luồng; chèn lớp chữ vô hình (`render_mode=3`) trực tiếp lên trang PDF gốc để giữ độ sắc nét 100% cho bản vẽ vector/CAD |
| `/api/compress` | `POST` | `file`, `level` (`screen`, `ebook`, `printer`, `lossless`), `preserve_signatures` | Kiểm tra chữ ký số `/ByteRange`; tự động thu nhỏ độ phân giải ảnh raster quá khổ (`LANCZOS`) kết hợp nén cấu trúc `deflate` và tự động giữ bản nhỏ nhất |

## Hướng Dẫn Dọn Dẹp Kho Lưu Trữ (Repository Cleanup)

Để loại bỏ toàn bộ 19 tệp vá lỗi nháp trong `scratch/`, 2 tệp `debug_run*.py` và 7 tệp `.md` rời rạc ở thư mục gốc sau khi đã gom nhóm, chạy kịch bản tự động:

```bash
chmod +x scripts/cleanup_repo.sh
./scripts/cleanup_repo.sh
```

## Giấy Phép & Ghi Công

Dự án được phân phối theo giấy phép **GNU Affero General Public License v3.0 (AGPL-3.0)**. Lõi chỉnh sửa văn bản PDFium WASM dựa trên công trình mã nguồn mở của dự án **BentoPDF** và nhánh phát triển [Cuongyd196/cit-pdf](https://github.com/Cuongyd196/cit-pdf) (v1.0.0). Xem chi tiết tại tệp `NOTICE.md` và `docs/ARCHITECTURE_AND_CIT_INTEGRATION.md`.
