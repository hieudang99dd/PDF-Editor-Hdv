#!/usr/bin/env python3
"""Cross-reader native CIT output acceptance using PyMuPDF, independent of old PDF.js 3.x.

Assert original glyph text is surgically replaced; second CAD annotation text
and original page geometry remain.
"""
import pathlib
import sys
import fitz

source, target = (pathlib.Path(p) for p in sys.argv[1:3])
with fitz.open(source) as old_doc, fitz.open(target) as new_doc:
    assert len(new_doc) == len(old_doc) == 1, "PDF page count changed"
    old, new = old_doc[0], new_doc[0]
    original = old.get_text()
    rewritten = new.get_text()
    assert "CIT ORIGINAL LINE" in original, repr(original)
    assert "CIT NATIVE EDITED" in rewritten, repr(rewritten)
    assert "CIT ORIGINAL LINE" not in rewritten, repr(rewritten)
    assert "SECOND CAD LINE" in rewritten, repr(rewritten)
    assert abs(old.rect.width - new.rect.width) < 0.1, "Page width changed"
    assert abs(old.rect.height - new.rect.height) < 0.1, "Page height changed"
    assert len(new.get_text("rawdict")["blocks"]) >= 2, "Lost vector text content"
print("PASS: native CIT PDFium text replacement survives independent PyMuPDF parsing")
