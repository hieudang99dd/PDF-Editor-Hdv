// PDF HVD Region Eraser — single source for file/memory budgets.
// 512 MiB is an input-size ceiling, NOT a guarantee of successful processing
// on devices with insufficient address space or RAM.
export const MAX_INPUT_BYTES = 512 * 1024 * 1024;
export const LARGE_FILE_NOTICE_BYTES = 256 * 1024 * 1024;
export const MAX_RENDER_PIXELS = 16_000_000;
export const PREVIEW_RANGE_CHUNK_BYTES = 256 * 1024;
export const WORKER_IDLE_TIMEOUT_MS = 8 * 60 * 1000;
export const WORKER_MAX_DURATION_MS = 30 * 60 * 1000;

export function validateInputSize(byteLength) {
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0)
    throw new Error('Tệp PDF trống hoặc không hợp lệ.');
  if (byteLength > MAX_INPUT_BYTES)
    throw new Error('PDF vượt giới hạn 512 MiB của công cụ Xóa vector theo vùng.');
  return byteLength;
}

export function recommendedWorkerDurationMs(byteLength, pageCount = 1) {
  validateInputSize(byteLength);
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 500)
    throw new Error('Số trang xử lý không hợp lệ.');
  // Base 6 minutes + 2 minutes per started 64 MiB + 20 seconds per page,
  // bounded at 30 minutes. Also use independent inactivity watchdog.
  return Math.min(WORKER_MAX_DURATION_MS,
    6 * 60_000 + Math.ceil(byteLength / (64 * 1024 * 1024)) * 2 * 60_000 +
    pageCount * 20_000);
}

export function cappedPreviewScale(width, height, requestedScale, pixelRatio = 1) {
  for (const n of [width, height, requestedScale, pixelRatio]) {
    if (!Number.isFinite(n) || n <= 0) throw new Error('Kích thước hiển thị không hợp lệ.');
  }
  const factor = Math.min(1, Math.sqrt(MAX_RENDER_PIXELS /
    (width * height * requestedScale * requestedScale * pixelRatio * pixelRatio)));
  return requestedScale * factor;
}
