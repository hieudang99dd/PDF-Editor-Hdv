// PDF HVD Region Eraser: derive a deterministic page plan for execution.
// Geometry uses normalized page coordinates so a template can be applied
// across a user-defined page interval without mutating any stored regions.
import {validateRegions, REGION_OPERATIONS} from './pdf-region-geometry.mjs';
export function planRegionJobs(regionMap,{scope='drawn',pageIndex=0,from=1,to=1,
 totalPages,operation='union'}={}){
 if(!Number.isSafeInteger(totalPages)||totalPages<1)
  throw Error('PDF chưa có số trang hợp lệ.');
 if(!REGION_OPERATIONS.includes(operation))
  throw Error('Phép kết hợp vùng không hợp lệ.');
 if(!(regionMap instanceof Map))throw Error('Danh sách vùng chọn không hợp lệ.');
 const source=Array.from(regionMap.entries());
 const jobs=[];
 if(scope==='drawn'){
  for(const [index,zones] of source){
   if(!zones?.length)continue;
   if(!Number.isSafeInteger(index)||index<0||index>=totalPages)
    throw Error('Vùng chọn thuộc trang ngoài phạm vi PDF.');
   jobs.push({pageIndex:index,regions:validateRegions(zones,operation),operation});
  }
 }else if(scope==='range'){
  if(!Number.isSafeInteger(pageIndex)||pageIndex<0||pageIndex>=totalPages)
   throw Error('Trang nguồn của vùng xóa không hợp lệ.');
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<1||to<from||to>totalPages)
   throw Error('Khoảng trang không hợp lệ. Phải chọn từ trang 1 đến trang cuối.');
  const template=validateRegions(regionMap.get(pageIndex),operation);
  for(let i=from-1;i<to;i++){
   jobs.push({pageIndex:i,regions:template.map(z=>({
    mode:z.mode,points:z.points.map(p=>({...p}))
   })),operation});
  }
 }else throw Error('Phạm vi trang không hợp lệ.');
 if(!jobs.length)throw Error('Hãy vẽ ít nhất một vùng xóa trước khi xử lý.');
 if(jobs.length>500)throw Error('Tối đa 500 trang trong một lần xóa; hãy chia khoảng trang.');
 return jobs.sort((a,b)=>a.pageIndex-b.pageIndex);
}
