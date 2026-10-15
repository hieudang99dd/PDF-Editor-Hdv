// Run with: node --test tests/save.test.cjs (no package install required).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PDFLib = require('../pdf-lib.min.js');

async function setup({ mode = 'picker', name = 'Bản vẽ', sourcePages = 3, selected = false } = {}) {
    const source = await PDFLib.PDFDocument.create();
    for (let i = 0; i < sourcePages; i++) source.addPage([300 + i * 10, 400]);
    const bytes = await source.save();
    const nodes = new Map();
    const events = [];
    const alerts = [];
    const downloads = [];
    const timers = [];
    const getNode = id => {
        if (!nodes.has(id)) {
            const classes = new Set(['active']);
            nodes.set(id, { value: '', textContent: '', disabled: false, style: {},
                classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) } });
        }
        return nodes.get(id);
    };
    getNode('po-save-mode').value = mode;
    getNode('po-save-filename').value = name;
    const file = { name: 'input.pdf', async arrayBuffer() { events.push('read-source'); return bytes.slice().buffer; } };
    const window = { PDFLib };
    const context = { window, console, Blob, ArrayBuffer, Uint8Array, setTimeout: (fn, ms) => timers.push({ fn, ms }),
        URL: { createObjectURL(blob) { downloads.push({ blob }); return 'blob:test'; }, revokeObjectURL() { events.push('revoke'); } },
        alert: message => alerts.push(message), confirm: () => true, toast: message => events.push(message),
        document: { getElementById: getNode, body: { appendChild() {} }, createElement() {
            return { click() { downloads.at(-1).filename = this.download; events.push('download'); }, remove() {} };
        } } };
    const createOrganizer = new Function(...Object.keys(context), fs.readFileSync(process.env.ORGANIZER_SOURCE || path.join(__dirname, '../organizer.js'), 'utf8') + '\nreturn PDFOrganizer;');
    const Organizer = createOrganizer(...Object.values(context));
    const org = Object.create(Organizer.prototype);
    Object.assign(org, { files: [file], pages: [{ type: 'pdf', fileIndex: 0, pageIndex: 0, rotation: 90, selected }],
        encrypted: {}, historyIndex: 4, savedHistoryIndex: 1, baseFilename: 'input', exportSelectedMode: selected,
        dirHandle: null, isSaving: false, isChoosingDirectory: false });
    const output = { blob: null, closed: false, aborted: false };
    const handle = { name: 'Đã chọn.pdf', async createWritable() {
        events.push('create-writable');
        return { async write(blob) { output.blob = blob; events.push('write'); },
            async close() { output.closed = true; events.push('close'); },
            async abort() { output.aborted = true; events.push('abort'); } };
    } };
    window.showSaveFilePicker = async () => { events.push('picker'); return handle; };
    return { org, nodes, getNode, events, alerts, downloads, timers, window, output, handle };
}

async function verifyPDF(blob, expectedWidths, rotations = expectedWidths.map(() => 90)) {
    assert.ok(blob, 'PDF bytes were produced');
    assert.equal(blob.type, 'application/pdf');
    const doc = await PDFLib.PDFDocument.load(await blob.arrayBuffer());
    assert.deepEqual(doc.getPages().map(p => p.getWidth()), expectedWidths);
    assert.deepEqual(doc.getPages().map(p => p.getRotation().angle), rotations);
}

function directory(env, existing = new Set()) {
    const created = [];
    env.org.dirHandle = { name: 'Hồ sơ', async requestPermission() { env.events.push('permission'); return 'granted'; },
        async getFileHandle(name, options) {
            if (options?.create) { created.push(name); return env.handle; }
            if (existing.has(name)) return env.handle;
            throw new DOMException('Missing', 'NotFoundError');
        } };
    return created;
}

test('opens native Save As BEFORE reading/processing the source; writes valid PDF', async () => {
    const e = await setup();
    await e.org.executeSave();
    assert.ok(e.events.indexOf('picker') < e.events.indexOf('read-source'));
    assert.equal(e.output.closed, true);
    await verifyPDF(e.output.blob, [300]);
    assert.equal(e.org.savedHistoryIndex, 4);
    assert.equal(e.org.baseFilename, 'Đã chọn');
    assert.equal(e.downloads.length, 0);
    assert.equal(e.org.isSaving, false);
});

test('selected directory is used directly, including name collision versioning', async () => {
    const e = await setup({ mode: 'directory', name: 'Bản vẽ.pdf' });
    const created = directory(e, new Set(['Bản vẽ.pdf', 'Bản vẽ_v1.pdf']));
    await e.org.executeSave();
    assert.deepEqual(created, ['Bản vẽ_v2.pdf']);
    assert.equal(e.events.includes('picker'), false);
    assert.equal(e.events[0], 'permission');
    assert.equal(e.output.closed, true);
    await verifyPDF(e.output.blob, [300]);
});

test('rechecks collisions after PDF generation', async () => {
    const e = await setup({ mode: 'directory', name: 'Drawing.pdf' });
    const existing = new Set();
    const created = directory(e, existing);
    const read = e.org.files[0].arrayBuffer;
    e.org.files[0].arrayBuffer = async () => { existing.add('Drawing.pdf'); return read(); };
    await e.org.executeSave();
    assert.deepEqual(created, ['Drawing_v1.pdf']);
});

test('cancelling Save As produces no write, download, success, or saved-state change', async () => {
    const e = await setup();
    e.window.showSaveFilePicker = async () => { throw new DOMException('Cancelled', 'AbortError'); };
    await e.org.executeSave();
    assert.equal(e.downloads.length, 0);
    assert.equal(e.output.blob, null);
    assert.equal(e.org.savedHistoryIndex, 1);
    assert.equal(e.org.baseFilename, 'input');
    assert.equal(e.alerts.length, 0);
    assert.equal(e.getNode('po-save-modal').classList.contains('active'), true);
    assert.equal(e.getNode('po-save-confirm').disabled, false);
});

test('picker security error is visible and never silently changes the destination', async () => {
    const e = await setup();
    e.window.showSaveFilePicker = async () => { throw new DOMException('Blocked', 'SecurityError'); };
    await e.org.executeSave();
    assert.equal(e.downloads.length, 0);
    assert.equal(e.org.savedHistoryIndex, 1);
    assert.match(e.alerts[0], /Blocked/);
});

for (const stage of ['write', 'close']) {
    test(`disk ${stage} failure aborts stream and keeps changes unsaved`, async () => {
        const e = await setup();
        e.handle.createWritable = async () => ({
            async write() { if (stage === 'write') throw new Error('Disk full'); },
            async close() { if (stage === 'close') throw new Error('Disk full'); },
            async abort() { e.output.aborted = true; }
        });
        await e.org.executeSave();
        assert.equal(e.output.aborted, true);
        assert.equal(e.org.savedHistoryIndex, 1);
        assert.equal(e.downloads.length, 0);
        assert.match(e.alerts[0], /Disk full/);
        assert.equal(e.org.isSaving, false);
    });
}

test('denied directory permission is reported without falling back', async () => {
    const e = await setup({ mode: 'directory' });
    const created = directory(e);
    e.org.dirHandle.requestPermission = async () => 'denied';
    await e.org.executeSave();
    assert.deepEqual(created, []);
    assert.equal(e.events.includes('read-source'), false);
    assert.equal(e.downloads.length, 0);
    assert.equal(e.org.savedHistoryIndex, 1);
    assert.match(e.alerts[0], /quyền ghi/);
});

test('permission errors during collision checks are NOT treated as missing files', async () => {
    const e = await setup({ mode: 'directory' });
    directory(e);
    e.org.dirHandle.getFileHandle = async () => { throw new DOMException('No access', 'NotAllowedError'); };
    await e.org.executeSave();
    assert.equal(e.output.blob, null);
    assert.equal(e.downloads.length, 0);
    assert.match(e.alerts[0], /No access/);
});

test('browser download keeps Blob URL alive, adds .pdf, and produces valid bytes', async () => {
    const e = await setup({ mode: 'download' });
    await e.org.executeSave();
    assert.equal(e.events.includes('picker'), false);
    assert.equal(e.downloads.length, 1);
    assert.equal(e.downloads[0].filename, 'Bản vẽ.pdf');
    assert.equal(e.events.includes('revoke'), false);
    assert.ok(e.timers[0].ms >= 60000);
    await verifyPDF(e.downloads[0].blob, [300]);
    e.timers[0].fn();
    assert.equal(e.events.includes('revoke'), true);
});

test('exporting selected pages leaves the full document dirty', async () => {
    const e = await setup({ selected: true });
    await e.org.executeSave();
    await verifyPDF(e.output.blob, [300]);
    assert.equal(e.org.savedHistoryIndex, 1);
});

test('concurrent save clicks create only one picker and one write', async () => {
    const e = await setup();
    await Promise.all([e.org.executeSave(), e.org.executeSave()]);
    assert.equal(e.events.filter(x => x === 'picker').length, 1);
    assert.equal(e.events.filter(x => x === 'write').length, 1);
});

test('blank-only documents can be saved without a source file', async () => {
    const e = await setup();
    e.org.files = [];
    e.org.pages = [{ type: 'blank', width: 595, height: 842 }];
    await e.org.executeSave();
    assert.deepEqual(e.alerts, []);
    await verifyPDF(e.output.blob, [595], [0]);
});

for (const name of ['a/b', 'a\\b', 'a:b', 'CON.pdf', 'trailing.']) {
    test(`rejects invalid filename ${JSON.stringify(name)} before opening a picker`, async () => {
        const e = await setup({ name });
        await e.org.executeSave();
        assert.equal(e.events.includes('picker'), false);
        assert.equal(e.downloads.length, 0);
        assert.match(e.alerts[0], /Tên file không hợp lệ/);
    });
}

test('reordered and duplicated original pages save correctly after deleting source pages', async () => {
    const e = await setup();
    e.org.pages = [2, 2, 0].map((pageIndex, i) => ({ type: 'pdf', fileIndex: 0, pageIndex, rotation: i === 1 ? 180 : 90 }));
    await e.org.executeSave();
    assert.deepEqual(e.alerts, []);
    await verifyPDF(e.output.blob, [320, 320, 300], [90, 180, 90]);
});

test('multiple source files retain page order in the saved file', async () => {
    const e = await setup();
    e.org.files.push(e.org.files[0]);
    e.org.pages = [{ type: 'pdf', fileIndex: 1, pageIndex: 2, rotation: 0 },
        { type: 'pdf', fileIndex: 0, pageIndex: 1, rotation: 180 }];
    await e.org.executeSave();
    assert.deepEqual(e.alerts, []);
    await verifyPDF(e.output.blob, [320, 310], [0, 180]);
});
