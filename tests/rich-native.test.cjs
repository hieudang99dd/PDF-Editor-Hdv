const {test}=require('node:test');
const assert=require('node:assert/strict');
let methods;
test('loads native CIT run-preserving functions',async()=>{
  methods=await import('../pdf-native-text.mjs');
  assert.equal(typeof methods.replacementRuns,'function');
  assert.equal(typeof methods.findParagraph,'function');
});
const run=(text,style={})=>({
 text,family:'Tinos',bold:0,italic:0,size:11,rgba:0x000000ff,
 underline:false,strike:false,script:0,renderMode:0,strokeRgba:0,
 strokeWidth:1,hScale:1,rise:0,...style
});
const p=(runs)=>({runs,box:{x:100,top:150,w:180,h:12},
 firstBaseline:140,lines:[{}],editable:true,vertical:false});
const edit=(originalText,newText,style={})=>({
 originalText,newText,fontFamily:'original',nativeFamily:null,
 nativeSize:11,bold:false,italic:false,underline:false,color:'#000000',
 ...style
});
test('rich paragraph edits a unique bold segment, preserving all styles',()=>{
 const paragraph=p([run('KM '),run('BOLD',{bold:1}),run(' ghi chú')]);
 const result=methods.replacementRuns(paragraph,
   edit('BOLD','BOLD2026',{bold:true}));
 assert.deepEqual(result.map(x=>x.text),['KM ','BOLD2026',' ghi chú']);
 assert.deepEqual(result.map(x=>x.sourceIndex),[0,1,2]);
 assert.equal(result[1].bold,1);
 assert.equal(result[0].bold,0);
 assert.equal(result[2].family,'Tinos');
});
test('rich paragraph refuses changes to selected style and size',()=>{
 const paragraph=p([run('Normal '),run('Bold',{bold:1})]);
 assert.throws(()=>methods.replacementRuns(paragraph,edit('Bold','Đậm',{bold:false})),/chỉ được đổi chữ/);
 assert.throws(()=>methods.replacementRuns(paragraph,edit('Bold','Đậm',{bold:true,nativeSize:15})),/chỉ được đổi chữ/);
});
test('cross-font boundary replacement is denied',()=>{
 const paragraph=p([run('abc'),run('xyz',{bold:1})]);
 assert.throws(()=>methods.replacementRuns(paragraph,edit('abcxyz','abc NEW xyz')),/ranh giới font/);
});
test('duplicate same text in rich runs fails closed',()=>{
 const paragraph=p([run('KM',{bold:1}),run('KM')]);
 assert.throws(()=>methods.replacementRuns(paragraph,edit('KM','QL',{bold:true})),/lặp lại/);
});
test('same-style paragraph preserves other runs on partial edit',()=>{
 const paragraph=p([run('ABC'),run('DEF')]);
 const result=methods.replacementRuns(paragraph,edit('DEF','XYZ'));
 assert.deepEqual(result.map(x=>x.text),['ABC','XYZ']);
});
test('native matching accepts uniquely selected run with original baseline',()=>{
 const paragraph=p([run('KM '),run('BOLD',{bold:1})]);
 const engine={toModel:(x,y)=>({x,y})};
 const found=methods.findParagraph(engine,[paragraph],edit('BOLD','NEW',{x:124,y:140}));
 assert.equal(found,paragraph);
});
test('native matching refuses wrong baseline and duplicate run text',()=>{
 const paragraph=p([run('ABC'),run('ABC',{bold:1})]);
 const engine={toModel:(x,y)=>({x,y})};
 assert.equal(methods.findParagraph(engine,[paragraph],edit('ABC','NEW',{x:120,y:140})),null);
 assert.equal(methods.findParagraph(engine,[p([run('KM')])],edit('KM','NEW',{x:100,y:158})),null);
});
test('preview rejects geometry crossing a table cell',()=>{
 const paragraph=p([run('Old')]);
 const preview={lines:[{w:210}],box:{x:100,top:149,w:210,h:11}};
 const ed=edit('Old','New',{maxWidth:240,cell:{left:98,right:160,bottom:125,top:155}});
 const engine={toUser:(x,y)=>({x,y})};
 assert.throws(()=>methods.validatePreview(paragraph,preview,ed,engine),/vượt vùng ô bảng/);
});
