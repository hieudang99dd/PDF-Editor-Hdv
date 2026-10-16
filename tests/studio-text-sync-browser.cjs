/* Real browser acceptance for a newly rebuilt CIT/PDFium text bundle.
 * Runs against staged local repo files, not an older remote Pages deployment.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const PDF = require('../pdf-lib.min.js');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'test-results', 'cit-original');
fs.mkdirSync(out, { recursive: true });
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.wasm': 'application/wasm', '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.json': 'application/json'
};

async function fixture() {
  const doc = await PDF.PDFDocument.create();
  const p = doc.addPage([600, 780]);
  const f = await doc.embedFont(PDF.StandardFonts.Helvetica);
  p.drawText('CIT ORIGINAL LINE', { x: 80, y: 650, size: 13, font: f });
  p.drawText('SECOND CAD LINE', { x: 80, y: 590, size: 13, font: f });
  p.drawLine({ start: { x: 65, y: 625 }, end: { x: 460, y: 625 },
    thickness: 0.5, color: PDF.rgb(0, 0, 0) });
  const file = path.join(out, 'source.pdf');
  fs.writeFileSync(file, await doc.save());
  return file;
}

function server() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/PDF-Editor1(?=\/)/, '');
    const target = path.resolve(root, '.' + (relative.endsWith('/') ? relative + 'index.html' : relative));
    if (!target.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    fs.readFile(target, (error, contents) => {
      response.writeHead(error ? 404 : 200,
        { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
          'Cache-Control': 'no-store' });
      response.end(error ? 'Not found' : contents);
    });
  });
}

async function main() {
  const localServer = server();
  await new Promise(resolve => localServer.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const errors = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 920 }, acceptDownloads: true
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {
      if (r.status() >= 400 && /\.(?:js|wasm|css)(?:\?|$)/.test(r.url()))
        errors.push('HTTP ' + r.status() + ' ' + r.url());
    });
    const base = 'http://127.0.0.1:' + localServer.address().port +
      '/PDF-Editor1';
    await page.goto(base + '/text-editor.html', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/PDF-Editor1\/studio\/edit-pdf-text\.html/);
    for (const selector of ['#file-input', '#fFamily', '#fSize', '#fLine',
      '#fPara', '#save', '#inspector', '#hvd-brandbar'])
      assert.equal(await page.locator(selector).count(), 1, selector);
    assert.match(await page.title(), /PDF Đạo Chích/);
    await page.locator('#file-input').setInputFiles(await fixture());
    await page.waitForFunction(() => {
      const app = document.getElementById('text-editor-app');
      return app && !app.hidden &&
        document.querySelectorAll('#overlay .para-box:not(.block-box)').length >= 2;
    }, null, { timeout: 120000 });
    await page.screenshot({ path: path.join(out, '01-loaded.png'), fullPage: true });
    await page.locator('#overlay .para-box:not(.block-box)').first()
      .dispatchEvent('mousedown');
    const editor = page.locator('#overlay .editor [contenteditable=true]');
    await editor.waitFor({ timeout: 30000 });
    assert.match(await editor.innerText(), /CIT ORIGINAL LINE/);
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('CIT NATIVE EDITED');
    const apply = page.locator('#hvd-apply-now');
    await apply.waitFor({ state: 'visible' });
    await apply.click();
    await page.waitForFunction(() =>
      document.querySelector('#overlay .editor') === null &&
      window.__HVD_TEXT_LAST_RESULT?.committed === true
    , null, { timeout: 30000 });
    const confirmed = await page.evaluate(() => window.__HVD_TEXT_LAST_RESULT);
    assert.equal(confirmed.confirmed, true,
      'Source-level CIT session must explicitly confirm native commit');
    await page.screenshot({ path: path.join(out, '02-applied.png'), fullPage: true });
    const downloading = page.waitForEvent('download', { timeout: 120000 });
    await page.locator('#save').click();
    const download = await downloading;
    const pdf = path.join(out, 'cit-edited.pdf');
    await download.saveAs(pdf);
    const file = fs.readFileSync(pdf);
    assert.ok(file.length > 1000 && file.toString('ascii', 0, 5) === '%PDF-');
    assert.deepEqual(errors, [], 'No missing JS/WASM/CSS or uncaught JS errors');
    // A true PDF-content comparison follows independently in verify_pdf.py.
    console.log('PASS: CIT/PDFium Apply confirmed; PDF exported:', file.length);
  } finally {
    await browser.close();
    await new Promise(resolve => localServer.close(resolve));
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
