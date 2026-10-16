const test=require('node:test');
const assert=require('node:assert/strict');
const PDFLib=require('../pdf-lib.min.js');
const MiB=1024*1024;
// Real generated PDF >80 MiB containing a raw EmbeddedFile stream plus PATH
// objects. Deliberately NOT a 512 MiB allocation: CI verifies the removal
// of the previous 80 MiB boundary without exhausting GitHub runner RAM.
test('native PDFium handles a valid 88+ MiB PDF and physically cuts its vector', {timeout:300000},async()=>{
 const pdf=await PDFLib.PDFDocument.create();
 const page=pdf.addPage([600,400]);
 page.drawLine({start:{x:40,y:200},end:{x:560,y:200},thickness:1});
 page.drawLine({start:{x:40,y:50},end:{x:560,y:50},thickness:1});
 // A registered but unreferenced PDF stream is still a real PDF stream/xref
 // object, not invalid bytes artificially appended after %%EOF.
 const contents=new Uint8Array(88*MiB+128);
 contents.fill(65);
 const asset=pdf.context.stream(contents,{Type:'EmbeddedFile'});
 pdf.context.register(asset);
 const input=new Uint8Array(await pdf.save({useObjectStreams:false}));
 assert.ok(input.byteLength>80*MiB,'input must exceed the old 80 MiB cap');
 const {erasePdfRegions}=await import('../pdf-region-native.mjs');
 const progress=[];
 const result=await erasePdfRegions(input,[{pageIndex:0,regions:[{
  mode:'erase',points:[{x:.3,y:.2},{x:.7,y:.2},{x:.7,y:.8},{x:.3,y:.8}]
 }]}],{onProgress:item=>progress.push(item.stage)});
 assert.ok(result.report.changedObjects>=1);
 assert.equal(Buffer.from(result.bytes.subarray(0,5)).toString('ascii'),'%PDF-');
 assert.ok(progress.includes('page-done')&&progress.includes('saving'));
 const output=await PDFLib.PDFDocument.load(result.bytes);
 assert.equal(output.getPageCount(),1);
 assert.equal(Buffer.from(input.subarray(0,5)).toString('ascii'),'%PDF-',
  'source PDF buffer must not be mutated');
 console.log(JSON.stringify({inputMiB:(input.byteLength/MiB).toFixed(1),
  outputMiB:(result.bytes.byteLength/MiB).toFixed(1),
  changedPaths:result.report.changedObjects,fragments:result.report.newFragments}));
});
