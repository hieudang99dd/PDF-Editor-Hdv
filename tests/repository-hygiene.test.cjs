const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('grouped workflow documents replace redundant root-level historical notes',()=>{
  for(const p of ['README.md','docs/REPOSITORY_MAP.md','docs/TEXT_ENGINE.md',
    'docs/STUDIO_DEPLOYMENT.md','docs/PROCESSING_AND_QA.md','IMPLEMENTATION_PROGRESS.md']){
    assert.ok(exists(p),'Required document missing: '+p);
  }
  const consolidated=[
    ['docs/TEXT_ENGINE.md',['CIT-INTEGRATION.md','CIT-TEXT-WORKSPACE.md','CIT-TEXT-EDITING-UPDATE.md']],
    ['docs/STUDIO_DEPLOYMENT.md',['CIT-ORIGINAL-FRONTEND.md','HVD-BRANDING.md']],
    ['docs/PROCESSING_AND_QA.md',['CIT-ADVANCED-INTEGRATION.md','PDFIUM-PREFLIGHT-INTEGRATION.md']]
  ];
  for(const [dest,sources] of consolidated){
    const body=read(dest);
    for(const source of sources){
      assert.match(body,new RegExp(source.replaceAll('.','\\.')),'lost historical section: '+source);
      assert.ok(!exists(source),'Duplicate legacy doc was not removed: '+source);
    }
  }
});

test('cleanup removes one-off patches and unused UI prototypes, not runtime or licenses',()=>{
  for(const p of ['scratch','debug_run.py','debug_run2.py','hvd-home-v2.css','hvd-legal.js']){
    assert.ok(!exists(p),'Transient artifact still checked in: '+p);
  }
  for(const p of ['LICENSE','NOTICE.md','CIT-FEATURE-PORTING-MATRIX.md',
    'index.html','organizer.js','organizer.css','text-editor.html','text-editor-hdv.html',
    'pdf-native-text.mjs','pdf-native-worker.mjs','pdf-native-client.mjs',
    'pdfium-preflight-worker.mjs','pdfium-preflight-core.mjs','pdfium-preflight.html',
    'cit-advanced-core.js','cit-advanced-ui.js','studio/edit-pdf-text.html',
    'studio/assets/edit-pdf-text-DRxmk-wp.js',
    'scripts/cit-original/publish_site.py','backend/main.py',
    '.github/workflows/pages-smoke.yml','.github/workflows/cit-original-build.yml']){
    assert.ok(exists(p),'Required original application/runtime path removed: '+p);
  }
  const home=read('index.html');
  assert.match(home,/hvd-ui-v2\.css/);
  assert.match(home,/hvd-ui-v2\.js/);
  assert.match(home,/cit-text-route/);
  assert.doesNotMatch(home,/src="hvd-legal\.js"|href="hvd-home-v2\.css"/);
  assert.match(read('.gitignore'),/scratch\//);
});

test('links in consolidated docs, README and legal notice are not broken by file removal',()=>{
  for(const p of ['README.md','NOTICE.md','docs/TEXT_ENGINE.md','docs/STUDIO_DEPLOYMENT.md',
    'docs/PROCESSING_AND_QA.md','docs/REPOSITORY_MAP.md']){
    const body=read(p);
    for(const match of body.matchAll(/\]\(([^)]+)\)/g)){
      let target=match[1].trim();
      if(!target||/^(?:https?:|mailto:|#|\/)/i.test(target))continue;
      target=target.split('#')[0];
      if(!target||/[?*]/.test(target))continue;
      const resolved=path.resolve(path.dirname(path.join(root,p)),decodeURIComponent(target));
      assert.ok(resolved.startsWith(root+path.sep),'Link escapes repo: '+p+' -> '+target);
      assert.ok(fs.existsSync(resolved),'Broken Markdown link: '+p+' -> '+target);
    }
  }
});
