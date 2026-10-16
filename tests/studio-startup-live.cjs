'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../test-results/studio-startup');
fs.mkdirSync(out,{recursive:true});
const base='https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html';
async function main() {
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for (const [name,sw] of [['fresh','block'],['service-worker','allow']]) {
   const ctx=await browser.newContext({viewport:{width:1600,height:920},serviceWorkers:sw});
   const page=await ctx.newPage(); const errors=[];
   page.on('pageerror',e=>errors.push('JS '+e.stack));
   page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text());});
   page.on('requestfailed',r=>errors.push('REQUEST '+r.url()+' '+(r.failure()?.errorText||'')));
   page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
   const url=base+'?startup_probe='+name+'-'+Date.now();
   let response=null;
   try {
     response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
     await page.waitForTimeout(12000);
     const state=await page.evaluate(()=>{
      const describe=id=>{const el=document.getElementById(id);if(!el)return null;const c=getComputedStyle(el);return {hidden:el.hidden,display:c.display,visibility:c.visibility,text:el.innerText?.slice(0,160),classes:el.className}};
      const resourceErrors=performance.getEntriesByType('resource').filter(r=>r.responseStatus>=400).map(r=>({url:r.name,status:r.responseStatus}));
      return {title:document.title,href:location.href,ready:document.readyState,
        loader:describe('loader-modal'),uploader:describe('uploader'),
        toolUploader:describe('tool-uploader'),editor:describe('text-editor-app'),
        jsAPI:!!window.__HVD_CIT_TEXT_API,resources:resourceErrors,
        sw:navigator.serviceWorker?.controller?.scriptURL||null};
     });
     console.log('RESULT',name,'HTTP',response.status(),JSON.stringify(state));
     console.log('ERRORS',name,JSON.stringify(errors.slice(0,45)));
     await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
     if (response.status()!==200 || errors.some(x=>/module|.js|.wasm|Unexpected token|Failed to fetch dynamically/i.test(x))) throw new Error(name+': critical startup errors');
     if(state.loader?.display!=='none')throw new Error(name+': loader still visible after startup');
     if(state.uploader?.display==='none')throw new Error(name+': uploader hidden');
   }catch(e){console.error('STARTUP FAIL',name,e.message);process.exitCode=1;}
   await ctx.close();
  }
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
