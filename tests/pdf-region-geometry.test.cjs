const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const lib=()=>import('../pdf-region-geometry.mjs');
const rect=(x0,y0,x1,y1,mode='erase')=>({mode,points:[
 {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]});
const close=(a,b)=>Math.abs(a-b)<1e-6;

test('rectangle subtracts only crossing centerline; preserves outside vector',async()=>{
 const {validateRegions,keepSegment}=await lib();
 const zones=validateRegions([rect(.3,.1,.7,.9)]);
 const pieces=keepSegment({x:0,y:.5},{x:1,y:.5},zones);
 assert.equal(pieces.length,2);
 assert.ok(close(pieces[0].a.x,0)&&close(pieces[0].b.x,.3));
 assert.ok(close(pieces[1].a.x,.7)&&close(pieces[1].b.x,1));
});
test('many erase regions plus protected inner polygon leave a hole in the erased band',async()=>{
 const {validateRegions,keepSegment}=await lib();
 const zones=validateRegions([rect(.2,.2,.8,.8),rect(.35,.35,.65,.65,'protect'),rect(.9,.2,1,.8)]);
 const p=keepSegment({x:0,y:.5},{x:1,y:.5},zones);
 assert.equal(p.length,3);
 const spans=p.map(v=>[v.a.x,v.b.x]);
 for(const [i,want] of [[0,[0,.2]],[1,[.35,.65]],[2,[.8,.9]]]){
  assert.ok(close(spans[i][0],want[0])&&close(spans[i][1],want[1]),JSON.stringify(spans));
 }
});
test('polygon and line crossing corner are clipped, not deleted as whole objects',async()=>{
 const {validateRegions,keepSegment}=await lib();
 const z=validateRegions([{mode:'erase',points:[{x:.4,y:.3},{x:.7,y:.5},{x:.4,y:.7}]}]);
 const seg=keepSegment({x:0,y:.5},{x:1,y:.5},z);
 assert.equal(seg.length,2);assert.ok(close(seg[0].b.x,.4));assert.ok(close(seg[1].a.x,.7));
});
test('self crossing, missing erase and malformed points fail closed',async()=>{
 const {validateRegions}=await lib();
 assert.throws(()=>validateRegions([rect(.2,.2,.8,.8,'protect')]),/ít nhất một vùng xóa/);
 assert.throws(()=>validateRegions([{mode:'erase',points:[{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0}]}]),/giao nhau|diện tích/);
 assert.throws(()=>validateRegions([rect(-1,0,.4,.5)]),/ngoài trang/);
});
test('production Organizer serializes regions with Undo/Redo and performs true native erase before annotations',()=>{
 const js=fs.readFileSync(path.join(root,'organizer.js'),'utf8');
 const ui=fs.readFileSync(path.join(root,'pdf-region-ui.js'),'utf8');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(js,/eraseRegions: p\.eraseRegions \? JSON\.parse\(JSON\.stringify\(p\.eraseRegions\)\) : \[\]/);
 assert.match(js,/eraseRegionsInWorker\(await finalDoc\.save\(\),regionJobs\)/);
 assert.ok(js.indexOf('eraseRegionsInWorker(')<js.indexOf('// Apply Rich Annotations'));
 assert.match(index,/pdf-region-ui\.js\?v=/);
 assert.match(ui,/id='po-tb-region'|id="po-tb-region"|launch\.id='po-tb-region'/);
 assert.match(ui,/po-region-overlay/);
 assert.doesNotMatch(ui,/drawRectangle|whiteout/);
 const vm=require('node:vm');new vm.Script(ui);
});
