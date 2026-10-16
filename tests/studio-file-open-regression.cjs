'use strict';
// Production: exercise visible file input, OS file chooser and native drag-and-drop.
// setInputFiles alone is insufficient to cover user actions through the overlay.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const PDF = require('../pdf-lib.min.js');
const { chromium } = require('playwright');
const results = path.resolve(__dirname, '../test-results/file-open-regression');
fs.mkdirSync(results, { recursive: true });

async function makeFixtures() {
  const doc = await PDF.PDFDocument.create();
  const regular = await doc.embedFont(PDF.StandardFonts.Helvetica);
  const bold = await doc.embedFont(PDF.StandardFonts.HelveticaBold);
  for (let i=0;i<3;i++) {
    const page=doc.addPage([842,595]);
    page.drawText('CIVIL3D TEST SECTION '+i,{x:50,y:530,size:15,font:bold});
    for(let j=0;j<35;j++) {
      const y=500-j*12;
      page.drawText('Sample line '+j+' - datum / EG / drainage / culvert',{x:70,y,size:10,font:regular});
      page.drawLine({start:{x:50,y:y-3},end:{x:745,y:y-3},thickness:.2});
    }
  }
  const filepath=path.join(results,'multi-page-civil.pdf');
  fs.writeFileSync(filepath,await doc.save());
  return filepath;
}

function diag(page){
  return page.evaluate(()=>{
    const item=id=>{
      const e=document.getElementById(id);
      return e&&{hidden:e.hidden,display:getComputedStyle(e).display,
        text:(e.textContent||'').trim().slice(0,150)};
    };
    return {loader:item('loader-modal'),error:item('alert-modal'),
      uploader:item('uploader'),page:item('pageWrap'),editor:item('text-editor-app'),
      paragraphs:document.querySelectorAll('#overlay .para-box:not(.block-box)').length,
      engine:!!window.__HVD_CIT_TEXT_API,
      file:document.getElementById('file-input')?.files?.[0]?.name||null,
      sw:navigator.serviceWorker?.controller?.scriptURL||null
    };
  });
}
async function runOne(browser,fixture,mode,serviceWorkers) {
  const context=await browser.newContext({viewport:{width:1500,height:940},
     serviceWorkers,acceptDownloads:true});
  const page=await context.newPage();
  const errs=[];
  page.on('pageerror',e=>errs.push('JS '+e.stack));
  page.on('requestfailed',r=>errs.push('FAILED '+r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  try{
    await page.goto('https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html?real_action='+mode+'&stamp='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#drop-zone').waitFor({state:'visible',timeout:45000});
    if(mode==='chooser'){
      const chooser=page.waitForEvent('filechooser',{timeout:10000});
      await page.locator('#drop-zone').click({position:{x:25,y:25}});
      (await chooser).setFiles(fixture);
    } else if(mode==='dragdrop'){
      const data=fs.readFileSync(fixture).toString('base64');
      await page.locator('#drop-zone').evaluate((node,b64)=>{
        const raw=atob(b64);
        const bytes=new Uint8Array(raw.length);
        for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
        const file=new File([bytes],'multi-page-civil.pdf',{type:'application/pdf'});
        const drag=new DataTransfer();
        drag.items.add(file);
        node.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:drag}));
        node.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:drag}));
      },data);
    }else{
      await page.locator('#file-input').setInputFiles(fixture);
    }
    await page.waitForFunction(()=>{
      const app=document.getElementById('text-editor-app');
      const wrap=document.getElementById('pageWrap');
      const loader=document.getElementById('loader-modal');
      return app&&!app.hidden&&wrap&&!wrap.hidden&&
        loader?.classList.contains('hidden')&&
        document.querySelectorAll('#overlay .para-box:not(.block-box)').length>=3;
    },null,{timeout:90000});
    const state=await diag(page);
    assert.ok(state.engine,'PDFium must start');
    assert.equal(state.loader.display,'none','Loader must disappear');
    assert.ok(state.paragraphs>=3);
    console.log('PASS',mode,serviceWorkers,JSON.stringify(state));
    await page.screenshot({path:path.join(results,mode+'-'+serviceWorkers+'.png'),fullPage:true});
    const critical=errs.filter(s=>/\.wasm|\.js|\.css|JS |Failed to fetch dynamically/i.test(s));
    assert.deepEqual(critical,[]);
  }catch(e){
    console.error('FAIL',mode,serviceWorkers,String(e));
    console.error('STATE',JSON.stringify(await diag(page).catch(()=>null)));
    console.error('ERRORS',JSON.stringify(errs.slice(-50)));
    await page.screenshot({path:path.join(results,'FAILED-'+mode+'-'+serviceWorkers+'.png'),fullPage:true}).catch(()=>{});
    throw e;
  }finally{await context.close();}
}
(async()=>{
 const fixture=await makeFixtures();
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const sw of ['block','allow']){
    for(const mode of ['chooser','dragdrop','direct']){
      await runOne(browser,fixture,mode,sw);
    }
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
