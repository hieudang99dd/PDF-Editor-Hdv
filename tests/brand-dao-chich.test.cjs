const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const brand = 'PDF EDITOR';
const visible = [
 'index.html','region-eraser.html','pdfium-preflight.html','text-editor.html',
 'text-editor-hdv.html','studio/edit-pdf-text.html','hvd-ui-v2.js',
 'text-editor-shell.js','studio/hvd-hub.js','scripts/cit-original/hvd-hub.js'
];
test('all active public routes and navigation adapters use PDF EDITOR',()=>{
 for (const file of visible) {
  const text = read(file);
  assert.ok(text.includes(brand),file+' is missing product brand');
  assert.doesNotMatch(text,/PDF Đạo Chích|PDF HVD|PDF HDV/,file+' shows old brand');
 }
});
test('home header shows P badge, full accessible name and responsive styling',()=>{
 const html=read('index.html'),css=read('hvd-ui-v2.css');
 assert.match(html,/id="logo" aria-label="PDF EDITOR – Trang chủ"/);
 assert.match(html,/class="dao-mark" aria-hidden="true">P</);
 assert.match(css,/header \.logo \.dao-mark/);
 assert.match(css,/@media\(max-width:550px\)\{header \.logo/);
});
test('standalone tools and SVG icon use PDF EDITOR emblem and name',()=>{
 const region=read('region-eraser.html'),preflight=read('pdfium-preflight.html');
 const svg=read('studio/hvd-mark.svg'),studio=read('studio/edit-pdf-text.html');
 assert.match(region,/class="re-mark">P<\/span><strong>PDF EDITOR<\/strong>/);
 assert.match(preflight,/class="brand-mark" aria-hidden="true">P/);
 assert.match(svg,/>Đ<\/text>/);
 assert.match(svg,/aria-label="PDF EDITOR"/);
 assert.match(studio,/hvd-mark\.svg\?v=20261016-editor1/);
});
test('branding change preserves routes, PDF engines, licenses and upstream attribution',()=>{
 const html=read('index.html'),studio=read('studio/edit-pdf-text.html');
 assert.match(html,/region-eraser-route/);
 assert.match(html,/cit-text-route/);
 assert.match(studio,/id="text-editor-app"/);
 assert.match(studio,/href="\.\.\/NOTICE\.md"/);
 const notice=read('NOTICE.md');
 assert.match(notice,/AGPL|BentoPDF/);
 assert.ok(fs.existsSync(path.join(root,'LICENSE')));
});
