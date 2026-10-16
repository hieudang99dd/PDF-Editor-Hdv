const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=n=>fs.readFileSync(path.join(root,n),'utf8');
const get=()=>import('../pdf-region-view.mjs');
const eq=(a,b)=>Math.abs(a-b)<1e-10;
test('page fit respects BOTH available width and available height for large landscape drawings',async()=>{
 const {computePageScale}=await get();
 assert.ok(eq(computePageScale({width:1500,height:900},{width:1200,height:500}),500/900));
 assert.ok(eq(computePageScale({width:1200,height:800},{width:1000,height:700}),Math.min(1000/1200,700/800)));
});
test('portrait PDF, rotated page orientation and image aspect ratio fit correctly',async()=>{
 const {computePageScale}=await get();
 for(const sheet of [{width:595,height:842},{width:842,height:595},{width:4000,height:2500}]){
  const available={width:940,height:560};
  const scale=computePageScale(sheet,available);
  assert.ok(sheet.width*scale<=available.width+1e-8);
  assert.ok(sheet.height*scale<=available.height+1e-8);
 }
});
test('fit width permits vertical overflow and zoom acts as a relative multiplier',async()=>{
 const {computePageScale}=await get();
 const page={width:1100,height:800},area={width:700,height:400};
 const fit=computePageScale(page,area);
 const width=computePageScale(page,area,{mode:'width'});
 assert.ok(eq(fit,.5));
 assert.ok(eq(width,700/1100));
 assert.ok(page.height*width>area.height);
 assert.ok(eq(computePageScale(page,area,{zoom:1.5}),fit*1.5));
});
test('invalid or degenerate box dimensions never produce an invalid preview scale',async()=>{
 const {computePageScale}=await get();
 for(const bad of [0,-100,Infinity,NaN])
  assert.throws(()=>computePageScale({width:bad,height:600},{width:1000,height:600}),/kích thước/);
 assert.throws(()=>computePageScale({width:100,height:100},{width:100,height:100},{mode:'random'}),/hiển thị/);
});
test('compact editor is scoped and keeps both fixed scroll panes and page drawing handles intact',()=>{
 const css=file('region-eraser.css'),html=file('region-eraser.html'),js=file('region-eraser.js');
 assert.match(css,/body\.re-workspace-open\.re-editor-active \.re-workspace-header/);
 assert.match(css,/body\.re-workspace-open\.re-editor-active \.re-columns/);
 assert.match(css,/body\.re-workspace-open\.re-editor-active \.re-viewport/);
 assert.match(css,/body\.re-workspace-open\.re-editor-active\.re-focus-page \.re-tools\{display:none\}/);
 assert.match(css,/\.re-page-surface\{\s*margin-left:auto;margin-right:auto/);
 assert.match(html,/id="re-toggle-tools"/);
 assert.match(html,/id="re-fit-width"/);
 assert.match(js,/const desiredScale=computePageScale\(box,space,/);
 assert.match(js,/observer\.observe\(dom\.viewport\)/);
 assert.match(js,/body\.classList\.add\('re-editor-active'\)/);
 assert.match(js,/dom\.viewport\.scrollTop=0/);
 assert.match(js,/drawRegions\(\);refreshZones\(\)/);
 assert.match(html,/20261016-dock1/);
});
