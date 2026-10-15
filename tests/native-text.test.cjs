const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const PDF=require('../pdf-lib.min.js');
const PDFJS=require('../pdf.min.js');
const fontkit=require('../fontkit.umd.min.js');
const Layout=require('../pdf-text-layout.js');
PDFJS.GlobalWorkerOptions.workerSrc=path.resolve(__dirname,'../pdf.worker.min.js');
let editor;
before(async()=>{
    const {NativeTextEditor}=await import('../pdf-native-text.mjs');
    const fonts=[];
    for(const family of ['Tinos','Noto Sans']) for(const [variant,bold,italic] of [['Regular',false,false],['Bold',true,false],['Italic',false,true],['BoldItalic',true,true]]) {
        const file=family==='Tinos' ? 'fonts/Tinos-'+variant+'.ttf' : 'NotoSans-'+variant+'.ttf';
        fonts.push({family,bold,italic,bytes:new Uint8Array(fs.readFileSync(path.resolve(__dirname,'..',file)))});
    }
    editor=await new NativeTextEditor().init(fonts);
});
async function fixture({rotation=0,crop=false,mixed=false}={}) {
    const doc=await PDF.PDFDocument.create();doc.registerFontkit(fontkit);
    const font=await doc.embedFont(fs.readFileSync(path.resolve(__dirname,'../fonts/Tinos-Regular.ttf')));
    const bold=await doc.embedFont(fs.readFileSync(path.resolve(__dirname,'../fonts/Tinos-Bold.ttf')));
    const p=doc.addPage([600,800]);p.setRotation(PDF.degrees(rotation));
    if(crop)p.setCropBox(20,30,550,730);
    p.drawRectangle({x:40,y:600,width:510,height:65,color:PDF.rgb(1,.9,.6)});
    for(const [text,y] of [['RÃNH KM1+260.65',646],['RÃNH KM1+260.65',616]]) {
        p.drawText(text,{x:50,y,size:12,font,color:PDF.rgb(.8,0,0)});
        if(mixed)p.drawText(' Bold',{x:160,y,size:12,font:bold});
        p.drawText('Column unchanged',{x:310,y,size:12,font});
    }
    for(const y of [600,630,665])p.drawLine({start:{x:40,y},end:{x:550,y},thickness:.5});
    for(const x of [40,290,550])p.drawLine({start:{x,y:600},end:{x,y:665},thickness:.5});
    const bytes=await doc.save();
    const reader=await PDFJS.getDocument({data:bytes.slice(),fontExtraProperties:true,verbosity:0}).promise;
    const page=await reader.getPage(1),content=await page.getTextContent();
    const runs=Layout.group(content.items,content.styles,page,Layout.analyzeOperators(await page.getOperatorList(),PDFJS.OPS));
    await reader.destroy();
    return {bytes,runs};
}
function editFor(run,text,extra={}) {
    const edit=Layout.makeEdit(run,{text,size:run.size,fontFamily:'original',color:run.color,bold:run.bold,italic:run.italic,underline:run.underline,align:'left',overflow:'reject',...extra});
    return {...edit,nativeSize:extra.size || run.size,nativeFamily:null};
}
async function extract(bytes) {
    const reader=await PDFJS.getDocument({data:bytes.slice(),verbosity:0}).promise;
    try {const page=await reader.getPage(1);return (await page.getTextContent()).items.filter(i=>i.str);}
    finally {await reader.destroy();}
}
for(const rotation of [0,90,180,270])test('native replacement preserves baseline and duplicate label at rotation '+rotation,async()=>{
    const {bytes,runs}=await fixture({rotation});
    const run=runs.find(r=>r.text==='RÃNH KM1+260.65' && r.y===646);
    const result=await editor.rewrite(bytes,[{pageIndex:0,edits:[editFor(run,'RÃNH KM1+299.99')]}]);
    const items=await extract(result.bytes);
    assert.equal(items.filter(i=>i.str==='RÃNH KM1+260.65').length,1,'old text only remains on untouched second row');
    const changed=items.find(i=>i.str==='RÃNH KM1+299.99');assert.ok(changed);
    assert.ok(Math.abs(changed.transform[4]-50)<.1);assert.ok(Math.abs(changed.transform[5]-646)<.1);
    assert.equal(items.filter(i=>i.str==='Column unchanged').length,2);
    assert.equal(result.operations.length,1,'reused engine must not retain previous splice plans');
});
test('native editor handles nonzero CropBox without shifting source coordinates',async()=>{
    const {bytes,runs}=await fixture({crop:true});const run=runs.find(r=>r.text==='RÃNH KM1+260.65' && r.y===646);
    const result=await editor.rewrite(bytes,[{pageIndex:0,edits:[editFor(run,'ĐƯỜNG MỚI')]}]);
    const changed=(await extract(result.bytes)).find(i=>i.str==='ĐƯỜNG MỚI');assert.ok(changed);
    assert.ok(Math.abs(changed.transform[5]-646)<.1);
});
test('native font substitution and explicit shrink preserve original baseline',async()=>{
    const {bytes,runs}=await fixture();const run=runs.find(r=>r.y===646 && r.text.startsWith('RÃNH'));
    const edit=editFor(run,'A'.repeat(35),{size:10,overflow:'shrink'});edit.nativeSize=10;edit.nativeFamily='Tinos';
    const result=await editor.rewrite(bytes,[{pageIndex:0,edits:[edit]}]);
    const changed=(await extract(result.bytes)).find(i=>i.str==='A'.repeat(35));assert.ok(changed);
    assert.ok(Math.abs(changed.transform[5]-646)<.1);
});
test('native deletion removes current text instead of adding a white rectangle',async()=>{
    const {bytes,runs}=await fixture();const run=runs.find(r=>r.y===646 && r.text.startsWith('RÃNH'));
    const result=await editor.rewrite(bytes,[{pageIndex:0,edits:[editFor(run,'')]}]);
    assert.equal((await extract(result.bytes)).filter(i=>i.str==='RÃNH KM1+260.65').length,1);
});
test('multiple native edits survive save and leave both neighboring columns intact',async()=>{
    const {bytes,runs}=await fixture();const rows=runs.filter(r=>r.text.startsWith('RÃNH'));
    const edits=rows.map((r,i)=>editFor(r,'RÃNH MỚI '+i));
    const result=await editor.rewrite(bytes,[{pageIndex:0,edits}]);const items=await extract(result.bytes);
    assert.ok(items.some(i=>i.str==='RÃNH MỚI 0'));assert.ok(items.some(i=>i.str==='RÃNH MỚI 1'));
    assert.equal(items.filter(i=>i.str==='RÃNH KM1+260.65').length,0);
    assert.equal(items.filter(i=>i.str==='Column unchanged').length,2);
});
test('overflow fails before a replacement PDF is returned',async()=>{
    const {bytes,runs}=await fixture();const run=runs.find(r=>r.y===646 && r.text.startsWith('RÃNH'));
    await assert.rejects(()=>editor.rewrite(bytes,[{pageIndex:0,edits:[editFor(run,'DÀI '.repeat(60))]}]),/xuống dòng|vượt/);
    const clean=await editor.rewrite(bytes,[{pageIndex:0,edits:[editFor(run,'RÃNH AN TOÀN')]}]);
    assert.ok((await extract(clean.bytes)).some(i=>i.str==='RÃNH AN TOÀN'),'failure must not contaminate next operation');
});
test('duplicated pages with shared source resources accept independent edits',async()=>{
    const {bytes,runs}=await fixture();const run=runs.find(r=>r.y===646 && r.text.startsWith('RÃNH'));
    const doc=await PDF.PDFDocument.load(bytes);
    const [copy]=await doc.copyPages(doc,[0]);doc.addPage(copy);
    const result=await editor.rewrite(await doc.save(),[
        {pageIndex:0,edits:[editFor(run,'BẢN CHÍNH')]},
        {pageIndex:1,edits:[editFor(run,'BẢN SAO')]}
    ]);
    const reader=await PDFJS.getDocument({data:result.bytes.slice(),verbosity:0}).promise;
    try {
        const texts=[];for(let n=1;n<=2;n++)texts.push((await (await reader.getPage(n)).getTextContent()).items.map(i=>i.str).join(' '));
        assert.ok(texts[0].includes('BẢN CHÍNH') && !texts[0].includes('BẢN SAO'));
        assert.ok(texts[1].includes('BẢN SAO') && !texts[1].includes('BẢN CHÍNH'));
    } finally {await reader.destroy();}
});
test('wrong coordinates do not replace another occurrence of identical text',async()=>{
    const {bytes,runs}=await fixture();const run=runs.find(r=>r.y===646 && r.text.startsWith('RÃNH'));
    const edit=editFor(run,'SAI VỊ TRÍ');edit.y+=10;
    await assert.rejects(()=>editor.rewrite(bytes,[{pageIndex:0,edits:[edit]}]),/Chưa xác định an toàn/);
});

test('native rich same-line edit preserves neighboring font runs when safely localized',async()=>{
    const doc=await PDF.PDFDocument.create();
    doc.registerFontkit(fontkit);
    const font=await doc.embedFont(fs.readFileSync(path.resolve(__dirname,'../fonts/Tinos-Regular.ttf')));
    const bold=await doc.embedFont(fs.readFileSync(path.resolve(__dirname,'../fonts/Tinos-Bold.ttf')));
    const page=doc.addPage([600,800]);
    const head='TUYẾN ĐƯỜNG ',tail='KM0+250';
    const x=60,y=600,size=12;
    page.drawText(head,{x,y,size,font});
    page.drawText(tail,{x:x+font.widthOfTextAtSize(head,size),y,size,font:bold});
    const bytes=await doc.save();
    const reader=await PDFJS.getDocument({data:bytes.slice(),verbosity:0,fontExtraProperties:true}).promise;
    let runs;
    try {
        const pdfPage=await reader.getPage(1),content=await pdfPage.getTextContent();
        runs=Layout.group(content.items,content.styles,pdfPage,
            Layout.analyzeOperators(await pdfPage.getOperatorList(),PDFJS.OPS));
    }finally{await reader.destroy();}
    const selected=runs.find(r=>r.text.includes('KM0+250'));
    assert.ok(selected,'PDF.js must expose the selected styled text');
    const result=await editor.rewrite(bytes,[{pageIndex:0,
        edits:[editFor(selected,'KM0+350')]}]);
    const items=await extract(result.bytes);
    const text=items.map(i=>i.str).join(' ');
    assert.ok(text.includes('TUYẾN ĐƯỜNG'),'neighbor text must remain untouched');
    assert.ok(text.includes('KM0+350'),'new text must be present');
    assert.ok(!text.includes('KM0+250'),'old text must be replaced, not painted over');
});
test('native editor rejects a PDF with a signature ByteRange before processing',async()=>{
    const {bytes,runs}=await fixture();
    const marked=new Uint8Array(bytes.length+40);
    marked.set(bytes);
    marked.set(Buffer.from('\n/ByteRange [0 1 2 3]\n'),bytes.length);
    const r=runs.find(run=>run.y===646&&run.text.startsWith('RÃNH'));
    await assert.rejects(()=>editor.rewrite(marked,[{pageIndex:0,
        edits:[editFor(r,'CHỮ MỚI')]}]),/chữ ký số/);
});
