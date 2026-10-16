'use strict';
// Tests the patched CIT 1.0.0 preflight using a deterministic fake PDF.js task.
// Does not mock or claim to test PDFium glyph rewriting; separate Chromium QA
// runs the actual source-built engine and verifies real exported PDF contents.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const patchedSource = path.resolve(__dirname, '../cit-upstream/src/js/utils/password-prompt.ts');
const available = fs.existsSync(patchedSource);

function harness(kind) {
  assert.ok(available, 'Pinned CIT source must exist in the vendor build job');
  const source = fs.readFileSync(patchedSource, 'utf8');
  const match = source.match(/async function isFileEncrypted\(file: File\): Promise<boolean> \{([\s\S]*?)\n\}\n/);
  assert.ok(match, 'Expected original PDF.js encryption detector entrypoint');
  const js = 'async function detector(file) {' +
     match[1].replaceAll('encrypted: boolean','encrypted') +
     '\n}; return detector;';
  let timeoutMs = null;
  let onTimeout = null;
  let destroyed = 0;
  let cleared = 0;
  let task;
  const fakeTask = () => {
    task = {
      onPassword:null,
      destroy(){destroyed++;return Promise.resolve()},
      promise: kind==='success'
        ? Promise.resolve({destroy(){destroyed++;return Promise.resolve();}})
        : new Promise(() => {})
    };
    return task;
  };
  const win = {
    setTimeout(callback, ms) {timeoutMs = ms;onTimeout=callback;return 9},
    clearTimeout(id) {assert.equal(id,9);cleared++}
  };
  const detector = new Function('readFileAsArrayBuffer','getPDFDocument','window','console',js)(
    async () => new Uint8Array([37,80,68,70,45]).buffer,
    fakeTask,win,{warn(){}}
  );
  return {detector,fireTimer(){assert.ok(onTimeout);onTimeout()},get task(){return task},
    get timeoutMs(){return timeoutMs},get cleared(){return cleared},
    get destroyed(){return destroyed}};
}
if (available) {
  test('PDF.js preflight cannot block native PDFium indefinitely',async()=>{
    const h=harness('pending');
    const result=h.detector({});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.timeoutMs,12000);
    h.fireTimer();
    assert.equal(await result,false,'Slow optional preflight falls back to the original PDF');
    assert.equal(h.cleared,1);
    assert.equal(h.destroyed,1);
  });
  test('encrypted PDF still enters original password handling',async()=>{
    const h=harness('pending');
    const result=h.detector({});
    await new Promise(resolve=>setImmediate(resolve));
    h.task.onPassword();
    assert.equal(await result,true);
    assert.equal(h.destroyed,1);
  });
  test('normal PDF immediately bypasses fallback deadline',async()=>{
    const h=harness('success');
    assert.equal(await h.detector({}),false);
    assert.equal(h.cleared,1);
  });
} else {
  test('only the pinned upstream build exercises the preflight timeout fixture',t=>{
    t.skip('cit-upstream is present only during source synchronization CI');
  });
}
