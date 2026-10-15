// Adapted for HDV's static browser/Node runtime, 2026-10-15.
// Upstream: CIT-PDF 1.0.0 / BentoPDF; AGPL-3.0, see ../LICENSE.
import createModule from '../pdfium/editcore.js';
const wasm = new URL('../pdfium/editcore.wasm', import.meta.url);
export const ENGINE_BUILD = 'bentopdf-pdfium@0.0.0-813903c93c75';
export function createEngineModule(options) {
  return createModule({...options, locateFile: (file, prefix) =>
    file.endsWith('.wasm') ? (wasm.protocol === 'file:' ? decodeURIComponent(wasm.pathname) : wasm.href) : prefix + file});
}
