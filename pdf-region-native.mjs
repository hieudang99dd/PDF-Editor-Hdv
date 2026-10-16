// Native object-level vector erasure. The only destructive input type supported is
// PDFium PATH with unfilled, solid-stroke MoveTo/LineTo geometry.
// Real PDF page objects are rebuilt, not painted over with a rectangle.
// Unsupported paths remain unchanged AND are reported (fail closed when a path
// geometrically intersects a deletion region but cannot safely be reconstructed).
import {PdfEngine} from './vendor/cit-pdf/editcore/core.js';
import {validateRegions, normalizedToUser, keepSegment} from './pdf-region-geometry.mjs?v=20261016-rotate2';
import {validateInputSize} from './pdf-region-limits.mjs?v=20261016-512mb1';
const readF=(M,p,i=0)=>M.HEAPF32[(p+i*4)>>2];
const writeF=(M,p,i,value)=>{M.HEAPF32[(p+i*4)>>2]=value};
const LIM_FRAGMENTS=20000;
const segDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const transform=(m,p)=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
function readStyle(M,h,p){
 if(!M._FPDFPath_GetDrawMode(h,p,p+4))throw Error('Không đọc được kiểu path.');
 const fill=M.HEAP32[p>>2],stroke=M.HEAP32[(p+4)>>2];
 if(fill!==0 || stroke!==1)return null;
 if(M._FPDFPageObj_GetDashCount(h)>0)return null; // dash phase would change on split
 const color=new Array(4);
 if(!M._FPDFPageObj_GetStrokeColor(h,p,p+4,p+8,p+12))return null;
 for(let i=0;i<4;i++)color[i]=M.HEAPU32[(p+i*4)>>2];
 if(!M._FPDFPageObj_GetStrokeWidth(h,p))return null;
 const width=readF(M,p);
 if(!Number.isFinite(width)||width<0)return null;
 const cap=M._FPDFPageObj_GetLineCap(h),join=M._FPDFPageObj_GetLineJoin(h);
 return {color,width,cap,join};
}
function readPath(M,h,p){
 const count=M._FPDFPath_CountSegments(h);
 if(count<2||count>100000) return null;
 if(!M._FPDFPageObj_GetMatrix(h,p))return null;
 const matrix=Array.from({length:6},(_,i)=>readF(M,p,i));
 const det=matrix[0]*matrix[3]-matrix[1]*matrix[2];
 if(!Number.isFinite(det)||Math.abs(det)<1e-12)return null;
 const edges=[];
 let current=null,first=null;
 for(let i=0;i<count;i++){
  const seg=M._FPDFPath_GetPathSegment(h,i);
  if(!seg||!M._FPDFPathSegment_GetPoint(seg,p,p+4))return null;
  const point={x:readF(M,p),y:readF(M,p,1)};
  const type=M._FPDFPathSegment_GetType(seg);
  if(type===2){current=point;first=point;}
  else if(type===0&&current){
   if(segDist(current,point)>1e-7)edges.push([current,point]);
   current=point;
  }else return null;  // Curve, missing MoveTo, unknown segment
  if(M._FPDFPathSegment_GetClose(seg)){
   if(first&&current&&segDist(current,first)>1e-7)edges.push([current,first]);
   current=first;
  }
 }
 return {matrix,edges};
}
function clipsPresent(M,h){
 if(typeof M._FPDFPageObj_GetClipPath!=='function')return false;
 const clip=M._FPDFPageObj_GetClipPath(h);
 if(!clip)return false;
 const count=M._FPDFClipPath_CountPaths(clip);
 return count>0;
}
function zoneBounds(zones){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const z of zones)for(const p of z.points){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
 return {x0,y0,x1,y1};
}
function intersectsBounds(rect,b){
 return b.x0<=rect.x1&&rect.x0<=b.x1&&b.y0<=rect.y1&&rect.y0<=b.y1;
}
function objectRect(engine,h){
 const b=engine._rawBounds(h);
 if(!b)return null;
 return {x0:b.x,y0:b.y,x1:b.x+b.w,y1:b.y+b.h};
}
function appendFragment(M,engine,fragment,style,matrix,at){
 const h=M._FPDFPageObj_CreateNewPath(fragment.a.x,fragment.a.y);
 if(!h)throw Error('PDFium không thể tạo path thay thế.');
 let owned=true;
 try{
  if(!M._FPDFPath_LineTo(h,fragment.b.x,fragment.b.y))throw Error('Không tạo được đoạn vector.');
  if(!M._FPDFPath_SetDrawMode(h,0,1))throw Error('Không thiết lập được stroke.');
  if(!M._FPDFPageObj_SetStrokeColor(h,...style.color))throw Error('Không khôi phục được màu stroke.');
  if(!M._FPDFPageObj_SetStrokeWidth(h,style.width))throw Error('Không khôi phục được nét vẽ.');
  M._FPDFPageObj_SetLineCap(h,style.cap);
  M._FPDFPageObj_SetLineJoin(h,style.join);
  const mp=M._malloc(24);
  try{for(let i=0;i<6;i++)writeF(M,mp,i,matrix[i]);if(!M._FPDFPageObj_SetMatrix(h,mp))throw Error('Không gán được ma trận path.');}
  finally{M._free(mp);}
  if(!M._FPDFPage_InsertObjectAtIndex(engine.page,h,at))throw Error('Không thể khôi phục vị trí lớp của vector.');
  owned=false;
 }finally{if(owned)M._FPDFPageObj_Destroy(h);}
}
function signed(bytes){
 const marker=new TextEncoder().encode('/ByteRange');
 outer:for(let i=0;i<=bytes.length-marker.length;i++){if(bytes[i]!==47)continue;for(let j=1;j<marker.length;j++)if(bytes[i+j]!==marker[j])continue outer;return true;}
 return false;
}
export async function erasePdfRegions(source,pageRequests,{onProgress=()=>{}}={}){
 const bytes=source instanceof Uint8Array?source:new Uint8Array(source);
 validateInputSize(bytes.byteLength);
 if(signed(bytes))throw Error('PDF có chữ ký số. Xóa vector sẽ làm mất hiệu lực chữ ký.');
 if(!Array.isArray(pageRequests)||pageRequests.length<1||pageRequests.length>500)
  throw Error('Danh sách trang cần xóa không hợp lệ.');
 const emit=(stage,detail={})=>{try{onProgress({stage,...detail});}catch(_){/* Reporting cannot modify PDF processing. */}};
 emit('initializing',{totalPages:pageRequests.length,bytes:bytes.byteLength});
 const engine=await PdfEngine.create();
 const report={changedObjects:0,newFragments:0,removedSegments:0,skippedNonVector:0,pages:[]};
 try{
  try{engine.open(bytes);}
  catch(error){
   if(/memory|alloc|out of bounds|maximum memory|unreachable|abort/i.test(String(error)))
    throw Error('Thiếu bộ nhớ để mở PDF lớn trong PDFium. Hãy đóng tab khác hoặc xử lý trên máy có nhiều RAM hơn.');
   throw error;
  }
  emit('opened',{totalPages:pageRequests.length});
  if(engine.security?.encrypted)throw Error('Không xử lý vùng đối với PDF mã hóa.');
  const seen=new Set();
  for(const [jobIndex,req] of pageRequests.entries()){
   const pageIndex=req.pageIndex;
   if(!Number.isInteger(pageIndex)||pageIndex<0||pageIndex>=engine.pageCount||seen.has(pageIndex))
    throw Error('Chỉ số trang/vùng xóa không hợp lệ.');
   seen.add(pageIndex);
   const operation=req.operation||'union';
   const raw=validateRegions(req.regions,operation);
   engine.loadPage(pageIndex);
   emit('page-start',{pageIndex,completedPages:jobIndex,totalPages:pageRequests.length});
   const nativeRotation=engine.M._FPDFPage_GetRotation(engine.page);
   if(!Number.isInteger(nativeRotation)||nativeRotation<0||nativeRotation>3)
    throw Error('Trang '+(pageIndex+1)+': thông tin góc xoay PDF không hợp lệ.');
   if(nativeRotation!==0&&!req.viewport)
    throw Error('Trang '+(pageIndex+1)+' xoay '+(nativeRotation*90)+'°. Cần ma trận PDF.js để cắt chính xác; hãy thao tác qua công cụ PDF HVD.');
   if(req.viewport?.rotation!==undefined && req.viewport.rotation!==nativeRotation*90)
    throw Error('Trang '+(pageIndex+1)+': góc xoay trình xem khác dữ liệu PDF gốc. Hãy mở lại tài liệu và thử lại.');
   // The exact inverse PDF.js viewport maps the user's screen selection to
   // PDF user coordinates independent of /Rotate/CropBox/MediaBox/UserUnit.
   const regions=normalizedToUser(raw,engine,req.viewport),b=zoneBounds(regions);
   const M=engine.M,scratch=M._malloc(32);
   let changed=0,skipped=0,erased=0;
   try{
    // Decreasing order preserves indices outside the region. Each change removes
    // the original object before inserting fragments at its original Z index.
    const totalObjects=engine.objectCount();
    for(let i=totalObjects-1;i>=0;i--){
     if((totalObjects-i)%500===0)emit('objects',{pageIndex,objectsProcessed:totalObjects-i,objectCount:totalObjects,
       completedPages:jobIndex,totalPages:pageRequests.length});
     const obj=engine.objectAt(i);
     if(!obj)continue;
     const rect=objectRect(engine,obj.handle);
     if(!rect||!intersectsBounds(rect,b))continue;
     if(obj.type!==2){skipped++;continue;} // text/image/form are excluded, not blanked
     if(clipsPresent(M,obj.handle))throw Error('Trang '+(pageIndex+1)+': vector có clipping path trong vùng. Chưa hỗ trợ xóa an toàn.');
     const style=readStyle(M,obj.handle,scratch);
     const path=readPath(M,obj.handle,scratch);
     if(!style||!path)throw Error('Trang '+(pageIndex+1)+': vùng chạm vector tô kín, nét đứt hoặc Bézier chưa hỗ trợ. Không thay đổi PDF.');
     let touched=false;
     const pieces=[];
     for(const [a,b2] of path.edges){
      const worldA=transform(path.matrix,a),worldB=transform(path.matrix,b2);
      const kept=keepSegment(worldA,worldB,regions,operation);
      const delta=segDist(worldA,worldB);
      if(!delta)continue;
      if(kept.length!==1||segDist(kept[0].a,worldA)>1e-6||segDist(kept[0].b,worldB)>1e-6)touched=true;
      const vx=worldB.x-worldA.x,vy=worldB.y-worldA.y;
      for(const section of kept){
       const coord=(p)=>Math.abs(vx)>=Math.abs(vy)?(p.x-worldA.x)/vx:(p.y-worldA.y)/vy;
       const t0=coord(section.a),t1=coord(section.b);
       if(!Number.isFinite(t0)||!Number.isFinite(t1))throw Error('Không nội suy được giao điểm.');
       pieces.push({a:{x:a.x+(b2.x-a.x)*t0,y:a.y+(b2.y-a.y)*t0},
                    b:{x:a.x+(b2.x-a.x)*t1,y:a.y+(b2.y-a.y)*t1}});
      }
      if(pieces.length+report.newFragments>LIM_FRAGMENTS)throw Error('Quá nhiều đoạn vector sau cắt. Chia vùng nhỏ hơn.');
     }
     if(!touched)continue;
     if(!M._FPDFPage_RemoveObject(engine.page,obj.handle))throw Error('Không xóa được path nguồn.');
     M._FPDFPageObj_Destroy(obj.handle);
     // All inserted content preserves the source path matrix, color and stroke width.
     for(let k=0;k<pieces.length;k++)appendFragment(M,engine,pieces[k],style,path.matrix,i+k);
     changed++;erased++;report.newFragments+=pieces.length;
     report.changedObjects++;
    }
   }finally{M._free(scratch);}
   report.skippedNonVector+=skipped;report.removedSegments+=erased;
   if(changed){
    engine._pageDirty=true;
    if(!engine.generateContent())throw Error('PDFium không tạo lại được nội dung trang sau xóa.');
   }
   report.pages.push({pageIndex,changedObjects:changed,skippedNonVector:skipped});
   emit('page-done',{pageIndex,completedPages:jobIndex+1,totalPages:pageRequests.length,
       changedObjects:report.changedObjects,newFragments:report.newFragments});
  }
  if(!report.changedObjects)throw Error('Không có đường vector nét liền hỗ trợ giao với vùng xóa. Không tạo tệp giả.');
  emit('saving',{completedPages:pageRequests.length,totalPages:pageRequests.length});
  let out;
  try{out=engine.save({incremental:false});}
  catch(error){
   if(/memory|alloc|out of bounds|maximum memory|unreachable|abort/i.test(String(error)))
    throw Error('Không đủ bộ nhớ để xuất PDF lớn. Tài liệu gốc vẫn được giữ nguyên.');
   throw error;
  }
  if(!out||out.length<20)throw Error('PDFium chưa lưu được kết quả.');
  emit('done',{completedPages:pageRequests.length,totalPages:pageRequests.length});
  return {bytes:out,report};
 }finally{engine.close();}
}
