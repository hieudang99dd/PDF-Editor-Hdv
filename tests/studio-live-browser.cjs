/* Real remote GitHub Pages acceptance test, not local mock assets.
 * Run after: npm install --no-save playwright@1.57.0 && npx playwright install chromium
 */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const PDF=require('../pdf-lib.min.js');
const out=path.resolve(__dirname,'../test-results/studio-live');
fs.mkdirSync(out,{recursive:true});
const url='https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html';
async function fixture(){
 const doc=await PDF.PDFDocument.create();
 const p=doc.addPage([600,780]);
 const f=await doc.embedFont(PDF.StandardFonts.Helvetica);
 p.drawText('PDF DAO CHICH ORIGINAL',{x:75,y:650,size:14,font:f});
 p.drawText('ANOTHER TEXT LINE',{x:75,y:600,size:14,font:f});
 const name=path.join(out,'fixture.pdf');
 fs.writeFileSync(name,await doc.save());
 return name;
}
async function main(){
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,serviceWorkers:'allow'});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push('pageerror '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text());});
  page.on('response',r=>{if(r.status()>=400&&/\.(?:css|js|wasm)(?:\?|$)/.test(r.url()))errors.push('HTTP '+r.status()+' '+r.url());});
  console.log('Opening LIVE',url);
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  assert.equal(response.status(),200,'LIVE page must be accessible');
  await page.locator('#tool-uploader').waitFor({timeout:20000});
  await page.waitForLoadState('networkidle',{timeout:35000}).catch(()=>{});
  const v=await page.evaluate(()=>{
   const q=x=>document.querySelector(x);
   const body=getComputedStyle(document.body),box=getComputedStyle(q('#tool-uploader')),drop=getComputedStyle(q('#drop-zone'));
   const rect=q('#tool-uploader').getBoundingClientRect();
   return {
    title:document.title, styles:document.styleSheets.length,
    font:body.fontFamily, background:box.backgroundColor, borderRadius:box.borderRadius,
    dropDisplay:drop.display, boxWidth:rect.width, viewport:innerWidth,
    jsLoaded:document.body.dataset.hvdCitHub,
    css:[...document.querySelectorAll('link[rel=stylesheet]')].map(e=>({href:e.href,hasSheet:!!e.sheet})),
    serviceWorker:!!navigator.serviceWorker?.controller
   };
  });
  console.log('LIVE DESIGN',JSON.stringify(v));
  await page.screenshot({path:path.join(out,'01-live-uploader.png'),fullPage:true});
  assert.ok(v.styles>=4,'Main stylesheet did not load');
  assert.ok(!/Times New Roman/.test(v.font),'Browser is using unstyled default font');
  assert.ok(parseFloat(v.borderRadius)>=8,'Uploader is unstyled (border radius missing)');
  assert.ok(v.boxWidth < 1000,'Uploader is stretched unstyled across desktop');
  assert.equal(v.dropDisplay,'flex','Drop area does not have its original layout');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#tool-uploader').waitFor();
  const recheck=await page.locator('#tool-uploader').evaluate(e=>({
   radius:getComputedStyle(e).borderRadius,
   width:e.getBoundingClientRect().width
  }));
  assert.ok(parseFloat(recheck.radius)>=8,'Styling lost after reload/service worker');
  console.log('RELOAD after service worker',JSON.stringify(recheck));
  const pdf=await fixture();
  await page.locator('#file-input').setInputFiles(pdf);
  await page.waitForFunction(()=>{
   const app=document.getElementById('text-editor-app');
   const wrap=document.getElementById('pageWrap');
   return app&&!app.hidden&&wrap&&!wrap.hidden&&document.querySelectorAll('#overlay .para-box:not(.block-box)').length>=2;
  },null,{timeout:100000});
  await page.screenshot({path:path.join(out,'02-live-editor.png'),fullPage:true});
  assert.ok(await page.locator('#inspector').isVisible(),'Text properties panel must appear');
  console.log('LIVE EDITOR loaded, text paragraphs=',await page.locator('#overlay .para-box:not(.block-box)').count());
  const block=page.locator('#overlay .para-box:not(.block-box)').first();
  await block.dispatchEvent('mousedown');
  const editor=page.locator('#overlay .editor [contenteditable=true]');
  await editor.waitFor({timeout:30000});
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('PDF DAO CHICH EDITED');
  await page.waitForTimeout(450);
  const dl=page.waitForEvent('download',{timeout:120000});
  await page.locator('#save').click();
  const downloaded=await dl;
  const dest=path.join(out,'live-edited.pdf');
  await downloaded.saveAs(dest);
  const data=fs.readFileSync(dest);
  assert.equal(data.toString('ascii',0,5),'%PDF-');
  assert.ok(data.length>1000);
  console.log('EXPORTED PDF',data.length,'bytes');
  const critical=errors.filter(e=>/HTTP 4|HTTP 5|\.wasm|\.css|\.js|pageerror/i.test(e));
  assert.deepEqual(critical,[],'Critical browser errors: '+JSON.stringify(critical));
  console.log('PASS LIVE STUDIO CSS, navigation, upload, native edit, PDF export');
 }catch(e){
  console.error('FAILED live browser run',e.stack||String(e));
  console.log('OTHER browser errors',JSON.stringify(errors.slice(0,40)));
  throw e;
 }finally{await browser.close();}
}
main().catch(()=>process.exitCode=1);
