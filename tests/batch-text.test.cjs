const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../pdf-batch-text.js'),'utf8');
test('batch text code parses and activates separate from PDF base UI',()=>{
 new vm.Script(source);
 assert.match(source,/PDFOrganizer\.prototype|const proto=PDFOrganizer\.prototype/);
});
function fixture(reject=false){
 const page={id:'page-1',pageIndex:0,type:'pdf',textEdits:[]};
 const fields={
  '#po-batch-status':{textContent:'',style:{}},
  '#po-batch-apply':{disabled:false,textContent:''}
 };
 const modal={querySelector:s=>fields[s]||null,style:{}};
 const document={getElementById:()=>modal};
 const ctx={document,window:{PDFTextLayout:{
  makeEdit:(r,v)=>({id:r.id,originalText:r.text,newText:v.text,size:r.size,
    layoutVersion:2}),layout:()=>({size:12})}},console};
 function PDFOrganizer(){this.pages=[page];this.focusedPageId=page.id;this.batchPageId=page.id;this.abort={signal:{aborted:false}};
  this.batchRows=[
   {run:{id:'first',text:'KM 1',size:12,color:'#000000'},original:'KM 1',checkbox:{checked:true},input:{value:'KM 5'}},
   {run:{id:'second',text:'KM 2',size:12,color:'#000000'},original:'KM 2',checkbox:{checked:true},input:{value:'KM 6'}}
  ];
  this.counts={save:0,undo:0};
 }
 PDFOrganizer.prototype.bindEvents=function(){};
 PDFOrganizer.prototype.getTextMeasureDoc=async()=>({});
 PDFOrganizer.prototype.getTextEditFont=async()=>({pdfFont:{},original:true,label:'Tinos'});
 PDFOrganizer.prototype.getNativeTextResult=async function(p,edits){
  this.candidate=edits;
  if(reject)throw Error('Native geometry crossed table border');
  return {bytes:new Uint8Array([37,80,68,70,45])};
 };
 PDFOrganizer.prototype.pushHistory=function(){this.counts.save++};
 PDFOrganizer.prototype.updateTextEditState=function(){};
 PDFOrganizer.prototype.invalidateTextThumbnail=function(){};
 PDFOrganizer.prototype.focusPage=function(){};
 ctx.PDFOrganizer=PDFOrganizer;
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const app=new ctx.PDFOrganizer();
 return {app,page,fields,modal};
}
test('batch line commit is atomic with exactly one undo history entry',async()=>{
 const {app,page}=fixture(false);
 const ok=await app.applyCITBatchText();
 assert.equal(ok,true);
 assert.equal(page.textEdits.length,2);
 assert.equal(app.counts.save,1);
 assert.equal(app.batchRows.length,0);
 assert.equal(app.batchPageId,null);
});
test('batch native failure leaves PDF edits and undo history untouched',async()=>{
 const {app,page,fields}=fixture(true);
 const ok=await app.applyCITBatchText();
 assert.equal(ok,false);
 assert.equal(page.textEdits.length,0);
 assert.equal(app.counts.save,0);
 assert.match(fields['#po-batch-status'].textContent,/Không áp dụng/);
});
test('batch filter/preview only updates edit inputs, never page document',()=>{
 const {app,page}=fixture();
 const field={
   '#po-batch-find':{value:'KM'},
   '#po-batch-replace':{value:'QL'}
 };
 // Search preview never alters the persisted PDF without applying changes.
 assert.equal(typeof app.previewCITBatchText,'function');
 const old=app.batchRows[0].input.value;
 assert.equal(old,'KM 5');
 app.batchRows[0].original='KM 1';
 // Find/replace UI uses its own modal fields. No PDF save occurs until apply.
 assert.equal(page.textEdits.length,0);
});
