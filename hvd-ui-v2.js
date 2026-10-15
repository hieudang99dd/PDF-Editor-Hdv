/* PDF HVD catalog hierarchy and copy. Does not modify processing engines. */
(function(){
'use strict';
const main=document.querySelector('#home');if(!main||typeof home!=='function')return;
const hero=main.querySelector('.hero');
hero.querySelector('h1').textContent='Bộ công cụ xử lý PDF chuyên nghiệp';
hero.querySelector('p').textContent='Chuyển đổi, sắp xếp, chỉnh sửa và bảo vệ tài liệu trong một không gian làm việc. Chọn công cụ để bắt đầu.';
hero.insertAdjacentHTML('afterbegin','<span class="eyebrow">PDF HVD <span aria-hidden="true">/</span> TRUNG TÂM CÔNG CỤ</span>');
const q=document.querySelector('#q');q.placeholder='Tìm kiếm công cụ: ghép PDF, chuyển Word, OCR, đánh số trang…';
const aliases=new Map([
 ['Giảm dung lượng PDF',['Nén PDF','Tối ưu dung lượng tệp PDF mà không làm thay đổi nội dung.']],
 ['Chuyển đổi PDF',['Chuyển đổi định dạng PDF','Xuất PDF sang các định dạng được hỗ trợ.']],
 ['PDF OCR',['Nhận dạng văn bản (OCR)','Trích xuất chữ từ PDF dạng ảnh hoặc tạo PDF có thể tìm kiếm.']],
 ['PDF sang PDF/A',['Chuyển PDF sang PDF/A','Chuyển tài liệu sang định dạng lưu trữ dài hạn.']],
 ['JPG sang PDF',['Ảnh sang PDF','Gộp ảnh JPG, PNG và các định dạng hỗ trợ thành PDF.']],
 ['Biên tập lại (che thông tin)',['Che nội dung PDF','Che nội dung hiển thị; không thay thế công cụ xóa dữ liệu an toàn.']]
]);
for(const t of T){const change=aliases.get(t[0]);if(change){t[0]=change[0];t[1]=change[1];}}
const prior=home;
const originalSoon=(t)=>!(t[4].startsWith('cit-')||['merge','range','rot','organize','img','pdf2jpg','pdf2png','wm','pnum','sign','flatten'].includes(t[4])||['Nén PDF','Chuyển đổi định dạng PDF','Nhận dạng văn bản (OCR)','PDF sang Word','PDF sang TXT','PDF sang TIFF','Word sang PDF','Excel sang PDF','PPT sang PDF'].includes(t[0]));
const localNames=new Set(['Nhận dạng văn bản (OCR)','PDF sang Word','PDF sang TIFF','Word sang PDF','Excel sang PDF','PPT sang PDF']);
const featured=['Ghép PDF','Nén PDF','Chỉnh sửa PDF','Chuyển đổi định dạng PDF','PDF sang Word','PDF sang JPG','Ảnh sang PDF','Tách PDF'];
const renderCatalog=()=>{
 const term=q.value.trim().toLocaleLowerCase('vi');
 const chips=document.querySelector('#chips');
 chips.innerHTML=cats.map(c=>'<button class="chip '+(c===cat?'on':'')+'" data-c="'+c+'" aria-pressed="'+(c===cat)+'">'+c+'</button>').join('');
 const groups=[];
 if(cat==='Tất cả'&&!term)groups.push(['Công cụ thường dùng',featured.map(n=>T.findIndex(t=>t[0]===n)).filter(i=>i>=0)]);
 for(const c of Object.keys(C)){
   if(cat!=='Tất cả'&&cat!==c)continue;
   const indices=T.map((t,i)=>({t,i})).filter(({t})=>t[2]===c&&(t[0]+' '+t[1]).toLocaleLowerCase('vi').includes(term)).map(x=>x.i);
   if(indices.length)groups.push([c,indices]);
 }
 const iconText=t=>String(t[3]).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));
 const status=t=>originalSoon(t)?['Sắp phát triển','is-soon']:localNames.has(t[0])?['Cần ứng dụng PC','is-local']:['Trình duyệt','is-web'];
 const html=groups.map(([name,ids])=>'<section class="catalog-group"><h2 class="cat">'+name+'</h2><div class="grid">'+ids.map(i=>{
   const t=T[i],st=status(t),soon=st[1]==='is-soon';
   return '<button type="button" class="tool '+(soon?'is-soon':'')+'" data-i="'+i+'"'+(soon?' disabled title="Chức năng chưa khả dụng"':'')+'><div class="ic" style="background:'+C[t[2]]+'">'+iconText(t)+'</div><div class="tool-body"><b>'+t[0]+'</b><span>'+t[1]+'</span></div><span class="tool-status '+st[1]+'">'+st[0]+'</span></button>';
 }).join('')+'</div></section>').join('');
 document.querySelector('#tools').innerHTML=html||'<p role="status" style="color:var(--mute)">Không tìm thấy công cụ phù hợp. Hãy thử từ khóa khác.</p>';
};
home=renderCatalog;
q.oninput=renderCatalog;
renderCatalog();
})();
