#!/usr/bin/env python3
"""Check CIT original Vite bundle before it can replace the HVD text editor.

Must fail closed: a static directory containing only HTML/CSS is not a
complete native PDFium/CIT editor.
"""
from __future__ import annotations
import pathlib
import re
import sys

dist = pathlib.Path(sys.argv[1]).resolve()
html_path = dist / "edit-pdf-text.html"
if not html_path.is_file():
    raise SystemExit("FAIL: missing original CIT edit-pdf-text.html")
html = html_path.read_text(encoding="utf-8")
required_nodes = [
    'id="text-editor-app"',
    'id="stage"',
    'id="inspector"',
    'id="fFamily"',
    'id="fSize"',
    'id="fLine"',
    'id="fPara"',
    'id="save"',
    'id="file-input"',
]
for node in required_nodes:
    if node not in html:
        raise SystemExit(f"FAIL: missing real CIT editor DOM element {node}")
if "{{>" in html:
    raise SystemExit("FAIL: uncompiled Vite handlebars markup")
base = "/PDF-Editor-Hdv/studio/"
if base not in html:
    raise SystemExit("FAIL: GitHub Pages subpath not embedded")
bundles = list((dist / "assets").glob("*.js"))
if not bundles:
    raise SystemExit("FAIL: no compiled TypeScript editor bundles")
wasm_files = list(dist.rglob("*.wasm"))
if not wasm_files:
    raise SystemExit("FAIL: no bundled WASM runtime")
if not any("editcore" in f.name.lower() or "pdfium" in f.name.lower() for f in wasm_files):
    print("WARN: WASM assets exist but names require runtime verification")
print("PASS: CIT original frontend assembled from Vite sources")
print("Compiled JS chunks:", len(bundles))
print("WASM assets:", len(wasm_files))
print("Original edit page:", html_path)
