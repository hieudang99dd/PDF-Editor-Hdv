/* Browser acceptance for the UNMODIFIED CIT-PDF 1.0.0 Vite frontend.
 * Accept only if the real PDFium WASM application edits PDF text and exports
 * actual PDF bytes (not a graphical mask). Also checks original CIT dock.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const PDF=require('../pdf-lib.min.js');
const PDFJS=require('../pdf.min.js');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..'),site=path.join(root,'cit-stage');
const results=path.join(root,'test-results','cit-original');
fs.mkdirSync(results,{recursive:true});

async function pdfFixture(){
 const doc=await PDF.PDFDocument.create();
 const page=doc.addPage([600,780]);
 const font=await doc.embedFont(PDF.StandardFonts.Helvetica);
 page.drawText('CIT ORIGINAL LINE',{x:80,y:650,size:13,font});
 page.drawText('SECOND CAD LINE',{x:80,y:590,size:13,font});
 page.drawLine({start:{x:65,y:625},end:{x:460,y:625},
   thickness:0.5,color:PDF.rgb(0,0,0)});
 const file=path.join(results,'source.pdf');
 fs.writeFileSync(file,await doc.save());
 return file;
}
const mime={'.wasm':'application/wasm','.mjs':'text/javascript','.js':'text/javascript',
 '.html':'text/html','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.woff2':'font/woff2'};
function createServer(){
 return http.createServer((req,res)=>{
  const relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(site,'.'+relative);
  if(!file.startsWith(site+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{
   res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
     'Cache-Control':'no-store'});
   res.end(error?'Not found':data);
  });
 });
}
async function main(){
 const server=createServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const failed=[];
 try {
  const page=await browser.newPage({viewport:{width:1440,height:950},acceptDownloads:true});
  page.on('pageerror',err=>failed.push('pageerror: '+err.message));
  page.on('response',res=>{
   if(res.status()>=400&&/editcore|pdfium|\.wasm|\/assets\//i.test(res.url()))
     failed.push('Asset HTTP '+res.status()+': '+res.url());
  });
  const url='http://127.0.0.1:'+server.address().port+
    '/PDF-Editor-Hdv/cit-native/edit-pdf-text.html';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#file-input').waitFor();
  for(const sel of ['#text-editor-app','#inspector','#fFamily','#fSize','#fLine',
    '#fPara','#fSwatches','#fAlign','#fToggles','#undo','#redo','#save']){
    assert.equal(await page.locator(sel).count(),1,'Original CIT element: '+sel);
  }
  const source=await pdfFixture();
  await page.locator('#file-input').setInputFiles(source);
  await page.waitForFunction(()=>{
    const app=document.getElementById('text-editor-app');
    const pdf=document.getElementById('pageWrap');
    return app&&!app.hidden&&pdf&&!pdf.hidden&&
       document.querySelectorAll('#overlay .para-box:not(.block-box)').length>=2;
  },null,{timeout:120000});
  await page.screenshot({path:path.join(results,'01-cit-original-loaded.png'),fullPage:true});
  assert.equal(await page.locator('#inspector').isVisible(),true,
    'Original right-hand formatting dock must be visible');
  const box=page.locator('#overlay .para-box:not(.block-box)').first();
  await box.dispatchEvent('mousedown');
  const editor=page.locator('#overlay .editor [contenteditable=true]');
  await editor.waitFor({timeout:30000});
  assert.match(await editor.innerText(),/CIT ORIGINAL LINE/);
  assert.equal(await page.locator('#fLine').isVisible(),true);
  assert.equal(await page.locator('#fPara').isVisible(),true);
  await editor.fill('CIT NATIVE EDITED');
  await page.screenshot({path:path.join(results,'02-cit-original-editing.png'),fullPage:true});
  const wait=page.waitForEvent('download',{timeout:120000});
  await page.locator('#save').click();
  const download=await wait;
  const output=path.join(results,'cit-edited.pdf');
  await download.saveAs(output);
  const bytes=new Uint8Array(fs.readFileSync(output));
  const reader=await PDFJS.getDocument({data:bytes,verbosity:0}).promise;
  let text='';
  try{
    const p=await reader.getPage(1);
    text=(await p.getTextContent()).items.map(i=>i.str).join(' ');
  }finally{await reader.destroy();}
  assert.match(text,/CIT NATIVE EDITED/,'New PDF must contain new glyph text');
  assert.doesNotMatch(text,/CIT ORIGINAL LINE/,'Original text must be removed');
  assert.match(text,/SECOND CAD LINE/,'Other vector text must remain');
  assert.deepEqual(failed,[],'No PDFium or Vite resource failures');
  console.log('PASS: original CIT frontend, exact inspector, original WASM PDF text rewrite, native export');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
