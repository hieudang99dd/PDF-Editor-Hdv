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
test('original CIT editor and native PdfEngine are preserved', () => {
  for (const asset of ['edit-pdf-text-DRxmk-wp.js','edit-pdf-text-CBd7slK6.css'])
    assert.ok(html.includes(asset));
  for (const id of ['pageWrap','overlay','inspector','save','fFamily','fSize','fLine','fPara'])
    assert.ok(html.includes('id="' + id + '"'));
  assert.ok(!js.includes('drawText('), 'Overlay writing must never replace native PDF edits');
});
test('apply/undo interaction commits the live CIT edit, not a draft', () => {
  assert.match(html, /hvd-text-apply\.js\?v=/);
  assert.match(html, /hvd-text-apply\.css\?v=/);
  assert.match(js, /import\('\.\/assets\/app-BS1uD-9J\.js'\)/);
  assert.match(js, /module\.endEdit\(accept\)/);
  assert.match(js, /finishEditing\(true\)/);
  assert.match(js, /finishEditing\(false\)/);
  assert.match(js, /save\.addEventListener\('click'[\s\S]*stopImmediatePropagation/);
  assert.match(js, /if \(ok\) save\.click\(\)/);
  assert.match(js, /event\.ctrlKey \|\| event\.metaKey/);
  new vm.Script(js, { filename:'hvd-text-apply.js' });
});
test('native glass is sole visible glyph source during active edit', () => {
  assert.match(css, /editor:has\(> canvas\.glass-live\)/);
  assert.match(css, /-webkit-text-fill-color:transparent!important/);
  assert.match(css, /caret-color:#111!important/);
  assert.match(css, /#hvd-apply-now\[hidden\]/);
});
