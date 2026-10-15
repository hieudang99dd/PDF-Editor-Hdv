# Bộ công cụ CIT trong PDF HDV

Cập nhật 2026-10-15. Nguồn cố định: [CIT-PDF 1.0.0](https://github.com/Cuongyd196/cit-pdf/tree/3c9c138d980a417de7439f383f37882a1d730ab6), kế thừa BentoPDF 2.8.8. Không yêu cầu giữ kín mã nguồn; bản kết hợp tiếp tục theo AGPL-3.0.

## Phạm vi đã tích hợp

Đã đưa **119 công cụ riêng biệt** từ danh mục CIT vào HDV. Các trang và engine chạy cùng website; không chuyển người dùng sang website CIT. [Danh mục đầy đủ](cit-tools-manifest.json) ghi từng mã công cụ, tên, mô tả và nhóm. Các trang nén theo dung lượng cố định có cùng engine cũng được đóng gói, không đếm thành công cụ mới.

| Nhóm | Chức năng có trong bản tích hợp |
|---|---|
| Chỉnh sửa | Chỉnh đoạn chữ nâng cao, annotation, highlight/redaction của viewer, crop, chữ ký vẽ, watermark, header/footer, Bates, tem, màu nền/chữ, tạo và điền form, bookmark, mục lục |
| Quản lý trang | Ghép có bookmark, xen kẽ, sắp bản quét hai mặt, chia/trích/xóa/nhân đôi/đảo trang, xoay tùy ý, trang trắng, N-up, booklet, ghép trang dài, in poster, chồng trang |
| Chuyển đổi sang PDF | Ảnh JPG/PNG/WebP/SVG/BMP/HEIC/TIFF, văn bản/Markdown/JSON, Word/Excel/PowerPoint, định dạng OpenDocument, sách điện tử, email và các định dạng khác trong danh mục |
| Chuyển đổi từ PDF | Ảnh, SVG, TXT, DOCX, XLSX/CSV, Markdown, JSON; trích ảnh, trích bảng; xuất nội dung phục vụ AI/RAG |
| Tối ưu và sửa | Nén bằng các chế độ CIT, sửa tệp, tuyến tính hóa, PDF/A, kích thước trang, rasterize, chỉnh nghiêng scan, chuyển font thành vector |
| Bảo mật | AES-256, gỡ mật khẩu đã biết, quyền PDF, xóa metadata, sanitize, flatten, chữ ký chứng thư, kiểm tra chữ ký và timestamp |
| OCR và quy trình | OCR tạo PDF có lớp chữ và TXT; mô hình Anh/Việt đi kèm; trình xây dựng quy trình xử lý nhiều bước |

Trình chỉnh sửa HDV giữ ô bảng của đợt trước vẫn là công cụ **Chỉnh sửa PDF**. Công cụ **Chỉnh sửa văn bản PDF** của CIT là chế độ nâng cao có dàn lại đoạn và có thể làm thay đổi xuống dòng; giao diện có ghi chú phân biệt hai chế độ.

Đây là tích hợp các engine và luồng xử lý nguyên bản kèm các điều chỉnh bên dưới, không phải tự viết lại mọi thuật toán của CIT. Chưa chứng minh mọi công cụ CIT tốt hơn HDV trong mọi tài liệu.

## Engine và tối ưu

- Tài nguyên chương trình phục vụ tại `cit-tools/`; chỉ nạp khi vào công cụ cần dùng. Trang danh mục không tải sẵn PDF.js/pdf-lib/fontkit của trình chỉnh sửa HDV.
- PDFium/editcore, qpdf, PyMuPDF/Pyodide, Ghostscript, CoherentPDF, wasm-vips, LibreOffice và Tesseract được đóng gói với phiên bản cố định. [ENGINES.lock.json](cit-tools/ENGINES.lock.json) ghi nguồn và integrity của các gói bổ sung.
- Office dùng dữ liệu gốc CIT chia thành phần 4 MiB, kiểm tra SHA-256 từng phần trước khi giải nén. Chỉ tải khi bắt đầu chuyển đổi, khoảng 74 MiB nén lần đầu. Worker riêng và COOP/COEP được kích hoạt bằng service worker trong phạm vi `cit-tools/` để dùng được trên GitHub Pages.
- OCR dùng worker/core tại HDV; mô hình `eng` và `vie` đi kèm. Ngôn ngữ khác tải từ commit cố định của `tesseract-ocr/tessdata_fast`; font đặc thù có thể cần tải từ nguồn Noto do CIT cấu hình. Noto Sans thông dụng dùng tệp của HDV.
- Cache chỉ lưu engine/font/tài nguyên chương trình. Không cache nội dung tài liệu qua service worker. Cache phụ thuộc dung lượng trình duyệt cho phép; lần dùng đầu vẫn cần mạng để lấy engine.
- Bổ sung API byte-array còn thiếu trên Chromium cũ trong cả luồng chính và PDF.js worker; giữ polyfill Map của CIT.
- Đọc PDF hợp lệ trực tiếp; chỉ thử sửa bằng qpdf khi cần, thay vì ghi lại mọi tệp trước khi đọc.
- Sửa đường dẫn Office worker bị lặp và đường dẫn Ghostscript mà PyMuPDF dùng khi chuyển DOCX; các đường dẫn được giải đúng dưới subpath của GitHub Pages.
- Trì hoãn thu hồi Blob URL của các công cụ dùng helper tải xuống và trình sửa chữ CIT. Bộ chọn nơi lưu của trình chỉnh sửa HDV vẫn được giữ.
- Tìm kiếm danh mục hỗ trợ tiếng Việt không dấu. Gỡ luồng nén gọi localhost và QR có URL giả; công cụ chưa có dịch vụ được ghi rõ là chưa hỗ trợ.

## Kiểm chứng

- **62 kiểm thử Node đạt:** lưu tệp, bố cục chữ, native text bằng WASM thật, danh mục/đường dẫn tài nguyên và checksum Office.
- **119/119 trang công cụ mở được** trong Chromium 133 dưới `/PDF-Editor-Hdv/`, không có page error hoặc request lỗi trong lượt kiểm tra.
- Kiểm thử xuất tệp thật: mã hóa AES-256 rồi mở bằng mật khẩu, đảo trang, xóa metadata, PDF→TXT, nén, PDF→DOCX, trích bảng sang XLSX (có dữ liệu ROAD), PDF→TIFF, OCR Anh+Việt thêm lớp chữ đọc lại được, DOCX→PDF đọc lại được nội dung.
- Kiểm thử hồi quy trình chỉnh sửa HDV: hủy, không sửa, chống tràn, thu nhỏ, tiếng Việt, undo/redo, tải PDF, xoay trang và về trang chủ đều đạt.

Lệnh kiểm tra:

```bash
node --test tests/*.test.cjs
PDF_EDITOR_CHROMIUM=/path/to/chromium node tests/text-editor-browser.cjs
CIT_FULL_SMOKE=1 CIT_ENGINES=1 CIT_OFFICE=1 CIT_OCR=1 \
  PDF_EDITOR_CHROMIUM=/path/to/chromium node tests/cit-tools-browser.cjs
```

Bài kiểm thử trình duyệt cần Playwright; các tệp mẫu được tạo tại thư mục tạm, không lấy tài liệu riêng của người dùng. Kiểm thử mở giao diện không tương đương kiểm thử toàn bộ định dạng và mọi tùy chọn của cả 119 công cụ.

## Mã nguồn và tái build mô-đun

Host HDV tiếp tục là web tĩnh vanilla, không cần npm/build để phục vụ. Bản web CIT đã được build sẵn. Nguồn tương ứng của mô-đun trình duyệt, các thay đổi HDV, cấu hình và lockfile nằm trong [cit-tools-source-1.0.0.tar.gz](vendor/cit-tools-source-1.0.0.tar.gz). Các script tích hợp host, service worker, manifest, bài kiểm thử và script đóng gói nằm trực tiếp trong repo.

Để tái build bằng Node 22.12+/24:

```bash
mkdir -p /tmp/hdv-cit-rebuild
tar -xzf vendor/cit-tools-source-1.0.0.tar.gz -C /tmp/hdv-cit-rebuild
cd /tmp/hdv-cit-rebuild/cit-pdf
npm ci --ignore-scripts --no-audit --no-fund
SIMPLE_MODE=true VITE_DEFAULT_LANGUAGE=vi VITE_BRAND_NAME='PDF HDV' \
  VITE_FOOTER_TEXT='Kế thừa CIT-PDF / BentoPDF · AGPL-3.0' BASE_URL=./ \
  NODE_OPTIONS=--max-old-space-size=6144 npx vite build --config hdv.vite.config.mjs
# Chạy từ repo HDV:
python scripts/package-cit-tools.py /tmp/hdv-cit-rebuild/cit-pdf
```

Engine trong `cit-tools/engines/` là tài nguyên đã được quản lý phiên bản trong repo và được giữ khi tái đóng gói. Hai gzip Office lớn không lặp trong archive nguồn; chúng có thể ghép lại theo manifest từng phần nếu cần. Các runtime C++/WASM được dùng nguyên bản, không phải được HDV tự biên dịch lại. Xem [NOTICE.md](NOTICE.md) và [giấy phép phụ thuộc](cit-tools/THIRD-PARTY-LICENSES.txt).

## Giới hạn rõ ràng

- Tính năng Electron, Open-with từ hệ điều hành và trình quản lý cài đặt desktop không áp dụng cho bản web. Chia sẻ tệp bằng đường dẫn công khai, mời người khác ký và tác vụ LLM chưa có dịch vụ tương ứng; không tạo kết quả giả.
- Office cần trình duyệt hỗ trợ service worker/SharedArrayBuffer và bộ nhớ đủ lớn; ưu tiên Chrome/Edge trên máy tính. Trình duyệt chặn service worker không dùng được engine Office tại GitHub Pages.
- Chữ ký số/timestamp cần chứng thư và/hoặc TSA phù hợp. Công cụ timestamp có yêu cầu mạng riêng, được ghi chú trong giao diện. Kiểm tra chữ ký không thay thế việc xác minh chuỗi tin cậy trong môi trường nghiệp vụ.
- Chưa kiểm thử tất cả định dạng Office/sách/email, tài liệu ký số, PDF/A, CAD nhiều lớp, PDF/UA, font hiếm hoặc PDF hàng trăm MB. Không bảo đảm chuyển PDF sang Word/Excel tái dựng hoàn toàn cấu trúc gốc; scan cần OCR trước khi trích chữ/bảng.
- Chỉnh sửa chữ không phải redaction an toàn. Chưa kiểm chứng redaction của viewer trên toàn bộ trường hợp, revision cũ, attachment hoặc hidden objects; phải kiểm tra độc lập trước khi dùng cho tài liệu nhạy cảm.
