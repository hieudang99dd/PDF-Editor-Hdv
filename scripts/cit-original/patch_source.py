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
    entry.write_text(entry_source, encoding="utf-8")
    print("PASS: pinned CIT native commit result, opt-in reflow and guarded save")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: patch_source.py <cit-upstream-root>")
    main(pathlib.Path(sys.argv[1]))
