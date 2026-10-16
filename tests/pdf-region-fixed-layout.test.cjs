const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('region-eraser.css');
const js=read('region-eraser.js');
const html=read('region-eraser.html');
test('loaded editor is a viewport-height non-scrolling flex shell',()=>{
 assert.match(css,/body\.re-workspace-open\s*\{[^}]*height:100dvh;[^}]*overflow:hidden/s);
 assert.match(css,/body\.re-workspace-open #re-workspace:not\(\[hidden\]\)\s*\{[^}]*display:flex;[^}]*overflow:hidden/s);
 assert.match(css,/body\.re-workspace-open #re-editor-view:not\(\[hidden\]\)\s*\{[^}]*flex:1 1 auto;[^}]*min-height:0/s);
 assert.match(css,/body\.re-workspace-open \.re-columns\s*\{[^}]*min-height:0;[^}]*overflow:hidden/s);
});
test('both pane shells stay fixed; only each interior has scrolling',()=>{
 assert.match(css,/body\.re-workspace-open \.re-tools\s*\{[^}]*overflow-y:auto;[^}]*overflow-x:hidden/s);
 assert.match(css,/body\.re-workspace-open \.re-viewport\s*\{[^}]*min-height:0;[^}]*overflow:auto/s);
 assert.match(css,/body\.re-workspace-open \.re-preview-toolbar,/);
 assert.match(css,/body\.re-workspace-open \.re-footer-info\s*\{[^}]*flex:0 0 auto/s);
 assert.match(css,/body\.re-workspace-open \.re-gallery-grid\s*\{[^}]*overflow-y:auto/s);
});
test('review and progress never resize the canvas panels, responsive layout remains clipped',()=>{
 assert.match(css,/body\.re-workspace-open #re-results:not\(\[hidden\]\)\s*\{[^}]*position:absolute/s);
 assert.match(css,/@media\(max-width:760px\)\{[^]*body\.re-workspace-open \.re-columns\s*\{[^}]*flex-direction:column/s);
 assert.match(css,/overscroll-behavior:contain/);
 assert.match(html,/region-eraser\.css\?v=20261016-grips1/);
 assert.match(html,/region-eraser\.js\?v=20261016-grips1/);
});
test('workspace scope is entered on PDF load and fully cleared on reset and failure',()=>{
 assert.match(js,/dom\.upload\.hidden=true;dom\.workspace\.hidden=false;\s*document\.body\.classList\.add\('re-workspace-open'\)/);
 const clears=js.match(/document\.body\.classList\.remove\('re-workspace-open'\)/g)||[];
 assert.equal(clears.length,2);
 assert.match(js,/dom\.workspace\.hidden=true;dom\.upload\.hidden=false/);
});
