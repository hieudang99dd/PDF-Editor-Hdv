const {test}=require('node:test');
const assert=require('node:assert/strict');
const PDFLib=require('../pdf-lib.min.js');
// The mapping helper is dynamically imported below so Node can run .mjs and .cjs.
const eps=(a,b)=>Math.abs(a-b)<1e-5;
const rect=(x0,y0,x1,y1)=>({mode:'erase',points:[
 {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
]});
const layouts=[
 {deg:0,  t:[1,0,0,-1,-100,340],w:400,h:300},
 {deg:90, t:[0,1,1,0,-40,-100],w:300,h:400},
 {deg:180,t:[-1,0,0,1,500,-40],w:400,h:300},
 {deg:270,t:[0,-1,-1,0,340,500],w:300,h:400}
];
function zoneForNativeRect(layout,left,bottom,right,top){
 const [a,b,c,d,e,f]=layout.t;
 const points=[[left,bottom],[left,top],[right,bottom],[right,top]]
  .map(([x,y])=>({x:(a*x+c*y+e)/layout.w,y:(b*x+d*y+f)/layout.h}));
 const u=points.map(p=>p.x),v=points.map(p=>p.y);
 return rect(Math.min(...u),Math.min(...v),Math.max(...u),Math.max(...v));
}
async function rotatedPdf(deg){
 const doc=await PDFLib.PDFDocument.create();
 const p=doc.addPage([600,400]);
 p.setCropBox(100,40,400,300);
 p.setRotation(PDFLib.degrees(deg));
 p.drawLine({start:{x:120,y:200},end:{x:480,y:200},thickness:1.4,
  color:PDFLib.rgb(.15,.3,.6)});
 p.drawLine({start:{x:120,y:80},end:{x:480,y:80},thickness:1.4});
 return new Uint8Array(await doc.save());
}
test('PDF.js affine viewport inverts normalized polygons across /Rotate 0/90/180/270 and shifted CropBox',async()=>{
 const {normalizedToUser,validatePageViewport}=await import('../pdf-region-geometry.mjs');
 for(const lay of layouts){
  const p=zoneForNativeRect(lay,240,170,360,230);
  const got=normalizedToUser([p],null,{width:lay.w,height:lay.h,
   transform:lay.t,rotation:lay.deg});
  const xs=got[0].points.map(q=>q.x),ys=got[0].points.map(q=>q.y);
  assert.ok(eps(Math.min(...xs),240)&&eps(Math.max(...xs),360),String(lay.deg)+' x');
  assert.ok(eps(Math.min(...ys),170)&&eps(Math.max(...ys),230),String(lay.deg)+' y');
 }
 assert.throws(()=>validatePageViewport({width:300,height:400,transform:[1,0,2,0,0,0]}),/suy biến/);
 assert.throws(()=>validatePageViewport({width:300,height:400,transform:[1,0,0,1,0,0],rotation:45}),/Góc xoay/);
});
test('PDFium deletes only selected line center on genuine rotated+cropped documents', {timeout:120000},async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const {PdfEngine}=await import('../vendor/cit-pdf/editcore/core.js');
 for(const lay of layouts){
  const input=await rotatedPdf(lay.deg);
  const zone=zoneForNativeRect(lay,240,170,360,230);
  const result=await erasePdfRegions(input,[{pageIndex:0,regions:[zone],
    viewport:{width:lay.w,height:lay.h,transform:lay.t,rotation:lay.deg}}]);
  assert.equal(result.report.changedObjects,1,'rotation '+lay.deg+' changes only target line');
  assert.equal(result.report.newFragments,2,'rotation '+lay.deg+' creates two remaining fragments');
  const engine=await PdfEngine.create();
  try{
   engine.open(result.bytes);engine.loadPage(0);
   assert.equal(engine.M._FPDFPage_GetRotation(engine.page),lay.deg/90,
    'preserves page rotation '+lay.deg);
   const M=engine.M,p=M._malloc(8),paths=[];
   try{
    for(let i=0;i<engine.objectCount();i++){
     const ob=engine.objectAt(i);if(!ob||ob.type!==2)continue;
     const points=[];
     for(let j=0;j<M._FPDFPath_CountSegments(ob.handle);j++){
      const seg=M._FPDFPath_GetPathSegment(ob.handle,j);
      if(M._FPDFPathSegment_GetPoint(seg,p,p+4))
       points.push([M.HEAPF32[p>>2],M.HEAPF32[(p+4)>>2]]);
     }
     paths.push(points);
    }
   }finally{M._free(p);}
   const mid=paths.filter(ps=>ps.some(q=>Math.abs(q[1]-200)<.02));
   assert.equal(mid.length,2,'rotation '+lay.deg+' splits selected line in PDF objects');
   assert.ok(mid.every(ps=>ps.every(q=>q[0]<=240.03||q[0]>=359.97)),
    'rotation '+lay.deg+' must not leave deleted center');
   assert.ok(paths.some(ps=>ps.some(q=>Math.abs(q[1]-80)<.02)),
    'rotation '+lay.deg+' must preserve outside line');
  }finally{engine.close();}
 }
});
test('fail safely if rotated native page is passed without a viewport or with wrong rotation',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const input=await rotatedPdf(90);
 const zone=zoneForNativeRect(layouts[1],240,170,360,230);
 await assert.rejects(erasePdfRegions(input,[{pageIndex:0,regions:[zone]}]),/ma trận PDF\.js/);
 await assert.rejects(erasePdfRegions(input,[{pageIndex:0,regions:[zone],viewport:{
  width:300,height:400,transform:layouts[1].t,rotation:270}}]),/khác dữ liệu PDF gốc/);
});
