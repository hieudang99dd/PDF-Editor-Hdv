// PDF Đạo Chích - compute real page fitting against a fixed-size viewport.
// All sizes are CSS pixels. The viewport's actual padding must be removed
// before calling this helper; no assumptions about desktop/mobile heights.
export const VIEW_MODES=Object.freeze(['page','width']);
export function computePageScale(page,space,{mode='page',zoom=1}={}){
 if(!VIEW_MODES.includes(mode))throw Error('Chế độ hiển thị PDF không hợp lệ.');
 const finite=(n)=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 if(!page||!space||![page.width,page.height,space.width,space.height,zoom].every(finite))
  throw Error('Không đủ kích thước hợp lệ để căn trang PDF.');
 const fitWidth=space.width/page.width;
 const fitHeight=space.height/page.height;
 const base=mode==='page'?Math.min(fitWidth,fitHeight):fitWidth;
 // Render safety caps are applied later by cappedPreviewScale.
 return Math.max(0.0001,Math.min(8,base*zoom));
}
