/* Layout-preserving text replacements. No paragraph reflow or page-rotation guesses. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PDFTextLayout = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
    'use strict';
    const IDENTITY = [1, 0, 0, 1, 0, 0];
    const point = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const multiply = (a, b) => [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
    const bounds = pts => ({ left: Math.min(...pts.map(p => p[0])), right: Math.max(...pts.map(p => p[0])), bottom: Math.min(...pts.map(p => p[1])), top: Math.max(...pts.map(p => p[1])) });
    const intersects = (a,b) => a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
    const contains = (a,b) => a.left <= b.left && a.right >= b.right && a.bottom <= b.bottom && a.top >= b.top;
    const compact = str => str.normalize('NFKC').replace(/\s/g, '');
    const rgbHex = values => '#' + Array.from(values).slice(0,3).map(v => Math.round(Math.min(255, Math.max(0,v))).toString(16).padStart(2,'0')).join('');
    const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255);

    function analyzeOperators(list, OPS) {
        const rules = [], backgrounds = [], images = [], paints = [];
        const stack = [];
        let state = { matrix: IDENTITY.slice(), color: '#000000', solid: true, alpha: 1, lineWidth: 1, rendering: 0 };
        let path = [], rectangles = [], cursor = null, start = null;
        const segment = (a,b) => { if (a && b) path.push([a,b]); };
        const addRule = (a,b) => {
            if (Math.hypot(a[0]-b[0],a[1]-b[1]) < 3) return;
            const width = state.lineWidth * Math.max(Math.hypot(...state.matrix.slice(0,2)), Math.hypot(...state.matrix.slice(2,4)));
            if (Math.abs(a[1]-b[1]) < 0.15) rules.push({ axis:'h', at:(a[1]+b[1])/2, from:Math.min(a[0],b[0]), to:Math.max(a[0],b[0]), width });
            else if (Math.abs(a[0]-b[0]) < 0.15) rules.push({ axis:'v', at:(a[0]+b[0])/2, from:Math.min(a[1],b[1]), to:Math.max(a[1],b[1]), width });
        };
        const strokeOps = new Set([OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
        const fillOps = new Set([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke]);
        for (let i=0; i<list.fnArray.length; i++) {
            const op = list.fnArray[i], args = list.argsArray[i] || [];
            if (op === OPS.save || op === OPS.paintFormXObjectBegin) {
                stack.push({...state, matrix:state.matrix.slice()});
                if (op === OPS.paintFormXObjectBegin && args[0]) state.matrix = multiply(state.matrix,args[0]);
            } else if (op === OPS.restore || op === OPS.paintFormXObjectEnd) state = stack.pop() || state;
            else if (op === OPS.transform) state.matrix = multiply(state.matrix,args);
            else if (op === OPS.setLineWidth) state.lineWidth = args[0];
            else if (op === OPS.setFillRGBColor) { state.color=rgbHex(args); state.solid=true; }
            else if (op === OPS.setFillGray) { state.color=rgbHex([args[0]*255,args[0]*255,args[0]*255]); state.solid=true; }
            else if (op === OPS.setFillCMYKColor) {
                state.color=rgbHex(args.slice(0,3).map(v=>255*(1-v)*(1-args[3]))); state.solid=true;
            } else if (op === OPS.setFillColorN || op === OPS.shadingFill) state.solid=false;
            else if (op === OPS.setTextRenderingMode) state.rendering=args[0];
            else if (op === OPS.setGState) {
                for (const [key,value] of args[0] || []) {
                    if (key === 'ca') state.alpha=value;
                    if (key === 'BM' && value !== 'source-over' && value !== 'Normal') state.solid=false;
                }
            } else if (op === OPS.constructPath) {
                let j=0;
                for (const p of args[0]) {
                    const coords=args[1];
                    if (p === OPS.moveTo) { cursor=point(state.matrix,coords[j++],coords[j++]); start=cursor; }
                    else if (p === OPS.lineTo) { const next=point(state.matrix,coords[j++],coords[j++]); segment(cursor,next); cursor=next; }
                    else if (p === OPS.rectangle) {
                        const x=coords[j++], y=coords[j++], w=coords[j++], h=coords[j++];
                        const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(p=>point(state.matrix,...p));
                        for(let k=0;k<4;k++) segment(pts[k],pts[(k+1)%4]);
                        rectangles.push(bounds(pts)); cursor=pts[0]; start=cursor;
                    } else if (p === OPS.closePath) { segment(cursor,start); cursor=start; }
                    else if (p === OPS.curveTo) { j+=4; cursor=point(state.matrix,coords[j++],coords[j++]); }
                    else if (p === OPS.curveTo2 || p === OPS.curveTo3) { j+=2; cursor=point(state.matrix,coords[j++],coords[j++]); }
                }
            } else if (strokeOps.has(op) || fillOps.has(op) || op === OPS.endPath) {
                if (strokeOps.has(op)) path.forEach(p=>addRule(...p));
                if (fillOps.has(op)) {
                    if(!rectangles.length && path.length===4 && path.every(([a,b])=>Math.abs(a[0]-b[0])<0.01 || Math.abs(a[1]-b[1])<0.01) &&
                        Math.hypot(path[0][0][0]-path[3][1][0],path[0][0][1]-path[3][1][1])<0.01) {
                        rectangles.push(bounds(path.map(segment=>segment[0])));
                    }
                    if(!rectangles.length && path.length) backgrounds.push({...bounds(path.flat()),solid:false,order:i});
                    for (const rect of rectangles) {
                        backgrounds.push({...rect,color:state.color,solid:state.solid && state.alpha===1,order:i});
                        const w=rect.right-rect.left, h=rect.top-rect.bottom;
                        if (h<=2 && w>3) rules.push({axis:'h',at:(rect.top+rect.bottom)/2,from:rect.left,to:rect.right,width:h});
                        if (w<=2 && h>3) rules.push({axis:'v',at:(rect.left+rect.right)/2,from:rect.bottom,to:rect.top,width:w});
                    }
                }
                path=[]; rectangles=[]; cursor=start=null;
            } else if ([OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject,OPS.paintSolidColorImageMask].includes(op)) {
                images.push(bounds([[0,0],[1,0],[1,1],[0,1]].map(p=>point(state.matrix,...p))));
            } else if ([OPS.showText,OPS.showSpacedText,OPS.nextLineShowText,OPS.nextLineSetSpacingShowText].includes(op)) {
                const glyphs = op===OPS.nextLineSetSpacingShowText ? args[2] : args[0];
                if (!Array.isArray(glyphs)) continue;
                const str = compact(glyphs.filter(g=>g && typeof g==='object').map(g=>g.unicode||'').join(''));
                if (str) paints.push({str,color:state.color,supported:state.solid && state.alpha===1 && state.rendering===0,order:i});
            }
        }
        const stream=paints.map(p=>p.str).join('');
        const lookup=[];
        paints.forEach(p=>{for(let j=0;j<p.str.length;j++) lookup.push(p);});
        return {rules, backgrounds, images, stream, lookup};
    }

    function findCell(box, rules) {
        const x=(box.left+box.right)/2, y=(box.top+box.bottom)/2;
        const h=rules.filter(r=>r.axis==='h' && r.from<=x && r.to>=x);
        const v=rules.filter(r=>r.axis==='v' && r.from<=y && r.to>=y);
        const lower=h.filter(r=>r.at<=y).sort((a,b)=>b.at-a.at)[0];
        const upper=h.filter(r=>r.at>y).sort((a,b)=>a.at-b.at)[0];
        const left=v.filter(r=>r.at<=x).sort((a,b)=>b.at-a.at)[0];
        const right=v.filter(r=>r.at>x).sort((a,b)=>a.at-b.at)[0];
        if (!lower || !upper || !left || !right) return null;
        // Require a closed rectangular cell; underlines and unrelated distant rules are insufficient.
        if (lower.from>left.at+1 || lower.to<right.at-1 || upper.from>left.at+1 || upper.to<right.at-1 ||
            left.from>lower.at+1 || left.to<upper.at-1 || right.from>lower.at+1 || right.to<upper.at-1) return null;
        return {left:left.at+left.width/2+0.5,right:right.at-right.width/2-0.5,bottom:lower.at+lower.width/2+0.5,top:upper.at-upper.width/2-0.5};
    }

    function group(items, styles, page, metadata) {
        const runs=[];
        let paintCursor=0;
        for(let index=0;index<items.length;index++) {
            const item=items[index];
            if (!item.str || !item.str.trim()) continue;
            const m=item.transform, size=Math.hypot(m[2],m[3]), horizontal=Math.hypot(m[0],m[1]);
            if (!size || !horizontal || !item.width) continue;
            const angle=Math.atan2(m[1],m[0]);
            const dir=[Math.cos(angle),Math.sin(angle)], normal=[-dir[1],dir[0]];
            const style=styles[item.fontName] || {};
            let font=null;
            try { if(page?.commonObjs?.has(item.fontName)) font=page.commonObjs.get(item.fontName); } catch (_) {}
            const fontName=font?.name || item.fontName;
            const bold=!!(font?.bold || font?.black || /bold|black|heavy|semibold/i.test(fontName));
            const italic=!!(font?.italic || /italic|oblique/i.test(fontName));
            const namedSerif=font?.isSerifFont || /times|tinos|cambria|georgia|notoserif|liberationserif/i.test(fontName);
            const family=namedSerif || (/serif/i.test(style.fontFamily) && !/sans/i.test(style.fontFamily)) ? 'serif' : 'sans-serif';
            const ascent=Number.isFinite(style.ascent) ? style.ascent : 0.8;
            const descent=Number.isFinite(style.descent) ? style.descent : -0.2;
            const at=(along,up)=>[m[4]+dir[0]*along+normal[0]*up,m[5]+dir[1]*along+normal[1]*up];
            const box=bounds([at(0,descent*size),at(item.width,descent*size),at(item.width,ascent*size),at(0,ascent*size)]);
            const cell=metadata ? findCell(box,metadata.rules) : null;
            const needle=compact(item.str);
            const found=metadata?.stream.indexOf(needle,paintCursor) ?? -1;
            const paint=found>=paintCursor && found-paintCursor<256 ? metadata.lookup.slice(found,found+needle.length) : [];
            if(paint.length) paintCursor=found+needle.length;
            const colors=new Set(paint.map(p=>p.color));
            const paintOrder=paint[0]?.order ?? Infinity;
            let background='#ffffff', blocked='';
            for(const bg of metadata?.backgrounds || []) {
                if (bg.order<paintOrder && intersects(bg,box)) {
                    if(bg.solid && contains(bg,box)) background=bg.color;
                    else blocked='Vùng chữ có nền hoặc hiệu ứng phức tạp.';
                }
            }
            if(metadata?.images.some(img=>intersects(img,box))) blocked='Vùng chữ nằm trên ảnh; chưa hỗ trợ thay chữ giữ nguyên nền ảnh.';
            if(style.vertical || font?.isType3Font || Math.abs(m[0]*m[2]+m[1]*m[3])/(size*horizontal)>0.01) blocked='Chữ dọc, font Type 3 hoặc chữ xiên chưa được hỗ trợ.';
            if (paint.some(p=>!p.supported) || colors.size>1) blocked='Vùng chữ có nhiều màu hoặc hiệu ứng; cần tách nhỏ hơn trước khi sửa.';
            const run={id:'run_'+index, indices:[index], text:item.str, x:m[4],y:m[5],size,angle:angle*180/Math.PI,
                dir,normal,width:item.width,height:(ascent-descent)*size,ascent,descent,box,cell,bold,italic,underline:false,
                fontName:item.fontName,sourceFontName:fontName,fontFamily:family,color:colors.size===1 ? paint[0].color : '#000000',
                colorKnown:paint.length>0,background,blocked,hasEOL:item.hasEOL,sourceFont:font};
            const prev=runs[runs.length-1];
            if(prev && !prev.hasEOL && prev.fontName===run.fontName && prev.bold===bold && prev.italic===italic &&
                prev.color===run.color && prev.background===run.background && prev.blocked===run.blocked && Math.abs(prev.size-size)<0.05 && Math.abs(prev.angle-run.angle)<0.1 &&
                JSON.stringify(prev.cell)===JSON.stringify(cell)) {
                const dx=run.x-prev.x, dy=run.y-prev.y;
                const across=dx*dir[0]+dy*dir[1], offset=Math.abs(dx*normal[0]+dy*normal[1]);
                const gap=across-prev.width;
                if(offset<Math.max(0.15,size*0.03) && gap>=-0.1 && gap<=size*0.18) {
                    prev.text+=(gap>size*0.08 && !/\s$/.test(prev.text) && !/^\s/.test(run.text) ? ' ' : '')+run.text;
                    prev.width=across+run.width;
                    prev.box={left:Math.min(prev.box.left,box.left),right:Math.max(prev.box.right,box.right),bottom:Math.min(prev.box.bottom,box.bottom),top:Math.max(prev.box.top,box.top)};
                    prev.indices.push(index); prev.hasEOL=run.hasEOL;
                    continue;
                }
            }
            runs.push(run);
        }
        for(const run of runs) {
            if(Math.abs(run.angle)<0.1) {
                const underlines=(metadata?.rules || []).filter(r=>r.axis==='h' && r.at<run.y-run.size*0.03 && r.at>run.y-run.size*0.35 &&
                    Math.abs(r.from-run.x)<run.size*0.25 && Math.abs(r.to-(run.x+run.width))<run.size*0.5);
                run.underline=underlines.length>0;
                const crossing=(metadata?.rules || []).some(r=>!underlines.includes(r) && (r.axis==='h'
                    ? r.at>run.box.bottom && r.at<run.box.top && r.from<run.box.right && r.to>run.box.left
                    : r.at>run.box.left && r.at<run.box.right && r.from<run.box.top && r.to>run.box.bottom));
                if(crossing) run.blocked='Vùng chữ chồng lên đường vector; chưa hỗ trợ thay chữ an toàn tại đây.';
            }
            run.maxWidth=run.width;
            if(run.cell && Math.abs(run.angle)<0.1) {
                run.maxWidth=Math.max(run.width,run.cell.right-run.x);
                for(const other of runs) {
                    if(other!==run && Math.abs(other.y-run.y)<run.size*0.35 && other.x>run.x && other.x<run.x+run.maxWidth) run.maxWidth=Math.max(run.width,other.x-run.x-0.5);
                }
            }
            if(run.cell && !contains(run.cell,run.box)) run.blocked='Chữ chạm đường biên ô; chưa xác định được vùng sửa an toàn.';
        }
        return runs;
    }

    function makeEdit(run, values) {
        return {id:run.id,layoutVersion:2,newText:values.text,originalText:run.text,
            x:run.x,y:run.y,size:values.size,originalSize:run.size,width:run.width,height:run.height,
            angle:run.angle,ascent:run.ascent,descent:run.descent,maxWidth:run.maxWidth,
            mask:{...run.box},cell:run.cell ? {...run.cell}:null,background:run.background,
            sourceFontKey:run.sourceFontKey,sourceFontName:run.sourceFontName,
            fontFamily:values.fontFamily,originalFamily:run.fontFamily,color:values.color,
            bold:values.bold,italic:values.italic,underline:values.underline,align:values.align,overflow:values.overflow};
    }

    function layout(edit, font) {
        if(/\r|\n/.test(edit.newText)) throw new Error('Mỗi vùng chỉ sửa một dòng. Hãy chọn riêng từng dòng trong bảng.');
        const requested=Number(edit.size);
        if(!Number.isFinite(requested) || requested<1 || requested>300) throw new Error('Cỡ chữ phải từ 1 đến 300 pt.');
        const originalWidth=font.widthOfTextAtSize(edit.originalText, edit.originalSize);
        const scale=edit.fontFamily==='original' && originalWidth>0 ? edit.width/originalWidth : 1;
        let size=requested;
        let width=edit.newText ? font.widthOfTextAtSize(edit.newText,size)*scale : 0;
        const limit=edit.maxWidth || edit.width;
        if(width>limit+0.05) {
            if(edit.overflow!=='shrink') throw new Error('Chữ vượt vùng gốc. Chọn “Thu nhỏ để vừa” hoặc rút ngắn nội dung.');
            size*=limit/width; width=limit;
            if(size<Math.max(1,requested*0.6)) throw new Error('Nội dung quá dài, cần thu nhỏ dưới 60% cỡ chữ. Hãy rút ngắn nội dung.');
        }
        // Preserve the PDF baseline; do not derive it from a block's bounding-box top.
        const offset=edit.align==='right' ? limit-width : edit.align==='center' ? (limit-width)/2 : 0;
        const radians=(edit.angle||0)*Math.PI/180, dir=[Math.cos(radians),Math.sin(radians)];
        const x=edit.x+dir[0]*offset, y=edit.y+dir[1]*offset;
        const normal=[-dir[1],dir[0]];
        const ascent=font.heightAtSize ? font.heightAtSize(size,{descender:false}) : edit.ascent*size;
        const descent=font.heightAtSize ? Math.max(0,font.heightAtSize(size)-ascent) : -edit.descent*size;
        const at=(a,h)=>[x+dir[0]*a+normal[0]*h,y+dir[1]*a+normal[1]*h];
        const drawn=bounds([at(0,-descent),at(width,-descent),at(width,ascent),at(0,ascent)]);
        if(edit.cell && edit.newText && !contains(edit.cell,drawn)) throw new Error('Cỡ chữ hoặc vị trí mới chạm đường biên ô. Hãy giảm cỡ chữ.');
        return {x,y,size,width,scale,angle:edit.angle||0};
    }

    function maskRect(edit) {
        const rect={...edit.mask};
        if(edit.cell) {
            rect.left=Math.max(rect.left,edit.cell.left);rect.right=Math.min(rect.right,edit.cell.right);
            rect.bottom=Math.max(rect.bottom,edit.cell.bottom);rect.top=Math.min(rect.top,edit.cell.top);
        }
        return rect;
    }

    function drawPDF(page, edit, font, PDFLib) {
        const plan=layout(edit,font), rect=maskRect(edit), radians=plan.angle*Math.PI/180;
        const {rgb:color,degrees}=PDFLib;
        if(Math.abs(plan.angle%360)>0.01) {
            page.drawRectangle({x:edit.x-Math.sin(radians)*edit.descent*edit.originalSize,y:edit.y+Math.cos(radians)*edit.descent*edit.originalSize,
                width:edit.width,height:edit.height,rotate:degrees(plan.angle),color:color(...rgb(edit.background))});
        } else page.drawRectangle({x:rect.left,y:rect.bottom,width:rect.right-rect.left,height:rect.top-rect.bottom,color:color(...rgb(edit.background))});
        if(!edit.newText) return plan;
        page.pushOperators(PDFLib.pushGraphicsState(),PDFLib.concatTransformationMatrix(
            Math.cos(radians)*plan.scale,Math.sin(radians)*plan.scale,-Math.sin(radians),Math.cos(radians),plan.x,plan.y));
        page.drawText(edit.newText,{x:0,y:0,font,size:plan.size,color:color(...rgb(edit.color))});
        if(edit.underline) page.drawLine({start:{x:0,y:-plan.size*0.12},end:{x:plan.width/plan.scale,y:-plan.size*0.12},thickness:Math.max(0.4,plan.size*0.05),color:color(...rgb(edit.color))});
        page.pushOperators(PDFLib.popGraphicsState());
        return plan;
    }

    function drawCanvas(ctx, viewport, edit, plan, family) {
        const rect=maskRect(edit), angle=plan.angle*Math.PI/180;
        ctx.save();
        ctx.transform(...viewport.transform);
        ctx.fillStyle=edit.background;
        if(Math.abs(plan.angle%360)>0.01) {
            ctx.save();ctx.translate(edit.x,edit.y);ctx.rotate(angle);
            ctx.fillRect(0,edit.descent*edit.originalSize,edit.width,edit.height);ctx.restore();
        } else ctx.fillRect(rect.left,rect.bottom,rect.right-rect.left,rect.top-rect.bottom);
        if(edit.newText) {
            ctx.translate(plan.x,plan.y);ctx.rotate(angle);ctx.scale(1,-1);
            ctx.font=`${edit.italic?'italic ':''}${edit.bold?'bold ':''}${plan.size}px ${family}`;
            ctx.textBaseline='alphabetic';ctx.fillStyle=edit.color;
            const measured=ctx.measureText(edit.newText).width;
            ctx.save();ctx.scale(measured ? plan.width/measured : 1,1);ctx.fillText(edit.newText,0,0);ctx.restore();
            if(edit.underline) {ctx.strokeStyle=edit.color;ctx.lineWidth=Math.max(0.4,plan.size*0.05);ctx.beginPath();ctx.moveTo(0,plan.size*0.12);ctx.lineTo(plan.width,plan.size*0.12);ctx.stroke();}
        }
        ctx.restore();
    }
    return {analyzeOperators,findCell,group,makeEdit,layout,maskRect,drawPDF,drawCanvas,point,multiply,rgb};
});
