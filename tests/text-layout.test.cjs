const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const PDFLib=require('../pdf-lib.min.js');
const PDFJS=require('../pdf.min.js');
const Layout=require('../pdf-text-layout.js');
PDFJS.GlobalWorkerOptions.workerSrc=path.resolve(__dirname,'../pdf.worker.min.js');

async function fixture({rows=1,mixed=false,color=false,background=false,rotation=0,textAngle=0,filledRules=false}={}) {
    const doc=await PDFLib.PDFDocument.create();
    const normal=await doc.embedFont(PDFLib.StandardFonts.TimesRoman);
    const bold=await doc.embedFont(PDFLib.StandardFonts.TimesRomanBold);
    const page=doc.addPage([600,800]);page.setRotation(PDFLib.degrees(rotation));
    if(background) page.drawRectangle({x:40,y:620,width:510,height:40,color:PDFLib.rgb(1,0.9,0.6)});
    for(let r=0;r<rows;r++) {
        page.drawText('Cell '+r,{x:50,y:646-r*22,size:12,font:normal,rotate:PDFLib.degrees(textAngle),color:color?PDFLib.rgb(1,0,0):PDFLib.rgb(0,0,0)});
        if(mixed) page.drawText('Bold',{x:90,y:646-r*22,size:12,font:bold});
        page.drawText('Column '+r,{x:300,y:646-r*22,size:12,font:normal});
    }
    if(!textAngle) {
        for(let r=0;r<=rows;r++) {
            const y=638-r*22+22;
            if(filledRules) page.drawRectangle({x:40,y:y-0.25,width:510,height:0.5,color:PDFLib.rgb(0,0,0)});
            else page.drawLine({start:{x:40,y},end:{x:550,y},thickness:0.5});
        }
        for(const x of [40,280,550]) page.drawLine({start:{x,y:660-rows*22},end:{x,y:660},thickness:0.5});
    }
    const bytes=await doc.save();
    const reader=await PDFJS.getDocument({verbosity:0,data:bytes.slice(),fontExtraProperties:true}).promise;
    const source=await reader.getPage(1), content=await source.getTextContent();
    const metadata=Layout.analyzeOperators(await source.getOperatorList(),PDFJS.OPS);
    const runs=Layout.group(content.items,content.styles,source,metadata);
    const outputDoc=await PDFLib.PDFDocument.load(bytes);
    const outputNormal=await outputDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    return {doc:outputDoc,page:outputDoc.getPage(0),normal:outputNormal,bold,bytes,reader,source,content,metadata,runs};
}
function values(run,override={}) {
    return {text:'Edited',size:run.size,fontFamily:'original',color:run.color,bold:run.bold,italic:run.italic,underline:false,align:'left',overflow:'reject',...override};
}

test('six table rows stay separate; closed cells and original baselines are detected',async()=>{
    const f=await fixture({rows:6});
    assert.equal(f.runs.filter(r=>r.text.startsWith('Cell')).length,6);
    for(let r=0;r<6;r++) {
        const run=f.runs.find(x=>x.text==='Cell '+r);
        assert.ok(run.cell);assert.equal(run.y,646-r*22);assert.equal(run.blocked,'');
        assert.ok(run.cell.bottom<run.box.bottom && run.cell.top>run.box.top);
    }
    await f.reader.destroy();
});

test('adjacent normal/bold runs retain distinct formatting',async()=>{
    const f=await fixture({mixed:true});
    assert.equal(f.runs.find(r=>r.text==='Cell 0').bold,false);
    assert.equal(f.runs.find(r=>r.text==='Bold').bold,true);
    assert.ok(!f.runs.some(r=>r.text.includes('Cell 0Bold')));
    await f.reader.destroy();
});

test('nearby separate columns are not merged just because they share a baseline',()=>{
    const items=[{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]},
        {str:'B',fontName:'f',width:20,transform:[12,0,0,12,90,700]}];
    const runs=Layout.group(items,{f:{fontFamily:'serif'}},null,null);
    assert.equal(runs.length,2);
});

test('a fragmented same-font word is joined without collapsing spaces',()=>{
    const items=[{str:'AB  ',fontName:'f',width:20,transform:[12,0,0,12,50,700]},
        {str:'CD',fontName:'f',width:20,transform:[12,0,0,12,70,700]}];
    const runs=Layout.group(items,{f:{fontFamily:'serif'}},null,null);
    assert.equal(runs.length,1);assert.equal(runs[0].text,'AB  CD');
});

test('paint operator colors are retained instead of defaulting every edit to black',async()=>{
    const f=await fixture({color:true});
    assert.equal(f.runs.find(r=>r.text==='Cell 0').color,'#ff0000');
    assert.equal(f.runs.find(r=>r.text==='Column 0').color,'#000000');
    assert.equal(f.runs.find(r=>r.text==='Cell 0').colorKnown,true);
    await f.reader.destroy();
});

test('solid cell background color is retained',async()=>{
    const f=await fixture({background:true});
    assert.equal(f.runs.find(r=>r.text==='Cell 0').background,'#ffe699');
    await f.reader.destroy();
});

test('thin filled rectangles are recognized as table rules',async()=>{
    const f=await fixture({filledRules:true});
    assert.ok(f.runs.find(r=>r.text==='Cell 0').cell);
    await f.reader.destroy();
});

for(const rotation of [0,90,180,270]) {
    test(`PDF /Rotate ${rotation}: edited text keeps the ORIGINAL PDF-space baseline`,async()=>{
        const f=await fixture({rotation});
        const run=f.runs.find(r=>r.text==='Cell 0');
        const edit=Layout.makeEdit(run,values(run));
        const plan=Layout.drawPDF(f.page,edit,f.normal,PDFLib);
        assert.equal(plan.x,run.x);assert.equal(plan.y,run.y);assert.equal(plan.angle,0);
        const reader=await PDFJS.getDocument({verbosity:0,data:await f.doc.save()}).promise;
        const page=await reader.getPage(1), content=await page.getTextContent();
        const written=content.items.find(i=>i.str==='Edited');
        assert.ok(written);assert.ok(Math.abs(written.transform[4]-run.x)<0.001);assert.ok(Math.abs(written.transform[5]-run.y)<0.001);
        assert.equal(page.rotate,rotation);
        await reader.destroy();await f.reader.destroy();
    });
}

for(const angle of [90,180,270,45]) {
    test(`text angle ${angle}: original writing direction survives independently of page rotation`,async()=>{
        const f=await fixture({textAngle:angle});
        const run=f.runs.find(r=>r.text==='Cell 0');
        const edit=Layout.makeEdit(run,values(run,{text:'Edit'}));
        Layout.drawPDF(f.page,edit,f.normal,PDFLib);
        const reader=await PDFJS.getDocument({verbosity:0,data:await f.doc.save()}).promise;
        const content=await (await reader.getPage(1)).getTextContent();
        const written=content.items.find(i=>i.str==='Edit');assert.ok(written);
        const expected=angle*Math.PI/180;
        assert.ok(Math.abs(Math.cos(Math.atan2(written.transform[1],written.transform[0]))-Math.cos(expected))<1e-5);
        assert.ok(Math.abs(written.transform[4]-run.x)<0.001);assert.ok(Math.abs(written.transform[5]-run.y)<0.001);
        await reader.destroy();await f.reader.destroy();
    });
}

test('long replacement is rejected until the user explicitly chooses shrink',async()=>{
    const f=await fixture();const run=f.runs.find(r=>r.text==='Cell 0');
    const edit=Layout.makeEdit(run,values(run,{text:'A'.repeat(24)}));
    edit.maxWidth=160;
    assert.throws(()=>Layout.layout(edit,f.normal),/vượt vùng/);
    edit.overflow='shrink';
    const plan=Layout.layout(edit,f.normal);
    assert.ok(plan.size<edit.size);assert.ok(plan.width<=edit.maxWidth);
    assert.equal(plan.y,run.y);
    await f.reader.destroy();
});

test('excessive shrinking is refused instead of producing unreadable text',async()=>{
    const f=await fixture();const run=f.runs[0];
    const edit=Layout.makeEdit(run,values(run,{text:'A'.repeat(300),overflow:'shrink'}));
    assert.throws(()=>Layout.layout(edit,f.normal),/60%/);
    await f.reader.destroy();
});

test('newlines are rejected instead of reflowing rows',async()=>{
    const f=await fixture();const edit=Layout.makeEdit(f.runs[0],values(f.runs[0],{text:'First\nSecond'}));
    assert.throws(()=>Layout.layout(edit,f.normal),/một dòng/);await f.reader.destroy();
});

test('mask uses original glyph bounds and cannot touch table rules',async()=>{
    const f=await fixture();const run=f.runs[0];const edit=Layout.makeEdit(run,values(run));
    const rect=Layout.maskRect(edit);
    assert.deepEqual(rect,run.box);
    assert.ok(rect.top<660-0.25);assert.ok(rect.bottom>638+0.25);
    await f.reader.destroy();
});

test('large replacement font cannot extend across the row border',async()=>{
    const f=await fixture();const edit=Layout.makeEdit(f.runs[0],values(f.runs[0],{size:50,text:'A'}));
    assert.throws(()=>Layout.layout(edit,f.normal),/biên ô/);await f.reader.destroy();
});

test('replacement inside same cell cannot grow into the next differently formatted run',async()=>{
    const f=await fixture({mixed:true});const run=f.runs.find(r=>r.text==='Cell 0');
    assert.ok(run.x+run.maxWidth<=90);await f.reader.destroy();
});

test('image behind a text run is conservatively blocked',()=>{
    const metadata={rules:[],backgrounds:[],images:[{left:0,right:600,bottom:0,top:800}],stream:'A',lookup:[{color:'#000000',supported:true,order:1}]};
    const [run]=Layout.group([{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]}],{},null,metadata);
    assert.match(run.blocked,/trên ảnh/);
});

test('preview and PDF use the same layout plan and point transformation',async()=>{
    const f=await fixture();const edit=Layout.makeEdit(f.runs[0],values(f.runs[0],{align:'right'}));
    const plan=Layout.layout(edit,f.normal),calls=[];
    const ctx=new Proxy({measureText:()=>({width:plan.width})},{get:(target,k)=>target[k] || ((...args)=>calls.push([k,...args])),set:(t,k,v)=>(t[k]=v,true)});
    Layout.drawCanvas(ctx,f.source.getViewport({scale:2,rotation:90}),edit,plan,'serif');
    assert.ok(calls.some(c=>c[0]==='translate' && c[1]===plan.x && c[2]===plan.y));
    assert.ok(calls.some(c=>c[0]==='fillText' && c[1]==='Edited'));
    await f.reader.destroy();
});

test('embedded serif font name takes precedence over PDF.js generic sans fallback',()=>{
    const page={commonObjs:{has:()=>true,get:()=>({name:'Tinos-Regular'})}};
    const [run]=Layout.group([{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]}],{f:{fontFamily:'sans-serif'}},page,null);
    assert.equal(run.fontFamily,'serif');
});

test('short underline is preserved without mistaking a full table border for an underline',()=>{
    const metadata={rules:[{axis:'h',at:699,from:50,to:70,width:.5}],backgrounds:[],images:[],stream:'A',lookup:[{color:'#000000',supported:true,order:1}]};
    const [run]=Layout.group([{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]}],{},null,metadata);
    assert.equal(run.underline,true);assert.equal(run.blocked,'');
});

test('a vector line crossing the glyph area blocks unsafe masking',()=>{
    const metadata={rules:[{axis:'v',at:60,from:690,to:720,width:.5}],backgrounds:[],images:[],stream:'A',lookup:[{color:'#000000',supported:true,order:1}]};
    const [run]=Layout.group([{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]}],{},null,metadata);
    assert.match(run.blocked,/vector/);
});

test('mixed/patterned background intersecting glyph area blocks unsafe replacement',()=>{
    const metadata={rules:[],backgrounds:[{left:45,right:60,bottom:690,top:720,solid:false,order:0}],images:[],stream:'A',lookup:[{color:'#000000',supported:true,order:1}]};
    const [run]=Layout.group([{str:'A',fontName:'f',width:20,transform:[12,0,0,12,50,700]}],{},null,metadata);
    assert.match(run.blocked,/phức tạp/);
});
