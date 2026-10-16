const {test}=require('node:test');
const assert=require('node:assert/strict');
const PDFLib=require('../pdf-lib.min.js');
const box=(x0,y0,x1,y1,mode='erase')=>({mode,points:[
 {x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}
]});
const region=(a,b,c,d)=>box(a,b,c,d);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
async function fixture({signature=false}={}){
 const doc=await PDFLib.PDFDocument.create(),page=doc.addPage([600,400]);
 page.drawText('TEXT_INSIDE',{x:100,y:200,size:13});
 page.drawText('TEXT_OUTSIDE',{x:490,y:200,size:13});
 page.drawText('TEXT_PROTECTED',{x:290,y:200,size:13});
 page.drawRectangle({x:135,y:120,width:38,height:45,color:PDFLib.rgb(.4,.4,.9)});
 page.drawRectangle({x:445,y:30,width:28,height:35,color:PDFLib.rgb(.9,.2,.4)});
 const img=await doc.embedPng(png);
 page.drawImage(img,{x:192,y:125,width:35,height:35});
 if(signature){
  const key=PDFLib.PDFName.of('SampleSignatureForTest');
  const sig=doc.context.obj({
   Type:PDFLib.PDFName.of('Sig'),
   Filter:PDFLib.PDFName.of('Adobe.PPKLite'),
   SubFilter:PDFLib.PDFName.of('adbe.pkcs7.detached'),
   ByteRange:[0,128,256,128],
   Contents:PDFLib.PDFHexString.fromText('test')
  });
  doc.catalog.set(key,doc.context.register(sig));
 }
 return new Uint8Array(await doc.save({useObjectStreams:false}));
}
async function objectTypes(bytes){
 const {PdfEngine}=await import('../vendor/cit-pdf/editcore/core.js');
 const eng=await PdfEngine.create();
 try{eng.open(bytes);eng.loadPage(0);
  return Array.from({length:eng.objectCount()},(_,i)=>eng.objectAt(i).type);
 }finally{eng.close();}
}
test('geometry decides area overlap in union, protected middle, nested ring and intersection',async()=>{
 const {regionIntersectsRect,validateRegions,normalizedToUser}=await import('../pdf-region-geometry.mjs');
 const outer=box(0,0,10,10),inner=box(3,3,7,7);
 const protectedZones=validateRegions([box(.1,.1,.9,.9),box(.4,.4,.6,.6,'protect')],'union');
 assert.equal(regionIntersectsRect({x0:.45,y0:.45,x1:.55,y1:.55},protectedZones,'union'),false);
 assert.equal(regionIntersectsRect({x0:.2,y0:.2,x1:.3,y1:.3},protectedZones,'union'),true);
 assert.equal(regionIntersectsRect({x0:4,y0:4,x1:6,y1:6},[outer,inner],'between'),false);
 assert.equal(regionIntersectsRect({x0:1,y0:1,x1:2,y1:2},[outer,inner],'between'),true);
 const cross=[box(.1,.1,.6,.9),box(.4,.1,.9,.9)];
 assert.equal(regionIntersectsRect({x0:.2,y0:.2,x1:.3,y1:.3},cross,'intersection'),false);
 assert.equal(regionIntersectsRect({x0:.45,y0:.2,x1:.55,y1:.3},cross,'intersection'),true);
});
test('whole-object mode physically removes text, image and filled paths, preserving outside PDF objects',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const src=await fixture(),before=await objectTypes(src);
 assert.ok(before.includes(1),'source has text objects');
 assert.ok(before.includes(2),'source has filled vector paths');
 assert.ok(before.includes(3),'source has image object');
 const r=await erasePdfRegions(src,[{pageIndex:0,regions:[region(.12,.25,.43,.76)]}],
  {mode:'whole-object'});
 assert.ok(r.report.removedObjects>=3,JSON.stringify(r.report));
 assert.ok(r.report.removedByType[1]>0,'text removed');
 assert.ok(r.report.removedByType[2]>0,'filled path removed');
 assert.ok(r.report.removedByType[3]>0,'image removed');
 assert.equal(r.report.skippedNonVector,0);
 const after=await objectTypes(r.bytes);
 assert.ok(after.length<before.length);
 assert.ok(after.includes(1),'outside text still present');
 assert.ok(after.includes(2),'outside vector still present');
 assert.equal(Buffer.from(r.bytes.subarray(0,5)).toString('ascii'),'%PDF-');
});
test('signed PDF requires opt-in and copy invalidates old signature without modifying source',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const src=await fixture({signature:true}),originalHash=Buffer.from(src).toString('base64').slice(0,120);
 await assert.rejects(erasePdfRegions(src,[{pageIndex:0,regions:[region(.12,.25,.43,.76)]}],
  {mode:'whole-object'}),/chữ ký số/);
 const output=await erasePdfRegions(src,[{pageIndex:0,regions:[region(.12,.25,.43,.76)]}],
  {mode:'whole-object',allowInvalidSignatures:true});
 assert.equal(output.report.signatureInvalidated,true);
 assert.ok(output.report.removedObjects>=3);
 assert.equal(Buffer.from(src).toString('base64').slice(0,120),originalHash);
 const parsed=await PDFLib.PDFDocument.load(output.bytes);
 assert.equal(parsed.getPageCount(),1);
});
test('whole-object mode refuses nonexistent deletion; precise mode unchanged',async()=>{
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const src=await fixture();
 await assert.rejects(erasePdfRegions(src,[{pageIndex:0,regions:[region(.01,.01,.07,.07)]}],
  {mode:'whole-object'}),/Không tìm thấy đối tượng/);
 await assert.rejects(erasePdfRegions(src,[{pageIndex:0,regions:[region(.12,.25,.43,.76)]}],
  {mode:'no-such-mode'}),/không hợp lệ/);
});
