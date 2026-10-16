const {test}=require('node:test');
const assert=require('node:assert/strict');
const PDFLib=require('../pdf-lib.min.js');
const polygon=(x0,y0,x1,y1,mode='erase')=>({mode,points:[
 {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]});
async function source(){
 const doc=await PDFLib.PDFDocument.create();
 const page=doc.addPage([600,400]);
 page.drawLine({start:{x:40,y:200},end:{x:560,y:200},thickness:1.2,color:PDFLib.rgb(.2,.3,.4)});
 page.drawLine({start:{x:50,y:50},end:{x:550,y:50},thickness:1.2,color:PDFLib.rgb(0,0,0)});
 return new Uint8Array(await doc.save());
}
async function vectorSnapshot(bytes){
 const {PdfEngine}=await import('../vendor/cit-pdf/editcore/core.js');
 const engine=await PdfEngine.create();
 try{
  engine.open(bytes);engine.loadPage(0);
  const M=engine.M;const data=[];
  for(let i=0;i<engine.objectCount();i++){
   const o=engine.objectAt(i);
   if(o.type!==2){data.push({type:o.type});continue;}
   const count=M._FPDFPath_CountSegments(o.handle);
   const p=M._malloc(8),points=[];
   try{
    for(let j=0;j<count;j++){
     const s=M._FPDFPath_GetPathSegment(o.handle,j);
     if(M._FPDFPathSegment_GetPoint(s,p,p+4)){
      points.push([M.HEAPF32[p>>2],M.HEAPF32[(p+4)>>2]]);
     }
    }
   }finally{M._free(p);}
   data.push({type:2,points});
  }
  return data;
 }finally{engine.close();}
}
test('real PDFium output physically splits one line while retaining unrelated vector objects',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const bytes=await source();
 const before=await vectorSnapshot(bytes);
 assert.ok(before.filter(x=>x.type===2).length>=2,'source must contain native vector paths');
 const erased=await erasePdfRegions(bytes,[{pageIndex:0,regions:[polygon(.4,.3,.6,.7)]}]);
 assert.ok(erased.bytes.length>100);
 assert.equal(Buffer.from(erased.bytes.slice(0,5)).toString('ascii'),'%PDF-');
 assert.equal(erased.report.changedObjects,1);
 const after=await vectorSnapshot(erased.bytes);
 assert.ok(after.filter(x=>x.type===2).length>before.filter(x=>x.type===2).length,
 'split line should create extra PDF PATH objects, not rasterized artwork');
 const endpoints=after.filter(x=>x.type===2).flatMap(x=>x.points);
 const center=after.filter(x=>x.type===2).filter(x=>x.points.some(p=>Math.abs(p[1]-200)<1));
 // All emitted x-coordinates for the original horizontal path stay OUTSIDE deleted band.
 assert.ok(center.every(o=>o.points.every(p=>p[0]<=240.01||p[0]>=359.99)),JSON.stringify(center));
 assert.ok(endpoints.some(p=>Math.abs(p[1]-50)<1),'unselected horizontal line must remain');
});
test('signed PDF and unchanged region never produce a misleading document',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const original=await source();
 await assert.rejects(erasePdfRegions(original,[{pageIndex:0,regions:[polygon(.01,.01,.07,.07)]}]),/Không có đường vector/);
 const marker=new Uint8Array(original.length+13);marker.set(original);marker.set(new TextEncoder().encode('/ByteRange'),original.length);
 await assert.rejects(erasePdfRegions(marker,[{pageIndex:0,regions:[polygon(.4,.3,.6,.7)]}]),/chữ ký số/);
});
