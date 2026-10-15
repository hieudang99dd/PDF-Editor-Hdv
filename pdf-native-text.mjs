// HDV integration of CIT-PDF 1.0.0's native editor. AGPL-3.0; see NOTICE.md.
import {PdfEngine, sfntCovers} from './vendor/cit-pdf/editcore/core.js';
import {protectPatternArtwork} from './vendor/cit-pdf/editcore/shadingsurgery.js';
import {protectType3Text, protectFragileText, consolidateContentArrays} from './vendor/cit-pdf/editcore/type3surgery.js';

const textOf = p => p.runs.map(r => r.text).join('');
const canonical = s => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const fail = message => { throw new Error(message); };

// Do not guess by text alone: identical labels occur throughout engineering tables.
export function findParagraph(engine, paragraphs, edit) {
    const at = engine.toModel(edit.x, edit.y);
    const matches = paragraphs.filter(p => canonical(textOf(p)) === canonical(edit.originalText) &&
        Math.hypot(p.box.x - at.x, p.firstBaseline - at.y) < 2);
    if(matches.length !== 1) return null;
    const p = matches[0];
    if(!p.editable || p.vertical || p.lines.length !== 1) return null;
    return p;
}

export function replacementRuns(paragraph, edit) {
    const old = paragraph.runs;
    // Each HDV region has one style. Refuse to flatten a rich paragraph by accident.
    const base = old[0];
    const keys = ['family','bold','italic','size','rgba','underline','strike','script','renderMode','strokeRgba','strokeWidth','hScale','rise'];
    if(old.some(r => keys.some(k => r[k] !== base[k])))
        fail('Vùng này có nhiều định dạng nội bộ. Hãy chọn cụm chữ nhỏ hơn; chưa áp dụng thay đổi.');
    const color = parseInt(edit.color.slice(1), 16);
    return [{...base, sourceIndex:0, text:edit.newText, size:edit.nativeSize,
        family:edit.nativeFamily || base.family, bold:edit.bold, italic:edit.italic,
        underline:edit.underline, rgba:((color << 8) | 255) >>> 0}];
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
                    if(edit.nativeFamily) {
                        const key=edit.nativeFamily+'|'+(edit.bold?'1':'0')+(edit.italic?'1':'0');
                        if(!sfntCovers(PdfEngine.localFonts.get(key) || new Uint8Array(),[...edit.newText].map(c=>c.codePointAt(0))))
                            fail('Font được chọn thiếu ký tự cần dùng.');
                    }
                    const fmt={...paragraph.format,align:0};
                    let preview=engine.previewParagraph(paragraph.id,runs,fmt);
                    // Native shaping can differ slightly from fontkit. Shrink only on explicit opt-in.
                    const nativeWidth=preview?.lines?.[0]?.cx?.at(-1) ?? preview?.width;
                    if(edit.overflow==='shrink' && nativeWidth>edit.maxWidth-0.8) {
                        runs=runs.map(r=>({...r,size:r.size*(edit.maxWidth-0.8)/nativeWidth}));
                        if(runs[0].size<Math.max(1,edit.size*0.6)) fail('Nội dung quá dài, cần thu nhỏ dưới 60% cỡ chữ.');
                        preview=engine.previewParagraph(paragraph.id,runs,fmt);
                    }
                    validatePreview(paragraph,preview,edit,engine);
                    const result=engine.editStep('HDV edit original text',()=>{
                        const result=engine.commitParagraph(paragraph.id,runs,fmt);
                        if(!result) return null;
                        const width=result.lines?.[0]?.w ?? result.box.w;
                        const offset=edit.align==='center' ? (edit.maxWidth-width)/2 : edit.align==='right' ? edit.maxWidth-width : 0;
                        const angle=edit.angle*Math.PI/180;
                        const at=engine.toModel(edit.x+Math.cos(angle)*offset,edit.y+Math.sin(angle)*offset);
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
                    validatePreview(paragraph,result,edit,engine);
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
