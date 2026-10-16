'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('studio/hvd-text-pages.js');
const css=read('studio/hvd-text-pages.css');
const html=read('studio/edit-pdf-text.html');
const patch=read('scripts/cit-original/patch_source.py');

test('left navigator scripts and styles are wired to approved text editor',()=>{
 assert.match(html,/hvd-text-pages\.js\?v=/);
 assert.match(html,/hvd-text-pages\.css\?v=/);
 assert.match(js,/hvd-pages-rail/);
 assert.match(js,/hvd-pages-list/);
 assert.match(js,/hvd-pages-jump-input/);
 assert.match(js,/hvd-pages-jump-form/);
 assert.match(js,/setOpen\(!isOpened\(\)\)/);
 assert.match(css,/#text-editor-app #hvd-pages-rail\[hidden\]/);
 assert.match(css,/#text-editor-app #hvd-pages-list/);
 new vm.Script(js,{filename:'studio/hvd-text-pages.js'});
});
test('navigation commits edits through native engine and does not mutate PDF content in thumbnail renderer',()=>{
 assert.match(js,/__HVD_COMMIT_BEFORE_PAGE_NAV/);
 assert.match(js,/native\.navigateToPage\(index\)/);
 assert.match(js,/window\.__HVD_PDF_THUMBNAILS/);
 assert.match(patch,/getPageCount: \(\) => P\(\)\?\.pageCount/);
 assert.match(patch,/navigateToPage: index => goToPage\(index\)/);
 assert.match(patch,/hvd:pagechange/);
 assert.match(patch,/hvd:document-open/);
 assert.match(patch,/hvdRenderPageThumbnail/);
 assert.match(patch,/Math\.min\(152 \/ natural\.width, 198 \/ natural\.height, 0\.55\)/);
 assert.doesNotMatch(js,/deleteParagraph\(|commitParagraph\(|saveSpliced\(/);
});
test('247-page documents use lazy and bounded thumbnail work',()=>{
 assert.match(js,/MAX_PARALLEL = 2/);
 assert.match(js,/IntersectionObserver/);
 assert.match(js,/rootMargin:'240px 0px'/);
 assert.match(js,/generation\+\+/);
 assert.match(js,/Math\.min\(20000/);
});
