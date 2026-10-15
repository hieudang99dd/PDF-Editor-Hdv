/* PDF HVD – catalog presentation. Tool identities are immutable. */
(function(){
'use strict';
const main=document.querySelector('#home');
if(!main||typeof home!=='function')return;
const hero=main.querySelector('.hero');
hero.querySelector('h1').textContent='Bộ công cụ xử lý PDF chuyên nghiệp';
hero.querySelector('p').textContent='Chuyển đổi, sắp xếp, chỉnh sửa và bảo vệ tài liệu trong một không gian làm việc. Chọn công cụ để bắt đầu.';
if(!hero.querySelector('.eyebrow'))hero.insertAdjacentHTML('afterbegin','<span class="eyebrow">PDF HVD <span aria-hidden="true">/</span> TRUNG TÂM CÔNG CỤ</span>');
const q=document.querySelector('#q');
q.placeholder='Tìm kiếm công cụ: ghép PDF, chuyển Word, OCR, đánh số trang…';
/* Display-only names: never rename T[i][0].
 * Existing local/OCR/CIT engines dispatch by the ORIGINAL name. */
const labels=new Map([
 ['Giảm dung lượng PDF',['Nén PDF','Tối ưu dung lượng tệp PDF mà không thay đổi nội dung.']],
 ['Chuyển đổi PDF',['Chuyển đổi định dạng PDF','Xuất PDF sang các định dạng hiện được hỗ trợ.']],
 ['PDF OCR',['Nhận dạng văn bản (OCR)','Nhận dạng chữ trên tài liệu PDF dạng ảnh.']],
 ['PDF sang PDF/A',['Chuyển PDF sang PDF/A','Chuyển tài liệu sang định dạng lưu trữ dài hạn.']],
 ['JPG sang PDF',['Ảnh sang PDF','Chuyển ảnh JPG, PNG và các định dạng được hỗ trợ thành PDF.']],
 ['Biên tập lại (che thông tin)',['Che nội dung PDF','Chỉ che phần hiển thị; không phải xóa dữ liệu bảo mật.']],
 ['Che thông tin trực quan',['Che nội dung PDF','Chỉ che phần hiển thị; không phải xóa dữ liệu bảo mật.']]
]);
const display=t=>labels.get(t[0])||[t[0],t[1]];
const offlineNames=new Set(['PDF OCR','PDF sang Word','PDF sang TIFF','Word sang PDF','Excel sang PDF','PPT sang PDF']);
const browserCodes=new Set(['merge','range','rot','organize','img','pdf2jpg','pdf2png','wm','pnum','sign','flatten','cit-text-route']);
const browserNames=new Set(['Giảm dung lượng PDF','Chuyển đổi PDF','PDF sang TXT']);
const allLocalNames=new Set([...offlineNames]);
const getStatus=t=>{
 if(allLocalNames.has(t[0]))return ['Cần ứng dụng PC','is-local'];
 if(t[4].startsWith('cit-')||browserCodes.has(t[4])||browserNames.has(t[0]))return ['Trình duyệt','is-web'];
 return ['Chưa hỗ trợ','is-soon'];
};
const featured=[
 'Chỉnh sửa văn bản PDF','Ghép PDF','Giảm dung lượng PDF','Chỉnh sửa PDF',
 'Chuyển đổi PDF','PDF sang Word','PDF sang JPG','JPG sang PDF'
];
const escape=s=>String(s).replace(/[&<>"']/g,x=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[x]));
const renderCatalog=()=>{
 const term=q.value.trim().toLocaleLowerCase('vi');
 const chips=document.querySelector('#chips');
 chips.innerHTML=cats.map(c=>'<button class="chip '+(c===cat?'on':'')+'" data-c="'+escape(c)+'" aria-pressed="'+(c===cat)+'">'+escape(c)+'</button>').join('');
 const featuredIndices=cat==='Tất cả'&&!term?
   featured.map(name=>T.findIndex(t=>t[0]===name)).filter(i=>i>=0):[];
 const groups=[];
 if(featuredIndices.length)groups.push(['Công cụ thường dùng',featuredIndices]);
 for(const c of Object.keys(C)){
   if(cat!=='Tất cả'&&cat!==c)continue;
   const indices=T.map((t,i)=>({t,i})).filter(({t})=>{
     const [label,description]=display(t);
     return t[2]===c&&(label+' '+description+' '+t[0]).toLocaleLowerCase('vi').includes(term);
   }).map(x=>x.i);
   const entries=cat==='Tất cả'&&!term?indices.filter(i=>!featuredIndices.includes(i)):indices;
   if(entries.length)groups.push([c,entries]);
 }
 const html=groups.map(([title,indices])=>'<section class="catalog-group"><h2 class="cat">'+escape(title)+'</h2><div class="grid">'+indices.map(i=>{
   const t=T[i],st=getStatus(t),soon=st[1]==='is-soon';
   const [label,description]=display(t);
   const primary=t[4]==='cit-text-route';
   return '<button type="button" class="tool '+(soon?'is-soon':'')+(primary?' is-primary':'')+'" data-i="'+i+'"'+(soon?' disabled title="Chức năng chưa khả dụng"':'')+'><div class="ic" style="background:'+C[t[2]]+'">'+escape(t[3])+'</div><div class="tool-body"><b>'+escape(label)+'</b><span>'+escape(description)+'</span></div><span class="tool-status '+st[1]+'">'+st[0]+'</span></button>';
 }).join('')+'</div></section>').join('');
 document.querySelector('#tools').innerHTML=html||'<p role="status" style="color:var(--mute)">Không tìm thấy công cụ phù hợp. Hãy thử từ khóa khác.</p>';
};
home=renderCatalog;
q.oninput=renderCatalog;
renderCatalog();
})();
