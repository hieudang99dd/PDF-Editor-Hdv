const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'text-editor.html'),'utf8');
const css=fs.readFileSync(path.join(root,'text-editor.css'),'utf8');
const shell=fs.readFileSync(path.join(root,'text-editor-shell.js'),'utf8');
const organizer=fs.readFileSync(path.join(root,'organizer.js'),'utf8');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('standalone text editor is reachable from homepage without organizer step',()=>{
 assert.match(home,/Chỉnh sửa Text chuyên sâu/);
 assert.match(home,/location\.href=['"]\.\/text-editor\.html/);
 assert.match(home,/cit-text-route/);
});
test('standalone HTML loads original native CIT chain from repository',()=>{
 for(const file of ['pdf-lib.min.js','pdf.min.js','fontkit.umd.min.js','pdf-text-layout.js',
  'organizer.js','pdf-batch-text.js','text-editor-shell.js']){
  assert.match(html,new RegExp('<script src="'+file.replaceAll('.','\\.')+''));
 }
 assert.ok(html.indexOf('organizer.js') < html.indexOf('text-editor-shell.js'),
  'CIT adapter must be loaded after native HVD organizer');
 assert.match(html,/<main id="home"/);
 assert.match(html,/<main id="ws"/);
 assert.match(html,/<input id="hdv-text-file-picker"/);
 assert.doesNotMatch(html,/cdn\./,'standalone mode should not use remote CDN');
});
test('standalone interface keeps original CIT worker and geometric safety',()=>{
 assert.match(organizer,/pdf-native-client\.mjs\?v=/);
 assert.match(organizer,/getNativeTextResult\(page,edits\)/);
 assert.match(shell,/PDFOrganizer\.prototype/);
 assert.match(shell,/originalHandle\.call\(this,\[first\],at\)/);
 assert.match(shell,/toggleEditMode\(true\)/);
 assert.match(shell,/po-ft-font/);
 assert.match(shell,/po-ft-size/);
 assert.match(shell,/po-ft-color/);
 assert.match(shell,/po-ft-overflow/);
 assert.match(shell,/po-ft-done|commitEdit/);
 assert.match(shell,/openCITBatchText/);
 assert.match(shell,/syncInspector/);
 assert.match(organizer,/e\.relatedTarget\?\.closest\?\.\('\.hdv-text-dock'\)/);
 new vm.Script(shell,{filename:'text-editor-shell.js'});
});
test('standalone page follows reference layout with text inspector on right',()=>{
 assert.match(css,/\.po-workspace>\.hdv-text-dock/);
 assert.match(css,/order:4/);
 assert.match(css,/\.po-left-col\{display:none!important\}/);
 assert.match(css,/\.po-workspace/);
 assert.match(organizer,/po-text-layer/);
 assert.match(shell,/hdv-text-dock/);
 assert.match(shell,/aria-label/);
});
test('sidebar does not advertise paragraph reflow or digitally signed text modification',()=>{
 assert.match(shell,/không cho chữ mới vượt đường biên/);
 assert.match(shell,/Type3/);
 assert.match(shell,/reflow tự do/);
 assert.match(shell,/Sửa nhiều dòng/);
});
