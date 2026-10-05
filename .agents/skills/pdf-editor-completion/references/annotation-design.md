# Thiết kế Giai đoạn 4: lớp chỉnh sửa nội dung

## Nguyên tắc

1. **Lưu tọa độ bằng đơn vị PDF** (point, theo không gian trang chưa xoay), không lưu pixel. Nhờ vậy zoom, xoay hay đổi độ phân giải đều không làm lệch vị trí.
2. **Flatten khi xuất:** đối tượng được vẽ thẳng vào nội dung trang bằng pdf-lib. Mọi trình xem đều hiển thị giống nhau. Annotation PDF gốc (có thể sửa lại sau) là việc tùy chọn cho tương lai.
3. **Dữ liệu nhị phân tách khỏi lịch sử:** ảnh và chữ ký nằm trong `this.assets: Map<key, { bytes: Uint8Array, mime }>`; đối tượng chỉ giữ `assetKey`. Snapshot lịch sử vì vậy vẫn nhẹ.

## Mô hình đối tượng

Gắn vào từng trang: `page.annotations = []`. Bản nhân đôi phải **deep-copy** mảng này và cấp `id` mới cho từng đối tượng.

```js
{
  id: 'an_5',
  type: 'text' | 'image' | 'rect' | 'ellipse' | 'line' | 'arrow' | 'highlight' | 'whiteout' | 'ink',
  x, y, w, h,          // hộp bao, đơn vị PDF, gốc dưới-trái của trang CHƯA xoay
  angle: 0,            // xoay riêng của đối tượng (độ), mặc định 0
  style: {
    color: '#1a1f36', fill: null, opacity: 1,
    strokeWidth: 1.5,
    fontSize: 12, fontKey: 'regular' | 'bold', align: 'left'
  },
  text: '...',         // type 'text'
  assetKey: 'img_2',   // type 'image'
  points: [[x, y], ...] // type 'ink' / 'line' / 'arrow', đơn vị PDF
}
```

## Hệ tọa độ

- Render trang ở edit mode: `vp = pdfPage.getViewport({ scale, rotation: (pdfPage.rotate + p.rotation + 360) % 360 })`.
- Chuột → PDF: `const [px, py] = vp.convertToPdfPoint(mouseX, mouseY)` (mouseX/Y tính theo canvas, đơn vị CSS px × tỷ lệ canvas/hiển thị).
- PDF → màn hình (khi vẽ overlay): `vp.convertToViewportPoint(x, y)`. Hộp bao: chuyển cả 4 góc rồi lấy min/max (trang xoay 90° sẽ đổi chiều rộng và chiều cao).
- **Không** tự cộng/trừ chiều cao trang hay offset CropBox. Hai hàm của pdf.js đã xử lý việc đó.

## Giao diện edit mode

- **Thanh công cụ con** (chỉ hiện khi đang ở edit mode): Chọn · Chữ · Ảnh · Chữ ký · Highlight · Che trắng · Chữ nhật · Elip · Đường · Mũi tên · Vẽ tay. Bên phải là bảng thuộc tính của đối tượng đang chọn (màu, cỡ, độ mờ, nét).
- **Overlay:** một `div` định vị tuyệt đối khớp canvas; mỗi đối tượng là một phần tử DOM hoặc SVG có 8 tay nắm đổi kích thước.
- **Tương tác:** chọn công cụ → click hoặc kéo trên trang để tạo; kéo để di chuyển; kéo tay nắm để đổi kích thước (giữ Shift để giữ tỷ lệ); nhấp đúp vào chữ để sửa; Delete xóa đối tượng; Esc bỏ chọn rồi quay lại công cụ Chọn; phím mũi tên dịch 1pt (Shift: 10pt).
- **Lịch sử:** gọi `pushHistory()` khi **kết thúc** thao tác (pointerup, blur ô chữ), không gọi trong lúc đang kéo.
- **Thumbnail:** sau khi sửa trang, vẽ lại thumbnail của trang đó (có thể vẽ đối tượng lên canvas thumbnail) để người dùng thấy thay đổi trong lưới.
- Chuyển trang hoặc thoát edit mode thì tự lưu trạng thái, không cần nút "Áp dụng".

## Mapping khi xuất bằng pdf-lib

Chuẩn bị một lần mỗi lần lưu:
```js
doc.registerFontkit(fontkit);  // @pdf-lib/fontkit (UMD global: fontkit)
const fonts = {
  regular: await doc.embedFont(await fetch('fonts/BeVietnamPro-Regular.ttf').then(r => r.arrayBuffer()), { subset: true }),
  bold:    await doc.embedFont(await fetch('fonts/BeVietnamPro-Bold.ttf').then(r => r.arrayBuffer()), { subset: true }),
};
const images = new Map(); // assetKey -> PDFImage (nhúng mỗi ảnh một lần, dùng lại cho nhiều trang)
```

| type | Lệnh pdf-lib | Ghi chú |
|---|---|---|
| text | `page.drawText(line, { x, y, size, font, color, opacity, lineHeight })` | Tự xuống dòng bằng `font.widthOfTextAtSize`; `y` là baseline của dòng đầu = `y + h - size` |
| image | `page.drawImage(img, { x, y, width: w, height: h, opacity })` | `embedPng` hoặc `embedJpg` theo `mime` |
| rect / whiteout | `page.drawRectangle({ x, y, width: w, height: h, color, borderColor, borderWidth, opacity })` | whiteout: `color: rgb(1,1,1)`, không viền |
| highlight | `drawRectangle({ ..., color, opacity: 0.35, blendMode: BlendMode.Multiply })` | |
| ellipse | `page.drawEllipse({ x: x + w/2, y: y + h/2, xScale: w/2, yScale: h/2, ... })` | |
| line / arrow | `page.drawLine({ start, end, thickness, color, opacity })` | Đầu mũi tên vẽ bằng 2 đường ngắn |
| ink | `page.drawSvgPath(d, { x: 0, y: pageHeight, borderColor, borderWidth })` | drawSvgPath dùng trục y hướng xuống, nên chuyển `y_svg = pageHeight - y` khi tạo `d` |

Hàm `hexToRgb` → `rgb(r/255, g/255, b/255)`.

**Trang có `/Rotate`:** tọa độ đã ở không gian chưa xoay nên vẽ trực tiếp. Riêng **chữ và ảnh** cần thêm `rotate: degrees(gócTrang)` và dịch gốc tương ứng để chữ hiển thị nằm ngang khi xem. Kiểm thử bằng file mẫu số 7 trong roadmap.

## Nghiệm thu chung cho Giai đoạn 4

- Chuỗi `Tiếng Việt: ắ ằ ẳ ẵ ặ ầ ấ ậ ơ ư đ Ư Ơ Đ` hiển thị đúng trong Chrome và Acrobat.
- Vị trí đối tượng trên file xuất lệch so với lúc xem trước không quá 1pt, kể cả trên trang `/Rotate 90` và trang có CropBox lệch gốc.
- Hoàn tác/làm lại hoạt động với mọi loại đối tượng.
- File xuất có dung lượng hợp lý: font subset, mỗi ảnh chỉ nhúng một lần.
