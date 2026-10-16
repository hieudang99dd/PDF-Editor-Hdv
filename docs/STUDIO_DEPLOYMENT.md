# PDF HVD — Frontend Studio, thương hiệu và triển khai

> Tài liệu tổng hợp kỹ thuật theo quy trình, cập nhật ngày 2026-10-16. Các mục có nhãn "Hồ sơ nguồn" giữ nguyên mô tả ở từng giai đoạn phát triển, không đồng nghĩa tất cả chức năng đều có trong phiên bản website mới nhất. Khi thực thi, ưu tiên mã thực tế, kiểm thử CI, [tiến độ dự án](../IMPLEMENTATION_PROGRESS.md), và [giấy phép](../NOTICE.md).

## Hồ sơ nguồn — CIT-ORIGINAL-FRONTEND.md (lịch sử triển khai)

# Toàn bộ frontend CIT-PDF v1.0.0 trong PDF HVD

Ngày: 2026-10-15 — nhánh master.

## Lựa chọn triển khai

**Không** mô phỏng / viết lại panel CIT bằng tay nữa. Tài liệu nguồn được ghim:

- CIT-PDF: https://github.com/Cuongyd196/cit-pdf
- Tag: 1.0.0
- Commit bắt buộc: `3c9c138d980a417de7439f383f37882a1d730ab6`
- License: GNU AGPL-3.0-only (cùng giấy phép dự án HVD)
- Dependency gốc: `package-lock.json`, `vendor/bentopdf-pdfium/*.tgz`, `vendor/bentopdf-viewer/*.tgz`.

GitHub Actions tải **đúng commit upstream** bằng git clone và `npm ci`, gọi Vite build nguyên bản với `BASE_URL=/PDF-Editor-Hdv/studio/`; **không sửa engine TypeScript/PDFium của CIT**; chỉ chèn 2 asset riêng cho điều hướng PDF HVD vào trang HTML build. Phần `studio/` sau build chứa toàn bộ bundle frontend (đo được khoảng 176 MB), không phải bản HTML rút gọn. Đầu ra giữ đường dẫn tài nguyên, WASM và ứng dụng Editor của CIT.

Mã nguồn TypeScript CIT được ghim tag+SHA ở `CIT-ORIGINAL-FRONTEND.lock.json` và được build tái lập bằng `.github/workflows/cit-original-build.yml`. **Các file frontend đã biên dịch** được đồng bộ vào `master/studio/` để GitHub Pages từ nhánh master không bị ghi đè trở lại bản cũ. Muốn sửa module CIT cần fork/upstream patch có kiểm thử, cập nhật nguồn và SHA; không chèn sửa minified JS thủ công.

## Cấu trúc website sau khi triển khai thành công

| Đường dẫn | Vai trò |
|---|---|
| `/PDF-Editor-Hdv/` | Trang chủ, toàn bộ công cụ HVD hiện có |
| `/PDF-Editor-Hdv/text-editor.html` | Route chính, tự chuyển vào frontend CIT gốc |
| `/PDF-Editor-Hdv/studio/edit-pdf-text.html` | Trang chỉnh sửa Text gốc CIT, HTML/CSS/JS/Viewer/PDFium original |
| `/PDF-Editor-Hdv/studio/` | Trọn bộ frontend CIT từ build upstream |
| `/PDF-Editor-Hdv/text-editor-hdv.html` | Bản HVD NativeTextEditor cũ để đối chiếu/khôi phục |

Chỉ sau khi toàn bộ kiểm thử pass, workflow mới commit bản build hoàn chỉnh vào `master/studio/`; luồng **Pages mặc định của nhánh master** là nguồn xuất bản duy nhất, tránh tranh chấp giữa hai pipeline deploy. Nếu CI thất bại, không thay đổi bundle đã phát hành.

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

Bản editor HVD trước đây còn nguyên trong repo tại `text-editor-hdv.html` và được kiểm tra không bị ghi đè thành trang chuyển hướng. Nếu kiểm thử CIT build thất bại, pipeline không được push bundle mới và Pages vẫn phục vụ bản đã phát hành thành công. Khi muốn quay lại HVD, sửa `scripts/cit-original/publish_site.py` bỏ phần thay alias hoặc chuyển Pages về nguồn legacy, kiểm thử lại trước khi quảng bá.

## Nghiệm thu và xuất bản thực tế

- Bản chuẩn đã xác nhận qua Chromium (frontend nguyên gốc) và PyMuPDF (PDF thật); 9 bước kiểm tra nguyên lý thao tác và kết quả đầu ra.
- GitHub Actions: https://github.com/hieudang99dd/PDF-Editor-Hdv/actions/runs/38744102098 — kết luận **success**, deploy-pages báo **Reported success!**.
- Commit triển khai: `c3cade1d0f42f637e708b982d90ac228ccb3c290`.
- Trang chính: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor.html (đi đến frontend CIT).
- Trình CIT gốc: https://hieudang99dd.github.io/PDF-Editor-Hdv/studio/edit-pdf-text.html
- Đường dự phòng HVD: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor-hdv.html
- Chưa dùng được khả năng quan sát trực tiếp từ môi trường trợ lý đối với CDN GitHub Pages; xác minh thực tế nguồn xuất bản thông qua GitHub Pages deployment và browser test đối với chính artifact đã đóng gói.

## 2026-10-15 — Hoàn thiện frontend HVD × CIT

- Giữ **nguyên phần frontend chức năng CIT 1.0.0**: lựa chọn paragraph, dàn đoạn, panel font/cỡ/màu/căn chỉnh/giãn cách, Undo/Redo và xuất PDFium.
- Thêm cầu nối giao diện độc lập `scripts/cit-original/hvd-hub.js` và `hvd-hub.css`, chỉ bổ sung nút PDF HVD trên thanh công cụ, đường dẫn quay về đúng website, nhận diện sản phẩm và khả năng dùng bàn phím/screen reader; không thay PDFium, `editcore` hoặc code gốc CIT.
- `scripts/cit-original/publish_site.py` tạo `studio/edit-pdf-text.html` có tham chiếu hai asset HVD bên trên; script/engine/CSS gốc từ Vite không bị sửa.
- Đã sửa lỗi build lại khi `master/text-editor.html` là redirect: bản HVD cũ `text-editor-hdv.html` không bị overwrite bằng trang chuyển hướng.
- Chặn asset lỗi thời: `studio/` được tạo mới từ Vite, không trộn các chunk hash cũ. Script persist trên master dùng đúng cây `cit-stage/studio/` đã test.
- Loại bỏ cơ chế deploy song song gây race: chỉ push commit build vào `master`, dùng Pages legacy duy nhất.
- Kiểm thử `tests/hvd-cit-hub.test.cjs` và `tests/cit-original-browser.cjs` bổ sung kiểm tra điều hướng HVD/CIT, file xuất PDF và các điều khiển font nguyên bản.
- Đường chính không đổi: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor.html. Trang dự phòng HVD: https://hieudang99dd.github.io/PDF-Editor-Hdv/text-editor-hdv.html.

**Điều kiện nghiệm thu:** mọi bài Node CI và Chromium/PyMuPDF đạt, bot cập nhật lại thư mục `studio/` trên master và workflow Pages cho commit đó báo thành công. Chưa thể tuyên bố đạt mọi trường hợp PDF CAD thực tế nếu chưa có bộ file thử tương ứng.

---

## Hồ sơ nguồn — HVD-BRANDING.md (lịch sử triển khai)

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
