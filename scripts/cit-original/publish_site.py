#!/usr/bin/env python3
"""Publish entire upstream CIT-PDF 1.0.0 frontend under the HVD Pages prefix.

The upstream TypeScript, original format dock, PDFium WASM and all dependent
assets are compiled upstream in GitHub Actions. This stage preserves every
HVD static tool in the repository and only redirects the dedicated Text
workspace after native Chromium tests pass.
"""
from __future__ import annotations

import html
import json
import pathlib
import shutil
import sys

root = pathlib.Path(__file__).resolve().parents[2]
upstream_dist = pathlib.Path(sys.argv[1]).resolve()
dest = pathlib.Path(sys.argv[2]).resolve()
excluded = {
    ".git", ".github", "node_modules", "cit-upstream", "cit-stage",
    "tests", "test-results", "scripts", "backend", "__pycache__", ".venv"
}
if not (upstream_dist / "edit-pdf-text.html").is_file():
    raise SystemExit("No original CIT Vite editor to publish")
if dest == root or root in dest.parents and dest.name not in {"cit-stage", "site-dist"}:
    raise SystemExit("Refusing unsafe publishing path")
if dest.exists():
    shutil.rmtree(dest)
dest.mkdir(parents=True)
for item in root.iterdir():
    if item.name in excluded or item == dest:
        continue
    if item.is_dir():
        shutil.copytree(item, dest / item.name, symlinks=False)
    elif item.is_file() and item.suffix not in {".zip", ".pyc"}:
        shutil.copy2(item, dest / item.name)

# Keep a separate path for the previously implemented HVD PDFium editor.
legacy_editor = dest / "text-editor.html"
if legacy_editor.exists():
    legacy_editor.rename(dest / "text-editor-hdv.html")

# Do not modify the original CIT html/css/js/wasm. Keeping bytewise identical
# build products makes source equivalence and regression audit possible.
shutil.copytree(upstream_dist, dest / "cit-native", dirs_exist_ok=True)
(dest / ".nojekyll").write_text("", encoding="utf-8")

target = "./cit-native/edit-pdf-text.html"
redirect = f"""<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport"
content="width=device-width,initial-scale=1">
<title>Chỉnh sửa Text PDF – CIT-PDF trong PDF HVD</title>
<meta http-equiv="refresh" content="0;url={html.escape(target)}">
<link rel="canonical" href="{html.escape(target)}"></head>
<body><p>Đang mở trình biên tập văn bản gốc CIT-PDF…
<a href="{html.escape(target)}">Nhấn vào đây nếu không tự chuyển</a>.</p>
<script>location.replace({json.dumps(target)}+location.search+location.hash);</script>
</body></html>
"""
legacy_editor.write_text(redirect, encoding="utf-8")
meta = {
    "upstream_repo": "https://github.com/Cuongyd196/cit-pdf",
    "upstream_tag": "1.0.0",
    "upstream_commit": "3c9c138d980a417de7439f383f37882a1d730ab6",
    "engine": "original pinned CIT Vite+PDFium build, unmodified",
    "path": "/PDF-Editor-Hdv/cit-native/edit-pdf-text.html",
    "legacy_fallback": "/PDF-Editor-Hdv/text-editor-hdv.html",
    "license": "AGPL-3.0-only"
}
(dest / "cit-native" / "hvd-vendor-lock.json").write_text(
    json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
print("HVD + original CIT stage:", dest)
print("CIT editor:", dest / "cit-native" / "edit-pdf-text.html")
print("Legacy editor:", dest / "text-editor-hdv.html")
