// Draggable polygon controls for PDF Đạo Chích.
// Geometry changes are immutable and validated BEFORE they can be committed.
// Delta is in normalized page coordinates, independent of the PDF's zoom/rotation.
import {validateRegions} from './pdf-region-geometry.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function moveRegionHandle(regions,zoneIndex,kind,handleIndex,delta,operation='union'){
 if(!Array.isArray(regions)||!Number.isInteger(zoneIndex)||zoneIndex<0||zoneIndex>=regions.length)
  throw Error('Không tìm thấy vùng cần chỉnh.');
 if(!['vertex','edge'].includes(kind))throw Error('Loại tay nắm chỉnh sửa không hợp lệ.');
 const zone=regions[zoneIndex],points=zone?.points;
 if(!Array.isArray(points)||!Number.isInteger(handleIndex)||handleIndex<0||handleIndex>=points.length)
  throw Error('Đỉnh hoặc cạnh được chọn không hợp lệ.');
 if(!delta||!Number.isFinite(delta.x)||!Number.isFinite(delta.y))
  throw Error('Khoảng di chuyển không hợp lệ.');
 const next=regions.map(z=>({mode:z.mode,points:z.points.map(p=>({...p}))}));
 const pts=next[zoneIndex].points;
 const indexes=kind==='vertex'?[handleIndex]:[handleIndex,(handleIndex+1)%pts.length];
 // Clamp one shared delta for the entire edge. Do not distort that edge
 // by clamping each endpoint independently when crossing a page boundary.
 const dx=clamp(delta.x,-Math.min(...indexes.map(i=>pts[i].x)),
  1-Math.max(...indexes.map(i=>pts[i].x)));
 const dy=clamp(delta.y,-Math.min(...indexes.map(i=>pts[i].y)),
  1-Math.max(...indexes.map(i=>pts[i].y)));
 for(const i of indexes){pts[i].x+=dx;pts[i].y+=dy;}
 // A partial second polygon in Between/Intersection mode cannot yet satisfy
 // two-zone semantics. Once two zones exist, validate their relationships too.
 const op=operation!=='union'&&next.length===2?operation:'union';
 validateRegions(next,op);
 return next;
}
