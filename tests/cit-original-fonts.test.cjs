'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root,'scripts/cit-original/patch_source.py'),'utf8');
const panel = fs.readFileSync(path.join(root,'studio/hvd-text-apply.js'),'utf8');
const css = fs.readFileSync(path.join(root,'studio/hvd-text-apply.css'),'utf8');

test('original PDF fonts are inspected from CIT/PDFium runs without hard-coded style replacement',()=>{
  for(const marker of ['hvdOriginalFontInfo', 'hvdEnsureSelectedOriginalFont',
    'getFontInfo: hvdOriginalFontInfo', 'ensureSelectedOriginalFont: hvdEnsureSelectedOriginalFont',
    'loadSelectedSystemFont: hvdLoadSelectedSystemFont',
    '  let r = fontInfo && p?.runs?.[fontInfo.runIndex]', 'docFontsReady.get',
    'docFontsNull.has', 'run.family', 'run.size', 'run.bold', 'run.italic']) {
    assert.ok(source.includes(marker), 'Missing native PDF font binding: '+marker);
  }
  assert.match(source, /docFonts\.clear\(\)/);
  assert.match(source, /docFontsReady\.clear\(\)/);
  assert.match(source, /docFontsNull\.clear\(\)/);
  assert.match(source, /_fontADCache\.clear\(\)/);
  assert.doesNotMatch(source, /run\.family\s*=\s*['"]Times New Roman['"]/);
  assert.match(panel, /hvd-original-font-info/);
  assert.match(panel, /api\?\.getFontInfo\?\.\(\)/);
  assert.match(panel, /api\.ensureSelectedOriginalFont\(\)/);
  assert.match(panel, /byId\('sysFonts'\)/);
  assert.doesNotMatch(panel, /byId\('fFamily'\)\.value\s*=/);
  assert.match(css, /#text-editor-app #hvd-original-font-info/);
});

test('source-built CIT exports stable run-font API and does not lose original runs',t=>{
  const built = path.join(root,'cit-upstream/src/js/editcore/app.js');
  if (!fs.existsSync(built)) return t.skip('source checkout only exists during build CI');
  const app = fs.readFileSync(built,'utf8');
  const parts=['function hvdOriginalFontInfo()', 'function hvdEnsureSelectedOriginalFont()',
    'getFontInfo: hvdOriginalFontInfo', 'ensureSelectedOriginalFont: hvdEnsureSelectedOriginalFont',
    'docFonts.clear();', 'docFontsReady.clear();', 'docFontsNull.clear();'];
  for(const p of parts)assert.ok(app.includes(p),'Source patch not applied: '+p);
  assert.match(app, /async function ensureRunFont\(para, runIndex, run\)/);
  assert.match(app, /P\(\)\.runFontData\(para\.id, runIndex\)/);
});
