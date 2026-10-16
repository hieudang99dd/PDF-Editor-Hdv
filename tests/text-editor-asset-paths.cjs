#!/usr/bin/env node
// Static deployment checks; native PDF editing is separately verified in Chromium.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const at = rel => path.join(root, rel);
const read = rel => fs.readFileSync(at(rel), 'utf8');
const html = read('studio/edit-pdf-text.html');
for (const id of ['text-editor-app', 'overlay', 'inspector', 'fFamily',
  'fSize', 'fLine', 'fPara', 'save', 'undo', 'redo']) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing approved editor control: ' + id);
}
for (const marker of ['hvd-text-apply.css?v=', 'hvd-text-apply.js?v=20261016-stallfix1',
  'hvd-brand.css', 'hvd-editor-recovery', 'href="./repair-editor.html"']) {
  assert.ok(html.includes(marker), 'Missing HVD text editor UI: ' + marker);
}
assert.ok(html.includes('<html lang="vi">'));
assert.ok(!html.includes('/PDF-Editor-Hdv/studio/'), 'Legacy absolute base in approved editor');
const resources = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"?#]+\.(?:js|css))"/g)]
  .map(match => match[1]);
assert.ok(resources.length >= 4, 'Vite did not wire compiled text editor dependencies');
for (const resource of resources) {
  const pathname = new URL(resource,
    'https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html').pathname;
  assert.ok(pathname.startsWith('/PDF-Editor1/studio/assets/'),
    'Asset escapes Studio deployment base: ' + resource);
  const local = path.join(root, 'studio', pathname.split('/studio/')[1]);
  assert.ok(fs.existsSync(local), 'Missing runtime resource: ' + resource);
  assert.ok(!read(path.relative(root, local)).includes('/PDF-Editor-Hdv/studio/'),
    'Legacy base remains in compiled resource: ' + resource);
}
for (const asset of ['studio/hvd-brand.css', 'studio/hvd-text-apply.js',
  'studio/assets/editcore-Uyyxl379.wasm', 'studio/qpdf.wasm'])
  assert.ok(fs.existsSync(at(asset)), 'Missing established native core file: ' + asset);
const manifest = at('studio/hvd-text-build.json');
if (fs.existsSync(manifest)) {
  const build = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  assert.equal(build.commit, '3c9c138d980a417de7439f383f37882a1d730ab6');
  assert.equal(build.base, '/PDF-Editor1/studio/');
  assert.ok(build.brand_html_retained);
  assert.ok(build.assets.length >= 10);
}
const metadata = JSON.parse(read('studio/hvd-site.webmanifest'));
assert.equal(metadata.start_url, '../text-editor.html');
assert.equal(metadata.scope, '../');
assert.ok(read('studio/sw.js').includes('pdf-dao-chich-v13'));
console.log('PASS: branded CIT/PDFium text editor routes and Vite assets are resolvable');
