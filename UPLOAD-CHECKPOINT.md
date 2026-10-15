# Upload checkpoint — incomplete, not for deployment

The full CIT web integration was built and tested in the local HDV checkout.
Uploading the runtime assets was interrupted when the execution server disconnected.
This branch preserves only the Git objects uploaded so far. It does NOT contain
all runtime files and must NOT be merged into master or deployed in this state.

- Production remains at `c1599ec18327919edd66ba9bdfd3298400fdd2d1`.
- Local repository: `/workspace/scratch/bd00e5e24ed2/PDF-Editor-Hdv`.
- Last completed local Git tree: `9d93fdd6a265dca421afda1cd38ae2c9c530cc32`.
- Source: CIT 1.0.0, `3c9c138d980a417de7439f383f37882a1d730ab6`.
- 119 unique tool interfaces were smoke-tested.
- A complete browser run tested AES-256/reopen, reverse pages, metadata removal,
  PDF to TXT, compression, DOCX, table XLSX, TIFF, eng+vie searchable OCR and DOCX to PDF.
- Latest Node suite: 63 passes.
- Large engine files were subsequently split with SHA-256 verification because
  the connector accepts request bodies up to 16 MiB. The latest split-asset browser
  run reached the Office test before the executor disconnected; recover the log
  `/tmp/cit-split-results.log` and check its final result.

## Resume

1. Recover the existing local checkout; do not reset it to this partial branch.
2. Check `git status`, `git log -1` and `git rev-parse HEAD^{tree}`.
3. Regenerate the upload manifest from the local commit against production.
   The JSON checkpoint here is an earlier upload snapshot and predates the final
   split-asset manifests and reduced source archive.
4. UTF-8 files can be added with GitHub create_tree's inline `content`.
   Preserve original bytes/newlines when reading files. Read command output in
   chunks: unified exec output above approximately 512 KiB may be truncated.
5. Binary uploads must stay below the connector's 16 MiB JSON request limit
   (base64 expands bytes by 4/3). Use the final split engine files from the checkout.
6. Create the final tree and require its SHA to equal the verified local Git tree.
   Only then create a commit and update master with expected_sha as a lease.
7. Wait for Pages, verify .nojekyll assets and service worker paths, then test the
   deployed site. Do not report the 119-tool version as live before this succeeds.

Temporary logs: `/tmp/cit-final-results.log`, `/tmp/hdv-node-results.log`,
`/tmp/hdv-editor-regression.log`, `/tmp/cit-split-results.log`.
