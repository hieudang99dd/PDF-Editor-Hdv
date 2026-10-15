/* HVD/CIT native batch text — AGPL-3.0.
 * Replaces multiple original single-line PDF text regions atomically using PDFium.
 * No overlay, no font Type3 guessing, no automatic paragraph reflow.
 */
(()=>{
  'use strict';
  if(typeof PDFOrganizer!=='function')return;
  const proto=PDFOrganizer.prototype;
  const originalBind=proto.bindEvents;
  const el=(tag,cls='',txt='')=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    node.textContent=txt;return node;
  };
  const status=(modal,text,bad=false)=>{
    const node=modal.querySelector('#po-batch-status');
    node.textContent=text;node.style.color=bad?'#dc2626':'var(--po-text-muted)';
  };
  const values=(run,text)=>({text,size:run.size,fontFamily:'original',color:run.color,
    bold:run.bold,italic:run.italic,underline:run.underline,align:'left',overflow:'reject'});
  proto.bindEvents=function(...args){
    const result=originalBind.apply(this,args);
    this.initCITBatchText();
    return result;
  };
  proto.initCITBatchText=function(){
    const original=document.getElementById('po-tb-edit-text');
    if(!original||document.getElementById('po-tb-batch-text'))return;
    const button=el('button','po-tool-btn','☷ Sửa nhiều dòng');
    button.id='po-tb-batch-text';
    button.title='Sửa nhiều dòng PDF gốc; mọi dòng được kiểm tra trước khi ghi';
    original.after(button);
    const modal=el('div','po-modal-overlay');modal.id='po-batch-modal';
    modal.style.display='none';modal.style.zIndex='10050';
    modal.innerHTML='<div class="po-modal" role="dialog" aria-modal="true" style="width:min(94vw,960px);max-width:960px;max-height:92vh;display:flex;flex-direction:column;">'+
      '<h3 class="po-modal-title">Chỉnh sửa nhiều dòng — PDF HVD</h3>'+
      '<p style="font-size:12px;margin:5px 0;color:var(--po-text-muted)">Sửa các vùng chữ gốc của cùng một trang trong một giao dịch. Giữ tọa độ, font và đường bảng; không tự dàn lại đoạn, không sửa Type3 chưa an toàn.</p>'+
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">'+
      '<input id="po-batch-find" type="text" placeholder="Tìm nội dung" style="flex:1;min-width:120px;padding:8px">'+
      '<input id="po-batch-replace" type="text" placeholder="Thay bằng" style="flex:1;min-width:120px;padding:8px">'+
      '<button id="po-batch-preview" class="po-tool-btn">Xem trước thay thế</button></div>'+
      '<p id="po-batch-info" style="font-size:12px;color:var(--po-text-muted)"></p>'+
      '<div style="overflow:auto;min-height:120px;max-height:52vh;border:1px solid var(--po-border);border-radius:6px">'+
      '<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px"><thead><tr>'+
      '<th style="width:45px">Chọn</th><th style="width:46%">Văn bản gốc</th><th>Văn bản mới (một dòng)</th>'+
      '</tr></thead><tbody id="po-batch-rows"></tbody></table></div>'+
      '<p id="po-batch-status" role="status" style="font-size:12px;min-height:17px;margin:8px 0"></p>'+
      '<div class="po-modal-footer"><button id="po-batch-cancel" class="po-tool-btn">Đóng</button>'+
      '<button id="po-batch-apply" class="po-primary-btn">Áp dụng</button></div></div>';
    this.appNode.append(modal);
    button.onclick=()=>this.openCITBatchText();
    modal.querySelector('#po-batch-cancel').onclick=()=>this.closeCITBatchText();
    modal.querySelector('#po-batch-preview').onclick=()=>this.previewCITBatchText();
    modal.querySelector('#po-batch-apply').onclick=()=>this.applyCITBatchText();
    modal.querySelector('#po-batch-find').oninput=()=>this.filterCITBatchText();
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&!this.batchBusy){e.preventDefault();this.closeCITBatchText();}
    });
  };
  proto.openCITBatchText=async function(){
    if(this.isSaving||this.batchBusy)return;
    if(this.activeEditDiv&&!await this.finishTextEdit())return;
    const page=this.pages.find(p=>p.id===this.focusedPageId);
    if(!page||page.type!=='pdf'){if(typeof toast==='function')toast('Chọn một trang PDF để sửa.');return;}
    const visible=Array.from(document.querySelectorAll('#po-text-layer .po-text-box'))
      .filter(d=>d._pageId===page.id&&d._textRun);
    const skipped=visible.filter(d=>d._textRun.blocked);
    const type3Count=skipped.filter(d=>/Type ?3/i.test(d._textRun.blocked)).length;
    const boxes=visible
      .filter(d=>!d._textRun.blocked)
      .sort((a,b)=>b._textRun.y-a._textRun.y||a._textRun.x-b._textRun.x);
    if(!boxes.length){if(typeof toast==='function')toast('Bật Chỉnh sửa nội dung và đợi lớp chữ tải xong; font Type3/ảnh không được sửa tự động.');return;}
    const modal=document.getElementById('po-batch-modal');
    const tbody=modal.querySelector('#po-batch-rows');
    tbody.replaceChildren();this.batchPageId=page.id;this.batchRows=[];
    modal.querySelector('#po-batch-find').value='';
    modal.querySelector('#po-batch-replace').value='';
    for(let i=0;i<Math.min(500,boxes.length);i++){
      const run=boxes[i]._textRun;
      const current=(page.textEdits||[]).find(e=>e.id===run.id);
      const original=current?current.newText:run.text;
      const tr=el('tr');tr.style.borderTop='1px solid var(--po-border)';
      const c1=el('td'),c2=el('td','',original),c3=el('td');
      c1.style.padding=c2.style.padding=c3.style.padding='7px';
      c2.style.wordBreak='break-word';
      c1.style.width='45px';
      const checkbox=document.createElement('input');checkbox.type='checkbox';
      checkbox.setAttribute('aria-label','Áp dụng dòng '+(i+1));
      const input=document.createElement('input');input.type='text';input.value=original;
      input.maxLength=4000;input.style.width='98%';
      input.style.padding='7px';input.style.boxSizing='border-box';
      input.addEventListener('input',()=>{checkbox.checked=input.value!==original;this.refreshCITBatchCount();});
      checkbox.addEventListener('change',()=>this.refreshCITBatchCount());
      c1.append(checkbox);c3.append(input);tr.append(c1,c2,c3);tbody.append(tr);
      this.batchRows.push({run,original,checkbox,input,tr});
    }
    modal.querySelector('#po-batch-info').textContent='Trang '+(page.pageIndex+1)+' — '+this.batchRows.length+
      ' vùng chữ được nhận diện'+(boxes.length>500?' (giới hạn 500 vùng đầu)':'')+
      '. Đã khóa '+skipped.length+' vùng phức tạp (Type3: '+type3Count+') để tránh sai hình học.'+
      ' Chỉ dòng được chọn và có thay đổi mới được áp dụng.';
    status(modal,'Kiểm tra văn bản mới từng dòng rồi nhấn Áp dụng. Giới hạn 80 dòng mỗi giao dịch.');
    modal.style.display='flex';this.refreshCITBatchCount();
  };
  proto.filterCITBatchText=function(){
    const modal=document.getElementById('po-batch-modal');
    const find=modal.querySelector('#po-batch-find').value.toLocaleLowerCase('vi');
    for(const r of this.batchRows||[])
      r.tr.style.display=!find||r.original.toLocaleLowerCase('vi').includes(find)?'':'none';
  };
  proto.previewCITBatchText=function(){
    const modal=document.getElementById('po-batch-modal');
    const from=modal.querySelector('#po-batch-find').value;
    const to=modal.querySelector('#po-batch-replace').value;
    if(!from){status(modal,'Không được tìm chuỗi rỗng.',true);return;}
    let count=0;
    for(const r of this.batchRows||[]){
      if(!r.original.includes(from))continue;
      r.input.value=r.original.split(from).join(to);r.checkbox.checked=true;count++;
    }
    this.refreshCITBatchCount();
    status(modal,'Đã chuẩn bị '+count+' dòng. Đây chỉ là xem trước, chưa ghi file.');
  };
  proto.refreshCITBatchCount=function(){
    const modal=document.getElementById('po-batch-modal');if(!modal)return;
    const count=(this.batchRows||[]).filter(r=>r.checkbox.checked&&r.input.value!==r.original).length;
    const apply=modal.querySelector('#po-batch-apply');
    apply.disabled=!!this.batchBusy||count===0||count>80;
    apply.textContent=this.batchBusy?'Đang kiểm tra…':'Kiểm tra và áp dụng '+count+' dòng';
    if(count>80)status(modal,'Chỉ hỗ trợ tối đa 80 dòng/lượt; chia thao tác nhỏ hơn.',true);
  };
  proto.closeCITBatchText=function(){
    if(this.batchBusy)return;
    const modal=document.getElementById('po-batch-modal');
    if(modal)modal.style.display='none';
    this.batchRows=[];this.batchPageId=null;
  };
  proto.applyCITBatchText=async function(){
    if(this.batchBusy)return false;
    const page=this.pages.find(p=>p.id===this.batchPageId);
    const modal=document.getElementById('po-batch-modal');
    if(!page||this.focusedPageId!==page.id){status(modal,'Trang đã thay đổi. Hãy mở lại bảng sửa.',true);return false;}
    const selected=(this.batchRows||[]).filter(r=>r.checkbox.checked&&r.input.value!==r.original);
    if(!selected.length||selected.length>80)return false;
    this.batchBusy=true;this.refreshCITBatchCount();
    try{
      const incoming=[];
      for(const r of selected){
        if(/[\r\n]/.test(r.input.value))throw new Error('Nội dung vùng chữ không được chứa ký tự xuống dòng.');
        const run=r.run;
        // Keep the user's prior per-run formatting when batch-editing an already
        // edited region; never silently reset font, size or alignment to default.
        const prior=(page.textEdits||[]).find(e=>e.id===run.id);
        const edit=prior?{...prior,newText:r.input.value}:
          window.PDFTextLayout.makeEdit(run,values(run,r.input.value));
        edit.originalBold=run.bold;edit.originalItalic=run.italic;
        const font=await this.getTextEditFont(await this.getTextMeasureDoc(),edit);
        const plan=window.PDFTextLayout.layout(edit,font.pdfFont);
        edit.nativeSize=plan.size;edit.nativeFamily=font.original?null:font.label;
        edit.nativeEngine='cit-pdf-1.0.0';
        incoming.push(edit);
      }
      const ids=new Set(incoming.map(e=>e.id));
      const edits=(page.textEdits||[]).filter(e=>!ids.has(e.id)).concat(incoming);
      // Build the whole candidate PDF first. If any source line fails, do not change history or page.
      await this.getNativeTextResult(page,edits);
      if(this.abort.signal.aborted||this.focusedPageId!==page.id)throw new Error('Phiên sửa đã thay đổi.');
      page.textEdits=edits;
      this.pushHistory();this.updateTextEditState();this.invalidateTextThumbnail(page);
      this.batchBusy=false;this.closeCITBatchText();this.focusPage(page.id,true);
      if(typeof toast==='function')toast('Đã thay '+incoming.length+' dòng gốc; Undo hoàn tác cả lượt.');
      return true;
    }catch(e){
      status(modal,'Không áp dụng: '+(e.message||String(e))+'. PDF gốc chưa bị sửa.',true);
      return false;
    }finally{this.batchBusy=false;this.refreshCITBatchCount();}
  };
})();
