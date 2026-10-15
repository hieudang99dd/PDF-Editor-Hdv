/* CIT-PDF 1.0.0 algorithms adapted for PDF HVD. GNU AGPL-3.0; see NOTICE.md.
 * Uses local pdf-lib: no network calls, preserves vector PDF page content.
 * Functions are intentionally independent from HVD UI for testing.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CITAdvancedCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  const ptPerMm = 72 / 25.4;
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function uint(bytes) { return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes); }
  function safeStem(name) { return String(name || 'document.pdf').replace(/\.pdf$/i, '').slice(0, 90); }
  function normalizeNumber(value, min, max, name) {
    const n = Number(value);
    assert(Number.isFinite(n) && n >= min && n <= max, name + ' ngoài khoảng hợp lệ');
    return n;
  }
  async function loadPDF(PDFLib, bytes) {
    assert(PDFLib && PDFLib.PDFDocument, 'Không tìm thấy pdf-lib');
    const arr = uint(bytes);
    assert(arr.length >= 5 && String.fromCharCode(...arr.slice(0,5)) === '%PDF-', 'Đầu vào không phải PDF');
    // Disallow silently modifying signed documents.
    const ascii = String.fromCharCode.apply(null, arr.slice(0, Math.min(8192, arr.length)));
    assert(!ascii.includes('/ByteRange'), 'PDF có thể đã ký số; không tự ý sửa nội dung');
    return PDFLib.PDFDocument.load(arr, { updateMetadata: false });
  }
  function getBox(page) {
    const b = page.getCropBox();
    assert(b && b.width > 0 && b.height > 0, 'CropBox không hợp lệ');
    return b;
  }
  function fieldInfo(doc) {
    const pages = doc.getPages().map((p,i) => {
      const b=getBox(p);
      return {page:i+1,widthPt:Math.round(b.width*100)/100,heightPt:Math.round(b.height*100)/100,
        widthMm:Math.round(b.width/ptPerMm*100)/100,heightMm:Math.round(b.height/ptPerMm*100)/100,
        rotation:p.getRotation().angle};
    });
    return {pages:pages, title:doc.getTitle()||'',author:doc.getAuthor()||'',
      subject:doc.getSubject()||'',keywords:doc.getKeywords()||'',
      creator:doc.getCreator()||'',producer:doc.getProducer()||'',
      pageCount:doc.getPageCount()};
  }
  function removeVisibleMetadata(doc, PDFLib) {
    // CIT-PDF's removal strategy: Info dictionary + catalog XMP and PieceInfo.
    const dict = doc.getInfoDict();
    for (const key of [...dict.keys()]) dict.delete(key);
    const catalog=doc.catalog.dict;
    for (const key of ['Metadata','PieceInfo']) {
      catalog.delete(PDFLib.PDFName.of(key));
    }
    if (doc.context.trailerInfo) delete doc.context.trailerInfo.ID;
    // PDF metadata can also occur in nested XObjects and incremental history.
  }
  function getOutput(bytes, filename, note, type='application/pdf') {
    return {bytes:uint(bytes),filename, note, mime:type};
  }
  async function execute(PDFLib, action, files, options={}) {
    assert(Array.isArray(files) && files.length, 'Chưa có PDF đầu vào');
    const docs = [];
    for (const f of files) docs.push(await loadPDF(PDFLib, f.bytes));
    const doc=docs[0], name=safeStem(files[0].name);
    if (action==='inspect') {
      return {info:fieldInfo(doc),filename:name};
    }
    if (action==='reverse' || action==='odd' || action==='even') {
      const count=doc.getPageCount();
      let idx=Array.from({length:count},(_,i)=>i);
      if(action==='reverse')idx.reverse();
      if(action==='odd')idx=idx.filter(i=>i%2===0);
      if(action==='even')idx=idx.filter(i=>i%2===1);
      assert(idx.length>0,'Không có trang phù hợp để xuất');
      const output=await PDFLib.PDFDocument.create();
      const pages=await output.copyPages(doc,idx);
      for(const p of pages)output.addPage(p);
      return getOutput(await output.save(),name+'_'+action+'.pdf', 'Đã bảo toàn các trang PDF dạng vector.');
    }
    if (action==='interleave') {
      assert(docs.length===2,'Ghép xen kẽ yêu cầu đúng hai PDF');
      const output=await PDFLib.PDFDocument.create();
      const counts=docs.map(d=>d.getPageCount());
      const total=Math.max(...counts);
      for(let i=0;i<total;i++)for(let j=0;j<docs.length;j++) {
        if(i<counts[j]) {
          const [p]=await output.copyPages(docs[j],[i]);
          output.addPage(p);
        }
      }
      return getOutput(await output.save(),name+'_xen_ke.pdf',
        'Ghép lần lượt trang 1 của hai file, trang 2 của hai file…');
    }
    if (action==='crop') {
      const left=normalizeNumber(options.left,0,500,'Lề trái')*ptPerMm;
      const right=normalizeNumber(options.right,0,500,'Lề phải')*ptPerMm;
      const top=normalizeNumber(options.top,0,500,'Lề trên')*ptPerMm;
      const bottom=normalizeNumber(options.bottom,0,500,'Lề dưới')*ptPerMm;
      for (const p of doc.getPages()) {
        const b=getBox(p);
        const w=b.width-left-right, h=b.height-top-bottom;
        assert(w>=12 && h>=12,'Cắt lề vượt kích thước trang');
        p.setCropBox(b.x+left,b.y+bottom,w,h);
      }
      return getOutput(await doc.save(),name+'_crop.pdf',
        'Đã đổi CropBox; phần ngoài vẫn có thể tồn tại trong PDF. KHÔNG dùng để xóa thông tin mật.');
    }
    if (action==='metadata') {
      const vals=['title','author','subject','creator'];
      for(const f of vals) {
        assert(String(options[f]||'').length<=300,'Metadata quá dài');
      }
      doc.setTitle(String(options.title||'')); doc.setAuthor(String(options.author||''));
      doc.setSubject(String(options.subject||'')); doc.setCreator(String(options.creator||''));
      doc.setKeywords(String(options.keywords||'').split(',').map(s=>s.trim()).filter(Boolean));
      return getOutput(await doc.save(),name+'_metadata.pdf','Đã cập nhật thông tin tài liệu.');
    }
    if (action==='remove-metadata') {
      removeVisibleMetadata(doc,PDFLib);
      return getOutput(await doc.save({updateFieldAppearances:false}),name+'_metadata_removed.pdf',
        'Đã xóa metadata chính và XMP cấp tài liệu. KHÔNG bảo đảm loại bỏ mọi thông tin nhạy cảm.');
    }
    if(action==='remove-annotations') {
      let removed=0;
      const N=PDFLib.PDFName;
      for(const page of doc.getPages()){
        const annots=page.node.Annots();
        if(!annots)continue;
        const kept=[];
        for(const ref of annots.asArray()){
          const annot=doc.context.lookup(ref);
          const typ=annot && typeof annot.get==='function' ? annot.get(N.of('Subtype')) : null;
          if(typ && typ.toString()==='/Widget')kept.push(ref);
          else removed++;
        }
        if(kept.length)page.node.set(N.of('Annots'),doc.context.obj(kept));
        else page.node.delete(N.of('Annots'));
      }
      return getOutput(await doc.save(),name+'_annotations_removed.pdf',
        'Đã loại '+removed+' chú thích; giữ nguyên trường biểu mẫu Widget.');
    }
    if(action==='bates') {
      const prefix=String(options.prefix||'HDV-');
      assert(/^[\x20-\x7e]{0,24}$/.test(prefix),'Tiền tố Bates chỉ hỗ trợ ASCII, tối đa 24 ký tự');
      const start=normalizeNumber(options.start,1,100000000,'Số bắt đầu');
      assert(Number.isInteger(start),'Số bắt đầu phải là số nguyên');
      const pad=normalizeNumber(options.padding||6,1,12,'Số chữ số');
      assert(Number.isInteger(pad),'Số chữ số phải là số nguyên');
      const font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      let index=0;
      for(const page of doc.getPages()){
        const box=getBox(page);
        const code=prefix+String(start+index++).padStart(pad,'0');
        const size=Math.max(7,Math.min(10,box.width/65));
        const width=font.widthOfTextAtSize(code,size);
        assert(width+20<box.width,'Trang quá hẹp để đóng dấu Bates');
        page.drawText(code,{x:box.x+box.width-width-12,y:box.y+10,size,font,
          color:PDFLib.rgb(0.15,0.15,0.15),opacity:1});
      }
      return getOutput(await doc.save(),name+'_bates.pdf','Đã thêm mã Bates liên tục cho '+index+' trang.');
    }
    if(action==='nup') {
      const n=Number(options.nup||2);
      assert(n===2||n===4,'Chỉ hỗ trợ bố trí 2 hoặc 4 trang/tờ');
      const cols=2,rows=n/cols;
      const output=await PDFLib.PDFDocument.create();
      const sourcePages=doc.getPages();
      // pdf-lib cannot embed a PDF page with no Contents stream (blank pages).
      // Attach an invisible zero-length vector operation; never rasterize the page.
      for(const source of sourcePages)if(!source.node.Contents()) {
        source.drawLine({start:{x:0,y:0},end:{x:0,y:0},
          thickness:0,color:PDFLib.rgb(1,1,1),opacity:0});
      }
      const sheetBox=getBox(sourcePages[0]);
      const sheetWidth=n===2?sheetBox.height:sheetBox.width;
      const sheetHeight=n===2?sheetBox.width:sheetBox.height;
      const cellW=sheetWidth/cols,cellH=sheetHeight/rows;
      for(let offset=0;offset<sourcePages.length;offset+=n){
        const page=output.addPage([sheetWidth,sheetHeight]);
        const src=sourcePages.slice(offset,offset+n);
        // embedPages retains vector content instead of rasterizing.
        const embedded=await output.embedPages(src);
        for(let k=0;k<embedded.length;k++){
          const entry=embedded[k], w=entry.width,h=entry.height;
          const scale=Math.min((cellW-12)/w,(cellH-12)/h);
          assert(scale>0,'Trang quá nhỏ cho N-up');
          const x=(k%cols)*cellW+(cellW-w*scale)/2;
          const y=sheetHeight-(Math.floor(k/cols)+1)*cellH+(cellH-h*scale)/2;
          page.drawPage(entry,{x,y,width:w*scale,height:h*scale});
        }
      }
      return getOutput(await output.save(),name+'_'+n+'up.pdf',
        'Đã sắp '+n+' trang trên một tờ, giữ đường nét vector.');
    }
    throw new Error('Tác vụ chưa hỗ trợ: '+action);
  }
  return {execute,fieldInfo,removeVisibleMetadata,ptPerMm};
});
