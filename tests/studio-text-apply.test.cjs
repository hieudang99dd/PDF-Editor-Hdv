'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const get = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = get('studio/edit-pdf-text.html');
const js = get('studio/hvd-text-apply.js');
const css = get('studio/hvd-text-apply.css');

test('keep the original CIT/PDFium editor, without drawing substitute text', () => {
  for (const id of ['pageWrap','overlay','inspector','save','fFamily','fSize','fLine','fPara'])
    assert.ok(html.includes('id="' + id + '"'));
  assert.match(html, /hvd-text-apply\.js\?v=/);
  assert.match(html, /hvd-text-apply\.css\?v=/);
  assert.doesNotMatch(js, /drawText\(|fillRect\(/);
  assert.match(css, /editor:has\(> canvas\.glass-live\)/);
});

test('resolve the running CIT module, never an old hash, and check real native result', () => {
  assert.doesNotMatch(js, /import\(['"]\.\/assets\/app-[A-Za-z0-9_-]+\.js['"]\)/);
  assert.match(js, /__HVD_CIT_TEXT_API/);
  assert.match(js, /performance\.getEntriesByType/);
  assert.match(js, /result\.ok === false/);
  assert.match(js, /activeEditor\(\) === editor/);
  assert.match(js, /document\.fonts\?\.ready/);
  assert.match(js, /if \(!ok\) return/);
  new vm.Script(js, { filename: 'hvd-text-apply.js' });
});

function harness(result) {
  let editing = true;
  let vendorSaveCount = 0;
  const byId = new Map();
  function element() {
    const listeners = new Map();
    return {
      id: '', hidden: false, disabled: false, dataset: {},
      listeners, addEventListener(type, fn) { listeners.set(type, fn); },
      setAttribute() {},
      insertAdjacentElement(_where, next) { byId.set(next.id, next); }
    };
  }
  const save = element();
  save.id = 'save';
  save.click = function () {
    let stopped = false;
    const ev = { preventDefault() {}, stopImmediatePropagation() { stopped = true; } };
    const listener = this.listeners.get('click');
    if (listener) listener(ev);
    if (!stopped) vendorSaveCount++;
  };
  byId.set('save', save);
  byId.set('overlay', element());
  const editor = element();
  const document = {
    readyState: 'loading',
    baseURI: 'https://example.test/PDF-Editor1/studio/edit-pdf-text.html',
    fonts: { ready: Promise.resolve() },
    querySelector(selector) {
      return selector === '#overlay .editor [contenteditable="true"]' && editing ? editor : null;
    },
    querySelectorAll() { return []; },
    getElementById(id) { return byId.get(id) || null; },
    createElement() { return element(); },
    addEventListener(type, fn) { if (type === 'DOMContentLoaded') this.ready = fn; }
  };
  const window = {
    __HVD_CIT_TEXT_API: {
      async endEdit(commit) {
        if (result instanceof Error) throw result;
        if (result !== false && result?.ok !== false) editing = false;
        return typeof result === 'function' ? result(commit) : result;
      }
    },
    addEventListener() {}
  };
  const sandbox = {
    document, window, console, URL,
    location: { origin: 'https://example.test' },
    performance: { getEntriesByType() { return []; } },
    requestAnimationFrame(fn) { fn(); },
    MutationObserver: class { observe() {} },
  };
  vm.runInNewContext(js, sandbox, { filename: 'hvd-text-apply.js' });
  document.ready();
  return { byId, window, save, getVendorSaveCount: () => vendorSaveCount,
    setEditing: value => { editing = value; } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('successful native Apply confirms commit and ends active input', async () => {
  const app = harness({ ok: true });
  app.byId.get('hvd-apply-now').listeners.get('click')({
    preventDefault() {}, stopPropagation() {}
  });
  await tick();
  assert.equal(app.window.__HVD_TEXT_LAST_RESULT.committed, true);
  assert.equal(app.window.__HVD_TEXT_LAST_RESULT.confirmed, true);
  assert.equal(app.getVendorSaveCount(), 0, 'Apply must not export automatically');
});

test('failed native commit blocks export and displays error', async () => {
  const app = harness({ ok: false, message: 'native fail' });
  app.save.click();
  await tick();
  assert.equal(app.getVendorSaveCount(), 0);
  assert.equal(app.window.__HVD_TEXT_LAST_RESULT.committed, false);
  assert.match(app.byId.get('hvd-apply-state').textContent, /native fail/);
});

test('native exception blocks export without reporting success', async () => {
  const app = harness(new Error('WASM error'));
  app.save.click();
  await tick();
  assert.equal(app.getVendorSaveCount(), 0);
  assert.match(app.byId.get('hvd-apply-state').textContent, /WASM error/);
});

test('successful save first commits pending input, then exports once', async () => {
  const app = harness({ ok: true });
  app.save.click();
  await tick();
  assert.equal(app.getVendorSaveCount(), 1);
  assert.equal(app.window.__HVD_TEXT_LAST_RESULT.committed, true);
});
