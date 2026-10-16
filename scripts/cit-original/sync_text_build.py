#!/usr/bin/env python3
"""Sync rebuilt, pinned CIT-PDF text dependencies without replacing approved HVD UI.

The original Studio HTML markup, branding, tools and CSS are retained.
Only the Vite-generated import/preload/stylesheet references for the *text*
entrypoint are rewired and corresponding static dependencies are copied.
No minified JavaScript is edited.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import shutil
import sys

UPSTREAM = "3c9c138d980a417de7439f383f37882a1d730ab6"
BASE = "/PDF-Editor1/studio/"
VENDOR = re.compile(r'<(?:script|link)\b[^>]*(?:src|href)="[^"]*assets/[^"]+"[^>]*>(?:</script>)?')
JS_REF = re.compile(r'(?:/PDF-Editor1/studio/|\./)?assets/[^"?#\s]+\.(?:js|css)')


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def vendor_tags(html: str) -> list[str]:
    result = []
    for match in VENDOR.finditer(html):
        tag = match.group(0)
        if 'type="module"' in tag and tag.startswith("<script"):
            result.append(tag)
        elif 'rel="modulepreload"' in tag or ('rel="stylesheet"' in tag and 'crossorigin' in tag):
            result.append(tag)
    return result


def main(dist: pathlib.Path, root: pathlib.Path) -> None:
    dist = dist.resolve()
    root = root.resolve()
    current = root / "studio" / "edit-pdf-text.html"
    upstream = dist / "edit-pdf-text.html"
    if not current.is_file() or not upstream.is_file():
        raise SystemExit("Missing approved text UI or compiled CIT text entrypoint")
    original = current.read_text(encoding="utf-8")
    built = upstream.read_text(encoding="utf-8")
    tags = vendor_tags(built)
    if len(tags) < 4 or BASE not in built:
        raise SystemExit("Refusing incomplete/wrong-base CIT frontend bundle")
    required_ids = ('text-editor-app','overlay','inspector','save','file-input',
                    'fFamily','fSize','fLine','fPara')
    for ident in required_ids:
        if f'id="{ident}"' not in original or f'id="{ident}"' not in built:
            raise SystemExit(f"DOM contract mismatch: {ident}")
    if "hvd-brandbar" not in original or "hvd-text-apply.js" not in original:
        raise SystemExit("Refusing to replace approved PDF Dao Chich chrome")
    # An exact Vite hash collision should never contain different bytes.
    assets = dist / "assets"
    if not assets.is_dir():
        raise SystemExit("Compiled editcore has no assets directory")
    copied = []
    for src in sorted(assets.rglob("*")):
        if not src.is_file():
            continue
        rel = src.relative_to(dist)
        dest = root / "studio" / rel
        if dest.exists() and digest(dest) != digest(src):
            raise SystemExit(f"Hashed vendor asset changed in place: {rel}")
        if not dest.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        copied.append(str(rel).replace("\\", "/"))
    # The text dependency graph also references fonts/wasm on Studio root.
    # Do not overwrite any existing shared editor, worker, HTML or brand file.
    for src in sorted(dist.iterdir()):
        if not src.is_file() or src.suffix.lower() in (".html", ".br"):
            continue
        if src.name in {"sw.js", "config.json"} or src.name.startswith("hvd-"):
            continue
        dest = root / "studio" / src.name
        if not dest.exists():
            shutil.copy2(src, dest)
            copied.append(src.name)
        elif digest(dest) != digest(src) and src.suffix == ".wasm":
            raise SystemExit(f"Conflicting shared WASM filename: {src.name}")
    # Rewire the Vite entrypoint without replacing a single paragraph of HTML.
    lines = original.splitlines(keepends=True)
    output = []
    replaced = 0
    inserted = False
    for line in lines:
        stripped = line.strip()
        relevant = ("assets/" in line and (
            ('<script' in line and 'type="module"' in line) or
            ('<link' in line and 'rel="modulepreload"' in line) or
            ('<link' in line and 'rel="stylesheet"' in line and 'crossorigin' in line)
        ))
        if relevant:
            replaced += 1
            if not inserted:
                output.extend("    " + tag + "\n" for tag in tags)
                inserted = True
            continue
        output.append(line)
    if replaced < 4:
        raise SystemExit("Compiled entrypoint mismatch; refusing destructive rewrite")
    rewritten = "".join(output)
    if "/PDF-Editor-Hdv/studio/" in rewritten:
        raise SystemExit("Legacy Pages base detected")
    # Brand and user-approved inspector markup must remain byte-identical
    # outside the Vite dependency tags.
    for marker in ('id="hvd-brandbar"', 'id="hvd-editor-recovery"',
                   'hvd-text-apply.js', 'hvd-brand.css'):
        if marker not in rewritten:
            raise SystemExit(f"Approved editor marker missing: {marker}")
    current.write_text(rewritten, encoding="utf-8")
    graph = []
    for rel in copied:
        path = root / "studio" / rel
        graph.append({"path": rel, "sha256": digest(path), "size": path.stat().st_size})
    manifest = {
        "schema": 1,
        "upstream": "https://github.com/Cuongyd196/cit-pdf",
        "commit": UPSTREAM,
        "base": BASE,
        "vendor_tags": tags,
        "assets": graph,
        "brand_html_retained": True,
        "algorithm_changed_in_source_not_minified": True,
    }
    (root / "studio" / "hvd-text-build.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: synced {len(graph)} text assets; retained branded HTML; rewired {replaced} vendor tags")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: sync_text_build.py <cit-dist> <repo-root>")
    main(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
