const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const html = read('studio/edit-pdf-text.html');
const css = read('studio/hvd-brand.css');
const notice = read('NOTICE.md');
const homepage = read('index.html');

test('text editor uses PDF EDITOR first-party navigation and accurate native text description', () => {
  assert.match(html, /<div id="hvd-brandbar"/);
  assert.match(html, /<a class="hvd-logo" href="\.\.\/index\.html"/);
  assert.match(html, /href="\.\.\/text-editor\.html" aria-current="page"/);
  assert.match(html, /href="\.\.\/pdfium-preflight\.html"/);
  assert.match(html, /Chỉnh sửa văn bản PDF/);
  assert.doesNotMatch(html, /<meta[^>]+content="Click any paragraph and edit it in place with live reflow/i);
  assert.match(html, /"name": "PDF EDITOR – Chỉnh sửa văn bản PDF"/);
  assert.match(html, /hvd-brand\.css\?v=20261016-editor1/);
});

test('legacy marketing is not rendered but native editor DOM and assets remain untouched', () => {
  for (const id of ['uploader','file-input','text-editor-app','toolbar','stage','inspector',
    'fFamily','fSize','fLine','fPara','save']) {
    assert.match(html, new RegExp('id="'+id+'"'), 'missing native editor element ' + id);
  }
  assert.match(html, /hvd-original-nav/);
  assert.match(html, /hvd-original-footer/);
  assert.match(css, /nav\.hvd-original-nav,#tool-landing,footer\.hvd-original-footer\s*\{display:none!important\}/);
  assert.doesNotMatch(css, /#text-editor-app\s*\{\s*display:none/);
  assert.match(html, /assets\/edit-pdf-text-[A-Za-z0-9_-]+\.js/);
  assert.match(html, /hvd-hub\.js/);
});

test('HVD legal access remains discoverable without upstream promotion in primary chrome', () => {
  const header = html.split('<div id="hvd-brandbar"')[1].split('</div>')[0];
  const footer = html.split('<div id="hvd-brand-footer"')[1].split('</div>')[0];
  assert.doesNotMatch(header+footer, /(?:alam00000|bentopdf|cit-pdf|digitalocean|discord|instagram|x\.com)/i);
  assert.match(footer, /href="\.\.\/NOTICE\.md"/);
  assert.match(homepage, /id="hvd-legal-source"[^>]+href="NOTICE\.md"/);
  assert.match(notice, /BentoPDF Contributors/);
  assert.match(notice, /Cường IT/);
  assert.match(notice, /AGPL/);
  assert.ok(fs.existsSync(path.join(root, 'LICENSE')));
});

test('nav destinations resolve within published GitHub Pages base', () => {
  const base='https://hieudang99dd.github.io/PDF-Editor1/studio/edit-pdf-text.html';
  for (const item of ['index.html','text-editor.html','pdfium-preflight.html','NOTICE.md']) {
    assert.equal(new URL('../'+item,base).href,
      'https://hieudang99dd.github.io/PDF-Editor1/'+item);
  }
});
