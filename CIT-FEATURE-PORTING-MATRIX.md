# CIT-PDF v1.0.0 — Full Feature Porting Inventory

Ngày lập: 2026-10-15. Tham chiếu cố định: https://github.com/Cuongyd196/cit-pdf/tree/1.0.0/src/pages

**Lưu ý:** Một HTML tool entry không nhất thiết bằng một thuật toán độc lập; nhiều công cụ cùng dùng pdf-lib, PDFium, qpdf, Ghostscript hoặc LibreOffice. Trạng thái phản ánh HVD tại thời điểm lập danh mục, không phải chất lượng/độ đầy đủ chức năng so với bản CIT.

## Quy ước

- **Native CIT**: đã tích hợp engine và một phần workflow CIT, có kiểm thử.
- **Thuật toán đã tích hợp**: port nguyên lý thuật toán CIT vào browser HVD, có UI và test PDF thực.
- **HVD có chức năng**: đã có công cụ tương tự, chưa khẳng định mang toàn bộ thuật toán CIT.
- **Chưa tích hợp**: chưa thấy HVD có implementation đã kiểm chứng tương đương; cần phân tích theo engine.

## Bảng đối chiếu

| # | CIT tool page | Trạng thái | Ưu tiên rà soát |
|---:|---|---|---|
| 1 | [add-attachments](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/add-attachments.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 2 | [add-blank-page](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/add-blank-page.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 3 | [add-page-labels](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/add-page-labels.html) | Chưa tích hợp | P2 — browser/QA |
| 4 | [add-stamps](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/add-stamps.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 5 | [add-watermark](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/add-watermark.html) | HVD có chức năng | P2 — browser/QA |
| 6 | [adjust-colors](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/adjust-colors.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 7 | [alternate-merge](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/alternate-merge.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 8 | [background-color](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/background-color.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 9 | [bates-numbering](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/bates-numbering.html) | Thuật toán đã tích hợp | P3 — xét giá trị sử dụng |
| 10 | [bmp-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/bmp-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 11 | [bookmark](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/bookmark.html) | Chưa tích hợp | P2 — browser/QA |
| 12 | [cbz-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/cbz-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 13 | [change-permissions](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/change-permissions.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 14 | [combine-single-page](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/combine-single-page.html) | Chưa tích hợp | P2 — browser/QA |
| 15 | [compare-pdfs](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compare-pdfs.html) | Chưa tích hợp | P2 — browser/QA |
| 16 | [compress-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 17 | [compress-pdf-for-email](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-for-email.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 18 | [compress-pdf-to-100kb](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-to-100kb.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 19 | [compress-pdf-to-1mb](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-to-1mb.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 20 | [compress-pdf-to-200kb](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-to-200kb.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 21 | [compress-pdf-to-2mb](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-to-2mb.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 22 | [compress-pdf-to-500kb](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/compress-pdf-to-500kb.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 23 | [crop-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/crop-pdf.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 24 | [csv-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/csv-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 25 | [delete-pages](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/delete-pages.html) | HVD có chức năng | P2 — browser/QA |
| 26 | [deskew-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/deskew-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 27 | [digital-sign-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/digital-sign-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 28 | [divide-pages](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/divide-pages.html) | Chưa tích hợp | P2 — browser/QA |
| 29 | [duplex-collate](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/duplex-collate.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 30 | [edit-attachments](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/edit-attachments.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 31 | [edit-metadata](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/edit-metadata.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 32 | [edit-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/edit-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 33 | [edit-pdf-text](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/edit-pdf-text.html) | Native CIT | P2 — browser/QA |
| 34 | [email-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/email-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 35 | [epub-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/epub-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 36 | [excel-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/excel-to-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 37 | [extract-attachments](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/extract-attachments.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 38 | [extract-images](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/extract-images.html) | Chưa tích hợp | P2 — browser/QA |
| 39 | [extract-pages](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/extract-pages.html) | HVD có chức năng | P2 — browser/QA |
| 40 | [extract-tables](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/extract-tables.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 41 | [fb2-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/fb2-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 42 | [fix-page-size](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/fix-page-size.html) | Chưa tích hợp | P2 — browser/QA |
| 43 | [flatten-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/flatten-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 44 | [font-to-outline](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/font-to-outline.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 45 | [form-creator](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/form-creator.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 46 | [form-filler](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/form-filler.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 47 | [header-footer](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/header-footer.html) | Chưa tích hợp | P2 — browser/QA |
| 48 | [heic-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/heic-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 49 | [image-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/image-to-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 50 | [invert-colors](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/invert-colors.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 51 | [jpg-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/jpg-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 52 | [json-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/json-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 53 | [linearize-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/linearize-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 54 | [markdown-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/markdown-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 55 | [merge-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/merge-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 56 | [mobi-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/mobi-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 57 | [n-up-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/n-up-pdf.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 58 | [ocr-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/ocr-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 59 | [odg-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/odg-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 60 | [odp-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/odp-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 61 | [ods-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/ods-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 62 | [odt-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/odt-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 63 | [organize-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/organize-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 64 | [overlay-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/overlay-pdf.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 65 | [page-dimensions](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/page-dimensions.html) | Chưa tích hợp | P2 — browser/QA |
| 66 | [page-numbers](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/page-numbers.html) | HVD có chức năng | P2 — browser/QA |
| 67 | [pages-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pages-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 68 | [pdf-booklet](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-booklet.html) | Chưa tích hợp | P2 — browser/QA |
| 69 | [pdf-layers](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-layers.html) | Chưa tích hợp | P2 — browser/QA |
| 70 | [pdf-multi-tool](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-multi-tool.html) | Chưa tích hợp | P2 — browser/QA |
| 71 | [pdf-to-bmp](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-bmp.html) | Chưa tích hợp | P2 — browser/QA |
| 72 | [pdf-to-cbz](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-cbz.html) | Chưa tích hợp | P2 — browser/QA |
| 73 | [pdf-to-csv](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-csv.html) | Chưa tích hợp | P2 — browser/QA |
| 74 | [pdf-to-excel](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-excel.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 75 | [pdf-to-greyscale](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-greyscale.html) | Chưa tích hợp | P2 — browser/QA |
| 76 | [pdf-to-jpg](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-jpg.html) | HVD có chức năng | P2 — browser/QA |
| 77 | [pdf-to-json](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-json.html) | Chưa tích hợp | P2 — browser/QA |
| 78 | [pdf-to-markdown](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-markdown.html) | Chưa tích hợp | P2 — browser/QA |
| 79 | [pdf-to-pdfa](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-pdfa.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 80 | [pdf-to-png](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-png.html) | HVD có chức năng | P2 — browser/QA |
| 81 | [pdf-to-svg](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-svg.html) | Chưa tích hợp | P2 — browser/QA |
| 82 | [pdf-to-text](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-text.html) | HVD có chức năng | P2 — browser/QA |
| 83 | [pdf-to-tiff](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-tiff.html) | Chưa tích hợp | P2 — browser/QA |
| 84 | [pdf-to-webp](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-webp.html) | Chưa tích hợp | P2 — browser/QA |
| 85 | [pdf-to-word](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-word.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 86 | [pdf-to-zip](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-to-zip.html) | Chưa tích hợp | P2 — browser/QA |
| 87 | [pdf-workflow](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pdf-workflow.html) | Chưa tích hợp | P2 — browser/QA |
| 88 | [png-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/png-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 89 | [posterize-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/posterize-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 90 | [powerpoint-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/powerpoint-to-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 91 | [prepare-pdf-for-ai](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/prepare-pdf-for-ai.html) | Chưa tích hợp | P2 — browser/QA |
| 92 | [protect-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/protect-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 93 | [psd-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/psd-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 94 | [pub-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/pub-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 95 | [rasterize-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/rasterize-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 96 | [remove-annotations](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/remove-annotations.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 97 | [remove-blank-pages](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/remove-blank-pages.html) | Chưa tích hợp | P2 — browser/QA |
| 98 | [remove-metadata](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/remove-metadata.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 99 | [remove-restrictions](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/remove-restrictions.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 100 | [repair-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/repair-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 101 | [reverse-pages](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/reverse-pages.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 102 | [rotate-custom](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/rotate-custom.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 103 | [rotate-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/rotate-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 104 | [rtf-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/rtf-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 105 | [sanitize-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/sanitize-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 106 | [scanner-effect](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/scanner-effect.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 107 | [sign-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/sign-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 108 | [split-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/split-pdf.html) | HVD có chức năng | P2 — browser/QA |
| 109 | [svg-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/svg-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 110 | [table-of-contents](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/table-of-contents.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 111 | [text-color](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/text-color.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 112 | [tiff-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/tiff-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 113 | [timestamp-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/timestamp-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 114 | [txt-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/txt-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 115 | [unlock-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/unlock-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 116 | [validate-signature-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/validate-signature-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 117 | [view-metadata](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/view-metadata.html) | Thuật toán đã tích hợp | P2 — browser/QA |
| 118 | [view-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/view-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 119 | [vsd-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/vsd-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 120 | [wasm-settings](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/wasm-settings.html) | Chưa tích hợp | P3 — xét giá trị sử dụng |
| 121 | [webp-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/webp-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 122 | [word-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/word-to-pdf.html) | Chưa tích hợp | P1 — kiểm thử engine |
| 123 | [wpd-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/wpd-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 124 | [wps-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/wps-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 125 | [xml-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/xml-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |
| 126 | [xps-to-pdf](https://github.com/Cuongyd196/cit-pdf/blob/1.0.0/src/pages/xps-to-pdf.html) | Chưa tích hợp | P2 — browser/QA |

## Tổng hợp

- Tổng 126 trang công cụ CIT trong src/pages.
- Native CIT: 1; thuật toán đã port: 12; HVD có chức năng tương ứng cần đối chiếu: 14; chưa tích hợp: 99.

## Chính sách hoàn thiện

1. Không copy mọi HTML/Vite route như một tính năng chạy được: một số route phụ thuộc WASM, engine ngoài, assets lớn hoặc máy chủ.
2. Bản đồ phụ thuộc engine: PDFium, pdf-lib, PDF.js, PyMuPDF/WASM, qpdf, Ghostscript, LibreOffice WASM, Tesseract; chọn một đường thực thi đáng tin cậy cho mỗi workflow.
3. Mỗi tool chỉ chuyển sang trạng thái 'Thuật toán đã tích hợp' khi có UI, xử lý file thật, đối chiếu output, các ca biên và test CI.
4. Bảo toàn CAD vector/độ chính xác hình học, xử lý page rotation/crop/annotations, không tạo đường dẫn chia sẻ giả.
5. Với crypto/redaction/PDF/A: cần kiểm thử bảo mật riêng, không thay bằng lớp che trắng hoặc nhãn 'thành công' mô phỏng.

## Tham chiếu

- [CIT-ADVANCED-INTEGRATION.md](CIT-ADVANCED-INTEGRATION.md)
- [CIT-INTEGRATION.md](CIT-INTEGRATION.md)
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)