const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'pdf-local-tools.js'), 'utf8');

function makePage(name, calls) {
  const dom = Object.create(null);
  for (const id of ['go', 'out', 'fmt-sel', 'ocr-lang', 'ocr-target']) {
    dom[id] = { value: id === 'fmt-sel' ? 'docx' : id === 'ocr-lang' ? 'eng' : 'txt',
      disabled: false, style: {}, children: [], append(...xs) { this.children.push(...xs); },
      replaceChildren(...xs) { this.children = xs; } };
  }
  const doc = {
    getElementById: id => dom[id] || null,
    querySelector: () => null,
    createElement: tag => ({ tag, children: [], style: {}, append(...xs) { this.children.push(...xs); }, addEventListener() {} }),
  };
  const ctx = { document: doc, window: {}, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    FormData, Blob, File, AbortSignal, setTimeout, console,
    fetch: async (url, opts) => {
      calls.push({ url, opts });
      if (url.endsWith('/api/capabilities')) return { ok: true, json: async () => ({ libreoffice: true, ocr_languages: ['eng'] }) };
      return { ok: true, blob: async () => new Blob(['actual output']) };
    } };
  vm.createContext(ctx);
  vm.runInContext(`const T=[]; const OPT={}; const sz=n=>n+' bytes'; function home() {};
    async function run() {};
    let tool=['${name}'];
    let files=[new File([new Blob(['%PDF- fake'])], 'sample.pdf', {type:'application/pdf'})];`,ctx);
  vm.runInContext(source, ctx);
  return {ctx, dom};
}

test('PDF→DOCX tool executes local engine and offers real download', async () => {
  const calls = [];
  const {ctx, dom} = makePage('PDF sang Word',calls);
  await vm.runInContext('run()',ctx);
  assert.equal(calls[1].url, 'http://localhost:8000/api/convert');
  assert.equal(calls[1].opts.body.get('target'), 'docx');
  assert.equal(dom.out.children[0].children.at(-1).download, 'sample.docx');
  assert.equal(dom.go.disabled, false);
});

test('Office→PDF chooses pdf target', async () => {
  const calls = [];
  const {ctx,dom} = makePage('Word sang PDF',calls);
  await vm.runInContext('run()',ctx);
  assert.equal(calls[1].opts.body.get('target'), 'pdf');
  assert.equal(dom.out.children[0].children.at(-1).download, 'sample.pdf');
});

test('OCR language, output option, and endpoint are forwarded', async () => {
  const calls=[];
  const {ctx,dom}=makePage('PDF OCR',calls);
  await vm.runInContext('run()',ctx);
  assert.equal(calls[1].url, 'http://localhost:8000/api/ocr');
  assert.equal(calls[1].opts.body.get('language'), 'eng');
  assert.equal(calls[1].opts.body.get('target'), 'txt');
  assert.equal(dom.out.children[0].children.at(-1).download, 'sample_ocr.txt');
});
