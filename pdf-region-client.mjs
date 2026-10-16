// PDF HVD: input File/Blob is structured-cloned (no eager main-thread bytes).
// The worker materializes it once; final PDF bytes transfer without copying.
import {validateInputSize,recommendedWorkerDurationMs,WORKER_IDLE_TIMEOUT_MS} from './pdf-region-limits.mjs';
export function eraseRegionsInWorker(source,pages,{timeoutMs,onProgress=()=>{},signal,
 idleTimeoutMs=WORKER_IDLE_TIMEOUT_MS}={}){
 const isBlob=typeof Blob!=='undefined' && source instanceof Blob;
 const size=isBlob?source.size:source?.byteLength;
 validateInputSize(size);
 const duration=timeoutMs??recommendedWorkerDurationMs(size,pages?.length||1);
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(idleTimeoutMs)||idleTimeoutMs<=0)
  return Promise.reject(new Error('Cấu hình thời gian xử lý không hợp lệ.'));
 if(signal?.aborted)return Promise.reject(new Error('Đã hủy xử lý PDF.'));
 return new Promise((resolve,reject)=>{
  let worker;
  try{worker=new Worker(new URL('./pdf-region-worker.mjs',import.meta.url),{type:'module'});}
  catch(error){reject(new Error('Không khởi động được PDFium Worker: '+error.message));return;}
  let settled=false,activityTimer;
  const done=(error,result)=>{
   if(settled)return;settled=true;
   clearTimeout(hardTimer);clearTimeout(activityTimer);
   signal?.removeEventListener('abort',abort);
   worker.terminate();
   if(error)reject(error);else resolve(result);
  };
  const abort=()=>done(new Error('Đã hủy xử lý PDF. Tệp gốc không thay đổi.'));
  const onActivity=()=>{
   clearTimeout(activityTimer);
   activityTimer=setTimeout(()=>done(new Error('Worker không phản hồi trong thời gian cho phép. PDF gốc không thay đổi.')),idleTimeoutMs);
  };
  const hardTimer=setTimeout(()=>done(new Error('Đã hết thời gian xử lý PDF lớn. Hãy giảm số trang/vùng hoặc thử trên thiết bị có nhiều RAM.')),duration);
  signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=e=>done(new Error('PDFium Worker dừng bất thường, có thể do thiếu bộ nhớ. Tệp gốc không bị thay đổi.'));
  worker.onmessageerror=()=>done(new Error('Không nhận được dữ liệu hợp lệ từ PDFium Worker.'));
  worker.onmessage=({data})=>{
   if(data?.id!==1||settled)return;
   onActivity();
   if(data.progress){try{onProgress(data.progress);}catch(_){/* UI callbacks never break a save. */}return;}
   if(data.error)done(new Error(data.error));
   else if(data.result)done(null,data.result);
   else done(new Error('Phản hồi PDFium không hợp lệ.'));
  };
  onActivity();
  try{
   if(isBlob)worker.postMessage({id:1,file:source,pages});
   else {
    // Taking ownership of a whole ArrayBuffer prevents an extra .slice() copy.
    // Views into larger buffers need a compact copy before transfer.
    const buffer=source instanceof ArrayBuffer ? source :
     source?.buffer instanceof ArrayBuffer && source.byteOffset===0 &&
      source.byteLength===source.buffer.byteLength ? source.buffer : source.slice().buffer;
    worker.postMessage({id:1,bytes:buffer,pages},[buffer]);
   }
  }catch(error){done(new Error('Không thể gửi PDF tới Worker: '+error.message));}
 });
}
