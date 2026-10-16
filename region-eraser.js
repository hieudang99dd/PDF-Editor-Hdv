import {eraseRegionsInWorker} from './pdf-region-client.mjs?v=20261016-all1';
import {validateRegions} from './pdf-region-geometry.mjs';
import {planRegionJobs} from './pdf-region-plan.mjs';
import {moveRegionHandle} from './pdf-region-handles.mjs';
import {MAX_INPUT_BYTES,LARGE_FILE_NOTICE_BYTES,PREVIEW_RANGE_CHUNK_BYTES,
  validateInputSize,cappedPreviewScale} from './pdf-region-limits.mjs?v=20261016-512mb1';

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
 renderToken:0,renderTask:null,busy:false,result:null,downloadUrls:new Set(),
 previewUrl:null,abortController:null,
 operation:'union',galleryStart:0,galleryGeneration:0,galleryObserver:null,
 reviewPdf:null,reviewUrl:null,reviewMode:false,exported:false,
 selectedZone:-1,editDrag:null
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
function releaseReview(){
 state.reviewMode=false;
 $('re-review-switch').hidden=true;
 dom.overlay.removeAttribute('hidden');dom.overlay.style.display='';
 const pdf=state.reviewPdf,url=state.reviewUrl;
 state.reviewPdf=null;state.reviewUrl=null;
 if(pdf)Promise.resolve(pdf.destroy()).catch(()=>{}).finally(()=>{if(url)URL.revokeObjectURL(url)});
 else if(url)URL.revokeObjectURL(url);
}
function invalidateResult(){
 if(!state.result&&!state.reviewPdf)return;
 const wasReview=state.reviewMode;
 releaseReview();state.result=null;state.exported=false;dom.results.hidden=true;
 updateControls();
 if(wasReview&&state.pdf&&!$('re-editor-view').hidden)
  renderPage().catch(e=>status('Không tải lại được bản gốc: '+e.message,'error'));
}
function updateWorkflow(){
 const hasFile=!!state.file,applied=!!state.result;
 const stage=applied?(state.exported?'export':'review'):
  state.busy?'apply':hasFile&&countRegions()?'apply':'edit';
 for(const step of ['edit','apply','review','export']){
  const el=$('re-step-'+step);
  el.classList.toggle('active',step===stage);
  el.classList.toggle('complete',
   (step==='edit'&&stage!=='edit')||
   (step==='apply'&&(stage==='review'||stage==='export'))||
   (step==='review'&&stage==='export'));
 }
}
function updateControls(){
 $('re-undo').disabled=state.busy||!!state.result||state.cursor<=0;
 $('re-redo').disabled=state.busy||!!state.result||state.cursor>=state.history.length-1;
 dom.process.disabled=state.busy||!!state.result||!state.file||
  !([...state.regions.values()].some(z=>z.some(v=>v.mode==='erase')));
 $('re-download').disabled=state.busy||!state.result||!state.result.blob;
 $('re-rework').disabled=state.busy||!state.result;
 $('re-draw').disabled=state.busy||!state.pdf||!!state.result;
 $('re-clear-page').disabled=state.busy||!!state.result||!activeRegions().length;
 $('re-prev').disabled=state.busy||state.pageIndex<=0;
 $('re-next').disabled=state.busy||!state.pdf||state.pageIndex>=state.pdf.numPages-1;
 $('re-page').disabled=state.busy||!state.pdf;
 $('re-zoom-in').disabled=state.busy||state.zoom>=2.5;
 $('re-zoom-out').disabled=state.busy||state.zoom<=.5;
 $('re-replace').disabled=state.busy;
 $('re-new').disabled=state.busy;
 $('re-shape').disabled=state.busy||!!state.result;
 $('re-role').disabled=state.busy||!!state.result||state.operation!=='union';
 $('re-operation').disabled=state.busy||!!state.result;
 $('re-object-mode').disabled=state.busy||!!state.result;
 $('re-allow-signed').disabled=state.busy||!!state.result;
 $('re-scope').disabled=state.busy||!!state.result;
 $('re-range-from').disabled=state.busy||!!state.result;
 $('re-range-to').disabled=state.busy||!!state.result;
 $('re-gallery-back').disabled=state.busy;
 $('re-gallery-prev').disabled=state.busy||state.galleryStart===0;
 $('re-gallery-next').disabled=state.busy||!state.pdf||state.galleryStart+24>=state.pdf.numPages;
 $('re-cancel').hidden=!state.abortController;
 updateWorkflow();
}
function setBusy(value){state.busy=value;updateControls();$('re-finish').disabled=value;}
function clearResults(){
 for(const url of state.downloadUrls)URL.revokeObjectURL(url);
 state.downloadUrls.clear();releaseReview();state.result=null;state.exported=false;dom.results.hidden=true;
 updateControls();
}
async function teardown(){
 state.renderToken++;state.galleryGeneration++;
 state.galleryObserver?.disconnect();state.galleryObserver=null;
 if(state.renderTask){try{state.renderTask.cancel();await state.renderTask.promise;}catch(_){}state.renderTask=null;}
 if(state.pdf){try{await state.pdf.destroy();}catch(_){}state.pdf=null;}
 if(state.previewUrl){URL.revokeObjectURL(state.previewUrl);state.previewUrl=null;}
}
async function reset(check=true,selectNew=false){
 if(state.busy){status('Đang xử lý. Hãy chờ trước khi thay tài liệu.','error');return;}
 if(check&&state.file&&(countRegions()>0||state.result)&&!confirm('Đóng PDF hiện tại? Các vùng chọn và kết quả chưa lưu sẽ bị bỏ.'))return;
 await teardown();stopDrawing();clearResults();
 state.file=null;state.regions=new Map();state.history=[];state.cursor=-1;state.pageIndex=0;state.zoom=1;
 state.galleryStart=0;state.operation='union';$('re-operation').value='union';
 state.selectedZone=-1;state.editDrag=null;
 $('re-object-mode').value='whole-object';$('re-allow-signed').checked=false;
 dom.input.value='';dom.workspace.hidden=true;dom.upload.hidden=false;
 document.body.classList.remove('re-workspace-open');
 dom.canvas.width=0;dom.canvas.height=0;dom.overlay.replaceChildren();dom.zones.replaceChildren();
 $('re-gallery-grid').replaceChildren();$('re-editor-view').hidden=true;$('re-gallery-panel').hidden=false;
 dom.filename.textContent='';status('Có thể mở PDF khác mà không cần quay về trang chủ.');
 if(selectNew)dom.input.click();
}
async function load(file){
 if(state.busy)return;
 if(!file)return;
 if(!(/\.pdf$/i.test(file.name)||file.type==='application/pdf')){status('Chỉ hỗ trợ tài liệu PDF.','error');return;}
 try{validateInputSize(file.size);}catch(e){status(e.message,'error');return;}
 if(file.size>=LARGE_FILE_NOTICE_BYTES && !confirm('PDF lớn từ 256 MiB có thể tiêu thụ nhiều RAM. Tiếp tục mở tệp '+(file.size/1024/1024).toFixed(1)+' MiB?'))return;
 if(state.file&&(countRegions()>0||state.result)&&!confirm('Thay PDF hiện tại? Vùng chọn và kết quả chưa tải sẽ bị bỏ.'))return;
 setBusy(true);
 try{
  await teardown();stopDrawing();clearResults();
  state.regions=new Map();state.history=[];state.cursor=-1;state.pageIndex=0;state.zoom=1;
  state.galleryStart=0;state.operation='union';$('re-operation').value='union';
 state.selectedZone=-1;state.editDrag=null;
 $('re-object-mode').value='whole-object';$('re-allow-signed').checked=false;
  if(!window.pdfjsLib)throw new Error('Không tải được trình xem PDF. Vui lòng tải lại trang.');
  // Let PDF.js fetch the Blob URL. Do not allocate a full-size File.arrayBuffer()
  // on the main UI thread just to preview the first page.
  state.previewUrl=URL.createObjectURL(file);
  const loading=window.pdfjsLib.getDocument({
    url:state.previewUrl,rangeChunkSize:PREVIEW_RANGE_CHUNK_BYTES,
    disableAutoFetch:true
  });
  let pdf;
  try{pdf=await loading.promise;}catch(error){await loading.destroy();throw error;}
  state.pdf=pdf;state.file=file;
  dom.upload.hidden=true;dom.workspace.hidden=false;
  document.body.classList.add('re-workspace-open');
  dom.filename.textContent=file.name;
  dom.filesize.textContent=(file.size/1024/1024).toFixed(2)+' MB · '+pdf.numPages+' trang';
  dom.page.max=pdf.numPages;
  dom.total.textContent='/ '+pdf.numPages;
  $('re-range-from').max=pdf.numPages;$('re-range-to').max=pdf.numPages;
  $('re-range-from').value=1;$('re-range-to').value=pdf.numPages;
  $('re-gallery-panel').hidden=false;$('re-editor-view').hidden=true;
  record();
  await showGallery(0);
  status('Đã mở PDF. Vẽ một hoặc nhiều vùng để bắt đầu.','success');
 }catch(error){
  status(error.message||'Không mở được PDF.','error');
  state.file=null;
  await teardown();
  dom.workspace.hidden=true;dom.upload.hidden=false;
  document.body.classList.remove('re-workspace-open');
 }finally{setBusy(false);}
}
// Memory-bounded storyboard: 24 page cards, lazy 150-pixel thumbnails,
// serial renders to avoid allocating hundreds of canvas bitmaps at once.
let thumbnailQueue=Promise.resolve();
async function showGallery(start=0){
 if(!state.pdf)return;
 const generation=++state.galleryGeneration;
 state.galleryObserver?.disconnect();state.galleryObserver=null;
 const total=state.pdf.numPages;
 const first=Math.max(0,Math.min(Math.floor(start/24)*24,Math.floor((total-1)/24)*24));
 state.galleryStart=first;
 $('re-gallery-range').textContent=(first+1)+'–'+Math.min(total,first+24)+' / '+total;
 $('re-gallery-prev').disabled=first===0;
 $('re-gallery-next').disabled=first+24>=total;
 const grid=$('re-gallery-grid');grid.replaceChildren();
 const observer=typeof IntersectionObserver==='function'?
  new IntersectionObserver(entries=>{
   for(const item of entries)if(item.isIntersecting){
    observer.unobserve(item.target);
    thumbnailQueue=thumbnailQueue.then(()=>renderThumbnail(item.target,generation)).catch(()=>{});
   }
  },{rootMargin:'250px'}):null;
 state.galleryObserver=observer;
 for(let i=first;i<Math.min(total,first+24);i++){
  const card=document.createElement('button');
  card.type='button';card.className='re-page-card';card.dataset.page=String(i);
  card.setAttribute('aria-label','Phóng to trang '+(i+1)+' để thao tác xóa vùng');
  const canvas=document.createElement('canvas');canvas.width=112;canvas.height=145;
  const title=document.createElement('span');title.className='re-page-number';title.textContent='Trang '+(i+1);
  const count=document.createElement('small');count.className='re-page-count';
  const n=(state.regions.get(i)||[]).length;
  count.textContent=n?n+' vùng đã vẽ':'Nhấp để phóng to';
  card.append(canvas,title,count);
  card.addEventListener('click',()=>enterPage(i));
  grid.append(card);
  if(observer)observer.observe(card);
  else thumbnailQueue=thumbnailQueue.then(()=>renderThumbnail(card,generation)).catch(()=>{});
 }
}
async function renderThumbnail(card,generation){
 if(generation!==state.galleryGeneration||!state.pdf||!card.isConnected)return;
 const index=Number(card.dataset.page),canvas=card.querySelector('canvas');
 try{
  const page=await state.pdf.getPage(index+1);
  if(generation!==state.galleryGeneration)return;
  const box=page.getViewport({scale:1});
  const scale=Math.min(144/box.width,175/box.height,1);
  const view=page.getViewport({scale});
  canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);
  const task=page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:view});
  await task.promise;page.cleanup?.();
 }catch(error){
  if(generation===state.galleryGeneration){
   const label=card.querySelector('.re-page-count');
   if(label)label.textContent='Không xem được hình thu nhỏ';
  }
 }
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
 const zones=state.editDrag?.draftZones||activeRegions(),ns='http://www.w3.org/2000/svg';
 const canEdit=!state.drawing&&!state.busy&&!state.result&&zones.length>0;
 dom.overlay.classList.toggle('editing',canEdit);
 dom.overlay.classList.toggle('drawing',state.drawing);
 const polygonText=points=>points.map(p=>(p.x*1000)+','+(p.y*1000)).join(' ');
 if(zones.length===2&&state.operation==='between'){
  const shape=document.createElementNS(ns,'path');
  const shapePath=pts=>'M '+pts.map(p=>(p.x*1000)+' '+(p.y*1000)).join(' L ')+' Z';
  shape.setAttribute('d',shapePath(zones[0].points)+' '+shapePath(zones[1].points));
  shape.setAttribute('fill-rule','evenodd');shape.setAttribute('fill','rgba(250,108,42,.31)');
  shape.setAttribute('pointer-events','none');dom.overlay.append(shape);
 }else if(zones.length===2&&state.operation==='intersection'){
  const defs=document.createElementNS(ns,'defs');
  const clip=document.createElementNS(ns,'clipPath');clip.id='re-operation-overlap';
  const poly=document.createElementNS(ns,'polygon');
  poly.setAttribute('points',polygonText(zones[0].points));clip.append(poly);defs.append(clip);
  const overlap=document.createElementNS(ns,'polygon');
  overlap.setAttribute('points',polygonText(zones[1].points));
  overlap.setAttribute('clip-path','url(#re-operation-overlap)');
  overlap.setAttribute('fill','rgba(255,119,28,.38)');
  dom.overlay.append(defs,overlap);
 }
 for(const [i,r] of zones.entries()){
  const polygon=svgPoly(r.points,r.mode);
  polygon.dataset.zoneIndex=String(i);
  polygon.classList.add('re-zone-shape');
  if(i===state.selectedZone)polygon.classList.add('re-zone-selected');
  dom.overlay.append(polygon);
 }
 if(canEdit&&zones[state.selectedZone]){
  const points=zones[state.selectedZone].points;
  const bounds=dom.overlay.getBoundingClientRect();
  const rx=1000*6/Math.max(1,bounds.width),ry=1000*6/Math.max(1,bounds.height);
  const group=document.createElementNS(ns,'g');
  group.setAttribute('aria-label','Tay nắm chỉnh sửa đường bao');
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   const edge=document.createElementNS(ns,'line');
   edge.setAttribute('x1',a.x*1000);edge.setAttribute('y1',a.y*1000);
   edge.setAttribute('x2',b.x*1000);edge.setAttribute('y2',b.y*1000);
   edge.classList.add('re-edit-hit-edge');
   edge.dataset.editHandle='edge';edge.dataset.handleIndex=String(i);
   group.append(edge);
   const middle=document.createElementNS(ns,'ellipse');
   middle.setAttribute('cx',(a.x+b.x)*500);middle.setAttribute('cy',(a.y+b.y)*500);
   middle.setAttribute('rx',rx);middle.setAttribute('ry',ry);
   middle.classList.add('re-edit-grip-edge');
   middle.dataset.editHandle='edge';middle.dataset.handleIndex=String(i);
   group.append(middle);
  }
  for(let i=0;i<points.length;i++){
   const point=points[i],vertex=document.createElementNS(ns,'ellipse');
   vertex.setAttribute('cx',point.x*1000);vertex.setAttribute('cy',point.y*1000);
   vertex.setAttribute('rx',rx*1.2);vertex.setAttribute('ry',ry*1.2);
   vertex.classList.add('re-edit-grip-vertex');
   vertex.dataset.editHandle='vertex';vertex.dataset.handleIndex=String(i);
   group.append(vertex);
  }
  dom.overlay.append(group);
 }
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
  remove.disabled=state.busy||!!state.result;remove.addEventListener('click',()=>{
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
 if(state.reviewMode){status('Chuyển về Bản gốc để chỉnh lại vùng.','error');return;}
 if(state.drawing){stopDrawing();return;}
 state.shape=dom.shape.value;state.role=state.operation==='union'?dom.role.value:'erase';
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
  if(state.operation!=='union'&&regions.length>2)
   throw Error('Chế độ này chỉ cho phép đúng hai đường bao.');
  const regionsForCheck=regions.some(z=>z.mode==='erase')?regions:[{mode:'erase',points:candidate.points},...regions];
  validateRegions(regionsForCheck,state.operation!=='union'&&regions.length===2?state.operation:'union');
 }catch(e){status(e.message,'error');return;}
 state.regions.set(state.pageIndex,regions);
 record();stopDrawing();refreshZones();
 status('Đã thêm vùng. Có thể tiếp tục vẽ vùng khác trước khi xuất PDF.','success');
}
async function enterPage(index){
 if(!state.pdf||(state.busy&&!state.reviewMode)||index<0||index>=state.pdf.numPages)return;
 $('re-gallery-panel').hidden=true;$('re-editor-view').hidden=false;
 $('re-editor-title').textContent='Trang '+(index+1)+' · Chọn vùng xóa';
 await showPage(index);
}
async function returnGallery(){
 if(state.busy)return;
 stopDrawing();
 $('re-editor-view').hidden=true;$('re-gallery-panel').hidden=false;
 await showGallery(Math.floor(state.pageIndex/24)*24);
}
async function showPage(index){
 if(!state.pdf||state.busy&&state.file===null)return;
 if(!Number.isInteger(index)||index<0||index>=state.pdf.numPages)return;
 state.pageIndex=index;state.editDrag=null;state.selectedZone=(state.regions.get(index)||[]).length?0:-1;
 stopDrawing();refreshZones();
 dom.page.value=index+1;
 await renderPage();
}
async function renderPage(){
 if(!state.pdf)return;
 const token=++state.renderToken;
 const old=state.renderTask;
 if(old){try{old.cancel();await old.promise;}catch(_){}}
 const pdf=state.reviewMode&&state.reviewPdf?state.reviewPdf:state.pdf;
 const page=await pdf.getPage(state.pageIndex+1);
 if(token!==state.renderToken)return;
 const box=page.getViewport({scale:1});
 const available=Math.max(200,dom.viewport.clientWidth-60);
 const fit=Math.min(1.8,available/box.width);
 const dpr=Math.min(2,window.devicePixelRatio||1);
 const desiredScale=Math.max(.1,fit*state.zoom);
 // Limit PDF.js canvas to <=16 megapixels, including devicePixelRatio;
 // very large CAD sheets must not allocate hundreds of MiB just to preview.
 const scale=cappedPreviewScale(box.width,box.height,desiredScale,dpr);
 const view=page.getViewport({scale});
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
 $('re-zoom-label').textContent=Math.round(state.zoom*100)+'%'+(scale<desiredScale-.0001?' · giới hạn RAM':'');
 dom.overlay.toggleAttribute('hidden',state.reviewMode);
 dom.overlay.style.display=state.reviewMode?'none':'';
 drawRegions();refreshZones();
}
function havePending(){
 return countRegions()>0&&!state.exported;
}
async function apply(){
 if(state.busy||!state.file||state.result)return;
 let pages;
 try{
  pages=planRegionJobs(state.regions,{
   scope:$('re-scope').value,pageIndex:state.pageIndex,
   from:Number($('re-range-from').value),to:Number($('re-range-to').value),
   totalPages:state.pdf.numPages,operation:state.operation
  });
 }catch(error){status(error.message,'error');return;}
 const controller=new AbortController();
 state.abortController=controller;
 setBusy(true);
 $('re-progress').hidden=false;
 $('re-progress-bar').value=0;
 $('re-progress-label').textContent='Chuẩn bị PDFium...';
 $('re-progress-note').textContent='Xử lý trong Worker; file gốc giữ nguyên.';
 status('Đang xử lý trong PDFium Worker. Có thể Hủy nếu cần.');
 try{
  // Supply the *per-page* affine viewport from the same PDF.js rendering
  // engine used to draw the selection overlay. This preserves exact cursor
  // coordinates when pages have inherited /Rotate, CropBox, off-origin page
  // bounds and mixed portrait/landscape layouts within a selected range.
  for(let i=0;i<pages.length;i++){
   if(controller.signal.aborted)throw Error('Đã hủy thao tác.');
   $('re-progress-label').textContent='Đồng bộ tọa độ trang '+(i+1)+' / '+pages.length;
   $('re-progress-bar').value=Math.min(12,Math.floor((i+1)*12/pages.length));
   const page=await state.pdf.getPage(pages[i].pageIndex+1);
   const viewport=page.getViewport({scale:1});
   pages[i].viewport={
    width:viewport.width,height:viewport.height,
    transform:Array.from(viewport.transform),
    rotation:((page.rotate%360)+360)%360
   };
  }
  // Transfer a File reference; the Worker reads it into its own memory.
  // No File.arrayBuffer() or Uint8Array.slice() in the main UI save path.
  const result=await eraseRegionsInWorker(state.file,pages,{
   signal:controller.signal,
   mode:$('re-object-mode').value,
   allowInvalidSignatures:$('re-allow-signed').checked,
   onProgress:info=>{
    const total=Math.max(1,info.totalPages||pages.length);
    const done=Math.min(total,info.completedPages||0);
    const percentage=info.stage==='done'?100:Math.min(97,Math.round((done/total)*95));
    $('re-progress-bar').value=percentage;
    const labels={
     reading:'Đang đọc tệp PDF lớn',initializing:'Đang khởi tạo PDFium',
     opened:'Đã mở PDF', 'page-start':'Đang xử lý trang '+((info.pageIndex||0)+1),
     objects:'Đang duyệt đối tượng · trang '+((info.pageIndex||0)+1),
     'page-done':'Đã xử lý '+done+'/'+total+' trang',saving:'Đang xuất PDF',
     done:'Hoàn tất'
    };
    $('re-progress-label').textContent=labels[info.stage]||'Đang xử lý';
    $('re-progress-note').textContent=info.stage==='objects'?
      (info.objectsProcessed||0)+' / '+(info.objectCount||0)+' đối tượng của trang':
      done+' / '+total+' trang yêu cầu cắt';
   }
  });
  if(!result?.bytes?.length)throw new Error('Không nhận được PDF kết quả.');
  // Keep only a Blob for output after Worker returns. The real output PDF
  // is rendered by PDF.js for before/after comparison, never faked by masks.
  const blob=new Blob([result.bytes],{type:'application/pdf'});
  releaseReview();
  state.result={blob,report:result.report};
  state.exported=false;
  state.reviewUrl=URL.createObjectURL(blob);
  const loading=window.pdfjsLib.getDocument({url:state.reviewUrl,
   rangeChunkSize:PREVIEW_RANGE_CHUNK_BYTES,disableAutoFetch:true});
  try{state.reviewPdf=await loading.promise;}
  catch(error){state.reviewPdf=null;URL.revokeObjectURL(state.reviewUrl);state.reviewUrl=null;
   throw Error('PDF đã xuất nhưng không mở được xem trước: '+error.message);}
  state.reviewMode=true;
  $('re-before').className='re-btn re-ghost';$('re-after').className='re-btn re-primary';
  $('re-review-switch').hidden=false;
  await enterPage(state.pageIndex);
  const whole=$('re-object-mode').value==='whole-object';
  $('re-result-title').textContent=whole?'Đã xóa đối tượng PDF trong vùng':'Đã cắt đường vector trong vùng';
  $('re-result-summary').textContent=(whole?
   result.report.removedObjects+' đối tượng PDF được gỡ trực tiếp khỏi trang.':
   result.report.changedObjects+' PATH được chỉnh · '+result.report.newFragments+
    ' đoạn vector còn lại · '+result.report.skippedNonVector+' đối tượng khác không xử lý.')+
   (result.report.signatureInvalidated?
    ' PDF nguồn có chữ ký số; chữ ký cũ trên bản sao đã chỉnh sửa không còn hiệu lực.':'')+
   ' Tệp nguồn vẫn nguyên vẹn. Kiểm tra rồi quyết định Chỉnh sửa lại hoặc Xuất PDF.';
  dom.results.hidden=false;
  dom.results.scrollIntoView({behavior:'smooth',block:'nearest'});
  status('Đã áp dụng trực tiếp trên web. So sánh Bản gốc / Sau xử lý, chỉnh lại nếu cần và chỉ Xuất PDF khi đã đúng.','success');
 }catch(error){invalidateResult();status('Không thể xóa an toàn: '+(error.message||String(error)),'error');}
 finally{
  state.abortController=null;
  $('re-progress').hidden=true;
  setBusy(false);
 }
}
function download(){
 if(!state.result||!state.result.blob||!state.file||state.busy)return;
 const blob=state.result.blob;
 const url=URL.createObjectURL(blob);state.downloadUrls.add(url);
 const a=document.createElement('a');a.href=url;a.download=safeFileName(state.file);
 document.body.append(a);a.click();a.remove();
 state.exported=true;
 updateControls();
 status('Đã gửi yêu cầu xuất PDF đã kiểm tra. Bạn vẫn có thể Chỉnh sửa lại để tạo phiên bản khác.','success');
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
 $('re-gallery-prev').addEventListener('click',()=>showGallery(state.galleryStart-24));
 $('re-gallery-next').addEventListener('click',()=>showGallery(state.galleryStart+24));
 $('re-gallery-back').addEventListener('click',returnGallery);
 $('re-before').addEventListener('click',()=>{
  if(!state.reviewPdf||state.busy)return;
  state.reviewMode=false;
  dom.overlay.removeAttribute('hidden');dom.overlay.style.display='';
  $('re-before').className='re-btn re-primary';
  $('re-after').className='re-btn re-ghost';
  renderPage();updateControls();
 });
 $('re-after').addEventListener('click',()=>{
  if(!state.reviewPdf||state.busy)return;
  state.reviewMode=true;
  dom.overlay.setAttribute('hidden','');dom.overlay.style.display='none';
  $('re-before').className='re-btn re-ghost';
  $('re-after').className='re-btn re-primary';
  renderPage();updateControls();
 });
 $('re-operation').addEventListener('change',()=>{
  if(state.busy)return;
  state.operation=$('re-operation').value;
  $('re-role').value='erase';
  const names={
   union:'Hợp vùng: xóa đồng thời một hoặc nhiều vùng riêng biệt; có thể thêm vùng bảo vệ.',
   between:'Giữa hai đường bao: vẽ vùng ngoài TRƯỚC, vùng trong SAU. Chỉ xóa phần nằm giữa hai vùng.',
   intersection:'Giao hai vùng: vẽ đúng hai vùng có phần chồng nhau. Chỉ xóa nội dung ở phần giao.'
  };
  $('re-operation-help').textContent=names[state.operation];
  stopDrawing();invalidateResult();refreshZones();drawRegions();updateControls();
 });
 $('re-object-mode').addEventListener('change',()=>{
  const mode=$('re-object-mode').value;
  $('re-mode-explanation').textContent=mode==='whole-object'?
   'Xóa thực nguyên đối tượng chữ, ảnh, Form và vector nếu hộp bao của chúng giao vùng. Một phần bên ngoài vùng cũng có thể mất theo.':
   'Chỉ cắt PATH nét liền thành những đoạn nằm ngoài vùng, giữ nguyên chữ, ảnh và các đối tượng chưa hỗ trợ.';
  invalidateResult();updateControls();
 });
 $('re-allow-signed').addEventListener('change',()=>{invalidateResult();updateControls();});
 $('re-scope').addEventListener('change',()=>{
  $('re-range-fields').hidden=$('re-scope').value!=='range';
  invalidateResult();updateControls();
 });
 $('re-range-from').addEventListener('change',invalidateResult);
 $('re-range-to').addEventListener('change',invalidateResult);
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
 $('re-rework').addEventListener('click',()=>{
  if(state.busy||!state.result)return;
  invalidateResult();stopDrawing();refreshZones();drawRegions();updateControls();
  status('Chỉnh sửa lại trên PDF gốc; các vùng đã vẽ vẫn được giữ. Hãy chỉnh rồi bấm Áp dụng lần nữa.','success');
 });
 $('re-cancel').addEventListener('click',()=>state.abortController?.abort());
 window.addEventListener('beforeunload',e=>{if(havePending()){e.preventDefault();e.returnValue='';}});
}
wire();updateControls();
