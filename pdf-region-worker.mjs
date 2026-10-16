// One isolated PDFium execution per save; no network/API. A failed job
// never returns modified bytes to the Organizer and never mutates its PDF.
import {erasePdfRegions} from './pdf-region-native.mjs';
self.onmessage=async ({data})=>{
 const {id,bytes,pages}=data||{};
 try{
  const result=await erasePdfRegions(new Uint8Array(bytes),pages);
  self.postMessage({id,result},[result.bytes.buffer]);
 }catch(err){
  self.postMessage({id,error:err?.message||String(err)});
 }
};
