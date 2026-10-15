const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(
  path.join(__dirname,'../scripts/cit-original/hvd-hub.js'),'utf8');

test('CIT/HVD navigation adapter parses without bundler or native engine replacement',()=>{
  new vm.Script(source);
  assert.match(source,/back-to-tools/);
  assert.match(source,/stopImmediatePropagation/);
  assert.doesNotMatch(source,/PdfEngine\.create\(|\.renderPage\(|\.commitParagraph\(|\.saveSpliced\(/,
    'HVD navigation adapter must not modify the original CIT PDF engine');
});
test('CIT Back to Tools opens HVD homepage while other native buttons work unchanged',()=>{
  const selectors={};
  const listeners={};
  const created={};
  class Element{
    constructor(value){this.value=value;}
    closest(query){return query==='#back-to-tools'&&this.value==='back'?this:null;}
  }
  const span={textContent:'Back to Tools',removeAttribute(a){this.removed=a;}};
  selectors['#back-to-tools span']=span;
  const host=()=>({appendChild(a){created[a.id]=a;}});
  selectors['#toolbar .tgroup']=host();
  selectors['#tool-uploader']=host();
  let redirected='',events=0;
  const context={
    window:{
      location:{
        href:'https://hieudang99dd.github.io/PDF-Editor-Hdv/cit-native/edit-pdf-text.html',
        assign(url){redirected=url;}
      },
      dispatchEvent(){events++;}
    },
    document:{
      readyState:'complete',title:'Edit Text CIT',
      body:{dataset:{}},
      getElementById(id){return created[id]||null;},
      querySelector(sel){return selectors[sel]||null;},
      addEventListener(type,cb,capture){listeners[type]=cb;assert.equal(capture,true);},
      createElement(){return {setAttribute(k,v){this[k]=v;},textContent:'',href:''};}
    },
    Element,
    URL,CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail;}},
  };
  vm.createContext(context);vm.runInContext(source,context);
  assert.equal(context.document.body.dataset.hvdCitHub,'original');
  assert.equal(span.textContent,'Trở về PDF HVD');
  assert.equal(span.removed,'data-i18n');
  assert.equal(created['hvd-cit-home'].href,
    'https://hieudang99dd.github.io/PDF-Editor-Hdv/index.html');
  assert.equal(created['hvd-cit-uploader-home'].href,
    'https://hieudang99dd.github.io/PDF-Editor-Hdv/index.html');
  assert.equal(events,1);
  let blocked=false;
  listeners.click({
    target:new Element('other'),
    preventDefault(){blocked=true;},
    stopImmediatePropagation(){blocked=true;}
  });
  assert.equal(blocked,false);
  assert.equal(redirected,'');
  listeners.click({
    target:new Element('back'),
    preventDefault(){blocked=true;},
    stopImmediatePropagation(){blocked=true;}
  });
  assert.equal(blocked,true);
  assert.equal(redirected,
    'https://hieudang99dd.github.io/PDF-Editor-Hdv/index.html');
});
