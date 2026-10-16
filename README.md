# PDF HVD — PDF Editor

Bộ công cụ PDF HVD: sửa văn bản gốc, biên tập trang, chuyển đổi, kiểm tra chất lượng PDF và một số tác vụ Office/OCR qua engine PC tùy chọn. Trang chính triển khai bằng GitHub Pages, dữ liệu PDF trên các công cụ browser không tự tải lên dịch vụ cloud.

**Truy cập:** https://hieudang99dd.github.io/PDF-Editor-Hdv/

## Luồng chức năng

| Luồng | Đường dẫn chạy | Thành phần chính |
| --- | --- | --- |
| Trang chủ/các công cụ browser | `index.html` | `hvd-ui-v2.js/css`, `pdf-local-tools.js`, `cit-advanced-core.js`, `cit-advanced-ui.js` |
| Chỉnh sửa text chuyên sâu | `text-editor.html` → `studio/edit-pdf-text.html` | Frontend Vite đã biên dịch, PDFium WASM và worker upstream |
| Trình sửa PDF HVD dự phòng | `text-editor-hdv.html` | `organizer.js/css`, `text-editor-shell.js/css`, `pdf-native-*.mjs`, `pdf-text-layout.js` |
| Kiểm tra chất lượng PDF | `pdfium-preflight.html` | `pdfium-preflight-core.mjs`, `pdfium-preflight-worker.mjs` |
| Xử lý Office/OCR bằng PC | `backend/` | FastAPI localhost; chỉ cần chạy cho các thao tác có ghi chú cần PC |

**Không gộp cưỡng bức** core, UI adapter, worker, font, WASM hoặc các JavaScript chunk chỉ vì chúng có tên gần giống nhau: các thành phần có runtime và vòng đời riêng. `studio/` là **artifact của bản build đầy đủ**, không phải tệp rác. Tham chiếu mã nguồn ngoài, font và thông báo bản quyền nằm trong `NOTICE.md` và `LICENSE`.

## Tài liệu đã chuẩn hóa

- [Sửa Text PDF / Native engine](docs/TEXT_ENGINE.md) — các giai đoạn hoàn thiện engine, giới hạn hình học, Undo/Redo.
- [Frontend, nhận diện, build/deploy](docs/STUDIO_DEPLOYMENT.md) — frontend upstream được ghim, luồng tái dựng, branding HDV.
- [Thuật toán xử lý PDF và kiểm định](docs/PROCESSING_AND_QA.md) — chức năng nâng cao, PDFium preflight.
- [Kiểm kê tính năng gốc](CIT-FEATURE-PORTING-MATRIX.md) — bảng đối chiếu lịch sử, không phải cam kết tính năng đã hoạt động.
- [Tiến độ và thay đổi](IMPLEMENTATION_PROGRESS.md).
- [Sổ tay cấu trúc và chính sách dọn dẹp](docs/REPOSITORY_MAP.md).
- [Đặc tả UX: Làm mới, Tệp khác, Back/Forward, Tải xuống không thoát tác vụ](docs/UX_WORKFLOW.md).
- [Xóa vector theo vùng bằng PDFium: thuật toán, giao diện, giới hạn và kiểm thử](docs/REGION_ERASER.md).
- [Thông tin nguồn/giấy phép](NOTICE.md).
- [Engine Office/OCR cục bộ](backend/README.md).

## Kiểm thử

```bash
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_brand_site.py' -v
```

Bài test browser end-to-end và build frontend CIT yêu cầu dependencies được mô tả tại `.github/workflows/`. Mỗi thay đổi phải chạy `.github/workflows/pages-smoke.yml`; thay đổi Studio/upstream cần thêm build và browser QA tương ứng.

## Quy tắc phát triển

- Ưu tiên bảo toàn tính năng sửa text gốc, glyph Unicode, giới hạn bảng, baseline, trang xoay và lịch sử Undo/Redo.
- UI/UX tiếng Việt, chỉ hiện công cụ có route thật, không tuyên bố tính năng vượt mức đã kiểm chứng.
- Dọn bản vá thử nghiệm khỏi nhánh phát hành; sử dụng `tests/` và workflow CI để tái hiện lỗi.
- Không xóa các tệp `LICENSE`, `NOTICE.md`, thư mục `vendor/`, font, `studio/assets/` hoặc cấu hình deploy chỉ dựa trên tên file.
- Nếu cần quay lại trước đợt dọn dẹp, sử dụng lịch sử Git của repository.
