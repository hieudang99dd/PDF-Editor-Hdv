const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=load('region-eraser.html'),css=load('region-eraser.css'),js=load('region-eraser.js');
test('result summary is inside task sidebar, never appended after the PDF viewport',()=>{
 const aside=html.indexOf('<aside class="re-tools"');
 const result=html.indexOf('id="re-results"');
 const preview=html.indexOf('class="re-preview"');
 assert.ok(aside>=0&&result>aside&&preview>result,'report belongs before PDF pane');
 assert.equal((html.match(/id="re-results"/g)||[]).length,1);
 assert.match(css,/body\.re-workspace-open \.re-tools #re-results:not\(\[hidden\]\)\s*\{[^}]*position:static/s);
 assert.doesNotMatch(css,/#re-results:not\(\[hidden\]\)\s*\{[^}]*position:absolute/s);
});
test('status messages are inline and global toast is hidden while a PDF is open',()=>{
 assert.match(html,/id="re-editor-status"/);
 assert.match(html,/id="re-gallery-status"/);
 assert.match(css,/body\.re-workspace-open #re-status\{display:none\}/);
 assert.match(css,/body\.re-workspace-open \.re-editor-status/);
 assert.match(js,/\['re-editor-status','re-gallery-status'\]/);
 assert.doesNotMatch(js,/dom\.results\.scrollIntoView/);
});
test('Rework stays in fixed editor toolbar, independent of hidden left task panel',()=>{
 const header=html.indexOf('class="re-editor-header"');
 const button=html.indexOf('id="re-rework"');
 const columns=html.indexOf('class="re-columns"');
 assert.ok(header>=0&&button>header&&columns>button);
 assert.match(js,/\$\('re-rework'\)\.hidden=!state\.result/);
 assert.equal((html.match(/id="re-rework"/g)||[]).length,1);
 assert.match(css,/re-focus-page \.re-tools\{display:none\}/);
});
test('non-overlay status keeps full tooltip and error semantics',()=>{
 assert.match(js,/node\.title=message/);
 assert.match(js,/node\.className=/);
 assert.match(css,/\.re-editor-status\.error/);
 assert.match(css,/\.re-gallery-status\.error/);
 assert.match(html,/region-eraser\.css\?v=20261016-dock1/);
 assert.match(html,/region-eraser\.js\?v=20261016-dock1/);
});
