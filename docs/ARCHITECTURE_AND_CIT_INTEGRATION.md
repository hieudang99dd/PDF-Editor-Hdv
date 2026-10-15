# Kiến Trúc Hệ Thống & Tích Hợp CIT-PDF (Tài Liệu Tổng Hợp Nhóm 1)

*Tài liệu này tổng hợp và chuẩn hóa nội dung từ 5 tệp tài liệu kiến trúc riêng lẻ trước đây: `CIT-INTEGRATION.md`, `CIT-ORIGINAL-FRONTEND.md`, `CIT-TEXT-EDITING-UPDATE.md`, `CIT-TEXT-WORKSPACE.md`, và `CIT-ADVANCED-INTEGRATION.md`.*

## 1. Chiến Lược Tích Hợp Lõi CIT-PDF & BentoPDF Upstream

Dự án **PDF Editor HDV** tích hợp lõi chỉnh sửa văn bản PDF nguyên bản từ bản phát hành tĩnh [Cuongyd196/cit-pdf](https://github.com/Cuongyd196/cit-pdf) (tag `1.0.0`, commit `3c9c138d980a417de7439f383f37882a1d730ab6`, kế thừa từ `BentoPDF` theo giấy phép `AGPL-3.0-only`).

### Cơ chế đóng gói hai tầng
* **Tầng Vendored Runtime (`vendor/cit-pdf/`)**: Giữ nguyên bản biên dịch nhị phân WebAssembly `bentopdf-pdfium` (SHA-256: `1860f0b33a1c7d231b78fa9bfedace19739f06e80b1d5f654dd2ea77a7a893ce`) và các mô-đun phẫu thuật luồng dữ liệu gốc trong `vendor/cit-pdf/editcore/` (`core.js`, `streamsplice.js`, `type3surgery.js`, `shadingsurgery.js`). Thiết kế này giúp dự án không cần biên dịch lại mã C++ phức tạp mà vẫn đạt độ chính xác tuyệt đối khi can thiệp cấu trúc PDF.
* **Tầng Nguyên Khối Studio (`studio/`)**: Quy trình CI/CD tại `.github/workflows/cit-original-build.yml` tự động lấy đúng mã nguồn commit upstream, thực thi `vite build` (Vite 8 + TypeScript) với đường dẫn cơ sở `BASE_URL=/PDF-Editor-Hdv/studio/` và gắn cầu nối điều hướng về giao diện chính của HDV.

| Thuộc tính cấu hình | Giá trị khóa trong `CIT-ORIGINAL-FRONTEND.lock.json` |
| :--- | :--- |
| **Upstream Repository** | `https://github.com/Cuongyd196/cit-pdf` |
| **Upstream Tag & Commit** | `1.0.0` (`3c9c138d980a417de7439f383f37882a1d730ab6`) |
| **Frontend Stack** | Vite 8, TypeScript, CIT PDFium WASM, `bentopdf-viewer` |
| **Điểm vào Native Text** | `studio/edit-pdf-text.html` (Alias công khai: `text-editor.html`) |
| **Trình sửa dự phòng** | `text-editor-hdv.html` |

## 2. Kiến Trúc Chỉnh Sửa Văn Bản Nguyên Bản (Native PDF Text Editing)

Khác với phương pháp truyền thống (vẽ hình chữ nhật trắng che chữ cũ rồi chèn lớp chữ mới lên trên gây lệch phông và hỏng cấu trúc vector), hệ thống sử dụng luồng can thiệp trực tiếp vào đối tượng văn bản trong PDF stream.

### Ba mô-đun Adapter chủ lực của HDV
* **`pdf-native-client.mjs`**: Quản lý giao tiếp bất đồng bộ giữa giao diện người dùng và Web Worker, đảm bảo luồng UI chính không bao giờ bị treo khi phân tích tệp PDF dung lượng lớn.
* **`pdf-native-worker.mjs`**: Khởi tạo môi trường cô lập cho `bentopdf-pdfium`, xếp hàng (queue) các giao dịch sửa đổi văn bản theo thứ tự tuần tự và giải phóng bộ nhớ WASM sau mỗi thao tác.
* **`pdf-native-text.mjs` & `pdf-text-layout.js`**: Thực thi các quy tắc bảo toàn hình học và kiểu chữ:
  * **Khóa đường cơ sở (Baseline Pinning)**: Giữ nguyên tọa độ đường cơ sở (`baseline Y`) của dòng chữ gốc khi người dùng thay đổi nội dung để chữ mới không bị nhảy dòng.
  * **Bảo toàn khung bảng biểu (Table Bounds Guard)**: Tự động tính toán độ rộng chuỗi ký tự mới và cảnh báo hoặc co giãn hợp lý để không tràn qua đường kẻ ô bảng.
  * **Phẫu thuật phông chữ Type3 (`type3surgery.js`)**: Bảo vệ các phông chữ vector nhúng đặc thù trong bản vẽ kỹ thuật và từ chối ghi đè mù quáng khi gặp bảng mã glyph không tương thích.
  * **Bảo vệ chữ ký số (`/ByteRange` Protection)**: Tự động quét cấu trúc tệp trước khi ghi; nếu phát hiện chữ ký số hợp lệ, hệ thống khóa chế độ ghi đè trực tiếp và thông báo rõ ràng để tránh làm hỏng tính pháp lý của tài liệu.

### Chỉnh sửa hàng loạt & Giao dịch nguyên tử (`pdf-batch-text.js`)
* **Xử lý theo lô (Batch Editing)**: Hỗ trợ tìm kiếm và thay thế đồng thời tối đa **500 vùng văn bản** trên toàn tài liệu (giới hạn an toàn **80 dòng mỗi lượt commit**).
* **Kiểm tra tiền giao dịch (Pre-Commit Validation)**: Mọi thay đổi được mô phỏng trước qua `PDFTextLayout` để kiểm tra tràn lề và hỗ trợ hoàn tác/làm lại (**Atomic Undo/Redo**) trọn vẹn.

## 3. Không Gian Làm Việc Văn Bản Chuyên Sâu (`text-editor.html`)

Không gian làm việc văn bản được tách riêng nhằm tối ưu diện tích hiển thị cho các tài liệu nhiều trang hoặc bản vẽ khổ lớn:

* **Khung Canvas Trung Tâm**: Kết xuất trang PDF độ phân giải cao kèm lớp phủ tương tác (interactive bounding boxes) cho phép nhấp chọn từng dòng hoặc đoạn văn bản.
* **Bảng Điều Khiển Định Dạng Cố Định (Right Dock Panel)**: Điều khiển bởi `text-editor-shell.js` và `text-editor.css`, hiển thị thông tin chi tiết về tên phông chữ gốc, kích thước điểm (pt), màu sắc, độ lệch baseline và lịch sử thay đổi theo từng trang.

## 4. Bộ Công Cụ Kỹ Thuật Nâng Cao Cho Hồ Sơ Civil 3D & Bản Vẽ CAD (`cit-advanced-core.js`)

Nhằm phục vụ nhu cầu xử lý hồ sơ thiết kế đường, trắc dọc, trắc ngang và bản vẽ xây dựng xuất từ AutoCAD / Civil 3D, mô-đun `cit-advanced-core.js` triển khai các thuật toán thao tác trang thuần client-side trên nền `pdf-lib`:

* **Ghép trang N-Up & In Sách (Booklet Imposition)**: Sắp xếp 2, 4, 6, 8 trang bản vẽ lên cùng một tờ giấy in khổ lớn (A3/A1) hoặc tự động đảo thứ tự trang theo chuẩn đóng quyển (Saddle-Stitch Booklet) với lề cắt và khung viền tùy chỉnh.
* **Chồng lớp bản vẽ kỹ thuật (Blueprint Overlay Comparison)**: Phủ hai phiên bản bản vẽ PDF lên nhau với chế độ hòa trộn màu (ví dụ: bản thiết kế cũ màu xanh lam, bản chỉnh sửa mới màu đỏ tươi) để kỹ sư phát hiện ngay các chi tiết thay đổi.
* **Đánh số hồ sơ pháp lý (Bates Numbering)**: Tự động đóng dấu mã hồ sơ tăng dần (ví dụ: `HDV-2026-0001`) kèm tiền tố, hậu tố và ngày tháng tại 6 vị trí góc/cạnh trang mà không làm ảnh hưởng tới đối tượng vector bên dưới.
* **Ghép xen kẽ tài liệu quét hai mặt (Interleave Duplex Scans)**: Tự động trộn tệp quét mặt lẻ (`1, 3, 5...`) và tệp quét mặt chẵn đảo ngược (`...6, 4, 2`) thành một hồ sơ hoàn chỉnh theo đúng thứ tự trang.
* **Căn chỉnh nghiêng & Hiệu chuẩn tỷ lệ (Auto-Deskew & Margin Crop)**: Xoay trang theo góc thập phân tự do (`-45°` đến `+45°`) để làm thẳng bản quét bị lệch và cắt chính xác khoảng trắng thừa quanh khung tên bản vẽ.
