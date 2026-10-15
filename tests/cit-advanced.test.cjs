const test = require('node:test');
const assert = require('node:assert/strict');
const PDFLib = require('../pdf-lib.min.js');
const {execute,ptPerMm} = require('../cit-advanced-core.js');
const {PDFDocument,PDFName} = PDFLib;
async function fixture(widths=[200,220,240,260]) {
  const doc=await PDFDocument.create();
  for (const w of widths) doc.addPage([w,300]);
  return {name:'original.pdf',bytes:await doc.save()};
}
async function read(result){return PDFDocument.load(result.bytes,{updateMetadata:false});}
function widths(doc){return doc.getPages().map(p=>p.getSize().width);}
const run=async (act,data,params)=>execute(PDFLib,act,Array.isArray(data)?data:[data],params);

test('CIT reverse copies page content in reverse order',async()=>{
 const source=await fixture();
 const output=await read(await run('reverse',source));
 assert.deepEqual(widths(output),[260,240,220,200]);
});
test('CIT odd page filter keeps pages 1 and 3',async()=>{
 const output=await read(await run('odd',await fixture()));
 assert.deepEqual(widths(output),[200,240]);
});
test('CIT even page filter keeps pages 2 and 4',async()=>{
 const output=await read(await run('even',await fixture()));
 assert.deepEqual(widths(output),[220,260]);
});
test('CIT even with one-page document refuses empty output',async()=>{
 await assert.rejects(run('even',await fixture([200])),/Không có trang/);
});
test('CIT interleave combines exactly two inputs in alternating order',async()=>{
 const a=await fixture([200,220]),b=await fixture([240,260,280]);
 const output=await read(await run('interleave',[a,b]));
 assert.deepEqual(widths(output),[200,240,220,260,280]);
});
test('CIT interleave refuses a single input',async()=>{
 await assert.rejects(run('interleave',await fixture()),/hai PDF/);
});
test('CIT crop respects millimeters and page dimensions',async()=>{
 const d=await read(await run('crop',await fixture([200]),{left:5,right:10,top:2,bottom:3}));
 const b=d.getPages()[0].getCropBox();
 assert.ok(Math.abs(b.width-(200-15*ptPerMm))<0.1);
 assert.ok(Math.abs(b.height-(300-5*ptPerMm))<0.1);
});
test('CIT crop rejects dimensions that would erase the visible page',async()=>{
 await assert.rejects(run('crop',await fixture([200]),{left:100,right:100,top:0,bottom:0}),/Cắt lề/);
});
test('CIT inspect reports all page metrics without rewriting the source',async()=>{
 const r=await run('inspect',await fixture([210,260]));
 assert.equal(r.info.pageCount,2);
 assert.equal(r.info.pages[0].widthPt,210);
 assert.equal(r.info.pages[1].widthPt,260);
 assert.equal(r.bytes,undefined);
});
test('CIT edit metadata persists Vietnamese Unicode',async()=>{
 const out=await read(await run('metadata',await fixture([200]),
   {title:'Hồ sơ cầu đường',author:'HDV',subject:'Bình đồ',creator:'Civil 3D',keywords:'cầu,đường'}));
 assert.equal(out.getTitle(),'Hồ sơ cầu đường');
 assert.equal(out.getAuthor(),'HDV');
 assert.match(out.getKeywords(),/cầu/);
});
test('CIT remove metadata clears title, author and subject',async()=>{
 const doc=await PDFDocument.create(); doc.addPage();
 doc.setTitle('Private title');doc.setAuthor('Private author');
 const f={name:'meta.pdf',bytes:await doc.save()};
 const r=await read(await run('remove-metadata',f));
 assert.ok(!r.getTitle()||r.getTitle()==='');
 assert.ok(!r.getAuthor()||r.getAuthor()==='');
});
test('CIT remove annotations retains PDF page',async()=>{
 const doc=await PDFDocument.create();
 const p=doc.addPage([200,300]);
 const note=doc.context.obj({Type:'Annot',Subtype:'Text',Rect:[20,30,70,80],Contents:'note'});
 const ref=doc.context.register(note);
 p.node.set(PDFName.of('Annots'),doc.context.obj([ref]));
 const out=await read(await run('remove-annotations',{name:'note.pdf',bytes:await doc.save()}));
 assert.equal(out.getPageCount(),1);
 assert.equal(out.getPage(0).node.Annots(),undefined);
});
test('CIT Bates adds overlay without changing page count',async()=>{
 const out=await read(await run('bates',await fixture(),{prefix:'HDV-',start:5,padding:6}));
 assert.equal(out.getPageCount(),4);
});
test('CIT Bates refuses unsafe Unicode in standard font prefix',async()=>{
 await assert.rejects(run('bates',await fixture(),{prefix:'Tiếng Việt',start:1,padding:6}),/ASCII/);
});
test('CIT N-up 2 preserves vector embedded pages',async()=>{
 const out=await read(await run('nup',await fixture(),{nup:2}));
 assert.equal(out.getPageCount(),2);
 assert.equal(out.getPage(0).getSize().width,300);
});
test('CIT N-up 4 combines four pages',async()=>{
 const out=await read(await run('nup',await fixture(),{nup:4}));
 assert.equal(out.getPageCount(),1);
});
test('CIT rejects invalid PDF data safely',async()=>{
 await assert.rejects(run('inspect',{name:'bad.pdf',bytes:new Uint8Array([0,1,2])}),/không phải PDF/);
});

test('CIT blocks signature ByteRange found at end of PDF',async()=>{
 const source=await fixture([200]);
 const marked=new Uint8Array(source.bytes.length+80);
 marked.set(source.bytes);
 marked.set(Buffer.from('\n/ByteRange [0 1 2 3]\n'),source.bytes.length);
 await assert.rejects(run('reverse',{name:'signed.pdf',bytes:marked}),/ký số/);
});

test('CIT inserts blank page at a specified index',async()=>{
 const output=await read(await run('insert-blank',await fixture([200,220]),{position:1}));
 assert.equal(output.getPageCount(),3);
 assert.deepEqual(widths(output),[200,220,220]);
});
test('CIT supports 45 degree vector rotation with correct page box',async()=>{
 const result=await read(await run('rotate-custom',await fixture([200]),{angle:45}));
 assert.equal(result.getPageCount(),1);
 const b=result.getPage(0).getSize();
 assert.ok(b.width>200 && b.height>300);
});
test('CIT supports 90 degree rotation via page Rotate attribute',async()=>{
 const result=await read(await run('rotate-custom',await fixture([200]),{angle:90}));
 assert.equal(result.getPage(0).getRotation().angle,90);
 assert.equal(result.getPage(0).getSize().width,200);
});
test('CIT overlays a second PDF while retaining base page count',async()=>{
 const base=await fixture([200,220]);
 const overlay=await fixture([210,240,270]);
 const result=await read(await run('overlay',[base,overlay],{opacity:0.5}));
 assert.equal(result.getPageCount(),2);
 assert.deepEqual(widths(result),[200,220]);
});
test('CIT overlay refuses a single source file',async()=>{
 await assert.rejects(run('overlay',await fixture()),/hai tệp/);
});

test('CIT read-only PDF inspector is allowed even with signature markers',async()=>{
 const source=await fixture([200]);
 const marked=new Uint8Array(source.bytes.length+80);
 marked.set(source.bytes);
 marked.set(Buffer.from('\n/ByteRange [0 1 2 3]\n'),source.bytes.length);
 const info=await run('inspect',{name:'signed.pdf',bytes:marked});
 assert.equal(info.info.pageCount,1);
});
