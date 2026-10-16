#!/usr/bin/env python3
"""Reviewed, fail-closed patch of CIT 1.0.0 text module source (never minified JS).

CIT PDFium and all of its typography/splice algorithms remain the engine.
The patch exposes native success/failure and makes paragraph cascading opt-in.
"""
from __future__ import annotations

import pathlib
import subprocess
import sys

UPSTREAM_COMMIT = "3c9c138d980a417de7439f383f37882a1d730ab6"
APP_BLOB = "e1d32d2c9c7f596f281e330e1583e8094efaa007"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    found = source.count(old)
    if found != 1:
        raise SystemExit(f"Unsafe upstream change ({label}): expected 1 anchor, found {found}")
    return source.replace(old, new, 1)


def patch_app(source: str) -> str:
    source = replace_once(
        source, "function endEdit(commit) {", "function endEditOriginal(commit) {",
        "endEdit original entrypoint"
    )
    # A new geometry box must be added successfully *before* the old box is
    # removed. Otherwise addParagraph(null) can destroy the replaced content.
    source = replace_once(
        source,
        """        if (e.newGeom.replaces != null) {
          P().deleteParagraph(e.newGeom.replaces);
          state.paragraphs = state.paragraphs.filter(
            (q) => q.id !== e.newGeom.replaces
          );
        }
        const created = P().addParagraph(""",
        """        const created = P().addParagraph(""",
        "new paragraph prior deletion"
    )
    source = replace_once(
        source,
        """        if (created) {
          state.paragraphs.push(created);
          state.selection = { kind: 'para', para: created };""",
        """        if (created) {
          if (e.newGeom.replaces != null) {
            P().deleteParagraph(e.newGeom.replaces);
            state.paragraphs = state.paragraphs.filter(
              (q) => q.id !== e.newGeom.replaces
            );
          }
          state.paragraphs.push(created);
          state.selection = { kind: 'para', para: created };""",
        "delete replaced paragraph only after successful addition"
    )
    wrapper = """
// PDF Dao Chich: stable native session result, independent of the Vite hash.
// Preserve original CIT endEdit implementation. Instrument only the two
// PDFium paragraph write methods while it is called synchronously.
function endEdit(commit) {
  const editing = state.editing;
  if (!editing) return { ok: true, changed: false };
  if (!commit) {
    endEditOriginal(false);
    return { ok: true, cancelled: true };
  }
  const engine = P();
  if (!engine) return { ok: false, message: 'PDFium session is not available' };
  const beforeUndo = state.undo.slice();
  const beforeRedo = state.redo.slice();
  const htmlDraft = editing.editable?.innerHTML ?? '';
  const oldCommit = engine.commitParagraph;
  const oldAdd = engine.addParagraph;
  let attempted = false;
  let failed = false;
  let reason = '';
  engine.commitParagraph = function (...args) {
    attempted = true;
    const result = oldCommit.apply(this, args);
    if (!result) { failed = true; reason = 'PDFium commitParagraph returned no paragraph'; }
    return result;
  };
  engine.addParagraph = function (...args) {
    attempted = true;
    const result = oldAdd.apply(this, args);
    if (!result) { failed = true; reason = 'PDFium addParagraph returned no paragraph'; }
    return result;
  };
  try {
    endEditOriginal(true);
  } catch (error) {
    failed = true;
    reason = error?.message || String(error);
  } finally {
    engine.commitParagraph = oldCommit;
    engine.addParagraph = oldAdd;
  }
  if (!failed) return { ok: true, changed: attempted };
  // Restore the local history stack if the native commit was rejected.
  // This is a UI/history recovery, not a promise of WASM-level atomic rollback.
  state.undo = beforeUndo;
  state.redo = beforeRedo;
  try {
    if (editing.newGeom) {
      const overlay = $('overlay');
      if (editing.el && overlay && !editing.el.isConnected)
        overlay.appendChild(editing.el);
      state.editing = editing;
      editing.editable?.focus?.();
    } else {
      const para = state.paragraphs.find(p => p.id === editing.para.id)
        || editing.para;
      beginEdit(para);
      if (state.editing?.editable) {
        state.editing.editable.innerHTML = htmlDraft;
        state.editing.editable.focus();
      }
    }
  } catch (reopenError) {
    console.error('[PDF Dao Chich] Failed to recover native editor:', reopenError);
  }
  updateChrome();
  return { ok: false, message: reason || 'PDFium refused the text change' };
}

"""
    source = replace_once(
        source, "\nfunction updateHoverCursor(e) {",
        "\n" + wrapper + "function updateHoverCursor(e) {",
        "session result wrapper insertion"
    )
    # Native inspection is read-only. It must never turn the PDF's source font
    # into a guessed browser fallback when the user merely selects a paragraph.
    source = replace_once(
        source,
        "function syncInspector() {",
        """function hvdOriginalFontInfo() {
  const para = state.editing?.para ||
    (state.selection?.kind === 'para' ? state.selection.para : null);
  if (!para?.runs?.length) return null;
  const candidates = para.runs.map((run, idx) => ({ run, idx }))
    .filter(({ run }) => !run.atomic && typeof run.text === 'string' && run.text.trim());
  const selected = candidates.sort((a, b) =>
    [...b.run.text.trim()].length - [...a.run.text.trim()].length)[0] ||
    { run: para.runs[0], idx: 0 };
  let pick = selected;
  const edit = state.editing?.editable;
  if (edit) {
    const sel = window.getSelection();
    let target = null;
    if (sel?.rangeCount) {
      let node = sel.getRangeAt(0).startContainer;
      if (node.nodeType !== 1) node = node.parentElement;
      target = node?.closest?.('span[data-src]');
    }
    if (target && edit.contains(target)) {
      const idx = parseInt(target.dataset.src, 10);
      if (Number.isInteger(idx) && idx >= 0 && idx < para.runs.length)
        pick = { run: para.runs[idx], idx };
    }
  }
  const run = pick.run;
  const family = (run.family || 'Không xác định').trim();
  const font = docFontsReady.get(docFontKey(run));
  const need = docFontsNull.has(docFontKey(run));
  const embedded = Boolean(font);
  const local = [...PdfEngine.localFonts.keys()].some(k => {
    const name = k.split('|')[0].replace(/^[A-Z]{6}\\+/, '');
    return name.toLowerCase() === family.replace(/^[A-Z]{6}\\+/, '').toLowerCase();
  });
  const families = [...new Set(para.runs.filter(r => !r.atomic && r.text?.trim())
    .map(r => r.family || 'Không xác định'))];
  return {
    rawFamily: family,
    displayFamily: family.replace(/^[A-Z]{6}\\+/, ''),
    size: Number(run.size || 0),
    bold: Boolean(run.bold),
    italic: Boolean(run.italic),
    rgba: (run.rgba || 0) >>> 0,
    hScale: Number(run.hScale ?? 1),
    characterCount: [...(run.text || '')].length,
    mixed: families.length > 1,
    families,
    source: embedded ? 'embedded' : local ? 'local' : need ? 'unavailable' : 'loading',
    subset: /^[A-Z]{6}\\+/.test(family),
    paraId: para.id,
    runIndex: pick.idx
  };
}
async function hvdLoadSelectedSystemFont() {
  const info = hvdOriginalFontInfo();
  if (!info?.displayFamily) return null;
  // Browser permission is required. This call originates only from the user
  // pressing the 'load fonts from computer' button.
  await loadSystemFonts(false);
  await ensureLocalFontBytes(info.displayFamily);
  return hvdOriginalFontInfo();
}
async function hvdEnsureSelectedOriginalFont() {
  const info = hvdOriginalFontInfo();
  const para = state.editing?.para ||
    (state.selection?.kind === 'para' ? state.selection.para : null);
  if (!info || !para) return null;
  if (info.source !== 'loading') return info;
  try {
    await ensureRunFont(para, info.runIndex, para.runs[info.runIndex]);
  } catch (e) { console.warn('[PDF Dao Chich] original PDF font:', e); }
  return hvdOriginalFontInfo();
}
function syncInspector() {""",
        "original-font inspection and lazy loading"
    )
    source = replace_once(
        source,
        "  let r = p?.runs[0] || {};",
        """  // One PDF paragraph may contain a decorative initial or several fonts.
  // Show the predominant original text style until the caret picks an exact run.
  const fontInfo = hvdOriginalFontInfo();
  let r = fontInfo && p?.runs?.[fontInfo.runIndex] || p?.runs[0] || {};""",
        "original predominant font in inspector"
    )
    # Native paging is exposed without duplicating PDFium geometry.
    # A custom event after every page change keeps the thumbnail rail in sync
    # with footer navigation, search, keyboard and direct page-number entry.
    source = replace_once(
        source,
        """  $('pageLabel').textContent = has
    ? `${eng.pageIndex + 1} / ${eng.pageCount}`
    : '– / –';""",
        """  $('pageLabel').textContent = has
    ? `${eng.pageIndex + 1} / ${eng.pageCount}`
    : '– / –';
  if (has) {
    const pageState = eng.pageIndex + ':' + eng.pageCount;
    if (window.__HVD_LAST_PAGE_STATE !== pageState) {
      window.__HVD_LAST_PAGE_STATE = pageState;
      window.dispatchEvent(new CustomEvent('hvd:pagechange', {
        detail: { index: eng.pageIndex, count: eng.pageCount }
      }));
    }
  }""",
        "notify page thumbnail rail of native page changes"
    )
    source = replace_once(
        source,
        """  fitZoom();
  updateChrome();
}

async function saveFile() {""",
        """  fitZoom();
  updateChrome();
  // Fire only after the PDFium document has successfully opened.
  window.dispatchEvent(new CustomEvent('hvd:document-open', {
    detail: { file, count: P().pageCount }
  }));
}

async function saveFile() {""",
        "register original PDF bytes for lazy thumbnails only after open"
    )
    source = replace_once(
        source,
        """    getFontInfo: hvdOriginalFontInfo,
    ensureSelectedOriginalFont: hvdEnsureSelectedOriginalFont,""",
        """    getFontInfo: hvdOriginalFontInfo,
    getPageCount: () => P()?.pageCount || 0,
    getPageIndex: () => P()?.pageIndex ?? 0,
    navigateToPage: index => goToPage(index),
    ensureSelectedOriginalFont: hvdEnsureSelectedOriginalFont,""",
        "stable native PDFium paging API"
    )
    # CIT caches web-renderable PDF font blobs by family + bold/italic.
    # When another PDF is loaded, that key may resolve to a DIFFERENT subset.
    # Clear only the per-document font cache to prevent cross-document glyphs.
    source = replace_once(
        source,
        """async function openFile(file, sourceUrl = null, knownBytes) {
  endEdit(false);""",
        """async function openFile(file, sourceUrl = null, knownBytes) {
  endEdit(false);
  // Original embedded font bytes belong to this document, not the next PDF.
  clearTimeout(fontPrewarmTimer);
  docFonts.clear();
  docFontsReady.clear();
  docFontsNull.clear();
  _fontADCache.clear();""",
        "reset previous document font subset cache"
    )
    source = replace_once(
        source, "function cascadeParagraphGrowth(updated, prevBottom) {",
        """let hvdAutoReflow = false;
function cascadeParagraphGrowth(updated, prevBottom) {
  if (!hvdAutoReflow) return;""",
        "opt-in paragraph cascading"
    )
    source = replace_once(
        source,
        """async function saveFile() {
  endEdit(true);
  const incremental""",
        """async function saveFile() {
  const applied = endEdit(true);
  if (applied?.ok === false) {
    toast('PDF text was not committed; export cancelled.');
    return;
  }
  const incremental""",
        "block export on failed active edit"
    )
    source = replace_once(
        source,
        """  a.href = URL.createObjectURL(blob);
  a.download = state.fileName;
  a.click();
  URL.revokeObjectURL(a.href);""",
        """  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = state.fileName;
  a.click();
  // Immediate revoke races the browser download handler on some devices.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);""",
        "defer download Blob cleanup"
    )
    source = replace_once(
        source,
        """  if (onSaved) onSaved(savedKb, state.fileName);
  else toast('Saved ' + savedKb + ' KB');""",
        """  if (onSaved) onSaved(savedKb, state.fileName);
  const hvdStatus = document.getElementById('hvd-apply-state');
  if (hvdStatus) {
    hvdStatus.hidden = false;
    hvdStatus.dataset.error = 'false';
    hvdStatus.textContent = 'Đã xuất PDF (' + savedKb + ' KB); tài liệu vẫn mở để chỉnh sửa tiếp.';
  } else if (!onSaved) toast('Saved ' + savedKb + ' KB');""",
        "non-obstructing export status and continued editing"
    )
    source = replace_once(
        source,
        """export {
  openFile,
  engineReady,""",
        """// Stable interface for the HVD control strip, attached to the same CIT module.
if (typeof window !== 'undefined') {
  window.__HVD_CIT_TEXT_API = Object.freeze({
    endEdit,
    hasActiveEdit: () => Boolean(state.editing),
    getFontInfo: hvdOriginalFontInfo,
    ensureSelectedOriginalFont: hvdEnsureSelectedOriginalFont,
    loadSelectedSystemFont: hvdLoadSelectedSystemFont,
    getAutoReflow: () => hvdAutoReflow,
    setAutoReflow: value => (hvdAutoReflow = Boolean(value)),
  });
}

export {
  openFile,
  engineReady,""",
        "stable API exposed by pinned source"
    )
    for expected in ["hvdAutoReflow = false", "__HVD_CIT_TEXT_API",
                     "if (applied?.ok === false)", "function endEditOriginal(commit)"]:
        if expected not in source:
            raise SystemExit(f"Patched source missing {expected}")
    return source


def main(upstream_root: pathlib.Path) -> None:
    upstream_root = upstream_root.resolve()
    commit = subprocess.check_output(
        ["git", "-C", str(upstream_root), "rev-parse", "HEAD"], text=True
    ).strip()
    if commit != UPSTREAM_COMMIT:
        raise SystemExit(f"Wrong upstream CIT checkout: {commit}")
    target = upstream_root / "src/js/editcore/app.js"
    blob = subprocess.check_output(["git", "hash-object", str(target)], text=True).strip()
    if blob != APP_BLOB:
        raise SystemExit(f"Unsafe modified upstream app.js: {blob}")
    source = target.read_text(encoding="utf-8")
    target.write_text(patch_app(source), encoding="utf-8")
    # CIT 1.0.0 itself has a TypeScript structural cast error: the JS
    # getDocDescription().fields inference is {} rather than Record<string,string>.
    # This is an explicit module-boundary assertion, not an algorithm rewrite.
    entry = upstream_root / "src/js/logic/edit-pdf-text-page.ts"
    entry_source = entry.read_text(encoding="utf-8")
    entry_source = replace_once(
        entry_source,
        "appModule = (await import('../editcore/app.js')) as EditorAppModule;",
        "appModule = (await import('../editcore/app.js')) as unknown as EditorAppModule;",
        "TypeScript native module boundary cast"
    )
    entry_source = replace_once(
        entry_source,
        """      appModule.setOnSaved((kb) => {
        showAlert(
          t('common.success'),
          t('tools:editPdfText.saved', { size: kb }),
          'success',
          () => {
            closeEditor();
          }
        );
      });""",
        """      appModule.setOnSaved((kb) => {
        const status = document.getElementById('hvd-apply-state');
        if (status) {
          status.hidden = false;
          status.dataset.error = 'false';
          status.textContent = 'Đã xuất PDF (' + kb + ' KB). Có thể tiếp tục chỉnh sửa.';
        }
        // Export does not dismiss or close the active PDF workspace.
      });""",
        "export retains open document and avoids blocking dialog"
    )
    # PDF.js only powers thumbnails; native PDFium still handles all
    # editing, navigation, history and saves. Thumbnails load lazily and
    # an independent PDF.js document is never used as an editable source.
    entry_source = replace_once(
        entry_source,
        "import { batchDecryptIfNeeded } from '../utils/password-prompt.js';",
        """import { batchDecryptIfNeeded } from '../utils/password-prompt.js';
import { getPDFDocument } from '../utils/helpers.js';""",
        "PDFjs read-only thumbnail dependency"
    )
    entry_source = replace_once(
        entry_source,
        "function buildMenu(anchor: HTMLElement, cls: string): HTMLDivElement {",
        """type HvdThumbnailDocument = {
  getPage: (index: number) => Promise<{
    getViewport: (opts: {scale: number}) => {width: number; height: number};
    render: (opts: {
      canvasContext: CanvasRenderingContext2D;
      viewport: {width: number; height: number}
    }) => {promise: Promise<unknown>};
    cleanup?: () => void;
  }>;
  destroy?: () => Promise<void>;
};
let hvdThumbnailFile: File | null = null;
let hvdThumbnailDoc: Promise<HvdThumbnailDocument> | null = null;
let hvdThumbnailTask: {destroy: () => Promise<void>} | null = null;
let hvdThumbnailVersion = 0;
function hvdThumbnailSource(file: File) {
  hvdThumbnailVersion++;
  hvdThumbnailFile = file;
  hvdThumbnailDoc = null;
  const previous = hvdThumbnailTask;
  hvdThumbnailTask = null;
  if (previous) void previous.destroy().catch(() => {});
}
async function hvdRenderPageThumbnail(index: number): Promise<string | null> {
  const file = hvdThumbnailFile;
  const version = hvdThumbnailVersion;
  if (!file || !Number.isInteger(index) || index < 0) return null;
  if (!hvdThumbnailDoc) {
    hvdThumbnailDoc = file.arrayBuffer().then(buffer => {
      if (version !== hvdThumbnailVersion) throw new Error('PDF has changed');
      const task = getPDFDocument({data: buffer.slice(0)});
      hvdThumbnailTask = task;
      return task.promise as Promise<HvdThumbnailDocument>;
    }).catch(error => {
      if (version === hvdThumbnailVersion) hvdThumbnailDoc = null;
      throw error;
    });
  }
  const doc = await hvdThumbnailDoc;
  if (version !== hvdThumbnailVersion) return null;
  const page = await doc.getPage(index + 1);
  if (version !== hvdThumbnailVersion) return null;
  const natural = page.getViewport({scale:1});
  const scale = Math.min(152 / natural.width, 198 / natural.height, 0.55);
  const viewport = page.getViewport({scale:Math.max(0.02,scale)});
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1,Math.round(viewport.width));
  canvas.height = Math.max(1,Math.round(viewport.height));
  const ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) return null;
  await page.render({canvasContext:ctx,viewport}).promise;
  page.cleanup?.();
  return version === hvdThumbnailVersion ? canvas.toDataURL('image/jpeg',0.78) : null;
}
if (typeof window !== 'undefined') {
  const hvd = window as Window & {
    __HVD_PDF_THUMBNAILS?: {
      render: (index:number) => Promise<string|null>;
      clear: () => void;
    };
  };
  hvd.__HVD_PDF_THUMBNAILS = {
    render: hvdRenderPageThumbnail,
    clear: () => { hvdThumbnailVersion++; hvdThumbnailFile = null; hvdThumbnailDoc = null;
      const task = hvdThumbnailTask; hvdThumbnailTask = null;
      if (task) void task.destroy().catch(()=>{}); }
  };
  window.addEventListener('hvd:document-open', (event: Event) => {
    const documentEvent = event as CustomEvent<{file:File}>;
    if (documentEvent.detail?.file) hvdThumbnailSource(documentEvent.detail.file);
  });
}
function buildMenu(anchor: HTMLElement, cls: string): HTMLDivElement {""",
        "document-scoped lazy PDFjs page thumbnails"
    )
    # Report the actual load phase to the user instead of a permanent,
    # unqualified spinner. No changes to the PDFium parsing algorithms.
    entry_source = replace_once(
        entry_source,
        "async function launchEditor(file: File) {",
        """function hvdOpenStage(stage: string) {
  (window as Window & { __HVD_PDF_OPEN_STAGE?: string }).__HVD_PDF_OPEN_STAGE = stage;
  const label = document.getElementById('loader-text');
  if (label) label.textContent = stage;
}
async function launchEditor(file: File) {""",
        "load stage reporting"
    )
    entry_source = replace_once(
        entry_source,
        """  launching = true;
  showLoader('Loading PDF Text Editor...');
  try {
    hideLoader();
    const decrypted = await batchDecryptIfNeeded([file]);""",
        """  launching = true;
  showLoader('Đang chuẩn bị tài liệu PDF...');
  hvdOpenStage('Đang kiểm tra cấu trúc và mật khẩu PDF...');
  try {
    hideLoader();
    const decrypted = await batchDecryptIfNeeded([file]);""",
        "password preflight progress"
    )
    entry_source = replace_once(
        entry_source,
        """    showLoader('Loading PDF Text Editor...');
    document.getElementById('uploader')?.classList.add('hidden');""",
        """    showLoader('Đang tải trình chỉnh sửa PDFium...');
    hvdOpenStage('Đang tải lõi chỉnh sửa PDFium...');
    document.getElementById('uploader')?.classList.add('hidden');""",
        "source module progress"
    )
    entry_source = replace_once(
        entry_source,
        """    const engineOk = await appModule.engineReady;
    if (!engineOk) {
      throw new Error('WASM engine failed to initialize');
    }
    await appModule.openFile(decrypted[0]);""",
        """    hvdOpenStage('Đang khởi tạo lõi PDFium...');
    const engineOk = await new Promise<boolean>((resolve, reject) => {
      const timer = window.setTimeout(() =>
        reject(new Error('PDFium không khởi tạo sau 45 giây; hãy thử khôi phục cache')), 45000);
      Promise.resolve(appModule!.engineReady).then(
        ok => { window.clearTimeout(timer); resolve(ok); },
        error => { window.clearTimeout(timer); reject(error); }
      );
    });
    if (!engineOk) {
      throw new Error('WASM engine failed to initialize');
    }
    hvdOpenStage('Đang phân tích font, đối tượng và dựng trang PDF...');
    await appModule.openFile(decrypted[0]);
    hvdOpenStage('PDF đã mở thành công');""",
        "PDFium ready bounded and parse phase instrumented"
    )
    entry_source = replace_once(
        entry_source,
        """  } catch (error) {
    console.error('Error loading PDF Text Editor:', error);
    showAlert(t('common.error'), t('tools:editPdfText.failedToLoad'));
    closeEditor();
  } finally {
    hideLoader();
    launching = false;
  }
}

function handleFiles""",
        """  } catch (error) {
    const stage = (window as Window & { __HVD_PDF_OPEN_STAGE?: string })
      .__HVD_PDF_OPEN_STAGE || 'không xác định';
    const reason = error instanceof Error ? error.message : String(error);
    console.error('Error loading PDF Text Editor at ' + stage, error);
    showAlert(t('common.error'), 'Không thể mở PDF (' + stage + '): ' + reason);
    closeEditor();
  } finally {
    hideLoader();
    launching = false;
  }
}

function handleFiles""",
        "specific PDF open error instead of generic unknown error"
    )
    entry.write_text(entry_source, encoding="utf-8")

    # pdf.js probes all PDFs before PDFium opens them. Some valid complex CAD
    # PDFs leave this *optional* encryption detector pending indefinitely.
    # After a bounded wait, proceed with the original bytes. PDFium still
    # asks for a password itself if encryption is actually present.
    password = upstream_root / "src/js/utils/password-prompt.ts"
    pw_source = password.read_text(encoding="utf-8")
    pw_source = replace_once(
        pw_source,
        """  return new Promise((resolve) => {
    let settled = false;
    const task = getPDFDocument({ data: bytes.slice(0) });

    task.onPassword = () => {
      if (!settled) {
        settled = true;
        resolve(true);
        task.destroy().catch(() => {});
      }
    };

    task.promise
      .then((doc) => {
        doc.destroy();
        if (!settled) {
          settled = true;
          resolve(false);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      });
  });""",
        """  return new Promise((resolve) => {
    let settled = false;
    const task = getPDFDocument({ data: bytes.slice(0) });
    const finish = (encrypted: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(encrypted);
    };
    const timer = window.setTimeout(() => {
      console.warn('[PDF Dao Chich] PDF.js encryption preflight timed out; native PDFium will open the original document');
      finish(false);
      void task.destroy().catch(() => {});
    }, 12000);
    task.onPassword = () => {
      finish(true);
      void task.destroy().catch(() => {});
    };
    task.promise.then(doc => {
      void doc.destroy();
      finish(false);
    }).catch(() => finish(false));
  });""",
        "bounded nonessential PDFjs encrypted-file probe"
    )
    password.write_text(pw_source, encoding="utf-8")
    print("PASS: pinned CIT/PDFium core, bounded PDF.js preflight and diagnostic open stages")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: patch_source.py <cit-upstream-root>")
    main(pathlib.Path(sys.argv[1]))
