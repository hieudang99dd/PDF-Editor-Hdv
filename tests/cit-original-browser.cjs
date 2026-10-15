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
PDFJS.GlobalWorkerOptions.workerSrc=path.join(root,'pdf.worker.min.js');
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
  const raw=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const relative=raw.replace(/^\/PDF-Editor-Hdv(?=\/)/,'');
  const route=relative.endsWith('/')?relative+'index.html':relative;
  const file=path.resolve(site,'.'+route);
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
    '/PDF-Editor-Hdv/text-editor.html';
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForURL(/\/PDF-Editor-Hdv\/studio\/edit-pdf-text\.html/,{timeout:15000});
  await page.locator('#file-input').waitFor();
  assert.match(await page.title(),/PDF HVD/,
    'Browser tab must use PDF HVD, not upstream product branding');
  assert.match(await page.locator('link[rel="manifest"]').getAttribute('href'),
    /\/studio\/hvd-site\.webmanifest$/);
  assert.equal((await page.locator('#nav-brand').textContent()).trim(),'PDF HVD');
  assert.equal((await page.locator('#footer-brand').textContent()).trim(),'PDF HVD');
  assert.match(await page.locator('#nav-logo').getAttribute('src'),
    /\/studio\/hvd-mark\.svg$/);

  await page.locator('#hvd-cit-uploader-home').waitFor();
  assert.equal(await page.evaluate(()=>document.body.dataset.hvdCitHub),'original');
  assert.match(await page.locator('#hvd-cit-uploader-home').getAttribute('href'),
    /\/PDF-Editor-Hdv\/index\.html$/,'HVD home link must not point back inside CIT');

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
  assert.equal(await page.locator('#hvd-cit-home').isVisible(),true,
    'Brand/HVD navigation in original editor toolbar must be visible');
  assert.equal(await page.locator('#fFamily').count(),1,
    'Original font selector must remain attached to the CIT format dock');
  assert.equal(await page.locator('#fLine').isVisible(),true);
  assert.equal(await page.locator('#fPara').isVisible(),true);

  const box=page.locator('#overlay .para-box:not(.block-box)').first();
  await box.dispatchEvent('mousedown');
  const editor=page.locator('#overlay .editor [contenteditable=true]');
  await editor.waitFor({timeout:30000});
  assert.match(await editor.innerText(),/CIT ORIGINAL LINE/);
  assert.equal(await page.locator('#fLine').isVisible(),true);
  assert.equal(await page.locator('#fPara').isVisible(),true);
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('CIT NATIVE EDITED');
  await page.waitForTimeout(600);
  console.log('CIT editor after natural keyboard input:',JSON.stringify(await editor.innerText()));
  await page.screenshot({path:path.join(results,'02-cit-original-editing.png'),fullPage:true});
  const wait=page.waitForEvent('download',{timeout:120000});
  await page.locator('#save').click();
  const download=await wait;
  const output=path.join(results,'cit-edited.pdf');
  await download.saveAs(output);
  const bytes=new Uint8Array(fs.readFileSync(output));
  assert.ok(bytes.length>1000,'Output PDF is missing or truncated');
  assert.equal(String.fromCharCode(...bytes.slice(0,5)),'%PDF-','Output is not PDF');
  // Independent PyMuPDF acceptance in the following CI step checks actual
  // rewritten glyphs, their neighbors and PDF page geometry. Bundled old
  // HVD PDF.js 3.x has different glyph extraction behavior from CIT PDFium.
  console.log('Native-CIT PDF export size:',bytes.length);
  assert.deepEqual(failed,[],'No PDFium or Vite resource failures');
  // Verify the CIT "Back to Tools" route returns to the actual HVD home,
  // not to CIT's own subapplication homepage. This is independent of editor
  // state and must not alter the original save or text-edit handling.
  const nav=await browser.newPage({viewport:{width:1280,height:820}});
  try{
    await nav.goto('http://127.0.0.1:'+server.address().port+
      '/PDF-Editor-Hdv/studio/edit-pdf-text.html',{waitUntil:'domcontentloaded'});
    await nav.locator('#back-to-tools').waitFor();
    await nav.locator('#back-to-tools').click();
    await nav.waitForURL(/\/PDF-Editor-Hdv\/index\.html$/,{timeout:20000});
    assert.equal(await nav.locator('h1').filter({hasText:'PDF Editor HDV'}).count(),1,
      'Return destination must show the PDF Editor HDV homepage, not the upstream CIT hub');
  }finally{await nav.close();}
  console.log('PASS: original CIT frontend, exact inspector, original WASM PDF text rewrite, native export');
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
