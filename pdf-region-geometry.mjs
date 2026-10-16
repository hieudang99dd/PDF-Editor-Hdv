// PDF HVD geometry: normalized [0..1] polygons, true vector-segment subtraction.
// No canvas masks or image replacements. Input geometry is validated and immutable.
const EPS=1e-9;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const close=(a,b)=>Math.abs(a-b)<=EPS;
export function polygonArea(pts){
 let area=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];area+=a.x*b.y-b.x*a.y;}
 return area/2;
}
function intersectionT(a,b,c,d){
 const r=subtract(b,a),s=subtract(d,c),den=cross(r,s),ca=subtract(c,a);
 if(Math.abs(den)<=EPS){
   if(Math.abs(cross(ca,r))>EPS)return [];
   const rr=r.x*r.x+r.y*r.y;
   if(rr<EPS*EPS)return [];
   return [((c.x-a.x)*r.x+(c.y-a.y)*r.y)/rr,
           ((d.x-a.x)*r.x+(d.y-a.y)*r.y)/rr].filter(t=>t>=-EPS&&t<=1+EPS).map(t=>Math.min(1,Math.max(0,t)));
 }
 const t=cross(ca,s)/den,u=cross(ca,r)/den;
 return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?[Math.min(1,Math.max(0,t))]:[];
}
function onEdge(p,a,b){
 const ab=subtract(b,a),ap=subtract(p,a);
 return Math.abs(cross(ab,ap))<=EPS &&
  p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
  p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
}
export function insidePolygon(p,pts){
 let inside=false;
 for(let i=0,j=pts.length-1;i<pts.length;j=i++){
   const a=pts[j],b=pts[i];
   if(onEdge(p,a,b))return true;
   if((a.y>p.y)!==(b.y>p.y) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function selfIntersects(pts){
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  for(let j=i+1;j<pts.length;j++){
   if(j===i || j===(i+1)%pts.length || (j+1)%pts.length===i)continue;
   const c=pts[j],d=pts[(j+1)%pts.length];
   if(intersectionT(a,b,c,d).some(t=>t>EPS&&t<1-EPS))return true;
   // Detect non-adjacent endpoint touching or overlapping as malformed polygons.
   if(onEdge(a,c,d)||onEdge(b,c,d)||onEdge(c,a,b)||onEdge(d,a,b))return true;
  }
 }
 return false;
}
export function validateRegions(regions){
 if(!Array.isArray(regions)||!regions.length||regions.length>64)throw Error('Cần chọn từ 1 đến 64 vùng.');
 let sum=0,erase=0;
 const clean=regions.map((z,i)=>{
  if(!z||!['erase','protect'].includes(z.mode)||!Array.isArray(z.points)||z.points.length<3||z.points.length>256)
   throw Error('Vùng '+(i+1)+' không hợp lệ.');
  sum+=z.points.length;if(sum>3000)throw Error('Quá nhiều đỉnh vùng chọn.');
  const points=z.points.map(pt=>{
   if(!pt||!Number.isFinite(pt.x)||!Number.isFinite(pt.y)||pt.x<0||pt.x>1||pt.y<0||pt.y>1)
    throw Error('Tọa độ vùng chọn nằm ngoài trang.');
   return {x:pt.x,y:pt.y};
  });
  for(let k=0;k<points.length;k++){
   const a=points[k],b=points[(k+1)%points.length];
   if(Math.hypot(a.x-b.x,a.y-b.y)<1e-6)throw Error('Vùng có cạnh quá ngắn.');
  }
  if(Math.abs(polygonArea(points))<1e-7 || selfIntersects(points))
   throw Error('Vùng có cạnh giao nhau hoặc diện tích bằng 0.');
  if(z.mode==='erase')erase++;
  return {mode:z.mode,points};
 });
 if(!erase)throw Error('Cần ít nhất một vùng xóa.');
 return clean;
}
function eraseAt(point,zones){
 return zones.some(z=>z.mode==='erase'&&insidePolygon(point,z.points)) &&
        !zones.some(z=>z.mode==='protect'&&insidePolygon(point,z.points));
}
export function keepSegment(a,b,zones){
 if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||!Number.isFinite(b.x)||!Number.isFinite(b.y))throw Error('Tọa độ vector không hợp lệ.');
 if(Math.hypot(a.x-b.x,a.y-b.y)<EPS)return [];
 const ts=[0,1];
 for(const zone of zones){
  for(let i=0;i<zone.points.length;i++)ts.push(...intersectionT(a,b,zone.points[i],zone.points[(i+1)%zone.points.length]));
 }
 ts.sort((a,b)=>a-b);
 const distinct=ts.filter((v,i)=>i===0||v-ts[i-1]>EPS);
 const kept=[];
 for(let i=0;i<distinct.length-1;i++){
  const t0=distinct[i],t1=distinct[i+1];
  if(t1-t0<EPS || eraseAt(lerp(a,b,(t0+t1)/2),zones))continue;
  kept.push({a:lerp(a,b,t0),b:lerp(a,b,t1)});
 }
 return kept;
}
export function normalizedToUser(zones,engine){
 // Region UI coordinates have origin at visible PDF page top-left.
 // Rotation/crop are not guessed: caller rejects nonzero /Rotate.
 const w=engine.pageWidth,h=engine.pageHeight;
 return zones.map(z=>({mode:z.mode,points:z.points.map(p=>engine.toUser(p.x*w,(1-p.y)*h))}));
}
