// HDV integration of CIT-PDF 1.0.0's native editor. AGPL-3.0; see NOTICE.md.
import {PdfEngine, sfntCovers} from './vendor/cit-pdf/editcore/core.js';
import {protectPatternArtwork} from './vendor/cit-pdf/editcore/shadingsurgery.js';
import {protectType3Text, protectFragileText, consolidateContentArrays} from './vendor/cit-pdf/editcore/type3surgery.js';

const textOf = p => p.runs.map(r => r.text).join('');
const canonical = s => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const fail = message => { throw new Error(message); };

// Do not guess by text alone: identical labels occur throughout engineering tables.
// Match selected text in the correct native paragraph. For a rich paragraph, a
// unique native run may correspond to one PDF.js text box. Never choose by text alone.
export function findParagraph(engine, paragraphs, edit) {
    const at=engine.toModel(edit.x,edit.y);
    const found=paragraphs.filter(p=>{
        if(!p.editable||p.vertical||p.lines?.length!==1)return false;
        if(Math.abs(p.firstBaseline-at.y)>=2)return false;
        const whole=canonical(textOf(p))===canonical(edit.originalText);
        const segments=p.runs.filter(r=>canonical(r.text)===canonical(edit.originalText));
        if(!whole&&segments.length!==1)return false;
        if(whole)return Math.abs(p.box.x-at.x)<2;
        // Full paragraph may begin to the left of selected styled run.
        return at.x>=p.box.x-1.5 && at.x<=p.box.x+(p.box.w||0)+1.5;
    });
    return found.length===1?found[0]:null;
}
const richKeys=['family','bold','italic','size','rgba','underline','strike','script',
    'renderMode','strokeRgba','strokeWidth','hScale','rise'];
const sameStyle=(a,b)=>richKeys.every(k=>a[k]===b[k]);
const rgbValue=hex=>Number.parseInt(hex?.replace('#',''),16);
function richMutation(old,edit) {
    if(edit.fontFamily!=='original'||edit.nativeFamily)
        fail('Đoạn nhiều định dạng: chỉ hỗ trợ sửa nội dung với font gốc, không thay font cả đoạn.');
    const target=old.map((r,i)=>canonical(r.text)===canonical(edit.originalText)?i:-1)
        .filter(i=>i!==-1);
    if(target.length===1)return {index:target[0],text:edit.newText};
    if(target.length>1)fail('Nội dung lặp lại trong đoạn nhiều định dạng. Hãy chọn cụm chữ duy nhất.');
    if(canonical(old.map(r=>r.text).join(''))!==canonical(edit.originalText))
        fail('Chưa xác định chính xác vị trí chữ trong đoạn nhiều định dạng.');
    const oldCP=[...old.map(r=>r.text).join('')], newCP=[...edit.newText];
    let prefix=0;
    while(prefix<oldCP.length&&prefix<newCP.length&&oldCP[prefix]===newCP[prefix])prefix++;
    let suffix=0;
    while(suffix<oldCP.length-prefix&&suffix<newCP.length-prefix &&
        oldCP[oldCP.length-1-suffix]===newCP[newCP.length-1-suffix])suffix++;
    let pos=0;
    const changes=[];
    for(let i=0;i<old.length;i++){
        const a=pos,b=pos+[...old[i].text].length;pos=b;
        if(prefix>=a&&prefix<=b&&oldCP.length-suffix>=a&&oldCP.length-suffix<=b)
            changes.push({index:i,from:prefix-a,to:oldCP.length-suffix-a});
    }
    if(changes.length!==1)
        fail('Nội dung thay thế đi qua ranh giới font hoặc kiểu chữ. Hãy sửa riêng từng phần.');
    const c=changes[0],prev=[...old[c.index].text];
    return {index:c.index,text:prev.slice(0,c.from).join('')+
        newCP.slice(prefix,newCP.length-suffix).join('')+prev.slice(c.to).join('')};
}
export function replacementRuns(paragraph,edit) {
    const old=paragraph.runs;
    if(!old?.length)fail('Không đọc được các run văn bản của PDF.');
    const base=old[0];
    const mixed=old.some(r=>!sameStyle(r,base));
    const selectedPart=canonical(textOf(paragraph))!==canonical(edit.originalText);
    if(!mixed && !selectedPart){
        const color=rgbValue(edit.color);
        if(!Number.isFinite(color))fail('Màu chữ không hợp lệ.');
        return [{...base,sourceIndex:0,text:edit.newText,size:edit.nativeSize,
            family:edit.nativeFamily||base.family,bold:edit.bold,italic:edit.italic,
            underline:edit.underline,rgba:((color<<8)|255)>>>0}];
    }
    const change=richMutation(old,edit);
    const selected=old[change.index];
    const selectedColor=(selected.rgba>>>8)&0xffffff;
    // A rich edit only changes its selected run's literal characters. All styles,
    // geometry, stroke/render modes, script offsets and other runs remain intact.
    if(!!edit.bold!==!!selected.bold||!!edit.italic!==!!selected.italic||
       !!edit.underline!==!!selected.underline||
       Math.abs(edit.nativeSize-selected.size)>0.08||
       rgbValue(edit.color)!==selectedColor)
       fail('Đoạn nhiều định dạng: chỉ được đổi chữ; màu, font và cỡ chữ phải giữ nguyên.');
    return old.map((r,i)=>({...r,sourceIndex:i,text:i===change.index?change.text:r.text}));
}

export function validatePreview(paragraph, preview, edit, engine) {
    if(!preview || preview.lines?.length !== 1)
        fail('Nội dung sẽ xuống dòng. Hãy rút ngắn chữ hoặc chọn thu nhỏ để giữ bố cục.');
    // Test the native glyph box after the engine's own shaping/spacing, not just font metrics.
    const b=preview.box || {x:preview.x,top:preview.top,w:preview.width,h:preview.height};
    const corners=[[b.x,b.top],[b.x+b.w,b.top],[b.x,b.top-b.h],[b.x+b.w,b.top-b.h]].map(([x,y])=>engine.toUser(x,y));
    if(edit.cell) {
        // HDV's detected cell already excludes the border by 0.75 pt.
        const c=edit.cell, pad=0.01;
        if(corners.some(p=>p.x<c.left+pad || p.x>c.right-pad || p.y<c.bottom+pad || p.y>c.top-pad))
            fail('Chữ vượt vùng ô bảng sau khi dàn chữ. Hãy rút ngắn hoặc giảm cỡ chữ.');
    }
    if(b.w > edit.maxWidth + 0.5 && Math.abs(paragraph.rotation || 0)<0.01)
        fail('Chữ vượt vùng cho phép sau khi dàn chữ. Hãy rút ngắn hoặc giảm cỡ chữ.');
}

export class NativeTextEditor {
    async init(fonts) {
        for(const {family,bold,italic,bytes} of fonts) {
            const key=family+'|'+(bold?'1':'0')+(italic?'1':'0');
            PdfEngine.localFonts.set(key,bytes);
            PdfEngine.fallbackFonts.set(key,bytes);
        }
        this.engine = await PdfEngine.create();
        return this;
    }

    async rewrite(source, pages) {
        const engine=this.engine;
        if(!pages.some(p=>p.edits.length)) return {bytes:source,operations:[]};
        // Never rewrite signed documents. Standard signatures have /ByteRange in
        // the source PDF; rewriting their byte offsets invalidates verification.
        const signedMarker=[47,66,121,116,101,82,97,110,103,101];
        for(let i=0;i<=source.length-signedMarker.length;i++){
            if(source[i]!==47)continue;
            let found=true;
            for(let j=1;j<signedMarker.length;j++){
                if(source[i+j]!==signedMarker[j]){found=false;break;}
            }
            if(found) fail('PDF có chữ ký số (/ByteRange): không sửa chữ gốc để tránh làm mất hiệu lực chữ ký.');
        }
        let bytes=source;
        // Same protection pipeline as CIT, but errors abort this edit instead of silently proceeding.
        bytes=await consolidateContentArrays(bytes) || bytes;
        bytes=await protectPatternArtwork(bytes) || bytes;
        const type3=await protectType3Text(bytes);
        if(type3) bytes=type3.bytes;
        const fragile=await protectFragileText(bytes);
        if(fragile) bytes=fragile.bytes;
        const operations=[];
        try {
            // The upstream engine normally lives for one open file. HDV reuses its WASM
            // instance across history states: never replay plans from the previous document.
            engine._splicePlans=[];engine._spliceOk=true;engine._normalizedBytes=null;
            engine._pageDirty=false;engine._pageStale=false;
            engine.open(bytes);
            if(type3) engine.setType3Seg(type3.seg);
            if(fragile) engine.setFragilePages(fragile.pages);
            if(engine.security?.encrypted) fail('Chưa hỗ trợ sửa chữ gốc trong PDF được mã hóa.');
            for(const page of pages) {
                engine.loadPage(page.pageIndex);
                // CIT paragraph boxes are de-rotated local coordinates. Edit in raw
                // page space and restore /Rotate before serializing either save path.
                const rotation=engine.M._FPDFPage_GetRotation(engine.page);
                engine.M._FPDFPage_SetRotation(engine.page,0);
                engine._readPageTransform();
                for(const edit of page.edits) {
                    if(edit.layoutVersion!==2 || !Number.isFinite(edit.nativeSize)) fail('Dữ liệu sửa chữ chưa hợp lệ.');
                    let paragraph=findParagraph(engine,engine.buildModel(),edit);
                    if(!paragraph && edit.mask) {
                        const m=edit.mask;
                        const corners=[[m.left,m.bottom],[m.right,m.bottom],[m.left,m.top],[m.right,m.top]].map(([x,y])=>engine.toModel(x,y));
                        const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
                        paragraph=findParagraph(engine,engine.buildModelInRegion(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)),edit);
                    }
                    if(!paragraph) fail('Chưa xác định an toàn được cụm chữ gốc. Vùng này chưa được sửa; không dùng lớp che chữ thay thế.');
                    if(!edit.newText) {
                        const deleted=engine.editStep('HDV delete original text',()=>engine.deleteParagraph(paragraph.id));
                        if(!deleted) fail('Không xóa được cụm chữ gốc.');
                        operations.push({pageIndex:page.pageIndex,id:edit.id,method:engine.lastSplicePlan()?.kind || 'native'});
                        continue;
                    }
                    let runs=replacementRuns(paragraph,edit);
                    const isRich=paragraph.runs.length>1 &&
                        (canonical(textOf(paragraph))!==canonical(edit.originalText) ||
                         paragraph.runs.some(r=>!sameStyle(r,paragraph.runs[0])));
                    // For rich text, selected PDF.js text box may cover just one styled
                    // run. Validate the whole paragraph against its original bounds.
                    const safeEdit=isRich?{...edit,maxWidth:Math.max(edit.maxWidth,
                        paragraph.box.w||0)}:edit;
                    if(edit.nativeFamily) {
                        const key=edit.nativeFamily+'|'+(edit.bold?'1':'0')+(edit.italic?'1':'0');
                        if(!sfntCovers(PdfEngine.localFonts.get(key) || new Uint8Array(),[...edit.newText].map(c=>c.codePointAt(0))))
                            fail('Font được chọn thiếu ký tự cần dùng.');
                    }
                    const fmt={...paragraph.format,align:0};
                    let preview=engine.previewParagraph(paragraph.id,runs,fmt);
                    // Native shaping can differ slightly from fontkit. Shrink only on explicit opt-in.
                    const nativeWidth=preview?.lines?.[0]?.cx?.at(-1) ?? preview?.width;
                    if(!isRich && edit.overflow==='shrink' && nativeWidth>edit.maxWidth-0.8) {
                        runs=runs.map(r=>({...r,size:r.size*(edit.maxWidth-0.8)/nativeWidth}));
                        if(runs[0].size<Math.max(1,edit.size*0.6)) fail('Nội dung quá dài, cần thu nhỏ dưới 60% cỡ chữ.');
                        preview=engine.previewParagraph(paragraph.id,runs,fmt);
                    }
                    validatePreview(paragraph,preview,safeEdit,engine);
                    const result=engine.editStep('HDV edit original text',()=>{
                        const result=engine.commitParagraph(paragraph.id,runs,fmt);
                        if(!result) return null;
                        const width=result.lines?.[0]?.w ?? result.box.w;
                        const offset=edit.align==='center' ? (edit.maxWidth-width)/2 : edit.align==='right' ? edit.maxWidth-width : 0;
                        const angle=edit.angle*Math.PI/180;
                        const at=isRich?{x:paragraph.box.x,y:paragraph.firstBaseline}:
                            engine.toModel(edit.x+Math.cos(angle)*offset,edit.y+Math.sin(angle)*offset);
                        const dx=at.x-result.box.x,dy=at.y-result.firstBaseline;
                        if(Math.abs(dx)>0.01 || Math.abs(dy)>0.01) {
                            if(!engine.moveParagraph(result.id,dx,dy)) fail('Không giữ được vị trí dòng gốc.');
                            result.box.x+=dx;result.box.top+=dy;result.firstBaseline+=dy;
                        }
                        return result;
                    });
                    if(!result || result.ok===false) fail('Không ghi được thay đổi chữ gốc vào PDF.');
                    if(Math.abs(result.firstBaseline-paragraph.firstBaseline)>0.2)
                        fail('Engine không giữ được đường chân chữ gốc; chưa áp dụng thay đổi.');
                    validatePreview(paragraph,result,safeEdit,engine);
                    operations.push({pageIndex:page.pageIndex,id:edit.id,method:engine.lastSplicePlan()?.kind || 'native'});
                }
                engine.M._FPDFPage_SetRotation(engine.page,rotation);
            }
            const output=await engine.saveSpliced();
            if(!output?.length) fail('Engine không tạo được PDF đầu ra.');
            return {bytes:output,operations};
        } finally {engine.close();}
    }
}
