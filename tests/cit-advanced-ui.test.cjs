const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const lib=require('../pdf-lib.min.js');
const core=require('../cit-advanced-core.js');
const code=fs.readFileSync(path.join(__dirname,'..','cit-advanced-ui.js'),'utf8');

function setup() {
  const elements={
    go:{disabled:false},
    out:{children:[],replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);}}
  };
  const createElement=()=>({
    children:[],style:{},textContent:'',append(...children){this.children.push(...children);},
    addEventListener(){}
  });
  const ctx={window:{CITAdvancedCore:core,PDFLib:lib},Blob,Uint8Array,
    console,setTimeout,URL:{createObjectURL:()=> 'blob:ok',revokeObjectURL:()=>{}},
    document:{getElementById:id=>elements[id]||null,createElement}};
  vm.createContext(ctx);
  vm.runInContext("const T=[['Cắt lề PDF','old','Chỉnh sửa','⌗','organize','.pdf'],['Biên tập lại (che thông tin)','old','Chỉnh sửa','█','organize','.pdf']]; const OPT={}; let tool=null; let files=[]; function run(){return 'old-run'} function home(){} function toast(){}",ctx);
  new vm.Script(code).runInContext(ctx);
  return {ctx,elements};
}
test('CIT UI loads advanced tools and replaces misleading crop/redaction labels',()=>{
  const {ctx}=setup();
  const tools=vm.runInContext('T',ctx);
  assert.ok(tools.some(t=>t[0]==='Đảo thứ tự trang PDF'));
  assert.equal(tools.find(t=>t[0]==='Cắt lề PDF')[4],'cit-crop');
  assert.ok(tools.some(t=>t[0]==='Che thông tin trực quan'));
});
test('CIT advanced UI downloads a new PDF without calling localhost',async()=>{
  const {ctx,elements}=setup();
  const doc=await lib.PDFDocument.create();doc.addPage([210,300]);doc.addPage([220,300]);
  const bytes=await doc.save();
  ctx.inputFile={name:'source.pdf',arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  vm.runInContext("tool=['Đảo thứ tự trang PDF']; files=[inputFile]",ctx);
  await vm.runInContext('run()',ctx);
  assert.equal(elements.go.disabled,false);
  const link=elements.out.children[0].children.at(-1);
  assert.equal(link.download,'source_reverse.pdf');
  assert.equal(link.href,'blob:ok');
});
test('Unrelated HDV tools still call original run handler',()=>{
  const {ctx}=setup();
  assert.equal(vm.runInContext("tool=['Ghép PDF'];run()",ctx),'old-run');
});
