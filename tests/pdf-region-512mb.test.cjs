const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const limits=()=>import('../pdf-region-limits.mjs');
test('512 MiB is accepted and 512 MiB plus one byte is refused without allocation',async()=>{
 const {MAX_INPUT_BYTES,LARGE_FILE_NOTICE_BYTES,validateInputSize}=await limits();
 assert.equal(MAX_INPUT_BYTES,536870912);
 assert.equal(LARGE_FILE_NOTICE_BYTES,268435456);
 assert.equal(validateInputSize(MAX_INPUT_BYTES),MAX_INPUT_BYTES);
 assert.equal(validateInputSize(80*1024*1024+1),80*1024*1024+1);
 assert.throws(()=>validateInputSize(MAX_INPUT_BYTES+1),/512 MiB/);
 assert.throws(()=>validateInputSize(0),/trống/);
 assert.throws(()=>validateInputSize(Number.MAX_VALUE),/không hợp lệ/);
});
test('adaptive worker deadline grows with input and is capped; idle timeout differs',async()=>{
 const {recommendedWorkerDurationMs,WORKER_IDLE_TIMEOUT_MS,WORKER_MAX_DURATION_MS}=await limits();
 const small=recommendedWorkerDurationMs(10*1024*1024,1);
 const medium=recommendedWorkerDurationMs(256*1024*1024,1);
 const large=recommendedWorkerDurationMs(512*1024*1024,3);
 assert.ok(large>medium&&medium>small);
 assert.ok(large<=WORKER_MAX_DURATION_MS);
 assert.ok(WORKER_IDLE_TIMEOUT_MS>=4*60*1000);
 assert.throws(()=>recommendedWorkerDurationMs(100,501),/không hợp lệ/);
});
test('preview scale caps actual rendered backing bitmap at 16 million pixels',async()=>{
 const {MAX_RENDER_PIXELS,cappedPreviewScale}=await limits();
 for(const [w,h,scale,dpr] of [[20000,10000,2,2],[2000,4000,3,2],[600,800,1,1]]){
  const result=cappedPreviewScale(w,h,scale,dpr);
  assert.ok(result>0&&result<=scale);
  assert.ok(w*h*result*result*dpr*dpr<=MAX_RENDER_PIXELS+1);
 }
 assert.throws(()=>cappedPreviewScale(0,500,2,1),/không hợp lệ/);
});
test('standalone UI opens Blob URLs and does not allocate full PDF on UI before Worker',()=>{
 const s=read('region-eraser.js'),worker=read('pdf-region-worker.mjs'),client=read('pdf-region-client.mjs'),native=read('pdf-region-native.mjs');
 assert.match(s,/URL\.createObjectURL\(file\)/);
 assert.match(s,/disableAutoFetch:true/);
 assert.match(s,/cappedPreviewScale\(/);
 assert.match(s,/eraseRegionsInWorker\(state\.file,pages/);
 assert.doesNotMatch(s,/await (?:state\.)?file\.arrayBuffer\(\)/);
 assert.match(client,/worker\.postMessage\(\{id:1,file:source,pages\}\)/);
 assert.match(worker,/await file\.arrayBuffer\(\)/);
 assert.match(worker,/postMessage\(\{id,result:.*\},\[buffer\]\)/s);
 assert.match(native,/validateInputSize\(bytes\.byteLength\)/);
 assert.doesNotMatch(native,/LIMIT_BYTES=80/);
});
test('worker supports progress, cancellation, adaptive duration and lifecycle cleanup',()=>{
 const s=read('pdf-region-client.mjs'),native=read('pdf-region-native.mjs');
 for(const marker of ['signal?.addEventListener','worker.terminate()','WORKER_IDLE_TIMEOUT_MS',
    'recommendedWorkerDurationMs','onProgress(data.progress)','clearTimeout(activityTimer)'])
  assert.ok(s.includes(marker),marker);
 for(const marker of ["emit('page-start'","emit('objects'","emit('page-done'","emit('saving'"])
  assert.ok(native.includes(marker),marker);
 const html=read('region-eraser.html');
 assert.match(html,/id="re-progress-bar"/);
 assert.match(html,/id="re-cancel"/);
 assert.match(html,/512 MiB/);
});
