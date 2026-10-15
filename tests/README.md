# PDF editor regression checks

Run from the repository root with Node.js 18 or newer:

```sh
node --test tests/*.test.cjs
```

No dependency install or build step is needed. The suite uses the repository's
actual pdf-lib bundle to generate inputs and reopen output PDFs. It checks
picker ordering, folder writes, duplicate filenames, cancellation, permission
and disk errors, delayed Blob URL cleanup, filename validation, repeated saves,
selected-page export, blank documents, multiple sources, and reordered duplicates.
Native file pickers, write permissions, DOM elements and the download link are
mocked; these checks do not verify the operating system's dialogs or browser UI.

Before release on a local desktop browser, also check:

1. Chrome/Edge over HTTPS or localhost: choose a folder, save, and open the PDF
   from that folder. Repeat with the same name and verify the existing file stays
   unchanged and a new version is created.
2. Choose Save As, wait for its native dialog, then cancel: no download starts.
   Retry, select a location and verify the saved PDF opens in another PDF viewer.
3. Select browser download mode, with and without the browser's “ask where to
   save” preference. Confirm the download completes and contains the changes.
4. In a browser without File System Access, native modes and the folder button
   should be disabled while browser download remains available.
5. Check the save dialog at narrow screen widths. Verify home navigation,
   search/filter/refresh, merge/range/rotate/delete/extract, upload/preview,
   selection, reorder/duplicate/insert, undo/redo and reopening the editor.
6. Recheck encrypted PDFs, digitally signed PDFs, bookmark preservation,
   annotations, large scans and A0/A1 drawings with representative fixtures.

## Layout-preserving text changes (2026-10-15)

The 47 Node checks cover saving plus text-run boundaries, table-cell detection,
font styles, solid background colors, rule protection, overflow, explicit shrink,
page rotations 0/90/180/270 and text angles 0/45/90/180/270. Saved PDFs are reopened
with PDF.js to verify their actual writing direction and baseline coordinates.

Optional browser integration (requires Playwright and a Chromium installation):

```sh
PDF_EDITOR_CHROMIUM=/path/to/chromium node tests/text-editor-browser.cjs
```

This starts a temporary localhost server and generates a representative six-row
Vietnamese table. It checks no-op edits, Escape, overflow rejection, explicit
shrink, Unicode editing, undo/redo, browser download, rotated editing and export,
home navigation/search/filter, and browser errors. Temporary fixtures/screenshots/output PDFs are kept in the
printed OS temporary directory, not in the repository. The integration checks
passed in Chromium 133.0.6943.0. Poppler independently rendered an exported PDF;
pixel comparison found no changes outside the edited cell, including table rules.
Native operating-system file pickers and permissions remain manual checks.

Known limits: replacement is still an opaque overlay, so original PDF text remains
underneath and this feature is not redaction. Original fonts are reused only when
usable Unicode glyphs are available; otherwise the UI names the fallback (Tinos
or Noto Sans). Complex image backgrounds, vertical/Type 3/skewed text and detected
vector overlaps are conservatively blocked. Table detection supports closed,
axis-aligned vector cells; it does not reconstruct arbitrary table semantics.
The user's original PDF behind the supplied screenshot was not available; testing
used generated fixtures with comparable table structure.
