const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ui=fs.readFileSync(path.join(root,'hvd-ui-v2.js'),'utf8');

test('global header contains only site-wide actions, never Text editing CTA',()=>{
 const header=html.match(/<header>([\s\S]*?)<\/header>/)?.[1];
 assert.ok(header);
 assert.doesNotMatch(header,/shortcut-text|Chỉnh Text|Sửa Text|Chỉnh sửa văn bản PDF/);
 assert.match(header,/<nav id="nav">/);
 assert.match(header,/id="logo"/);
});

test('Text editor is a real item inside the Chỉnh sửa category',()=>{
 assert.match(html,/\['Chỉnh sửa văn bản PDF','[^']+','Chỉnh sửa','T','cit-text-route','\.pdf'\]/);
 assert.match(html,/if\(T\[i\]\?\.\[4\]==='cit-text-route'\)\{location\.href='\.\/text-editor\.html'/);
 assert.doesNotMatch(html,/id="shortcut-text"/);
});

test('new catalog displays friendly names without mutating original tool engine keys',()=>{
 const data=[
  ['Giảm dung lượng PDF','Giảm kích cỡ','Nén','⇲','compress','.pdf'],
  ['Chuyển đổi PDF','Đổi định dạng','Chuyển đổi','⇄','fmt','.pdf'],
  ['PDF OCR','Nhận dạng chữ','Chuyển đổi','OCR','lang','.pdf'],
  ['Chỉnh sửa văn bản PDF','Sửa Text','Chỉnh sửa','T','cit-text-route','.pdf'],
  ['PDF sang PDF/A','Lưu lâu dài','Chuyển đổi','A','none','.pdf']
 ];
 const before=structuredClone(data);
 const nodes={
  '#q':{value:'',placeholder:'',oninput:null},
  '#chips':{innerHTML:''},
  '#tools':{innerHTML:''}
 };
 const hero={
  children:{h1:{textContent:''},p:{textContent:''}},
  querySelector(q){return q==='.eyebrow'?null:this.children[q]},
  insertAdjacentHTML(){}
 };
 const rootNode={querySelector(q){return q==='.hero'?hero:null}};
 const context={
  document:{querySelector:q=>q==='#home'?rootNode:nodes[q]},
  T:data,
  C:{'Nén':'#fa3','Chuyển đổi':'#37c','Chỉnh sửa':'#09a'},
  cats:['Tất cả','Nén','Chuyển đổi','Chỉnh sửa'],
  cat:'Tất cả',
  home(){},
  console
 };
 vm.createContext(context);
 new vm.Script(ui).runInContext(context);
 assert.deepEqual(data,before,'internal tool names cannot change during display-only rebrand');
 assert.match(nodes['#tools'].innerHTML,/Chỉnh sửa văn bản PDF/);
 assert.match(nodes['#tools'].innerHTML,/Nén PDF/);
 assert.match(nodes['#tools'].innerHTML,/Nhận dạng văn bản \(OCR\)/);
 assert.match(nodes['#tools'].innerHTML,/data-i="3"/);
 assert.match(nodes['#tools'].innerHTML,/data-i="0"/);
 assert.equal((nodes['#tools'].innerHTML.match(/data-i="3"/g)||[]).length,1);
 assert.doesNotMatch(nodes['#tools'].innerHTML,/PDF sang PDF\/A[^]*data-i="4"[^>]*class="tool"/);
});

test('search and category filtering work with display label or original name',()=>{
 const data=[
  ['Giảm dung lượng PDF','Tối ưu','Nén','⇲','compress','.pdf'],
  ['PDF OCR','Nhận dạng','Chuyển đổi','OCR','lang','.pdf'],
  ['Chỉnh sửa văn bản PDF','Văn bản gốc','Chỉnh sửa','T','cit-text-route','.pdf']
 ];
 const nodes={'#q':{value:'',oninput:null},'#chips':{innerHTML:''},'#tools':{innerHTML:''}};
 const hero={querySelector:q=>q==='.eyebrow'?null:({textContent:''}),insertAdjacentHTML(){}};
 const context={document:{querySelector:q=>q==='#home'?{querySelector:()=>hero}:nodes[q]},
  T:data,C:{'Nén':'#a','Chuyển đổi':'#b','Chỉnh sửa':'#c'},
  cats:['Tất cả','Nén','Chuyển đổi','Chỉnh sửa'],cat:'Tất cả',home(){}};
 vm.createContext(context);new vm.Script(ui).runInContext(context);
 nodes['#q'].value='nén';vm.runInContext('home()',context);
 assert.match(nodes['#tools'].innerHTML,/Nén PDF/);
 assert.doesNotMatch(nodes['#tools'].innerHTML,/Nhận dạng văn bản/);
 nodes['#q'].value='OCR';vm.runInContext('home()',context);
 assert.match(nodes['#tools'].innerHTML,/Nhận dạng văn bản/);
});
