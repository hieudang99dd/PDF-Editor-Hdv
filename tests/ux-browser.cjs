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
   page.on('dialog',dialog=>dialog.accept());
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
   assert.deepEqual(failures,[],'No new browser JS errors');
   console.log('PASS: browser PDF download stays in task, refresh, new file, native back-forward and mobile');
 }finally{
   await browser?.close();
   await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
