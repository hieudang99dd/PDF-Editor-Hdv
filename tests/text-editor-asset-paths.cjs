// Run: node tests/text-editor-asset-paths.cjs
// Static deployment checks only. An interactive browser/PDF smoke test is still required.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const at = rel => path.join(root, rel);
const read = rel => fs.readFileSync(at(rel), 'utf8');
const paths = [
  'studio/edit-pdf-text.html',
  'studio/assets/edit-pdf-text-DRxmk-wp.js',
  'studio/assets/main-DwO0x_KA.js',
  'studio/assets/core-ClKb89zT.js',
  'studio/assets/font-loader-CVZcujpS.js',
  'studio/assets/wasm-provider-BbOMZgYX.js',
  'studio/assets/style-B64az6_y.css',
  'studio/assets/lucide-DZsz3ibU.css',
  'studio/hvd-site.webmanifest',
];
for (const p of paths) {
  assert.ok(fs.existsSync(at(p)), 'Missing runtime file: ' + p);
  assert.ok(!read(p).includes('/PDF-Editor-Hdv/studio/'), 'Old absolute base remains in ' + p);
}
const html = read('studio/edit-pdf-text.html');
assert.ok(html.includes('<html lang="vi">'), 'Expected Vietnamese uploader');
for (const attr of ['src="./assets/edit-pdf-text-DRxmk-wp.js"', 'href="./assets/style-B64az6_y.css"', 'href="./assets/edit-pdf-text-CBd7slK6.css"'])
  assert.ok(html.includes(attr), 'Missing relative asset reference: ' + attr);
for (const m of html.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+\.(?:js|css))"/g))
  assert.ok(fs.existsSync(path.resolve(root, 'studio', m[1])), 'Referenced asset missing: ' + m[1]);
assert.ok(read('studio/assets/main-DwO0x_KA.js').includes('Hr.workerSrc=\`./assets/pdf.worker-C317IdDw.js\`'), 'Worker URI is not relative');
assert.ok(read('studio/assets/core-ClKb89zT.js').includes('new URL(\`./editcore-Uyyxl379.wasm\`,'), 'PDFium WASM is not module-relative');
for (const p of ['studio/assets/pdf.worker-C317IdDw.js', 'studio/assets/editcore-Uyyxl379.wasm', 'studio/qpdf.wasm'])
  assert.ok(fs.existsSync(at(p)), 'Missing PDF engine binary: ' + p);
assert.ok(read('studio/assets/main-DwO0x_KA.js').includes("_e=function(e){return new URL(\`../\${e}\`,import.meta.url).href}"), 'Broken preloader creates /studio/assets/assets URLs');
assert.ok(!read('studio/assets/lucide-DZsz3ibU.css').includes('/PDF-Editor-Hdv/'), 'Font CSS still references renamed repository');
assert.ok(read('studio/sw.js').includes('pdf-dao-chich-v12'), 'Service-worker cache version unexpectedly rolled back');
const manifest = JSON.parse(read('studio/hvd-site.webmanifest'));
assert.equal(manifest.start_url, '../text-editor.html');
assert.equal(manifest.scope, '../');
console.log('PASS: text-editor static asset and engine path checks');
