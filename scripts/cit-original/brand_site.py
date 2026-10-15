#!/usr/bin/env python3
"""Rebrand the *presentation* of the pinned upstream Vite distribution.

Only HTML document titles, SEO identities, favicons, manifest and HVD
navigation bridge are changed. Preserve copyright/legal notices, bundled
licenses, original JS/CSS/WASM byte-for-byte, and all original algorithms.
"""
from __future__ import annotations
import json
import pathlib
import re
import sys

PAGE_BASE = "/PDF-Editor-Hdv/studio/"
SITE_ROOT = "https://hieudang99dd.github.io"
SITE_URL = SITE_ROOT + "/PDF-Editor-Hdv/"
APP_TITLE = "PDF HVD – Chỉnh sửa văn bản"
MANIFEST = {
    "name": "PDF HVD – Trình chỉnh sửa PDF",
    "short_name": "PDF HVD",
    "description": "Chỉnh sửa văn bản PDF, giữ định dạng và xuất PDF ngay trên trình duyệt.",
    "lang": "vi",
    "start_url": SITE_URL + "text-editor.html",
    "scope": SITE_URL,
    "display": "standalone",
    "background_color": "#161c22",
    "theme_color": "#0d9488",
    "icons": [{"src": PAGE_BASE + "hvd-mark.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable"}],
}

def meta_attr(content: str, key: str, value: str, property_: bool = False) -> str:
    typ = "property" if property_ else "name"
    pat = rf'(<meta\s+{typ}="{re.escape(key)}"\s+content=")[^"]*("\s*/?>)'
    return re.sub(pat, lambda m: m.group(1) + value + m.group(2), content, count=1)

def rebrand_page(html: str, page_name: str) -> str:
    title = APP_TITLE if page_name == "edit-pdf-text.html" else None
    def title_repl(match: re.Match[str]) -> str:
        current = match.group(2).strip()
        actual = title or re.sub(r"\s*[|–-]\s*BentoPDF\s*$", " – PDF HVD", current, flags=re.I)
        if actual == current and "BentoPDF" in current:
            actual = current.replace("BentoPDF", "PDF HVD")
        return match.group(1) + actual + match.group(3)
    html = re.sub(r"(<title[^>]*>)(.*?)(</title>)", title_repl, html, count=1, flags=re.S | re.I)
    parsed = re.search(r"<title>([^<]+)</title>", html)
    actual = title or (parsed.group(1).strip() if parsed else "PDF HVD – Công cụ PDF")
    canonical = SITE_URL + "text-editor.html" if page_name == "edit-pdf-text.html" else SITE_URL + "studio/" + page_name
    for key,val in {
        "title":actual, "author":"PDF HVD",
        "apple-mobile-web-app-title":"PDF HVD"
    }.items():
        html = meta_attr(html,key,val)
    for key,val in {
        "og:title":actual, "og:site_name":"PDF HVD", "og:url":canonical
    }.items():
        html=meta_attr(html,key,val,True)
    for key,val in {"twitter:title":actual, "twitter:url":canonical}.items():
        html=meta_attr(html,key,val)
    html = re.sub(r'<meta name="twitter:site" content="[^"]*"\s*/?>', "", html, count=1)
    html = re.sub(r'(<link rel="canonical" href=")[^"]*(")',lambda m:m.group(1)+canonical+m.group(2),html,count=1)
    html = re.sub(r'(<link rel="manifest" href=")[^"]*(")',lambda m:m.group(1)+PAGE_BASE+"hvd-site.webmanifest"+m.group(2),html,count=1)
    html = re.sub(r'(<link rel="icon"[^>]*href=")[^"]*(")',lambda m:m.group(1)+PAGE_BASE+"hvd-mark.svg"+m.group(2),html,flags=re.S)
    html = re.sub(r'(<link rel="apple-touch-icon"[^>]*href=")[^"]*(")',lambda m:m.group(1)+PAGE_BASE+"hvd-mark.svg"+m.group(2),html,flags=re.S)
    # Apply branding before first paint. Preserve footer-copyright and
    # all legal notices; only replace the product identity, not author credit.
    html = re.sub(
        r'(<span id="nav-brand"[^>]*>\s*<a href=")[^"]*(">)\s*BentoPDF(\s*</a>)',
        lambda m: m.group(1) + SITE_URL + 'index.html' + m.group(2) + 'PDF HVD' + m.group(3),
        html, count=1, flags=re.S)
    html = re.sub(
        r'(<span id="footer-brand"[^>]*>)\s*BentoPDF(\s*</span>)',
        lambda m: m.group(1) + 'PDF HVD' + m.group(2),
        html, count=1, flags=re.S)
    for ident in ('nav-logo', 'footer-logo'):
        html = re.sub(
            r'(<img\b[^>]*\bid="' + ident + r'"[^>]*\bsrc=")[^"]*(")',
            lambda m: m.group(1) + PAGE_BASE + 'hvd-mark.svg' + m.group(2),
            html, count=1, flags=re.S)
        html = re.sub(
            r'(<img\b[^>]*\bid="' + ident + r'"[^>]*\balt=")[^"]*(")',
            lambda m: m.group(1) + 'PDF HVD' + m.group(2),
            html, count=1, flags=re.S)
    if 'href="hvd-hub.css"' not in html:
        if "</head>" not in html: raise ValueError("No closing HEAD")
        html=html.replace("</head>",'  <link rel="stylesheet" href="hvd-hub.css">\n  </head>',1)
    if 'src="hvd-hub.js"' not in html:
        if "</body>" not in html: raise ValueError("No closing BODY")
        html=html.replace("</body>",'  <script defer src="hvd-hub.js"></script>\n  </body>',1)
    # Original footer copyrights and their legal notices are NOT replaced.
    return html

def main(folder: pathlib.Path) -> None:
    pages = list(folder.rglob("*.html"))
    if not pages or not (folder / "edit-pdf-text.html").exists():
        raise SystemExit("Missing the complete original PDF frontend")
    for page in pages:
        # Support original CIT nested HTML/SPA entries. Relative bridge asset
        # links are correct for top-level tool pages; nested pages still use
        # absolute URL paths through their Vite base.
        html=page.read_text(encoding="utf-8")
        if page.parent == folder:
            html=rebrand_page(html,page.name)
        page.write_text(html,encoding="utf-8")
    (folder / "hvd-site.webmanifest").write_text(
        json.dumps(MANIFEST,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    assert (folder / "edit-pdf-text.html").read_text(encoding="utf-8").count("hvd-hub.js")==1
    print("PASS: brand applied to",len(pages),"frontend HTML documents")
    print("PASS: original copyright notices preserved in source HTML; license files untouched")
if __name__=="__main__":
    main(pathlib.Path(sys.argv[1]).resolve())
