/* PDF HVD region selection; no white overlays are inserted into PDF data. */
(()=>{
 'use strict';
 if(typeof PDFOrganizer!=='function')return;
 const proto=PDFOrganizer.prototype,init=proto.initDOM,focus=proto.focusPage,SVG='http://www.w3.org/2000/svg';
 const node=tag=>document.createElementNS(SVG,tag),clamp=v=>Math.max(0,Math.min(1,v));
 const activePage=org=>org.pages.find(p=>p.id===org.focusedPageId);
 const notify=message=>{if(typeof toast==='function')toast(message);};
 function attach(org){
  const bar=org.appNode.querySelector('.po-toolbar');
  if(!bar)return;
  const group=document.createElement('div');group.className='po-tool-group';
  const launch=document.createElement('button');launch.id='po-tb-region';launch.type='button';
  launch.className='po-tool-btn';launch.textContent='✂ Xóa vector theo vùng';
  launch.title='Cắt thực vector nét liền tại các vùng bạn chọn';group.append(launch);bar.append(group);
  const panel=document.createElement('div');panel.id='po-region-panel';panel.hidden=true;
  panel.innerHTML=[
   '<div class="po-region-heading"><strong>Xóa vector theo vùng</strong><span id="po-region-status" role="status" aria-live="polite"></span></div>',
   '<label>Hình vùng <select id="po-region-shape"><option value="rect">Chữ nhật</option><option value="poly">Đa giác</option></select></label>',
   '<label>Kiểu vùng <select id="po-region-role"><option value="erase">Xóa trong vùng</option><option value="protect">Giữ vùng bên trong</option></select></label>',
   '<button type="button" class="po-tool-btn po-region-button" id="po-region-arm">＋ Vẽ vùng</button>',
   '<button type="button" class="po-tool-btn" id="po-region-finish" hidden>Hoàn thành đa giác</button>',
   '<button type="button" class="po-tool-btn" id="po-region-back">↶ Bỏ vùng cuối</button>',
   '<button type="button" class="po-tool-btn" id="po-region-clear">Xóa các vùng</button>',
   '<button type="button" class="po-tool-btn" id="po-region-close">Đóng bảng</button>',
   '<span class="po-region-tip">Thêm nhiều vùng xóa; vẽ vùng Giữ bên trong để tạo lỗ. Chỉ cắt vector nét liền không tô kín. Chữ, ảnh, hatch không bị xóa.</span>'
  ].join('');
  bar.insertAdjacentElement('afterend',panel);
  const overlay=node('svg');overlay.id='po-region-overlay';overlay.classList.add('po-region-overlay');
  overlay.setAttribute('viewBox','0 0 1000 1000');overlay.setAttribute('preserveAspectRatio','none');
  overlay.setAttribute('aria-label','Vùng xóa vector');
  org.appNode.querySelector('#po-preview-wrapper').append(overlay);
  const state=org.hvdRegion={panel,overlay,drawing:false,start:null,points:[],shape:'rect',role:'erase'};
  const coord=e=>{const b=overlay.getBoundingClientRect();return {x:clamp((e.clientX-b.left)/b.width),y:clamp((e.clientY-b.top)/b.height)}};
  const rect=(a,b)=>[{x:a.x,y:a.y},{x:b.x,y:a.y},{x:b.x,y:b.y},{x:a.x,y:b.y}];
  function poly(points,role,temp=false){
   const shape=node('polygon');
   shape.setAttribute('points',points.map(p=>(p.x*1000)+','+(p.y*1000)).join(' '));
   shape.setAttribute('fill',role==='protect'?'rgba(0,174,109,.15)':'rgba(240,68,60,.17)');
   shape.setAttribute('stroke',role==='protect'?'#00bb88':'#f33c3c');
   shape.setAttribute('stroke-width','2');
   if(temp)shape.setAttribute('stroke-dasharray','6 5');
   return shape;
  }
  function render(preview){
   overlay.replaceChildren();
   const page=activePage(org);
   if(!page||page.type!=='pdf')return;
   for(const z of page.eraseRegions||[])overlay.append(poly(z.points,z.mode));
   if(preview?.length>=2)overlay.append(poly(preview,state.role,true));
   panel.querySelector('#po-region-status').textContent=(page.eraseRegions?.length||0)+' vùng · Cắt thực khi Lưu tài liệu';
  }
  function arm(on){
   state.drawing=!!on;state.start=null;state.points=[];
   overlay.classList.toggle('po-region-armed',state.drawing);
   panel.querySelector('#po-region-arm').textContent=on?'Hủy vẽ':'＋ Vẽ vùng';
   panel.querySelector('#po-region-finish').hidden=!on||state.shape!=='poly';
   render();
  }
  function store(points){
   const p=activePage(org);
   if(!p||p.type!=='pdf')return;
   if(points.length<3||points.length>256){notify('Cần từ 3 đến 256 đỉnh.');return;}
   const area=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a.x*b.y-b.x*a.y;},0)/2;
   if(Math.abs(area)<1e-6){notify('Vùng có diện tích quá nhỏ.');return;}
   if((p.eraseRegions?.length||0)>=64){notify('Tối đa 64 vùng trên một trang.');return;}
   p.eraseRegions=[...(p.eraseRegions||[]),{mode:state.role,points:points.map(q=>({x:q.x,y:q.y}))}];
   org.pushHistory();arm(false);
   notify('Đã ghi nhận vùng. Bấm Lưu tài liệu để thực hiện cắt vector thật.');
  }
  const qs=id=>panel.querySelector('#'+id);
  qs('po-region-arm').onclick=()=>{
   const page=activePage(org);
   if(!page||page.type!=='pdf'){notify('Hãy chọn trang PDF.');return;}
   if((page.rotation||0)%360!==0){notify('Chưa hỗ trợ trang xoay; đặt góc trang 0° trước khi xóa vùng.');return;}
   state.shape=qs('po-region-shape').value;state.role=qs('po-region-role').value;
   arm(!state.drawing);
  };
  launch.onclick=()=>{panel.hidden=!panel.hidden;if(panel.hidden)arm(false);render();};
  qs('po-region-close').onclick=()=>{panel.hidden=true;arm(false);};
  qs('po-region-finish').onclick=()=>state.points.length>=3?store(state.points):notify('Cần ít nhất 3 đỉnh.');
  qs('po-region-back').onclick=()=>{
   if(state.drawing){state.points.pop();render(state.points);return;}
   const p=activePage(org);if(!p?.eraseRegions?.length)return;
   p.eraseRegions.pop();org.pushHistory();render();
  };
  qs('po-region-clear').onclick=()=>{
   const p=activePage(org);if(!p?.eraseRegions?.length)return;
   if(!confirm('Xóa toàn bộ vùng chọn trên trang hiện tại?'))return;
   p.eraseRegions=[];org.pushHistory();arm(false);
  };
  qs('po-region-shape').onchange=()=>arm(false);
  qs('po-region-role').onchange=()=>arm(false);
  overlay.addEventListener('pointerdown',e=>{
   if(!state.drawing)return;
   e.preventDefault();e.stopPropagation();
   if(state.shape==='rect'){state.start=coord(e);overlay.setPointerCapture(e.pointerId);}
   else if(state.points.length<256){
    const next=coord(e),prev=state.points[state.points.length-1];
    // Double-click emits two pointerdown events at the same vertex; do not
    // create a zero-length edge that would make the polygon invalid on Save.
    if(prev&&Math.hypot(prev.x-next.x,prev.y-next.y)<.003)return;
    state.points.push(next);render(state.points);
   }
  });
  overlay.addEventListener('pointermove',e=>{
   if(!state.drawing||state.shape!=='rect'||!state.start)return;
   render(rect(state.start,coord(e)));
  });
  overlay.addEventListener('pointerup',e=>{
   if(!state.drawing||state.shape!=='rect'||!state.start)return;
   const a=state.start,b=coord(e);state.start=null;
   if(Math.abs(a.x-b.x)<.003||Math.abs(a.y-b.y)<.003){notify('Kéo để tạo vùng lớn hơn.');render();return;}
   store(rect(a,b));
  });
  overlay.addEventListener('dblclick',e=>{
   if(!state.drawing||state.shape!=='poly')return;
   e.preventDefault();e.stopPropagation();if(state.points.length>=3)store(state.points);
  });
  window.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&state.drawing){e.preventDefault();arm(false);}
   if(e.key==='Enter'&&state.drawing&&state.shape==='poly'&&state.points.length>=3){e.preventDefault();store(state.points);}
  },{signal:org.abort.signal});
  org.renderHvdRegions=render;org.cancelHvdRegion=()=>arm(false);render();
 }
 proto.initDOM=function(...args){const result=init.apply(this,args);attach(this);return result;};
 proto.focusPage=function(...args){this.cancelHvdRegion?.();const result=focus.apply(this,args);this.renderHvdRegions?.();return result;};
})();
