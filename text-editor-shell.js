/* HVD CIT native text workspace — standalone UI adapter (AGPL-3.0).
 * Text rewrite always goes through existing CIT PdfEngine/PDFium native worker.
 * The organizer provides history, PDF.js text targeting and lossless PDF export;
 * page organization and annotation tools are not exposed here.
 */
(()=>{
  'use strict';
  const proto=PDFOrganizer.prototype;
  const originalInit=proto.initDOM;
  const originalPreview=proto.previewActiveText;
  const originalRender=proto.renderTextLayer;
  const originalHandle=proto.handleFiles;
  const originalFocus=proto.focusPage;
  const $=s=>document.querySelector(s);
  let docCounter=0, activeDocVersion=0;

  function buildDock(org){
    const container=org.appNode;
    container.classList.add('hvd-text-editor-only');
    const title=container.querySelector('.po-title');
    if(title)title.textContent='PDF EDITOR / Chỉnh sửa Text gốc';
    const header=container.querySelector('.po-header-left');
    const back=container.querySelector('#po-back');
    if(back){
      back.title='Trở về danh mục công cụ';
      back.onclick=async()=>{
        if(!await org.finishTextEdit())return;
        const changed=org.historyIndex!==org.savedHistoryIndex && org.historyIndex>=0;
        if(changed&&!confirm('Có thay đổi chưa lưu. Bạn muốn trở về danh mục công cụ?'))return;
        location.href='./index.html';
      };
    }
    const hActions=container.querySelector('.po-header-right');
    const addButton=(label,cls,id,title)=>{
      const b=document.createElement('button');b.textContent=label;
      b.className=cls;b.id=id;b.title=title||label;return b;
    };
    const fileButton=addButton('▤ Mở PDF','po-tool-btn','hdv-open-pdf','Mở tài liệu PDF khác');
    fileButton.style.cssText='color:#eff6f5;background:#3a3e42;border:1px solid #4c5256;margin-right:4px';
    const batch=container.querySelector('#po-tb-batch-text');
    const batchButton=addButton('☷ Sửa nhiều dòng','po-tool-btn','hdv-edit-lines','Sửa nhiều vùng văn bản trong một lần áp dụng');
    batchButton.style.cssText=fileButton.style.cssText;
    if(hActions){
      hActions.prepend(batchButton);
      hActions.prepend(fileButton);
    }
    batchButton.disabled=true;
    fileButton.onclick=()=>$('#hdv-text-file-picker').click();
    batchButton.onclick=()=>{if(typeof org.openCITBatchText==='function')org.openCITBatchText();};
    const topTitle=document.createElement('span');
    topTitle.className='hdv-engine-title';topTitle.textContent='PDF EDITOR TEXT';
    topTitle.style.cssText='font-size:10px;color:#11c8b7;margin-left:5px';
    header?.append(topTitle);

    const dock=document.createElement('aside');
    dock.className='hdv-text-dock';dock.id='hdv-text-dock';
    dock.setAttribute('aria-label','Bảng định dạng văn bản PDF');
    dock.innerHTML='<button id="hdv-dock-mobile" class="hdv-mobile-toggle" style="display:none">ĐỊNH DẠNG</button>'+
      '<div class="hdv-dock-section">'+
      '<h2>⚙ Định dạng</h2>'+
      '<span class="hdv-engine-title">BỘ BIÊN TẬP VĂN BẢN PDF</span>'+
      '<span class="hdv-dock-label">Vùng văn bản đang chọn</span>'+
      '<textarea id="hdv-text-value" aria-label="Sửa nội dung vùng chữ PDF" placeholder="Nhấp một vùng chữ trên PDF để chỉnh sửa" disabled spellcheck="false"></textarea>'+
      '<div class="hdv-dock-row" style="margin-top:9px">'+
      '<button id="hdv-text-apply" class="hdv-submit" disabled>✓ Áp dụng</button>'+
      '<button id="hdv-text-cancel" disabled>Hủy</button></div></div>'+
      '<div class="hdv-dock-section">'+
      '<span class="hdv-dock-label">Phông chữ</span>'+
      '<div class="hdv-dock-row"><select id="hdv-text-font" disabled>'+
      '<option value="original">Font gốc của PDF</option>'+
      '<option value="serif">Times New Roman / Tinos</option>'+
      '<option value="sans-serif">Noto Sans</option></select>'+
      '<input id="hdv-text-size" type="number" min="1" max="300" step=".5" title="Cỡ chữ (pt)" style="flex:0 0 67px" disabled></div>'+
      '<span class="hdv-dock-label">Màu chữ</span>'+
      '<div class="hdv-dock-row"><input type="color" id="hdv-text-color" value="#111111" disabled>'+
      '<span style="font-size:12px;color:#b1b9be">Giữ nguyên màu gốc hoặc chọn màu mới</span></div></div>'+
      '<div class="hdv-dock-section">'+
      '<span class="hdv-dock-label">Căn chỉnh</span>'+
      '<div class="hdv-dock-row">'+
      '<button class="hdv-align" data-align="left" title="Căn trái" disabled>≡</button>'+
      '<button class="hdv-align" data-align="center" title="Căn giữa" disabled>☰</button>'+
      '<button class="hdv-align" data-align="right" title="Căn phải" disabled>≡</button></div>'+
      '<span class="hdv-dock-label">Kiểu chữ</span>'+
      '<div class="hdv-dock-row">'+
      '<button id="hdv-text-bold" title="Đậm" disabled><b>B</b></button>'+
      '<button id="hdv-text-italic" title="Nghiêng" disabled><i>I</i></button>'+
      '<button id="hdv-text-underline" title="Gạch chân" disabled><u>U</u></button></div></div>'+
      '<div class="hdv-dock-section">'+
      '<span class="hdv-dock-label">Xử lý khi vượt vùng gốc</span>'+
      '<select id="hdv-text-overflow" disabled>'+
      '<option value="reject">Không cho vượt ô / khung</option>'+
      '<option value="shrink">Thu nhỏ để vừa (tối đa 40%)</option></select>'+
      '<p class="hdv-note">Tài liệu CAD giữ nguyên baseline, đường biên ô và đường vector.</p>'+
      '</div>'+
      '<div class="hdv-dock-section">'+
      '<h2>Thông tin vùng chữ</h2>'+
      '<div id="hdv-text-selection-info" class="hdv-note">Chưa chọn đối tượng chữ</div>'+
      '<div id="hdv-text-protection" class="hdv-note">Type3 và vùng chữ không nhận diện an toàn sẽ không cho sửa.</div>'+
      '<div id="hdv-text-status" class="hdv-status" role="status">Mở PDF và nhấp vào khung chữ để chỉnh sửa.</div></div>'+
      '<div class="hdv-dock-section"><h2>Thao tác</h2>'+
      '<button id="hdv-text-batch" style="width:100%;margin-bottom:8px" disabled>☷ Tìm và thay thế nhiều dòng</button>'+
      '<p class="hdv-note">Mọi thay đổi được xử lý cục bộ bằng worker PDFium. Không tải hồ sơ lên máy chủ.</p>'+
      '</div>';
    const ws=container.querySelector('.po-workspace');
    if(!ws)throw Error('Không thể tạo vùng xem PDF');
    ws.appendChild(dock);
    const input=$('#hdv-text-file-picker');
    input.onchange=async e=>{
      const file=e.target.files?.[0];
      input.value='';
      if(!file)return;
      if(!/\.pdf$/i.test(file.name)&&file.type!=='application/pdf'){
        toast('Vui lòng chọn tệp PDF.');return;
      }
      if(org.files.length){
        if(!confirm('Mở PDF mới sẽ đóng tài liệu hiện tại. Hãy lưu các thay đổi trước khi tiếp tục.'))return;
        org.destroy();
        window.initOrganizer([file]);
      }else await org.handleFiles([file],0);
    };
    const mobile=dock.querySelector('#hdv-dock-mobile');
    mobile.onclick=()=>dock.classList.toggle('hdv-expanded');
    dock.querySelector('#hdv-text-batch').onclick=()=>batchButton.click();
    const fwd=(dockId,toolbarId,event)=>{
      const src=dock.querySelector('#'+dockId);
      const dst=container.querySelector('#'+toolbarId);
      src.addEventListener(event,()=>{
        if(!org.activeEditDiv||!dst)return;
        dst.value=src.value;
        dst.dispatchEvent(new Event(event,{bubbles:true}));
      });
    };
    fwd('hdv-text-font','po-ft-font','change');
    fwd('hdv-text-size','po-ft-size','input');
    fwd('hdv-text-color','po-ft-color','input');
    fwd('hdv-text-overflow','po-ft-overflow','change');
    for(const [action,id] of [['bold','hdv-text-bold'],['italic','hdv-text-italic'],['underline','hdv-text-underline']])
      dock.querySelector('#'+id).onclick=()=>container.querySelector('#po-ft-'+action)?.click();
    dock.querySelectorAll('.hdv-align').forEach(b=>
      b.onclick=()=>container.querySelector('#po-ft-align-'+b.dataset.align)?.click());
    const area=dock.querySelector('#hdv-text-value');
    area.addEventListener('input',()=>{
      const div=org.activeEditDiv;
      if(!div)return;
      if(/[\r\n]/.test(area.value)){
        updateStatus(org,'Một vùng chữ chỉ nhận một dòng. Hãy chọn “Sửa nhiều dòng” để sửa nhiều vùng.',true);
        return;
      }
      div.innerText=area.value;
      org.previewActiveText();
    });
    dock.querySelector('#hdv-text-apply').onclick=async()=>{
      if(!org.activeEditDiv)return;
      const ok=await org.commitEdit(org.activeEditDiv);
      if(ok)updateStatus(org,'Đã sửa Text gốc. Có thể hoàn tác bằng Undo.');
      syncInspector(org);
    };
    dock.querySelector('#hdv-text-cancel').onclick=()=>{
      org.cancelTextEdit();syncInspector(org);
    };
    const ftStatus=container.querySelector('#po-ft-status');
    const observer=new MutationObserver(()=>{
      const txt=ftStatus?.textContent||'';
      if(txt)updateStatus(org,txt,ftStatus.classList.contains('po-text-error'));
    });
    if(ftStatus)observer.observe(ftStatus,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
    org.abort.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
    org.hdvDock=dock;
    syncInspector(org);
    const nativeSave=container.querySelector('#po-save');
    if(nativeSave)nativeSave.textContent='⭳ Xuất PDF';
    const nativeUndo=container.querySelector('#po-undo');
    if(nativeUndo)nativeUndo.title='Hoàn tác (Ctrl+Z)';
    const nativeRedo=container.querySelector('#po-redo');
    if(nativeRedo)nativeRedo.title='Làm lại (Ctrl+Y)';
  }
  function updateStatus(org,message,bad=false){
    const node=org.hdvDock?.querySelector('#hdv-text-status');
    if(!node)return;
    node.textContent=message;node.classList.toggle('error',bad);
  }
  function syncInspector(org){
    const dock=org.hdvDock;if(!dock)return;
    const div=org.activeEditDiv,enabled=!!(div&&div.contentEditable!=='false');
    dock.querySelectorAll('input,textarea,select,button').forEach(node=>{
      if(node.id==='hdv-dock-mobile')return;
      node.disabled=!enabled;
    });
    dock.querySelector('#hdv-text-batch').disabled=!org.pages.length;
    const launch=org.appNode.querySelector('#hdv-edit-lines');
    if(launch)launch.disabled=!org.pages.length;
    if(!enabled){
      dock.querySelector('#hdv-text-value').value='';
      dock.querySelector('#hdv-text-value').placeholder='Nhấp vùng chữ trên bản PDF để chỉnh sửa';
      dock.querySelector('#hdv-text-selection-info').textContent='Chưa chọn đối tượng chữ';
      return;
    }
    const info=div._textRun||{};
    const text=div.innerText;
    const area=dock.querySelector('#hdv-text-value');
    if(document.activeElement!==area)area.value=text;
    dock.querySelector('#hdv-text-font').value=div.dataset.fontFamily||'original';
    dock.querySelector('#hdv-text-size').value=div.dataset.pdfSize||'';
    dock.querySelector('#hdv-text-color').value=div.dataset.color||'#111111';
    dock.querySelector('#hdv-text-overflow').value=org.appNode.querySelector('#po-ft-overflow').value;
    for(const k of ['bold','italic','underline']){
      const b=dock.querySelector('#hdv-text-'+k);
      b.setAttribute('aria-pressed',div.dataset[k]==='1'?'true':'false');
    }
    dock.querySelectorAll('.hdv-align').forEach(b=>
      b.setAttribute('aria-pressed',div.dataset.align===b.dataset.align?'true':'false'));
    dock.querySelector('#hdv-text-selection-info').textContent=
      'Vị trí X: '+Number(info.x||0).toFixed(1)+' pt · Y: '+Number(info.y||0).toFixed(1)+
      ' pt · Cỡ gốc: '+Number(info.size||0).toFixed(1)+' pt · Font: '+(info.sourceFontName||'Không rõ');
    dock.querySelector('#hdv-text-protection').textContent=info.cell?
      'Đã phát hiện ô bảng; engine không cho chữ mới vượt đường biên.':
      'Đã chọn vùng chữ gốc; nếu kết quả native không giữ baseline, thay đổi sẽ bị từ chối.';
  }
  proto.initDOM=function(...args){
    const result=originalInit.apply(this,args);
    buildDock(this);
    return result;
  };
  proto.previewActiveText=function(...args){
    syncInspector(this);
    return originalPreview.apply(this,args);
  };
  proto.renderTextLayer=async function(...args){
    const result=await originalRender.apply(this,args);
    if(this.hdvDock){
      const nodes=this.appNode.querySelectorAll('.po-text-box');
      const blocked=[...nodes].filter(n=>n._textRun?.blocked);
      const type3=blocked.filter(n=>/Type ?3/i.test(n._textRun.blocked)).length;
      const txt=blocked.length?
        'Vùng khóa: '+blocked.length+' / '+nodes.length+
        ' (Type3: '+type3+'). Nhấp vùng hợp lệ để sửa.':
        'Đã nhận diện '+nodes.length+' vùng chữ; chỉ sửa đối tượng thật trong PDF.';
      this.hdvDock.querySelector('#hdv-text-protection').textContent=txt;
    }
    syncInspector(this);
    return result;
  };
  proto.focusPage=function(...args){
    const result=originalFocus.apply(this,args);
    syncInspector(this);
    return result;
  };
  proto.handleFiles=async function(fileList,at){
    // The dedicated editor operates on one PDF; do not append a second
    // document to the organizer or accidentally include it in output.
    const first=Array.from(fileList||[]).find(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name));
    if(!first)return;
    if(this.files.length){toast('Chỉ mở một tài liệu trong công cụ sửa Text. Dùng Mở PDF để thay thế.');return;}
    const result=await originalHandle.call(this,[first],at);
    if(this.abort.signal.aborted)return result;
    if(!this.isEditMode)await this.toggleEditMode(true);
    if(this.pages.length&&!this.focusedPageId)this.focusPage(this.pages[0].id,true);
    syncInspector(this);
    return result;
  };
  window.initOrganizer([]);
})();
