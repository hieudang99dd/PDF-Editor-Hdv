const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=fs.readFileSync(path.join(root,'hvd-legal.js'),'utf8');
const css=fs.readFileSync(path.join(root,'hvd-ui-v2.css'),'utf8');

test('homepage no longer renders a legal footer block or engine status paragraph',()=>{
  const home=html.match(/<main id="home">([\s\S]*?)<\/main>/)?.[1];
  assert.ok(home,'Home section exists');
  assert.doesNotMatch(home,/<footer\b/i,'Footer completely removed');
  assert.doesNotMatch(home,/Công cụ cơ bản chạy ngay trong trình duyệt/);
  assert.match(html,/<button[^>]*id="hvd-legal-toggle"/);
  assert.match(html,/<dialog id="hvd-legal-dialog"/);
  assert.match(html,/<script src="hvd-legal\.js\?v=/);
  assert.match(css,/#?hvd-info-toggle|\.hvd-info-toggle/);
});

test('license, copyright attribution, warranty disclaimer and source remain on-demand',()=>{
  const section=html.match(/<dialog id="hvd-legal-dialog"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(section);
  assert.match(section,/BentoPDF Contributors/);
  assert.match(section,/Cường IT/);
  assert.match(section,/không có bảo hành/);
  assert.match(section,/href="LICENSE"/);
  assert.match(section,/href="NOTICE\.md"/);
  assert.match(section,/github\.com\/hieudang99dd\/PDF-Editor-Hdv/);
  assert.ok(fs.existsSync(path.join(root,'LICENSE')));
  assert.ok(fs.existsSync(path.join(root,'NOTICE.md')));
});

test('legal information opens on user click and closes on close button',()=>{
  const listeners={};
  const button={
    attrs:{},handlers:{},focused:false,
    addEventListener(t,fn){this.handlers[t]??=[];this.handlers[t].push(fn)},
    setAttribute(k,v){this.attrs[k]=v},
    focus(){this.focused=true}
  };
  const dialog={
    open:false,handlers:{},
    addEventListener(t,fn){this.handlers[t]??=[];this.handlers[t].push(fn)},
    showModal(){this.open=true},
    close(){this.open=false;for(const fn of (this.handlers.close||[]))fn()},
  };
  const x={
    document:{
      getElementById:id=>({
        'hvd-legal-toggle':button,
        'hvd-legal-dialog':dialog,
        'hvd-legal-close':listeners
      })[id]||null
    },
    console
  };
  listeners.handlers={};
  listeners.addEventListener=(name,fn)=>{listeners.handlers[name]??=[];listeners.handlers[name].push(fn)};
  vm.createContext(x);
  new vm.Script(script,{filename:'hvd-legal.js'}).runInContext(x);
  assert.equal(button.attrs['aria-expanded'],'false');
  button.handlers.click.forEach(fn=>fn());
  assert.equal(dialog.open,true);
  assert.equal(button.attrs['aria-expanded'],'true');
  listeners.handlers.click[0]();
  assert.equal(dialog.open,false);
  assert.equal(button.focused,true);
  assert.equal(button.attrs['aria-expanded'],'false');
});
