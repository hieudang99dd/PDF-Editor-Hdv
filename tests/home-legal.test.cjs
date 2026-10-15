const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'hvd-ui-v2.css'), 'utf8');

test('homepage has no licensing modal, blocking overlay or long legal footer', () => {
  assert.doesNotMatch(html, /<dialog\b/i);
  assert.doesNotMatch(html, /id="hvd-legal-dialog"/);
  assert.doesNotMatch(html, /id="hvd-legal-toggle"/);
  assert.doesNotMatch(html, /<script src="hvd-legal\.js/);
  assert.doesNotMatch(html, /<footer\b/i);
  assert.doesNotMatch(css, /\.hvd-legal-dialog/);
});

test('original attribution and license files remain available via opt-in source link', () => {
  assert.match(html, /<a[^>]*id="hvd-legal-source"[^>]*href="NOTICE\.md"/);
  assert.match(html, /id="hvd-legal-source"[^>]*target="_blank"/);
  const notice = fs.readFileSync(path.join(root,'NOTICE.md'),'utf8');
  assert.match(notice, /BentoPDF Contributors/);
  assert.match(notice, /Cường IT/);
  assert.match(notice, /github\.com\/hieudang99dd\/PDF-Editor-Hdv/);
  assert.ok(fs.existsSync(path.join(root,'LICENSE')));
  assert.match(css, /header \.hvd-info-toggle/);
});
