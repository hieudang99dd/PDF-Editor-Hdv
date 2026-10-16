const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'organizer.js'),'utf8');
const css=fs.readFileSync(path.join(root,'organizer.css'),'utf8');

function fixture({hasDocument=true,confirmReset=true,loading=false,saving=false}={}){
  const body=js.match(/async newDocument\(\)\s*\{([\s\S]*?)\n    \}\n\n    showLoading\(/)?.[1];
  assert.ok(body,'newDocument() must remain a dedicated method');
  let destructions=0,initialized=0,asks=0;
  const notices=[];
  const sandbox={
    document:{getElementById:(id)=>id==='po-loading'?{style:{display:loading?'flex':'none'}}:null},
    window:{initOrganizer(files){initialized++;assert.equal(files.length,0)}},
    confirm(msg){asks++;assert.match(msg,/đóng tệp PDF hiện tại/);return confirmReset;},
    toast(msg){notices.push(msg)}
  };
  const method=new vm.Script('({async newDocument(){'+body+'\n}})').runInNewContext(sandbox).newDocument;
  const instance={files:hasDocument?[{name:'drawing.pdf'}]:[],pages:hasDocument?[{}]:[],
    isSaving:saving,isChoosingDirectory:false,destroy(){destructions++}};
  return {run:()=>method.call(instance),get destroyed(){return destructions},
    get opened(){return initialized},get asked(){return asks},notices};
}
test('Làm mới closes all loaded PDF resources and reopens uploader in the same feature',async()=>{
  const fx=fixture();
  assert.equal(await fx.run(),true);
  assert.equal(fx.destroyed,1);
  assert.equal(fx.opened,1);
  assert.equal(fx.asked,1);
});
test('Cancelling reset or running a save/load never closes user document',async()=>{
  for(const opts of [{confirmReset:false},{loading:true},{saving:true}]){
    const fx=fixture(opts);assert.equal(await fx.run(),false);
    assert.equal(fx.destroyed,0);assert.equal(fx.opened,0);
  }
});
test('Empty uploader can refresh without redundant confirmation',async()=>{
  const fx=fixture({hasDocument:false});
  assert.equal(await fx.run(),true);assert.equal(fx.asked,0);
  assert.equal(fx.opened,1);
});
test('Visual hierarchy separates clear-document reset, real navigation and page rollback',()=>{
  assert.match(js,/id="po-new-document"[^>]*>↻ Làm mới/);
  assert.match(js,/id="po-back"[^>]*>← Danh mục công cụ/);
  assert.doesNotMatch(js,/id="po-back"[^>]*>←<\/button>/);
  assert.match(js,/id="po-tb-reset"[^>]*>↶ Hoàn nguyên trang/);
  assert.match(css,/\.po-container \.po-header-action\s*\{/);
  assert.match(css,/@media\(max-width:670px\)/);
});
test('Original export, undo/redo and cleanup remain present',()=>{
  for(const token of ['id="po-save"','id="po-export-sel"','id="po-undo"','id="po-redo"',
    'this.nativeTextClient?.destroy()','this.thumbObserver.disconnect()',
    'window.initOrganizer = (files) =>']){
    assert.ok(js.includes(token),'Missing editor functionality: '+token);
  }
  const studio=fs.readFileSync(path.join(root,'studio/hvd-brand.css'),'utf8');
  assert.match(studio,/#hvd-brandbar \{display:none!important\}/,
    'Redundant Studio top bar must not obscure the editor workspace');
});

test('Studio build is isolated from ordinary organizer and homepage updates',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/cit-original-build.yml'),'utf8');
  const trigger=workflow.split('workflow_dispatch:')[0];
  assert.ok(trigger.includes('scripts/cit-original/**'),'Pinned upstream rebuild inputs must remain tracked');
  assert.doesNotMatch(trigger,/['"]organizer\.js['"]|['"]index\.html['"]/,
    'Studio build must not overwrite reviewed UI after unrelated Organizer releases');
});
