# Save regression checks

Run from the repository root with Node.js 18 or newer:

```sh
node --test tests/save.test.cjs
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

The current environment could run the Node checks and syntax validation but
could not install a browser binary, so the desktop UI checklist remains manual.
