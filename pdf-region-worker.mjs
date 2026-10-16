// PDF HVD vector eraser: each PDF processing request gets an isolated Worker.
// Blob/File inputs are read inside this Worker to avoid a 512 MiB ArrayBuffer
// allocation on the main UI thread before PDFium needs the bytes.
import {erasePdfRegions} from './pdf-region-native.mjs?v=20261016-all1';
import {validateInputSize} from './pdf-region-limits.mjs?v=20261016-512mb1';
self.onmessage=async ({data})=>{
 const {id,file,bytes,pages,mode,allowInvalidSignatures}=data||{};
 try{
  const size=file?.size??bytes?.byteLength??0;
  validateInputSize(size); // reject before allocating a large contiguous buffer
  self.postMessage({id,progress:{stage:'reading',bytes:size,totalPages:pages?.length||0}});
  const input=file ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array(bytes);
  const result=await erasePdfRegions(input,pages,{mode,allowInvalidSignatures,onProgress:progress=>{
   self.postMessage({id,progress});
  }});
  // PDFium normally returns a full Uint8Array. If it returns a view, copy only
  // that view once so the transfer cannot expose unrelated WASM bytes.
  const output=result.bytes;
  const buffer=output.byteOffset===0&&output.byteLength===output.buffer.byteLength
   ? output.buffer:output.slice().buffer;
  self.postMessage({id,result:{bytes:new Uint8Array(buffer),report:result.report}},[buffer]);
 }catch(err){
  self.postMessage({id,error:err?.message||String(err)});
 }
};
