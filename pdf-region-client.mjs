// Dedicated PDF HVD region-eraser worker. Used by the independent region-eraser.html app; no Organizer dependency.
export function eraseRegionsInWorker(bytes,pages,{timeoutMs=180000}={}){
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./pdf-region-worker.mjs',import.meta.url),{type:'module'});
  let settled=false;
  const settle=(err,result)=>{
   if(settled)return;settled=true;clearTimeout(timer);worker.terminate();
   if(err)reject(err);else resolve(result);
  };
  const timer=setTimeout(()=>settle(new Error('Cắt vùng quá thời gian. File gốc không bị thay đổi.')),timeoutMs);
  worker.onerror=e=>settle(new Error('Không tải được engine xóa vector.'));
  worker.onmessage=({data})=>{
   if(data?.id!==1)return;
   if(data.error)settle(new Error(data.error));else settle(null,data.result);
  };
  const input=bytes instanceof Uint8Array?bytes.slice():new Uint8Array(bytes).slice();
  worker.postMessage({id:1,bytes:input.buffer,pages},[input.buffer]);
 });
}
