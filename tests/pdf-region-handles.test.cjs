const test=require('node:test');
const assert=require('node:assert/strict');
const rect=(a,b,c,d,mode='erase')=>({mode,points:[{x:a,y:b},{x:c,y:b},{x:c,y:d},{x:a,y:d}]});
const edit=()=>import('../pdf-region-handles.mjs');
const approx=(x,y)=>Math.abs(x-y)<1e-9;
test('dragging a vertex changes only that point, not any other region or the original',async()=>{
 const {moveRegionHandle}=await edit();
 const before=[rect(.1,.1,.4,.5),rect(.6,.2,.9,.6)];
 const after=moveRegionHandle(before,0,'vertex',1,{x:.10,y:.03});
 assert.ok(approx(after[0].points[1].x,.5));
 assert.ok(approx(after[0].points[1].y,.13));
 assert.deepEqual(after[0].points[0],before[0].points[0]);
 assert.deepEqual(after[1],before[1]);
 assert.ok(approx(before[0].points[1].x,.4),'original remains immutable');
});
test('dragging an edge moves both endpoints by identical displacement including closing edge',async()=>{
 const {moveRegionHandle}=await edit();
 const original=[rect(.2,.2,.6,.7)];
 const after=moveRegionHandle(original,0,'edge',0,{x:.04,y:-.05});
 assert.deepEqual(after[0].points[0],{x:.24,y:.15});
 assert.deepEqual(after[0].points[1],{x:.64,y:.15});
 assert.deepEqual(after[0].points[2],original[0].points[2]);
 const closing=moveRegionHandle(original,0,'edge',3,{x:-.04,y:0});
 assert.ok(approx(closing[0].points[3].x,.16));
 assert.ok(approx(closing[0].points[0].x,.16));
});
test('boundary clamping preserves the entire edge translation and valid region',async()=>{
 const {moveRegionHandle}=await edit();
 const result=moveRegionHandle([rect(.8,.2,.98,.6)],0,'edge',1,{x:.2,y:.1});
 assert.ok(approx(result[0].points[1].x,1));
 assert.ok(approx(result[0].points[2].x,1));
 assert.ok(approx(result[0].points[1].y,.3));
 assert.ok(approx(result[0].points[2].y,.7));
});
test('invalid topology, zero area, missing controls and invalid deltas are rejected',async()=>{
 const {moveRegionHandle}=await edit();
 const zones=[rect(.1,.1,.6,.6)];
 assert.throws(()=>moveRegionHandle(zones,0,'vertex',1,{x:-.55,y:.45}),/giao nhau|diện tích|quá ngắn/);
 assert.throws(()=>moveRegionHandle(zones,0,'vertex',55,{x:.1,y:0}),/không hợp lệ/);
 assert.throws(()=>moveRegionHandle(zones,0,'edge',0,{x:Infinity,y:0}),/không hợp lệ/);
 assert.throws(()=>moveRegionHandle(zones,-1,'edge',0,{x:0,y:0}),/Không tìm thấy/);
});
test('between mode does not allow dragging inner region beyond outer polygon',async()=>{
 const {moveRegionHandle}=await edit();
 const rings=[rect(.1,.1,.9,.9),rect(.35,.35,.65,.65)];
 const good=moveRegionHandle(rings,1,'vertex',0,{x:.02,y:.02},'between');
 assert.ok(approx(good[1].points[0].x,.37));
 assert.throws(()=>moveRegionHandle(rings,1,'vertex',0,{x:-.35,y:0},'between'),/bên trong|giao|chạm/);
});
test('intersection mode disallows edits leaving no overlapping area',async()=>{
 const {moveRegionHandle}=await edit();
 const zones=[rect(.1,.1,.55,.7),rect(.4,.2,.8,.8)];
 assert.throws(()=>moveRegionHandle(zones,1,'edge',3,{x:.2,y:0},'intersection'),/không giao/);
});
test('post-draw UI registers a single pointer-up history commit with editable SVG grips',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const root=path.resolve(__dirname,'..');
 const js=fs.readFileSync(path.join(root,'region-eraser.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'region-eraser.css'),'utf8');
 for(const token of ["dataset.editHandle='edge'","dataset.editHandle='vertex'",
  "dataset.zoneIndex=String(i)","moveRegionHandle(edit.baseZones",
  "state.regions.set(state.pageIndex,edit.draftZones)","record();refreshZones();drawRegions();",
  "'pointercancel'","cancelEditDrag()","selectZone(i)"])
  assert.ok(js.includes(token),token);
 assert.match(css,/#re-overlay\.editing\{pointer-events:auto/);
 assert.match(css,/\.re-edit-hit-edge/);
 assert.match(css,/\.re-edit-grip-vertex/);
});
