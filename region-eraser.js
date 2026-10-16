import {eraseRegionsInWorker} from './pdf-region-client.mjs';
import {validateRegions} from './pdf-region-geometry.mjs';

const $=id=>document.getElementById(id);
const dom={
 input:$('re-input'),pick:$('re-pick'),drop:$('re-dropzone'),upload:$('re-uploader'),
 workspace:$('re-workspace'),filename:$('re-filename'),filesize:$('re-filesize'),
 canvas:$('re-canvas'),overlay:$('re-overlay'),surface:$('re-page-surface'),
 viewport:$('re-viewport'),status:$('re-status'),page:$('re-page'),
 total:$('re-total'),pageInfo:$('re-page-info'),shape:$('re-shape'),role:$('re-role'),
 zones:$('re-zones'),results:$('re-results'),process:$('re-process')
};
const state={
 file:null,pdf:null,pageIndex:0,zoom:1,regions:new Map(),
 history:[],cursor:-1,drawing:false,start:null,vertices:[],shape:'rect',role:'erase',
 renderToken:0,renderTask:null,busy:false,result:null,downloadUrls:new Set()
};
function status(message,type=''){
 dom.status.textContent=message;dom.status.className='re-status'+(type?' '+type:'');
}
function countRegions(){let n=0;for(const z of state.regions.values())n+=z.length;return n;}
function activeRegions(){return state.regions.get(state.pageIndex)||[];}
function safeFileName(file){return (file?.name||'document.pdf').replace(/\.pdf$/i,'').replace(/[\/\\:*?"<>|]+/g,'_').slice(0,90)+'_xoa-vector.pdf';}
function snapshot(){return JSON.stringify([...state.regions.entries()].map(([i,z])=>[i,z]));}
function record(){
 const item=snapshot();
 if(state.history[state.cursor]===item)return;
 state.history=state.history.slice(0,state.cursor+1);
 state.history.push(item);
 if(state.history.length>80)state.history.shift();
 state.cursor=state.history.length-1;
 invalidateResult();
 updateControls();
}
function recover(index){
 if(index<0||index>=state.history.length||state.busy)return;
 state.cursor=index;
 state.regions=new Map(JSON.parse(state.history[index]));
 stopDrawing();invalidateResult();refreshZones();drawRegions();updateControls();
}
function invalidateResult(){if(!state.result)return;state.result=null;dom.results.hidden=true;}
function updateControls(){
 $('re-undo').disabled=state.busy||state.cursor<=0;
 $('re-redo').disabled=state.busy||state.cursor>=state.history.length-1;
 dom.process.disabled=state.busy||!state.file||!([...state.regions.values()].some(z=>z.some(v=>v.mode==='erase')));
 $('re-draw').disabled=state.busy||!state.pdf;
 $('re-clear-page').disabled=state.busy||!activeRegions().length;
 $('re-prev').disabled=state.busy||state.pageIndex<=0;
 $('re-next').disabled=state.busy||!state.pdf||state.pageIndex>=state.pdf.numPages-1;
 $('re-page').disabled=state.busy||!state.pdf;
 $('re-zoom-in').disabled=state.busy||state.zoom>=2.5;
 $('re-zoom-out').disabled=state.busy||state.zoom<=.5;
 $('re-replace').disabled=state.busy;
 $('re-new').disabled=state.busy;
 $('re-shape').disabled=state.busy;
 $('re-role').disabled=state.busy;
}
function setBusy(value){state.busy=value;updateControls();$('re-finish').disabled=value;}
function clearResults(){
 for(const url of state.downloadUrls)URL.revokeObjectURL(url);
 state.downloadUrls.clear();state.result=null;dom.results.hidden=true;
}
async function teardown(){
 state.renderToken++;
 if(state.renderTask){try{state.renderTask.cancel();await state.renderTask.promise;}catch(_){}state.renderTask=null;}
 if(state.pdf){try{await state.pdf.destroy();}catch(_){}state.pdf=null;}
}
async function reset(check=true,selectNew=false){
 if(state.busy){status('Đang xử lý. Hãy chờ trước khi thay tài liệu.','error');return;}
 if(check&&state.file&&(countRegions()>0||state.result)&&!confirm('Đóng PDF hiện tại? Các vùng chọn và kết quả chưa lưu sẽ bị bỏ.'))return;
 await teardown();stopDrawing();clearResults();
 state.file=null;state.regions=new Map();state.history=[];state.cursor=-1;state.pageIndex=0;state.zoom=1;
 dom.input.value='';dom.workspace.hidden=true;dom.upload.hidden=false;
 dom.canvas.width=0;dom.canvas.height=0;dom.overlay.replaceChildren();
 dom.filename.textContent='';status('Có thể mở PDF khác mà không cần quay về trang chủ.');
 if(selectNew)dom.input.click();
}
async function load(file){
 if(state.busy)return;
 if(!file)return;
 if(!(/\.pdf$/i.test(file.name)||file.type==='application/pdf')){status('Chỉ hỗ trợ tài liệu PDF.','error');return;}
 if(file.size===0||file.size>80*1024*1024){status('PDF không hợp lệ hoặc vượt 80 MB.','error');return;}
 if(state.file&&(countRegions()>0||state.result)&&!confirm('Thay PDF hiện tại? Vùng chọn và kết quả chưa tải sẽ bị bỏ.'))return;
 setBusy(true);
 try{
  await teardown();stopDrawing();clearResults();
  state.regions=new Map();state.history=[];state.cursor=-1;state.pageIndex=0;state.zoom=1;
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!window.pdfjsLib)throw new Error('Không tải được trình xem PDF. Vui lòng tải lại trang.');
  const loading=window.pdfjsLib.getDocument({data:bytes});
  let pdf;
  try{pdf=await loading.promise;}catch(error){await loading.destroy();throw error;}
  state.pdf=pdf;state.file=file;
  dom.upload.hidden=true;dom.workspace.hidden=false;
  dom.filename.textContent=file.name;
  dom.filesize.textContent=(file.size/1024/1024).toFixed(2)+' MB · '+pdf.numPages+' trang';
  dom.page.max=pdf.numPages;
  dom.total.textContent='/ '+pdf.numPages;
  record();
  await showPage(0);
  status('Đã mở PDF. Vẽ một hoặc nhiều vùng để bắt đầu.','success');
 }catch(error){
  status(error.message||'Không mở được PDF.','error');
  state.file=null;
  await teardown();
  dom.workspace.hidden=true;dom.upload.hidden=false;
 }finally{setBusy(false);}
}
function pos(e){
 const r=dom.overlay.getBoundingClientRect();
 return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
}
function boxPoints(a,b){return [{x:a.x,y:a.y},{x:b.x,y:a.y},{x:b.x,y:b.y},{x:a.x,y:b.y}];}
function svgPoly(points,mode,temporary=false){
 const p=document.createElementNS('http://www.w3.org/2000/svg','polygon');
 p.setAttribute('points',points.map(pt=>(pt.x*1000).toFixed(3)+','+(pt.y*1000).toFixed(3)).join(' '));
 p.setAttribute('fill',mode==='erase'?'rgba(249,83,73,.18)':'rgba(0,195,128,.16)');
 p.setAttribute('stroke',mode==='erase'?'#f95349':'#00cc94');
 p.setAttribute('stroke-width','2.5');p.setAttribute('vector-effect','non-scaling-stroke');
 if(temporary)p.setAttribute('stroke-dasharray','7 5');
 return p;
}
function drawRegions(temporary=[]){
 dom.overlay.replaceChildren();
 for(const r of activeRegions())dom.overlay.append(svgPoly(r.points,r.mode));
 if(temporary.length>=2)dom.overlay.append(svgPoly(temporary,state.role,true));
}
function refreshZones(){
 const regions=activeRegions();
 dom.zones.replaceChildren();
 if(!regions.length){const p=document.createElement('p');p.textContent='Chưa có vùng nào trên trang này.';dom.zones.append(p);}
 regions.forEach((z,i)=>{
  const row=document.createElement('div');row.className='re-zone re-zone-'+z.mode;
  const span=document.createElement('span');span.textContent=(i+1)+'. '+(z.mode==='erase'?'Vùng xóa':'Vùng bảo vệ')+' · '+z.points.length+' đỉnh';
  const remove=document.createElement('button');remove.type='button';remove.textContent='✕';remove.setAttribute('aria-label','Bỏ vùng '+(i+1));
  remove.disabled=state.busy;remove.addEventListener('click',()=>{
   const copy=activeRegions().slice();copy.splice(i,1);
   if(copy.length)state.regions.set(state.pageIndex,copy);else state.regions.delete(state.pageIndex);
   record();refreshZones();drawRegions();
  });
  row.append(span,remove);dom.zones.append(row);
 });
 $('re-page-info').textContent='Trang '+(state.pageIndex+1)+' · '+regions.length+' vùng đã chọn · '+countRegions()+' vùng trên toàn PDF';
 updateControls();
}
function stopDrawing(){
 state.drawing=false;state.start=null;state.vertices=[];
 dom.overlay.classList.remove('drawing');
 $('re-draw').textContent='＋ Bắt đầu vẽ vùng';
 $('re-finish').hidden=true;
 drawRegions();
}
function startDrawing(){
 if(state.busy||!state.pdf)return;
 if(state.drawing){stopDrawing();return;}
 state.shape=dom.shape.value;state.role=dom.role.value;
 state.drawing=true;state.start=null;state.vertices=[];
 dom.overlay.classList.add('drawing');
 $('re-draw').textContent='✕ Hủy vẽ';
 $('re-finish').hidden=state.shape!=='poly';
 status(state.shape==='rect'?'Kéo chuột trên trang để khoanh hình chữ nhật.':'Nhấp từng đỉnh, sau đó Enter hoặc Hoàn thành đa giác.');
}
function addRegion(points){
 if(points.length<3){status('Vùng chọn phải có ít nhất 3 đỉnh.','error');return;}
 const candidate={mode:state.role,points:points.map(p=>({x:p.x,y:p.y}))};
 const regions=activeRegions().concat([candidate]);
 try{
  const regionsForCheck=regions.some(z=>z.mode==='erase')?regions:[{mode:'erase',points:candidate.points},...regions];
  validateRegions(regionsForCheck);
 }catch(e){status(e.message,'error');return;}
 state.regions.set(state.pageIndex,regions);
 record();stopDrawing();refreshZones();
 status('Đã thêm vùng. Có thể tiếp tục vẽ vùng khác trước khi xuất PDF.','success');
}
async function showPage(index){
 if(!state.pdf||state.busy&&state.file===null)return;
 if(!Number.isInteger(index)||index<0||index>=state.pdf.numPages)return;
 state.pageIndex=index;stopDrawing();refreshZones();
 dom.page.value=index+1;
 await renderPage();
}
async function renderPage(){
 if(!state.pdf)return;
 const token=++state.renderToken;
 const old=state.renderTask;
 if(old){try{old.cancel();await old.promise;}catch(_){}}
 const page=await state.pdf.getPage(state.pageIndex+1);
 if(token!==state.renderToken)return;
 const box=page.getViewport({scale:1});
 const available=Math.max(200,dom.viewport.clientWidth-60);
 const fit=Math.min(1.8,available/box.width);
 const scale=Math.max(.1,fit*state.zoom);
 const view=page.getViewport({scale});
 const dpr=Math.min(2,window.devicePixelRatio||1);
 dom.canvas.width=Math.round(view.width*dpr);dom.canvas.height=Math.round(view.height*dpr);
 dom.canvas.style.width=view.width+'px';dom.canvas.style.height=view.height+'px';
 dom.surface.style.width=view.width+'px';dom.surface.style.height=view.height+'px';
 const ctx=dom.canvas.getContext('2d',{alpha:false});
 const render=page.render({canvasContext:ctx,viewport:view,transform:dpr===1?undefined:[dpr,0,0,dpr,0,0]});
 state.renderTask=render;
 try{await render.promise;}catch(error){
  if(error.name!=='RenderingCancelledException')status('Không dựng được trang: '+error.message,'error');
 }
 if(state.renderTask===render)state.renderTask=null;
 if(token!==state.renderToken)return;
 $('re-zoom-label').textContent=Math.round(state.zoom*100)+'%';
 drawRegions();refreshZones();
}
function havePending(){
 return countRegions()>0&&!state.result;
}
async function apply(){
 if(state.busy||!state.file)return;
 const pages=[...state.regions.entries()].filter(([,zones])=>zones.some(z=>z.mode==='erase')).map(([pageIndex,regions])=>({pageIndex,regions}));
 if(!pages.length){status('Cần ít nhất một vùng xóa màu đỏ.','error');return;}
 for(const [pageIndex,zones] of state.regions){
  if(!zones.length)continue;
  if(!zones.some(z=>z.mode==='erase')){status('Trang '+(pageIndex+1)+' có vùng bảo vệ nhưng không có vùng xóa.','error');return;}
  try{validateRegions(zones);}catch(e){status('Trang '+(pageIndex+1)+': '+e.message,'error');return;}
 }
 setBusy(true);
 status('Đang cắt vector trực tiếp bằng PDFium. Giữ nguyên công cụ cho đến khi hoàn thành.');
 try{
  const bytes=new Uint8Array(await state.file.arrayBuffer());
  const result=await eraseRegionsInWorker(bytes,pages);
  if(!result?.bytes?.length)throw new Error('Không nhận được PDF kết quả.');
  state.result=result;
  $('re-result-title').textContent='PDF đã được xử lý · vùng đã cắt thật';
  $('re-result-summary').textContent=result.report.changedObjects+' PATH bị thay đổi · '+result.report.newFragments+' đoạn vector được giữ lại · '+result.report.skippedNonVector+' đối tượng phi vector bị bỏ qua. Tệp nguồn vẫn nguyên vẹn.';
  dom.results.hidden=false;
  dom.results.scrollIntoView({behavior:'smooth',block:'nearest'});
  status('Xử lý thành công. Bấm Tải PDF kết quả để lưu mà không rời công cụ.','success');
 }catch(error){invalidateResult();status('Không thể xóa an toàn: '+(error.message||String(error)),'error');}
 finally{setBusy(false);}
}
function download(){
 if(!state.result||!state.file)return;
 const blob=new Blob([state.result.bytes],{type:'application/pdf'});
 const url=URL.createObjectURL(blob);state.downloadUrls.add(url);
 const a=document.createElement('a');a.href=url;a.download=safeFileName(state.file);
 document.body.append(a);a.click();a.remove();
 status('Đã gửi yêu cầu tải PDF. Có thể tiếp tục chỉnh vùng và xuất lại.','success');
 setTimeout(()=>{URL.revokeObjectURL(url);state.downloadUrls.delete(url);},120000);
}
function onPointerDown(e){
 if(!state.drawing)return;e.preventDefault();
 const p=pos(e);
 if(state.shape==='rect'){state.start=p;dom.overlay.setPointerCapture(e.pointerId);return;}
 if(state.vertices.length>=256){status('Đạt giới hạn 256 đỉnh.','error');return;}
 const last=state.vertices[state.vertices.length-1];
 if(last&&Math.hypot(last.x-p.x,last.y-p.y)<.003)return;
 state.vertices.push(p);drawRegions(state.vertices);
}
function onPointerMove(e){if(state.drawing&&state.shape==='rect'&&state.start)drawRegions(boxPoints(state.start,pos(e)));}
function onPointerUp(e){
 if(!state.drawing||state.shape!=='rect'||!state.start)return;
 const a=state.start,b=pos(e);state.start=null;
 if(Math.abs(a.x-b.x)<.004||Math.abs(a.y-b.y)<.004){status('Kéo để tạo vùng rộng hơn.','error');drawRegions();return;}
 addRegion(boxPoints(a,b));
}
function finishPolygon(){if(state.drawing&&state.shape==='poly')addRegion(state.vertices);}
function wire(){
 dom.pick.addEventListener('click',e=>{e.stopPropagation();dom.input.click();});
 dom.drop.addEventListener('click',()=>dom.input.click());
 dom.drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();dom.input.click();}});
 dom.drop.addEventListener('dragover',e=>{e.preventDefault();dom.drop.classList.add('dragover');});
 dom.drop.addEventListener('dragleave',()=>dom.drop.classList.remove('dragover'));
 dom.drop.addEventListener('drop',e=>{e.preventDefault();dom.drop.classList.remove('dragover');load(e.dataTransfer.files[0]);});
 dom.input.addEventListener('change',e=>{const f=e.target.files[0];if(f)load(f);});
 $('re-new').addEventListener('click',()=>reset());
 $('re-replace').addEventListener('click',()=>reset(true,true));
 $('re-undo').addEventListener('click',()=>recover(state.cursor-1));
 $('re-redo').addEventListener('click',()=>recover(state.cursor+1));
 $('re-draw').addEventListener('click',startDrawing);
 $('re-finish').addEventListener('click',finishPolygon);
 $('re-clear-page').addEventListener('click',()=>{
  if(state.busy||!activeRegions().length||!confirm('Bỏ toàn bộ vùng chọn trên trang này?'))return;
  state.regions.delete(state.pageIndex);record();stopDrawing();refreshZones();
 });
 dom.shape.addEventListener('change',()=>{if(state.drawing)stopDrawing();});
 dom.role.addEventListener('change',()=>{if(state.drawing)stopDrawing();});
 dom.overlay.addEventListener('pointerdown',onPointerDown);
 dom.overlay.addEventListener('pointermove',onPointerMove);
 dom.overlay.addEventListener('pointerup',onPointerUp);
 dom.overlay.addEventListener('pointercancel',()=>{if(state.drawing&&state.shape==='rect'){state.start=null;drawRegions();}});
 dom.overlay.addEventListener('dblclick',e=>{if(state.drawing&&state.shape==='poly'){e.preventDefault();finishPolygon();}});
 window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&state.drawing){e.preventDefault();stopDrawing();}
  if(e.key==='Enter'&&state.drawing&&state.shape==='poly'){e.preventDefault();finishPolygon();}
 });
 $('re-prev').addEventListener('click',()=>showPage(state.pageIndex-1));
 $('re-next').addEventListener('click',()=>showPage(state.pageIndex+1));
 dom.page.addEventListener('change',()=>{let n=Number(dom.page.value);if(Number.isInteger(n))showPage(n-1);dom.page.value=state.pageIndex+1;});
 $('re-zoom-out').addEventListener('click',()=>{state.zoom=Math.max(.5,state.zoom-.25);renderPage();updateControls();});
 $('re-zoom-in').addEventListener('click',()=>{state.zoom=Math.min(2.5,state.zoom+.25);renderPage();updateControls();});
 $('re-fit').addEventListener('click',()=>{state.zoom=1;renderPage();updateControls();});
 dom.process.addEventListener('click',apply);
 $('re-download').addEventListener('click',download);
 window.addEventListener('beforeunload',e=>{if(havePending()){e.preventDefault();e.returnValue='';}});
}
wire();updateControls();
