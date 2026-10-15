/**
 * PDF HDV Local Bridge v3.0 (pdf-local-tools.js)
 * Kết nối thông minh tới Local FastAPI Engine (http://127.0.0.1:8000) với:
 * - Tự động thăm dò trạng thái định kỳ (Heartbeat Polling) & đo độ trễ (Latency ms)
 * - Cơ chế tự động chuyển về chế độ xử lý dự phòng trên trình duyệt (Graceful Client Fallback)
 * - Hỗ trợ đầy đủ các tham số nâng cấp: Vector-Preserving OCR, Multi-Tier Compression, Signature Guard
 */
(function (global) {
  'use strict';

  const DEFAULT_ENDPOINTS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000'
  ];

  class HDVLocalBridge {
    constructor(options = {}) {
      this.endpoints = options.endpoints || DEFAULT_ENDPOINTS;
      this.activeBaseUrl = this.endpoints[0];
      this.capabilities = null;
      this.online = false;
      this.latencyMs = null;
      this.listeners = new Set();
      this.pollTimer = null;
    }

    onStatusChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
      }
      return () => this.listeners.delete(callback);
    }

    _notify() {
      const snapshot = {
        online: this.online,
        baseUrl: this.activeBaseUrl,
        latencyMs: this.latencyMs,
        capabilities: this.capabilities
      };
      this.listeners.forEach((cb) => {
        try { cb(snapshot); } catch (_e) {}
      });
    }

    async checkCapabilities(timeoutMs = 2800) {
      for (const base of this.endpoints) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const t0 = performance.now();
        try {
          const res = await fetch(`${base}/api/capabilities`, {
            method: 'GET',
            signal: controller.signal
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            this.activeBaseUrl = base;
            this.online = true;
            this.latencyMs = Math.round(performance.now() - t0);
            this.capabilities = data;
            this._notify();
            return data;
          }
        } catch (_err) {
          clearTimeout(timer);
        }
      }
      this.online = false;
      this.latencyMs = null;
      this.capabilities = null;
      this._notify();
      return null;
    }

    startHeartbeat(intervalMs = 15000) {
      this.stopHeartbeat();
      this.checkCapabilities();
      this.pollTimer = setInterval(() => this.checkCapabilities(), intervalMs);
    }

    stopHeartbeat() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    }

    async convertDocument(file, targetFormat = 'pdf', dpi = 150) {
      if (!this.online) {
        await this.checkCapabilities();
      }
      if (!this.online) {
        throw new Error('Local Engine (127.0.0.1:8000) đang ngoại tuyến. Hãy chạy lệnh uvicorn hoặc docker compose.');
      }
      const form = new FormData();
      form.append('file', file);
      form.append('target', targetFormat);
      form.append('dpi', String(dpi));
      const res = await fetch(`${this.activeBaseUrl}/api/convert`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi chuyển đổi tài liệu từ Local Engine.');
      }
      return await res.blob();
    }

    async runOCR(file, { lang = 'vie+eng', output = 'pdf', preserveVectors = true, dpi = 200 } = {}) {
      if (!this.online) {
        await this.checkCapabilities();
      }
      if (!this.online) {
        throw new Error('Cần khởi động Local Engine (127.0.0.1:8000) có cài đặt Tesseract để thực hiện OCR.');
      }
      const form = new FormData();
      form.append('file', file);
      form.append('lang', lang);
      form.append('output', output);
      form.append('preserve_vectors', String(Boolean(preserveVectors)));
      form.append('dpi', String(dpi));
      const res = await fetch(`${this.activeBaseUrl}/api/ocr`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Lỗi xử lý OCR trên Local Engine.');
      }
      return {
        blob: await res.blob(),
        mode: res.headers.get('X-OCR-Mode') || 'vector-preserved'
      };
    }

    async compressPDF(file, { level = 'ebook', preserveSignatures = true } = {}) {
      if (!this.online) {
        await this.checkCapabilities();
      }
      if (this.online) {
        const form = new FormData();
        form.append('file', file);
        form.append('level', level);
        form.append('preserve_signatures', String(Boolean(preserveSignatures)));
        const res = await fetch(`${this.activeBaseUrl}/api/compress`, {
          method: 'POST',
          body: form
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || 'Lỗi nén PDF từ Local Engine.');
        }
        return {
          blob: await res.blob(),
          originalSize: Number(res.headers.get('X-Original-Size') || file.size),
          compressedSize: Number(res.headers.get('X-Compressed-Size') || 0),
          savedPercent: Number(res.headers.get('X-Saved-Percent') || 0),
          signatureStatus: res.headers.get('X-Digital-Signature-Status') || 'compressed',
          engine: 'local-fastapi'
        };
      }
      // Fallback: Client-side lossless object stream optimization via pdf-lib
      if (global.PDFLib) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await global.PDFLib.PDFDocument.load(arrayBuffer, { updateMetadata: false });
        const outBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        const finalBytes = outBytes.byteLength < arrayBuffer.byteLength ? outBytes : new Uint8Array(arrayBuffer);
        const savedPct = Math.max(0, Number(((1 - finalBytes.byteLength / arrayBuffer.byteLength) * 100).toFixed(2)));
        return {
          blob: new Blob([finalBytes], { type: 'application/pdf' }),
          originalSize: arrayBuffer.byteLength,
          compressedSize: finalBytes.byteLength,
          savedPercent: savedPct,
          signatureStatus: 'browser-lossless',
          engine: 'browser-fallback'
        };
      }
      throw new Error('Không tìm thấy PDFLib để nén dự phòng trên trình duyệt.');
    }
  }

  global.HDVLocalBridge = HDVLocalBridge;
  global.hdvLocalBridge = new HDVLocalBridge();
})(typeof window !== 'undefined' ? window : globalThis);
