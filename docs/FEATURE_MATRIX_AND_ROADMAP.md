# Ma Trận Tính Năng, Tiến Độ Thực Thi & Kế Hoạch Dọn Dẹp (Tài Liệu Tổng Hợp Nhóm 2)

*Tài liệu này tổng hợp và cập nhật toàn bộ nội dung từ 2 tệp theo dõi tiến độ trước đây (`CIT-FEATURE-PORTING-MATRIX.md` và `IMPLEMENTATION_PROGRESS.md`), đồng thời bổ sung danh mục các thuật toán mới được tối ưu hóa và danh sách tệp rác cần dọn dẹp.*

## 1. Ma Trận Chuyển Đổi & Hoàn Thiện Tính Năng (Feature Porting Matrix)

| Nhóm công cụ | Tên tính năng | Môi trường chạy | Trạng thái tích hợp | Mô-đun đảm nhiệm |
| :--- | :--- | :--- | :--- | :--- |
| **Chỉnh sửa Văn bản** | Sửa văn bản PDF gốc (Native Stream Edit) | Trình duyệt (WASM) | **Hoàn thành (Native CIT)** | `vendor/cit-pdf/`, `pdf-native-text.mjs` |
| **Chỉnh sửa Văn bản** | Sửa & Thay thế hàng loạt (Batch Text Edit) | Trình duyệt (WASM) | **Hoàn thành (HDV + CIT)** | `pdf-batch-text.js`, `pdf-text-layout.js` |
| **Chỉnh sửa Văn bản** | Bảo vệ phông chữ Type3 & Chữ ký số `/ByteRange` | Trình duyệt (WASM) | **Hoàn thành (Native CIT)** | `type3surgery.js`, `pdf-native-worker.mjs` |
| **Bố cục & Trang** | Ghép (Merge), Tách (Split), Trích xuất trang | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js`, `index.html` |
| **Bố cục & Trang** | Đảo thứ tự, Lọc trang chẵn/lẻ, Xóa trang | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Bố cục & Trang** | Ghép xen kẽ 2 mặt quét (Duplex Interleave) | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Kỹ thuật & In ấn** | Dàn trang N-Up (2/4/6/8 trang trên 1 tờ) | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Kỹ thuật & In ấn** | Đóng quyển Booklet (Saddle-Stitch Imposition) | Trình duyệt (`pdf-lib`) | **Mới bổ sung (v3.0)** | `cit-advanced-core.js` |
| **Kỹ thuật & In ấn** | Đánh số hồ sơ Bates Numbering & Watermark | Trình duyệt (`pdf-lib`) | **Hoàn thành (Nâng cấp Unicode)** | `cit-advanced-core.js` |
| **Kỹ thuật & In ấn** | So sánh chồng lớp bản vẽ (CAD Overlay Diff) | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Kỹ thuật & In ấn** | Xoay góc thập phân tự do (Deskew) & Cắt lề | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Bảo mật & Metadata** | Kiểm tra chữ ký số, Xóa Metadata & Chú thích | Trình duyệt (`pdf-lib`) | **Hoàn thành** | `cit-advanced-core.js` |
| **Chuyển đổi & OCR** | Chuyển đổi Office (`.docx`, `.xlsx`, `.pptx`) sang PDF | Local Engine (`soffice`) | **Hoàn thành (Cô lập Profile)** | `backend/main.py`, `pdf-local-tools.js` |
| **Chuyển đổi & OCR** | Chuyển đổi PDF sang Word (`.docx`) giữ bố cục | Local Engine (`PyMuPDF`) | **Đã tối ưu (Giữ bảng/ảnh/style)** | `backend/main.py` (`_pdf_to_docx`) |
| **Chuyển đổi & OCR** | Nhận dạng chữ OCR Tiếng Việt & Tiếng Anh | Local Engine (`Tesseract`) | **Đã tối ưu (Giữ nguyên Vector CAD)** | `backend/main.py` (`_ocr_pdf`) |
| **Chuyển đổi & OCR** | Xuất ảnh TIFF đa trang cho lưu trữ công nghiệp | Local Engine (`Pillow`) | **Đã tối ưu (Streaming tiết kiệm RAM)** | `backend/main.py` (`_pdf_to_tiff`) |
| **Tối ưu Dung lượng** | Nén PDF đa tầng (Downsample ảnh + Deflate) | Hybrid (Local + Browser) | **Đã tối ưu (Nén ảnh Lossy + Lossless)** | `backend/main.py` (`_compress_pdf`) |

## 2. Chi Tiết Các Thuật Toán Đã Được Tối Ưu Hóa Trong Phiên Bản Nâng Cấp

### A. Tái tạo tài liệu Word giữ nguyên bố cục (`_pdf_to_docx` trong `backend/main.py`)
* **Hạn chế cũ**: Chỉ gọi `page.get_text("blocks")` để lấy chuỗi ký tự thô đưa vào `python-docx`, làm mất toàn bộ bảng biểu, hình ảnh, cỡ chữ, in đậm/in nghiêng và căn lề.
* **Giải pháp mới**:
  * Tự động ưu tiên engine `pdf2docx` nếu môi trường đã cài đặt để tái tạo chuẩn xác cấu trúc cột và bảng phức tạp.
  * Nâng cấp toàn diện thuật toán nội tại bằng `page.find_tables()` của PyMuPDF kết hợp phân tích cấu trúc `page.get_text("dict")` để dựng lại bảng biểu thực sự trong Word, trích xuất hình ảnh nhúng đúng tỷ lệ và giữ nguyên cỡ chữ, màu sắc RGB, kiểu in đậm/nghiêng cũng như căn lề (trái, giữa, phải) của từng đoạn văn.

### B. Nhận dạng OCR bảo toàn đường nét Vector (`_ocr_pdf` trong `backend/main.py`)
* **Hạn chế cũ**: Biến toàn bộ trang PDF thành ảnh phẳng (rasterize 180 DPI) rồi mới nhờ Tesseract xuất lại PDF, khiến các bản vẽ kỹ thuật CAD/Civil 3D bị vỡ nét khi phóng to và làm tăng dung lượng tệp.
* **Giải pháp mới**:
  * Bổ sung chế độ **Vector-Preserving OCR (`preserve_vectors=True`)**: Chỉ kết xuất ảnh xám tạm thời trong RAM để lấy tọa độ từ (`pytesseract.image_to_data`), sau đó chèn trực tiếp lớp văn bản vô hình (`render_mode=3`) vào đúng tọa độ tương ứng trên trang PDF gốc. Nhờ đó, người dùng vừa bôi đen/tìm kiếm được chữ tiếng Việt trên vùng ảnh quét, vừa giữ nguyên 100% độ sắc nét vector của bản vẽ.
  * Xử lý song song nhiều trang qua `ThreadPoolExecutor` giúp tăng tốc độ OCR lên gấp 2–4 lần trên CPU đa nhân.

### C. Nén PDF đa tầng có kiểm soát chất lượng ảnh (`_compress_pdf` trong `backend/main.py`)
* **Hạn chế cũ**: Chỉ gọi `doc.tobytes(garbage=4, deflate=True)`, không can thiệp vào các ảnh chụp/quét độ phân giải quá cao bên trong tệp PDF nên tỷ lệ giảm dung lượng rất thấp đối với tài liệu scan.
* **Giải pháp mới**:
  * Quét danh sách XObject hình ảnh trên từng trang, tự động thu nhỏ độ phân giải (`LANCZOS` downsampling) và tái mã hóa JPEG theo 4 cấu hình (`screen`: 72 DPI / Q50, `ebook`: 150 DPI / Q75, `printer`: 220 DPI / Q85, `lossless`: chỉ nén luồng dữ liệu).
  * Chỉ ghi đè luồng ảnh (`doc.update_stream`) khi dung lượng ảnh sau xử lý nhỏ hơn ảnh gốc tối thiểu 5%, đồng thời kiểm tra chữ ký số `/ByteRange` trước khi nén để bảo vệ tính toàn vẹn pháp lý.

### D. Xuất TIFF đa trang theo luồng (`_pdf_to_tiff` trong `backend/main.py`)
* **Hạn chế cũ**: Kết xuất toàn bộ các trang thành đối tượng `PIL.Image` lưu cùng lúc trong một danh sách trên RAM trước khi ghi tệp, dễ gây tràn bộ nhớ với tài liệu khổ lớn.
* **Giải pháp mới**: Sử dụng hàm sinh (`generator` `_iter_rendered_pages`) để chỉ kết xuất từng trang khi bộ ghi `PIL` yêu cầu (`append_images=frame_generator`) và giải phóng `fitz.Pixmap` ngay lập tức, cho phép nâng giới hạn an toàn từ 60 trang lên **150 trang**.

## 3. Danh Mục Dữ Liệu Thừa & Tệp Rời Rạc Đã Được Dọn Dẹp

| Nhóm dữ liệu dọn dẹp | Danh sách tệp cụ thể | Hành động xử lý |
| :--- | :--- | :--- |
| **Tệp script vá lỗi tạm (`scratch/`)** | 19 tệp: `patch.js`, `patch.ps1`, `patch_bindevents.ps1`, `patch_css.ps1`, `patch_css_empty.ps1`, `patch_events.ps1`, `patch_focus.ps1`, `patch_grid.ps1`, `patch_grid_fix.ps1`, `patch_handleImages.js`, `patch_insert.js`, `patch_layout.ps1`, `patch_p33.js`, `patch_renderThumb.js`, `patch_roadmap.ps1`, `patch_roadmap2.js`, `patch_save.js`, `patch_thumbsize.ps1`, `patch_zoom.ps1` | Xóa hoàn toàn thư mục `scratch/` và chặn tái xuất hiện trong `.gitignore` |
| **Tệp chạy thử Playwright ở thư mục gốc** | `debug_run.py`, `debug_run2.py` | Xóa khỏi thư mục gốc và thêm quy tắc `debug_run*.py` vào `.gitignore` |
| **Tệp tài liệu `.md` rời rạc ở thư mục gốc** | `CIT-INTEGRATION.md`, `CIT-ORIGINAL-FRONTEND.md`, `CIT-TEXT-EDITING-UPDATE.md`, `CIT-TEXT-WORKSPACE.md`, `CIT-ADVANCED-INTEGRATION.md`, `CIT-FEATURE-PORTING-MATRIX.md`, `IMPLEMENTATION_PROGRESS.md`, `backend/README.md` | Hợp nhất toàn bộ nội dung vào `README.md`, `docs/ARCHITECTURE_AND_CIT_INTEGRATION.md` và `docs/FEATURE_MATRIX_AND_ROADMAP.md`, sau đó xóa các tệp lẻ |
