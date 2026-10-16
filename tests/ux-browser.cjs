/* Browser E2E for PDF HVD workspace. Run with Playwright Chromium.
 * Verifies generated binary downloads and that the tool stays open afterward.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const PDFLib=require('../pdf-lib.min.js');
const root=path.resolve(__dirname,'..');

function site(){
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
   '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
   '.json':'application/json','.wasm':'application/wasm','.pdf':'application/pdf',
   '.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'};
 return http.createServer(async(req,res)=>{
   try{
     const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
     const local=pathname==='/'?'/index.html':pathname;
     const target=path.resolve(root,'.'+local);
     if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
     const body=await fsp.readFile(target);
     res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream',
       'Cache-Control':'no-store'});
     res.end(body);
   }catch(err){res.writeHead(404);res.end('Missing file');}
 });
}

async function vectorSample(){
 const doc=await PDFLib.PDFDocument.create();
 for(let i=0;i<2;i++){
  const p=doc.addPage([600,400]);
  if(i===1)p.setRotation(PDFLib.degrees(90)); // mixed portrait/landscape in one range
  p.drawLine({start:{x:30,y:200},end:{x:570,y:200},thickness:1,color:PDFLib.rgb(0,0,0)});
  p.drawLine({start:{x:30,y:70},end:{x:570,y:70},thickness:1,color:PDFLib.rgb(0,0,0)});
 }
 return Buffer.from(await doc.save());
}
async function sample(label){
 const doc=await PDFLib.PDFDocument.create();
 const page=doc.addPage([595,842]);
 page.drawText(label,{x:50,y:750,size:18});
 return Buffer.from(await doc.save());
}

(async()=>{
 const server=site();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
   browser=await chromium.launch({headless:true});
   const page=await browser.newPage({viewport:{width:1280,height:800},acceptDownloads:true});
   const failures=[];
   page.on('pageerror',e=>failures.push(e.message));
   let acceptDialogs=true;
   page.on('dialog',dialog=>acceptDialogs?dialog.accept():dialog.dismiss());
   await page.goto(address,{waitUntil:'domcontentloaded'});
   await page.locator('button.catalog-tile').filter({hasText:'Ghép PDF'}).first().click();
   await page.locator('button.catalog-action').filter({hasText:'Ghép PDF'}).first().click();
   await page.locator('#ws').waitFor({state:'visible'});
   assert.match(new URL(page.url()).hash,/^#hvd-tool=\d+$/);
   await page.locator('#fi').setInputFiles([
     {name:'one.pdf',mimeType:'application/pdf',buffer:await sample('Page one')},
     {name:'two.pdf',mimeType:'application/pdf',buffer:await sample('Page two')}
   ]);
   assert.equal(await page.locator('.files li').count(),2);
   await page.locator('#go').click();
   const downloadLink=page.locator('#out a[download]').first();
   await downloadLink.waitFor({state:'visible',timeout:30000});
   const wait=page.waitForEvent('download');
   await downloadLink.click();
   const download=await wait;
   const destination=path.join('/tmp','hvd-ux-merged-'+process.pid+'.pdf');
   await download.saveAs(destination);
   const bytes=fs.readFileSync(destination);
   fs.unlinkSync(destination);
   assert.equal(bytes.subarray(0,5).toString('ascii'),'%PDF-');
   const merged=await PDFLib.PDFDocument.load(bytes);
   assert.equal(merged.getPageCount(),2);
   assert.ok(await page.locator('#ws').isVisible(),'workspace must remain open after binary download');
   assert.equal(await page.locator('.files li').count(),2,'selected inputs must survive download');
   await page.locator('#ws-refresh').click();
   assert.ok(await page.locator('#ws').isVisible());
   assert.equal(await page.locator('.files li').count(),2,'refresh should keep selected inputs');
   assert.equal(await page.locator('#out a[download]').count(),0,'refresh should clear old result');
   await page.locator('#ws-new').click();
   assert.equal(await page.locator('.files li').count(),0);
   assert.ok(await page.locator('#fi').count());
   await page.goBack({waitUntil:'domcontentloaded'});
   assert.ok(await page.locator('#home').isVisible(),'native Browser Back should return to catalog');
   await page.goForward({waitUntil:'domcontentloaded'});
   await page.locator('#ws').waitFor({state:'visible'});
   assert.equal(await page.locator('#wt').textContent(),'Ghép PDF');
   await page.setViewportSize({width:375,height:740});
   assert.ok(await page.locator('#refresh-app').isVisible(),'refresh must remain accessible on mobile');
   assert.ok(await page.locator('#ws-new').isVisible(),'New File action must remain accessible on mobile');
   await page.setViewportSize({width:1280,height:800});
   // Organizer: a real new-document reset must unload the PDF but preserve
   // the active feature; cancellation must leave its editor state intact.
   await page.goto(address,{waitUntil:'domcontentloaded'});
   await page.evaluate(() => openTool(T.findIndex(t=>t[0]==='Chỉnh sửa PDF')));
   await page.locator('#fi').setInputFiles({
     name:'sample-original.pdf',mimeType:'application/pdf',buffer:await sample('Document original')
   });
   await page.locator('#go').click();
   await page.locator('#po-ws').waitFor({state:'visible',timeout:30000});
   assert.ok(await page.locator('#po-new-document').isVisible());
   assert.ok(await page.locator('#po-back').isVisible());
   assert.match((await page.locator('#po-back').innerText()).trim(),/Danh mục công cụ/);
   assert.match((await page.locator('#po-tb-reset').innerText()).trim(),/Hoàn nguyên trang/);
   assert.equal(await page.locator('#po-meta-title').innerText(),'sample-original');
   const loaded=await page.evaluate(()=>window.organizerInstance.files.length);
   assert.equal(loaded,1);

   // Declining an explicit reset must keep the source, pages, and output.
   acceptDialogs=false;
   await page.locator('#po-new-document').click();
   acceptDialogs=true;
   assert.ok(await page.locator('#po-ws').isVisible(),'cancel must retain open document');
   assert.equal(await page.evaluate(()=>window.organizerInstance.files.length),1);
   await page.locator('#po-new-document').click();
   await page.locator('#po-initial-upload').waitFor({state:'visible'});
   assert.ok(await page.locator('#po-new-document').isVisible());
   assert.ok(await page.locator('#po-back').isVisible());
   assert.equal(await page.evaluate(()=>window.organizerInstance.files.length),0);
   assert.equal(await page.evaluate(()=>window.organizerInstance.pages.length),0);
   assert.ok(await page.locator('#po-save').isDisabled());
   assert.ok(await page.locator('#po-ws').isHidden());
   await page.locator('#po-file-input').setInputFiles({
     name:'another-file.pdf',mimeType:'application/pdf',buffer:await sample('Second document')
   });
   await page.locator('#po-ws').waitFor({state:'visible',timeout:30000});
   assert.equal(await page.locator('#po-meta-title').innerText(),'another-file');
   assert.ok(await page.locator('.po-header').isVisible());
   // The Organizer must remain a text/page editing tool, with no vector eraser plugin.
   assert.equal(await page.locator('#po-tb-region').count(),0,
     'vector region eraser must NOT be embedded inside PDF Organizer');
   // The new standalone route loads its own PDF, preview, zones and save workflow.
   await page.goto(address,{waitUntil:'domcontentloaded'});
   await page.locator('.tool').filter({hasText:'Xóa vector theo vùng'}).first().click();
   await page.waitForURL('**/region-eraser.html');
   await page.locator('#re-uploader').waitFor({state:'visible'});
   assert.ok(await page.locator('#re-dropzone').isVisible());
   await page.locator('#re-input').setInputFiles({
      name:'cad-linework.pdf',mimeType:'application/pdf',buffer:await vectorSample()
   });
   await page.locator('#re-workspace').waitFor({state:'visible',timeout:30000});
   await page.locator('#re-gallery-panel').waitFor({state:'visible'});
   assert.equal(await page.locator('.re-page-card').count(),2,'2-page PDF should show page storyboard');
   assert.equal(await page.locator('#re-download').isDisabled(),true,'Export must remain locked before Apply');
   assert.match(await page.locator('#re-process').innerText(),/Áp dụng/);
   assert.doesNotMatch(await page.locator('#re-process').innerText(),/xuất/i);
   await page.locator('.re-page-card').first().click();
   await page.locator('#re-editor-view').waitFor({state:'visible'});
   assert.ok(await page.locator('#re-gallery-back').isVisible());
   await page.waitForFunction(()=>{
     const c=document.getElementById('re-canvas'),s=document.getElementById('re-page-surface');
     return c&&c.width>200&&c.height>100&&s.getBoundingClientRect().width>100;
   },{timeout:30000});
   async function drawZone(x0,x1,role,y0=.39,y1=.61){
     if(await page.locator('#re-role').isEnabled())await page.locator('#re-role').selectOption(role);
     await page.locator('#re-shape').selectOption('rect');
     await page.locator('#re-draw').click();
     const box=await page.locator('#re-overlay').boundingBox();
     assert.ok(box&&box.width>100&&box.height>100,'standalone overlay must cover rendered PDF');
     await page.mouse.move(box.x+box.width*x0,box.y+box.height*y0);
     await page.mouse.down();
     await page.mouse.move(box.x+box.width*x1,box.y+box.height*y1,{steps:8});
     await page.mouse.up();
   }
   assert.equal(await page.locator('#re-object-mode').inputValue(),'whole-object');
   assert.ok(await page.locator('#re-allow-signed').count());
   // Preserve the previous precision workflow as its own explicit mode.
   await page.locator('#re-object-mode').selectOption('precise');
   await page.locator('#re-operation').selectOption('between');
   await drawZone(.3,.7,'erase');
   assert.equal(await page.locator('.re-zone').count(),1);
   await page.locator('#re-undo').click();
   assert.equal(await page.locator('.re-zone').count(),0,'standalone Undo must restore zone edits');
   await page.locator('#re-redo').click();
   assert.equal(await page.locator('.re-zone').count(),1,'standalone Redo must reapply zone edits');
   await drawZone(.43,.57,'erase',.44,.56);
   assert.equal(await page.locator('.re-zone').count(),2);
   await page.locator('#re-scope').selectOption('range');
   await page.locator('#re-range-from').fill('1');
   await page.locator('#re-range-to').fill('2');
   await page.locator('#re-process').click();
   await page.locator('#re-results').waitFor({state:'visible',timeout:120000});
   assert.match(await page.locator('#re-result-summary').innerText(),/PATH/);
   assert.equal(await page.locator('#re-download').isEnabled(),true,'Export unlocks only after PDFium Apply succeeds');
   assert.equal(await page.locator('#re-process').isDisabled(),true,'cannot apply an already reviewed snapshot');
   assert.equal(await page.locator('#re-draw').isDisabled(),true,'must explicitly Rework before changing zones');
   assert.ok(await page.locator('#re-rework').isVisible(),'Rework action should be available after applying');
   assert.match(await page.locator('#re-step-review').getAttribute('class'),/active/);
   assert.ok(await page.locator('#re-review-switch').isVisible(),'real output review should be shown immediately');
   assert.ok(await page.locator('#re-overlay').isHidden(),'region overlay must not impersonate the processed PDF');
   await page.locator('#re-before').click();
   assert.ok(await page.locator('#re-overlay').isVisible(),'before mode returns to the original PDF');
   await page.locator('#re-after').click();
   assert.ok(await page.locator('#re-overlay').isHidden(),'after mode must show real processed PDF');
   // Review result is NOT exported yet. Rework must discard the old output
   // without deleting the two drawn zones or leaving the editor.
   await page.locator('#re-rework').click();
   assert.equal(await page.locator('#re-download').isDisabled(),true,'stale result cannot be exported');
   assert.equal(await page.locator('#re-results').isHidden(),true,'old preview is invalidated on Rework');
   assert.equal(await page.locator('.re-zone').count(),2,'Rework preserves original region geometry');
   assert.equal(await page.locator('#re-process').isEnabled(),true);
   assert.equal(await page.locator('#re-draw').isEnabled(),true);
   await page.locator('#re-undo').click();
   assert.equal(await page.locator('.re-zone').count(),1,'can edit region history after Rework');
   await page.locator('#re-redo').click();
   assert.equal(await page.locator('.re-zone').count(),2);
   await page.locator('#re-process').click();
   await page.locator('#re-results').waitFor({state:'visible',timeout:120000});
   assert.equal(await page.locator('#re-download').isEnabled(),true);
   assert.match(await page.locator('#re-step-review').getAttribute('class'),/active/);
   const nativeWait=page.waitForEvent('download',{timeout:30000});
   await page.locator('#re-download').click();
   const nativeFile=await nativeWait;
   assert.match(await page.locator('#re-step-export').getAttribute('class'),/active/);
   const nativePath=path.join('/tmp','hvd-region-'+process.pid+'.pdf');
   await nativeFile.saveAs(nativePath);
   const nativeBytes=fs.readFileSync(nativePath);fs.unlinkSync(nativePath);
   assert.equal(nativeBytes.subarray(0,5).toString('ascii'),'%PDF-');
   assert.equal((await PDFLib.PDFDocument.load(nativeBytes)).getPageCount(),2);
   const {PdfEngine}=await import('../vendor/cit-pdf/editcore/core.js');
   const inspected=await PdfEngine.create();
   try{
     inspected.open(new Uint8Array(nativeBytes));
     for(let i=0;i<2;i++){
      inspected.loadPage(i);
      const vectorPaths=Array.from({length:inspected.objectCount()},(_,j)=>inspected.objectAt(j))
        .filter(obj=>obj?.type===2);
      assert.ok(vectorPaths.length>=4,'page '+(i+1)+' must contain native split paths after range operation');
     }
   }finally{inspected.close();}
   assert.ok(await page.locator('#re-workspace').isVisible(),'download must keep standalone tool open');
   await page.locator('#re-new').click();
   await page.locator('#re-uploader').waitFor({state:'visible'});
   assert.equal(await page.locator('.re-zone').count(),0);
   assert.match(page.url(),/region-eraser\.html/,'reset must remain inside standalone route');
   // Whole-object mode must physically remove text, not simply cover it.
   await page.locator('#re-input').setInputFiles({
     name:'text-report.pdf',mimeType:'application/pdf',buffer:await sample('DELETE TEXT IN BOX')
   });
   await page.locator('#re-gallery-panel').waitFor({state:'visible'});
   await page.locator('.re-page-card').first().click();
   await page.locator('#re-editor-view').waitFor({state:'visible'});
   assert.equal(await page.locator('#re-object-mode').inputValue(),'whole-object');
   assert.equal(await page.locator('#re-download').isDisabled(),true,'reset must discard prior export');
   await drawZone(.04,.65,'erase',.07,.20);
   await page.locator('#re-process').click();
   await page.locator('#re-results').waitFor({state:'visible',timeout:120000});
   assert.match(await page.locator('#re-result-summary').innerText(),/đối tượng PDF được gỡ/);
   assert.ok(await page.locator('#re-download').isEnabled());
   const textDownload=page.waitForEvent('download',{timeout:30000});
   await page.locator('#re-download').click();
   const textFile=await textDownload;
   const textPath=path.join('/tmp','hvd-text-erase-'+process.pid+'.pdf');
   await textFile.saveAs(textPath);
   const textBytes=fs.readFileSync(textPath);fs.unlinkSync(textPath);
   const verify=await PdfEngine.create();
   try{
    verify.open(new Uint8Array(textBytes));verify.loadPage(0);
    const textCount=Array.from({length:verify.objectCount()},(_,i)=>verify.objectAt(i))
       .filter(o=>o?.type===1).length;
    assert.equal(textCount,0,'selected text objects must be physically removed from PDF content stream');
   }finally{verify.close();}
   assert.deepEqual(failures,[],'No new browser JS errors');
   console.log('PASS: separate vector region eraser route + binary PDFium output + independent reset + Organizer regression');
 }finally{
   await browser?.close();
   await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
