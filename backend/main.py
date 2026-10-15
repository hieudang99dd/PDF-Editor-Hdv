"""
PDF HDV Local Engine v3.0 — Office Conversion, Vector-Preserving OCR & Multi-Tier PDF Optimization.
Chạy cục bộ tại http://127.0.0.1:8000 để đảm bảo tài liệu không bao giờ rời khỏi máy người dùng.
"""
from __future__ import annotations

import io
import os
import re
import shutil
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

import fitz  # PyMuPDF
import pytesseract
from docx import Document as DocxDocument
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

try:
    from pdf2docx import Converter as Pdf2DocxConverter  # Optional high-fidelity engine
    HAS_PDF2DOCX = True
except ImportError:
    HAS_PDF2DOCX = False

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_PDF_PAGES = 300
MAX_OCR_PAGES = 100
MAX_TIFF_PAGES = 150
LIBREOFFICE_TIMEOUT_SECONDS = 90

SUPPORTED_OFFICE_EXTENSIONS = {
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".odt", ".ods", ".odp", ".rtf", ".csv"
}

ALLOWED_ORIGINS = [
    "https://hieudang99dd.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
]

COMPRESSION_PROFILES: Dict[str, Dict[str, int]] = {
    "screen": {"target_dpi": 72, "max_dim": 900, "jpeg_quality": 50},
    "ebook": {"target_dpi": 150, "max_dim": 1600, "jpeg_quality": 74},
    "printer": {"target_dpi": 220, "max_dim": 2400, "jpeg_quality": 85},
    "lossless": {"target_dpi": 0, "max_dim": 0, "jpeg_quality": 100},
}

app = FastAPI(
    title="PDF HDV Local Engine",
    version="3.0.0",
    description="Engine xử lý Office, OCR bảo toàn Vector và tối ưu hóa PDF đa tầng chạy cục bộ.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",
        "X-Original-Size",
        "X-Compressed-Size",
        "X-Saved-Percent",
        "X-Digital-Signature-Status",
        "X-OCR-Mode",
    ],
)


def _find_soffice() -> Optional[str]:
    for candidate in ("soffice", "libreoffice"):
        found = shutil.which(candidate)
        if found:
            return found
    common_paths = [
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]
    for path in common_paths:
        if os.path.isfile(path):
            return path
    return None


def _get_tesseract_langs() -> List[str]:
    if not shutil.which("tesseract"):
        return []
    try:
        proc = subprocess.run(
            ["tesseract", "--list-langs"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        lines = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
        return [lang for lang in lines if not lang.lower().startswith("list of available")]
    except Exception:
        return []


def _has_digital_signature(pdf_bytes: bytes) -> bool:
    return b"/ByteRange" in pdf_bytes and (b"/Sig" in pdf_bytes or b"/PKCS7" in pdf_bytes)


async def _read_validated_upload(file: UploadFile) -> bytes:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Tệp tải lên đang trống.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Dung lượng tệp vượt quá giới hạn cho phép ({MAX_UPLOAD_BYTES // (1024 * 1024)}MB).",
        )
    return data


def _open_validated_pdf(data: bytes, max_pages: int = MAX_PDF_PAGES) -> fitz.Document:
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise HTTPException(status_code=415, detail="Tệp tải lên không phải là định dạng PDF hợp lệ.") from exc

    if doc.is_encrypted:
        doc.close()
        raise HTTPException(status_code=422, detail="Tệp PDF đang bị khóa mật khẩu. Vui lòng mở khóa trước khi xử lý.")

    if doc.page_count == 0:
        doc.close()
        raise HTTPException(status_code=422, detail="Tệp PDF không chứa trang nào.")

    if doc.page_count > max_pages:
        count = doc.page_count
        doc.close()
        raise HTTPException(
            status_code=413,
            detail=f"Tệp PDF có {count} trang, vượt quá giới hạn an toàn ({max_pages} trang) cho tác vụ này.",
        )
    return doc


def _office_to_pdf(data: bytes, filename: str) -> bytes:
    soffice_bin = _find_soffice()
    if not soffice_bin:
        raise HTTPException(
            status_code=503,
            detail="Chưa tìm thấy LibreOffice (soffice) trên máy. Vui lòng cài đặt LibreOffice để chuyển đổi tệp Office.",
        )

    ext = Path(filename or "").suffix.lower()
    if ext not in SUPPORTED_OFFICE_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Định dạng '{ext}' không nằm trong danh sách Office được hỗ trợ.",
        )

    with tempfile.TemporaryDirectory(prefix="hdv-office-") as tmpdir:
        tmp_path = Path(tmpdir)
        input_path = tmp_path / f"input{ext}"
        profile_dir = tmp_path / "lo_profile"
        profile_dir.mkdir(parents=True, exist_ok=True)
        input_path.write_bytes(data)

        profile_uri = profile_dir.as_uri()
        cmd = [
            soffice_bin,
            f"-env:UserInstallation={profile_uri}",
            "--headless",
            "--nologo",
            "--nodefault",
            "--nofirststartwizard",
            "--convert-to",
            "pdf",
            "--outdir",
            str(tmp_path),
            str(input_path),
        ]
        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=LIBREOFFICE_TIMEOUT_SECONDS,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(
                status_code=504,
                detail=f"Tiến trình chuyển đổi LibreOffice vượt quá thời gian chờ ({LIBREOFFICE_TIMEOUT_SECONDS} giây).",
            ) from exc

        output_pdf = tmp_path / "input.pdf"
        if proc.returncode != 0 or not output_pdf.is_file():
            err_msg = (proc.stderr or proc.stdout or "Lỗi không xác định từ LibreOffice").strip()
            raise HTTPException(status_code=422, detail=f"Không thể chuyển đổi tệp Office sang PDF: {err_msg}")

        return output_pdf.read_bytes()


def _pdf_to_docx(data: bytes, doc: fitz.Document) -> bytes:
    """
    Thuật toán chuyển đổi PDF -> DOCX nâng cấp:
    1. Ưu tiên dùng engine `pdf2docx` nếu có sẵn để tái tạo chuẩn xác cột, bảng biểu và đồ họa.
    2. Nếu dùng engine nội tại PyMuPDF + python-docx:
       - Phát hiện và tái tạo bảng biểu qua `page.find_tables()`
       - Trích xuất và chèn hình ảnh nhúng đúng tỷ lệ
       - Bảo toàn cỡ chữ, in đậm/nghiêng, màu chữ RGB và căn lề đoạn văn (Trái/Giữa/Phải)
    """
    if HAS_PDF2DOCX:
        with tempfile.TemporaryDirectory(prefix="hdv-pdf2docx-") as tmpdir:
            pdf_path = Path(tmpdir) / "input.pdf"
            docx_path = Path(tmpdir) / "output.docx"
            pdf_path.write_bytes(data)
            converter = Pdf2DocxConverter(str(pdf_path))
            try:
                converter.convert(str(docx_path), start=0, end=None)
            finally:
                converter.close()
            if docx_path.is_file():
                return docx_path.read_bytes()

    word_doc = DocxDocument()
    for page_idx, page in enumerate(doc):
        if page_idx > 0:
            word_doc.add_page_break()

        page_width = max(page.rect.width, 1.0)
        table_bboxes: List[fitz.Rect] = []

        # 1. Khôi phục cấu trúc bảng biểu trên trang
        if hasattr(page, "find_tables"):
            try:
                tables = page.find_tables()
                for tbl in tables.tables:
                    table_bboxes.append(fitz.Rect(tbl.bbox))
                    extracted = tbl.extract()
                    if not extracted:
                        continue
                    rows_count = len(extracted)
                    cols_count = max((len(r) for r in extracted), default=0)
                    if rows_count > 0 and cols_count > 0:
                        w_table = word_doc.add_table(rows=rows_count, cols=cols_count)
                        w_table.style = "Table Grid"
                        for r_i, row_data in enumerate(extracted):
                            for c_i, cell_val in enumerate(row_data):
                                if c_i < cols_count and cell_val:
                                    w_table.cell(r_i, c_i).text = str(cell_val).strip()
            except Exception:
                pass

        # 2. Khôi phục các khối văn bản với đầy đủ thuộc tính định dạng và hình ảnh
        page_dict = page.get_text("dict", sort=True)
        for block in page_dict.get("blocks", []):
            b_rect = fitz.Rect(block.get("bbox", (0, 0, 0, 0)))
            if any(b_rect.intersects(t_rect) for t_rect in table_bboxes):
                continue

            if block.get("type") == 1 and block.get("image"):
                # Khối hình ảnh nhúng
                try:
                    img_stream = io.BytesIO(block["image"])
                    width_inches = min(max(b_rect.width / 72.0, 0.75), 6.0)
                    word_doc.add_picture(img_stream, width=Inches(width_inches))
                except Exception:
                    continue

            elif block.get("type") == 0:
                # Khối văn bản có định dạng span
                para = word_doc.add_paragraph()
                center_x = (b_rect.x0 + b_rect.x1) / 2.0
                if abs(center_x - page_width / 2.0) < page_width * 0.08 and b_rect.width < page_width * 0.75:
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif b_rect.x0 > page_width * 0.55:
                    para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

                lines = block.get("lines", [])
                for line_idx, line in enumerate(lines):
                    if line_idx > 0:
                        para.add_run(" ")
                    for span in line.get("spans", []):
                        text = span.get("text", "")
                        if not text:
                            continue
                        run = para.add_run(text)
                        size_pt = span.get("size", 11.0)
                        run.font.size = Pt(max(min(round(size_pt, 1), 36.0), 7.5))

                        flags = int(span.get("flags", 0))
                        font_name = (span.get("font") or "").lower()
                        if (flags & 16) or "bold" in font_name:
                            run.bold = True
                        if (flags & 2) or "italic" in font_name or "oblique" in font_name:
                            run.italic = True

                        color_int = int(span.get("color", 0))
                        if color_int > 0:
                            r = (color_int >> 16) & 255
                            g = (color_int >> 8) & 255
                            b = color_int & 255
                            run.font.color.rgb = RGBColor(r, g, b)

    out_buf = io.BytesIO()
    word_doc.save(out_buf)
    return out_buf.getvalue()


def _iter_rendered_pages(doc: fitz.Document, dpi: int) -> Iterator[Image.Image]:
    """
    Bộ sinh (Generator) kết xuất từng trang sang PIL Image và giải phóng Pixmap ngay lập tức,
    tránh nạp đồng thời hàng trăm trang ảnh vào bộ nhớ RAM.
    """
    zoom = max(min(dpi, 300), 72) / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    for page in doc:
        pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        del pix
        yield img


def _pdf_to_tiff(doc: fitz.Document, dpi: int = 150) -> bytes:
    if doc.page_count > MAX_TIFF_PAGES:
        raise HTTPException(
            status_code=413,
            detail=f"Xuất TIFF giới hạn tối đa {MAX_TIFF_PAGES} trang để bảo vệ bộ nhớ hệ thống.",
        )
    page_iter = _iter_rendered_pages(doc, dpi=dpi)
    first_page = next(page_iter, None)
    if first_page is None:
        raise HTTPException(status_code=422, detail="Không thể kết xuất trang PDF sang TIFF.")

    out_buf = io.BytesIO()
    first_page.save(
        out_buf,
        format="TIFF",
        save_all=True,
        append_images=page_iter,
        compression="tiff_adobe_deflate",
        dpi=(dpi, dpi),
    )
    first_page.close()
    return out_buf.getvalue()


def _ocr_single_page_data(args: Tuple[int, bytes, int, int, str, str]) -> Tuple[int, str, List[Tuple[float, float, float, float, str]]]:
    page_idx, raw_samples, width, height, lang, output_mode = args
    img = Image.frombytes("L", (width, height), raw_samples)
    img = ImageOps.autocontrast(img, cutoff=1)

    if output_mode == "txt":
        text = pytesseract.image_to_string(img, lang=lang)
        img.close()
        return page_idx, text.strip(), []

    data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
    img.close()
    words_boxes: List[Tuple[float, float, float, float, str]] = []
    texts: List[str] = []
    n_items = len(data.get("text", []))
    for i in range(n_items):
        word = (data["text"][i] or "").strip()
        conf_raw = data["conf"][i]
        try:
            conf = float(conf_raw)
        except (ValueError, TypeError):
            conf = -1.0
        if not word or conf < 25.0:
            continue
        x = float(data["left"][i])
        y = float(data["top"][i])
        w = float(data["width"][i])
        h = float(data["height"][i])
        words_boxes.append((x, y, w, h, word))
        texts.append(word)

    return page_idx, " ".join(texts), words_boxes


def _ocr_pdf(
    doc: fitz.Document,
    lang: str = "vie+eng",
    output_mode: str = "pdf",
    preserve_vectors: bool = True,
    dpi: int = 200,
) -> Tuple[bytes, str]:
    """
    Thuật toán OCR nâng cấp:
    - Chạy song song đa luồng (`ThreadPoolExecutor`) cho các trang chưa có lớp văn bản.
    - Chế độ `preserve_vectors=True`: Chèn lớp chữ vô hình (`render_mode=3`) trực tiếp lên trang
      PDF gốc thay vì biến cả trang thành ảnh phẳng, bảo toàn 100% đường nét vector CAD/Civil 3D.
    """
    if not shutil.which("tesseract"):
        raise HTTPException(
            status_code=503,
            detail="Chưa cài đặt Tesseract OCR trên máy chủ cục bộ.",
        )

    scale = dpi / 72.0
    matrix = fitz.Matrix(scale, scale)
    tasks: List[Tuple[int, bytes, int, int, str, str]] = []
    existing_texts: Dict[int, str] = {}

    for idx, page in enumerate(doc):
        native_text = page.get_text("text").strip()
        # Nếu trang đã có đầy đủ văn bản gốc và chỉ cần trích xuất TXT thì bỏ qua OCR tốn kém
        if output_mode == "txt" and len(native_text) > 80:
            existing_texts[idx] = native_text
            continue
        pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csGRAY, alpha=False)
        tasks.append((idx, bytes(pix.samples), pix.width, pix.height, lang, output_mode))
        del pix

    ocr_results: Dict[int, Tuple[str, List[Tuple[float, float, float, float, str]]]] = {}
    if tasks:
        max_workers = min(4, os.cpu_count() or 2, len(tasks))
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            for page_idx, page_text, boxes in pool.map(_ocr_single_page_data, tasks):
                ocr_results[page_idx] = (page_text, boxes)

    if output_mode == "txt":
        all_lines: List[str] = []
        for idx in range(doc.page_count):
            txt = existing_texts.get(idx) or ocr_results.get(idx, ("", []))[0]
            all_lines.append(f"--- Trang {idx + 1} ---\n{txt}")
        return "\n\n".join(all_lines).encode("utf-8"), "text-extracted"

    if preserve_vectors:
        for idx, (_, boxes) in ocr_results.items():
            page = doc[idx]
            for x_px, y_px, w_px, h_px, word in boxes:
                x_pt = x_px / scale
                y_pt = (y_px + h_px * 0.85) / scale
                fontsize = max(min((h_px / scale) * 0.85, 48.0), 4.0)
                try:
                    page.insert_text(
                        fitz.Point(x_pt, y_pt),
                        word + " ",
                        fontsize=fontsize,
                        fontname="helv",
                        render_mode=3,  # Invisible searchable text layer
                    )
                except Exception:
                    continue
        out_bytes = doc.tobytes(garbage=3, deflate=True)
        return out_bytes, "vector-preserved"

    # Fallback: Rasterize searchable PDF via Tesseract
    merged = fitz.open()
    try:
        for page in doc:
            pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB, alpha=False)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            del pix
            pdf_page_bytes = pytesseract.image_to_pdf_or_hocr(img, lang=lang, extension="pdf")
            img.close()
            with fitz.open(stream=pdf_page_bytes, filetype="pdf") as single_pdf:
                merged.insert_pdf(single_pdf)
        return merged.tobytes(garbage=3, deflate=True), "rasterized"
    finally:
        merged.close()


def _compress_pdf(
    raw_bytes: bytes,
    doc: fitz.Document,
    level: str = "ebook",
    preserve_signatures: bool = True,
) -> Tuple[bytes, str]:
    """
    Thuật toán nén PDF đa tầng:
    1. Kiểm tra chữ ký số `/ByteRange`: Nếu có chữ ký số và `preserve_signatures=True`,
       giữ nguyên byte gốc để không làm hỏng chữ ký.
    2. Thu nhỏ độ phân giải ảnh raster quá khổ (`LANCZOS`) và tái nén JPEG theo cấu hình `level`.
    3. Dọn dẹp đối tượng thừa (`garbage=4`), nén luồng dữ liệu & phông chữ (`deflate=True`),
       và luôn giữ phiên bản có dung lượng nhỏ hơn giữa bản gốc và bản đã xử lý.
    """
    has_sig = _has_digital_signature(raw_bytes)
    if has_sig and preserve_signatures:
        return raw_bytes, "signed-preserved"

    profile = COMPRESSION_PROFILES.get(level, COMPRESSION_PROFILES["ebook"])
    max_dim = profile["max_dim"]
    jpeg_quality = profile["jpeg_quality"]

    if max_dim > 0:
        processed_xrefs = set()
        for page in doc:
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                if xref in processed_xrefs:
                    continue
                processed_xrefs.add(xref)
                try:
                    base_img = doc.extract_image(xref)
                    if not base_img or base_img.get("smask", 0) > 0:
                        continue
                    img_bytes = base_img.get("image")
                    if not img_bytes or len(img_bytes) < 16 * 1024:
                        continue

                    with Image.open(io.BytesIO(img_bytes)) as pil_img:
                        if pil_img.mode not in ("RGB", "L"):
                            continue
                        w, h = pil_img.size
                        if max(w, h) > max_dim:
                            ratio = max_dim / float(max(w, h))
                            new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
                            pil_img = pil_img.resize(new_size, Image.Resampling.LANCZOS)

                        buf = io.BytesIO()
                        pil_img.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
                        new_bytes = buf.getvalue()

                        # Chỉ cập nhật nếu giảm được ít nhất 5% dung lượng ảnh
                        if len(new_bytes) < len(img_bytes) * 0.95:
                            doc.update_stream(xref, new_bytes, compress=False)
                except Exception:
                    continue

    compressed = doc.tobytes(
        garbage=4,
        clean=True,
        deflate=True,
        deflate_images=True,
        deflate_fonts=True,
    )
    if len(compressed) >= len(raw_bytes):
        return raw_bytes, "already-optimal"
    return compressed, "compressed"


@app.get("/api/capabilities")
async def get_capabilities() -> dict:
    soffice_path = _find_soffice()
    tesseract_langs = _get_tesseract_langs()
    return {
        "status": "online",
        "engine_version": "3.0.0",
        "max_upload_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
        "max_pdf_pages": MAX_PDF_PAGES,
        "max_ocr_pages": MAX_OCR_PAGES,
        "max_tiff_pages": MAX_TIFF_PAGES,
        "libreoffice_available": bool(soffice_path),
        "tesseract_available": bool(shutil.which("tesseract")),
        "tesseract_langs": tesseract_langs,
        "high_fidelity_pdf2docx": HAS_PDF2DOCX,
        "vector_preserving_ocr": True,
        "supported_office_extensions": sorted(SUPPORTED_OFFICE_EXTENSIONS),
        "compression_levels": list(COMPRESSION_PROFILES.keys()),
    }


@app.post("/api/convert")
async def convert_document(
    file: UploadFile = File(...),
    target: str = Form("pdf"),
    dpi: int = Form(150),
) -> Response:
    data = await _read_validated_upload(file)
    target_norm = target.strip().lower()
    stem = Path(file.filename or "document").stem

    if target_norm == "pdf":
        pdf_bytes = _office_to_pdf(data, file.filename or "input.docx")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{stem}.pdf"'},
        )

    max_p = MAX_TIFF_PAGES if target_norm == "tiff" else MAX_PDF_PAGES
    doc = _open_validated_pdf(data, max_pages=max_p)
    try:
        if target_norm == "txt":
            text_parts = [page.get_text("text", sort=True).strip() for page in doc]
            txt_bytes = "\n\n".join(text_parts).encode("utf-8")
            return Response(
                content=txt_bytes,
                media_type="text/plain; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="{stem}.txt"'},
            )
        if target_norm == "docx":
            docx_bytes = _pdf_to_docx(data, doc)
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f'attachment; filename="{stem}.docx"'},
            )
        if target_norm == "tiff":
            tiff_bytes = _pdf_to_tiff(doc, dpi=dpi)
            return Response(
                content=tiff_bytes,
                media_type="image/tiff",
                headers={"Content-Disposition": f'attachment; filename="{stem}.tiff"'},
            )
        raise HTTPException(status_code=400, detail=f"Định dạng đích '{target}' không được hỗ trợ.")
    finally:
        doc.close()


@app.post("/api/ocr")
async def ocr_document(
    file: UploadFile = File(...),
    lang: str = Form("vie+eng"),
    output: str = Form("pdf"),
    preserve_vectors: bool = Form(True),
    dpi: int = Form(200),
) -> Response:
    data = await _read_validated_upload(file)
    doc = _open_validated_pdf(data, max_pages=MAX_OCR_PAGES)
    stem = Path(file.filename or "document").stem
    output_norm = output.strip().lower()
    try:
        result_bytes, ocr_mode = _ocr_pdf(
            doc,
            lang=lang.strip() or "vie+eng",
            output_mode=output_norm,
            preserve_vectors=preserve_vectors,
            dpi=dpi,
        )
        if output_norm == "txt":
            return Response(
                content=result_bytes,
                media_type="text/plain; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{stem}_ocr.txt"',
                    "X-OCR-Mode": ocr_mode,
                },
            )
        return Response(
            content=result_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{stem}_searchable.pdf"',
                "X-OCR-Mode": ocr_mode,
            },
        )
    finally:
        doc.close()


@app.post("/api/compress")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    level: str = Form("ebook"),
    preserve_signatures: bool = Form(True),
) -> Response:
    data = await _read_validated_upload(file)
    doc = _open_validated_pdf(data, max_pages=MAX_PDF_PAGES)
    stem = Path(file.filename or "document").stem
    try:
        compressed_bytes, status = _compress_pdf(
            data,
            doc,
            level=level.strip().lower(),
            preserve_signatures=preserve_signatures,
        )
        orig_len = len(data)
        comp_len = len(compressed_bytes)
        saved_pct = round(max(0.0, (1.0 - comp_len / max(orig_len, 1)) * 100.0), 2)
        return Response(
            content=compressed_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{stem}_optimized.pdf"',
                "X-Original-Size": str(orig_len),
                "X-Compressed-Size": str(comp_len),
                "X-Saved-Percent": str(saved_pct),
                "X-Digital-Signature-Status": status,
            },
        )
    finally:
        doc.close()
