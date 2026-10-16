const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=()=>fs.readFileSync(path.join(root,'region-eraser.html'),'utf8');
const js=()=>fs.readFileSync(path.join(root,'region-eraser.js'),'utf8');
test('Apply and Export are distinct toolbar actions; Export is initially disabled',()=>{
 const s=html();
 assert.match(s,/<button[^>]+id="re-process" disabled>✂ Áp dụng<\/button>/);
 assert.match(s,/<button[^>]+id="re-download" disabled>↓ Xuất PDF<\/button>/);
 assert.equal((s.match(/id="re-download"/g)||[]).length,1);
 assert.equal((s.match(/id="re-process"/g)||[]).length,1);
 assert.match(s,/id="re-rework"/);
 for(const stage of ['edit','apply','review','export'])assert.ok(s.includes('id="re-step-'+stage+'"'));
});
test('Export is disabled until applied result and never called from Apply',()=>{
 const s=js();
 assert.match(s,/\$\('re-download'\)\.disabled=state\.busy\|\|!state\.result\|\|!state\.result\.blob/);
 assert.match(s,/dom\.process\.disabled=state\.busy\|\|!!state\.result/);
 const apply=s.slice(s.indexOf('async function apply(){'),s.indexOf('function download(){'));
 assert.match(apply,/eraseRegionsInWorker\(state\.file,pages/);
 assert.match(apply,/state\.result=\{blob,report:result\.report\}/);
 assert.doesNotMatch(apply,/download\(\)|\.click\(\)/);
 assert.match(s,/\$\('re-download'\)\.addEventListener\('click',download\)/);
});
test('Rework discards stale PDF only, preserving geometry and requiring reapply',()=>{
 const s=js(),i=s.indexOf("\$('re-rework').addEventListener('click'");
 assert.ok(i>0);
 const rework=s.slice(i,i+420);
 assert.match(rework,/invalidateResult\(\)/);
 assert.match(rework,/refreshZones\(\)/);
 assert.doesNotMatch(rework,/state\.regions=new Map\(/);
 assert.match(s,/releaseReview\(\);state\.result=null;state\.exported=false/);
 assert.match(s,/\$\('re-draw'\)\.disabled=state\.busy\|\|!state\.pdf\|\|!!state\.result/);
 assert.match(s,/return countRegions\(\)>0&&!state\.exported/);
});
test('Export uses last applied result Blob, not the original or uncommitted selection',()=>{
 const s=js();
 const action=s.slice(s.indexOf('function download(){'),s.indexOf('function onPointerDown'));
 assert.match(action,/if\(!state\.result\|\|!state\.result\.blob\|\|!state\.file\|\|state\.busy\)return/);
 assert.match(action,/const blob=state\.result\.blob/);
 assert.match(action,/state\.exported=true/);
 assert.doesNotMatch(action,/eraseRegionsInWorker|state\.file\.arrayBuffer/);
});
