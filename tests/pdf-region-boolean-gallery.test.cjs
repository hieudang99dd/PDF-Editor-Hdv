const {test}=require('node:test');
const assert=require('node:assert/strict');
const rect=(x0,y0,x1,y1)=>({mode:'erase',points:[
 {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]});
const approx=(n,v)=>Math.abs(n-v)<1e-6;
const spans=items=>items.map(s=>[s.a.x,s.b.x]);
const geometry=()=>import('../pdf-region-geometry.mjs');
test('two disjoint zones: union erases both zones at the same time',async()=>{
 const {validateRegions,keepSegment}=await geometry();
 const z=validateRegions([rect(.1,.2,.3,.8),rect(.6,.2,.8,.8)],'union');
 const got=spans(keepSegment({x:0,y:.5},{x:1,y:.5},z,'union'));
 assert.equal(got.length,3);
 for(const [actual,expected] of got.map((x,i)=>[x,[[0,.1],[.3,.6],[.8,1]][i]]))
  assert.ok(approx(actual[0],expected[0])&&approx(actual[1],expected[1]));
});
test('nested outer/inner regions erase only ring, preserving inner center and external lines',async()=>{
 const {validateRegions,keepSegment}=await geometry();
 const z=validateRegions([rect(.2,.2,.8,.8),rect(.4,.35,.6,.65)],'between');
 const got=spans(keepSegment({x:0,y:.5},{x:1,y:.5},z,'between'));
 assert.equal(got.length,3);
 for(let i=0;i<3;i++)for(let k=0;k<2;k++)
  assert.ok(approx(got[i][k],[[0,.2],[.4,.6],[.8,1]][i][k]));
});
test('two overlapping regions erase only the intersection, keeping each outer arm',async()=>{
 const {validateRegions,keepSegment}=await geometry();
 const z=validateRegions([rect(.2,.2,.6,.8),rect(.4,.2,.8,.8)],'intersection');
 const got=spans(keepSegment({x:0,y:.5},{x:1,y:.5},z,'intersection'));
 assert.equal(got.length,2);
 assert.ok(approx(got[0][1],.4)&&approx(got[1][0],.6));
});
test('nested/out-of-order/invalid intersection must refuse destructive actions',async()=>{
 const {validateRegions}=await geometry();
 assert.throws(()=>validateRegions([rect(.1,.1,.3,.3),rect(.4,.4,.8,.8)],'between'),/bên trong/);
 assert.throws(()=>validateRegions([rect(.1,.1,.3,.3),rect(.6,.6,.9,.9)],'intersection'),/không giao/);
 assert.throws(()=>validateRegions([rect(.1,.1,.3,.3)],'intersection'),/đúng 2/);
 assert.throws(()=>validateRegions([rect(.1,.1,.3,.3),rect(.1,.1,.3,.3)],'X'),/không hợp lệ/);
});
test('per-page and range job plans are correct, 1-based inclusive and copy source polygons',async()=>{
 const {planRegionJobs}=await import('../pdf-region-plan.mjs');
 const m=new Map([[2,[rect(.2,.2,.7,.7)]],[4,[rect(.1,.1,.3,.3)]]]);
 const drawn=planRegionJobs(m,{totalPages:9,operation:'union'});
 assert.deepEqual(drawn.map(r=>r.pageIndex),[2,4]);
 const jobs=planRegionJobs(m,{scope:'range',pageIndex:2,from:4,to:7,totalPages:9});
 assert.deepEqual(jobs.map(r=>r.pageIndex),[3,4,5,6]);
 assert.notStrictEqual(jobs[0].regions,jobs[1].regions);
 assert.equal(jobs[0].regions[0].points[0].x,.2);
 jobs[0].regions[0].points[0].x=.9;
 assert.equal(jobs[1].regions[0].points[0].x,.2);
 assert.throws(()=>planRegionJobs(m,{scope:'range',pageIndex:2,from:0,to:4,totalPages:9}),/Khoảng trang/);
 assert.throws(()=>planRegionJobs(m,{scope:'range',pageIndex:2,from:4,to:600,totalPages:600}),/500 trang/);
});
test('UI storyboard is independent from Organizer; real before/after preview and range options are present',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const root=path.join(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'region-eraser.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'region-eraser.js'),'utf8');
 for(const id of ['re-gallery-panel','re-gallery-grid','re-gallery-back','re-operation','re-scope',
   're-range-from','re-range-to','re-review-switch','re-before','re-after'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(js,/getDocument\(\{url:state\.reviewUrl/);
 assert.match(js,/await showGallery\(0\)/);
 assert.match(js,/planRegionJobs\(state\.regions/);
 assert.doesNotMatch(js,/organizerInstance|PDFOrganizer/);
});
