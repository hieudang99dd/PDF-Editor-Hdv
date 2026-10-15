#!/usr/bin/env bash
# Kịch bản tự động dọn dẹp dữ liệu thừa và tái cấu trúc tài liệu cho PDF-Editor-Hdv
set -euo pipefail

echo "=== [1/4] Xóa thư mục scratch/ chứa 19 file patch tạm thời ==="
if [ -d "scratch" ]; then
  git rm -rf scratch 2>/dev/null || rm -rf scratch
  echo "Đã xóa thư mục scratch/"
fi

echo "=== [2/4] Xóa các file chạy nháp Playwright ở thư mục gốc ==="
for f in debug_run.py debug_run2.py; do
  if [ -f "$f" ]; then
    git rm -f "$f" 2>/dev/null || rm -f "$f"
    echo "Đã xóa $f"
  fi
done

echo "=== [3/4] Dọn dẹp các file Markdown rời rạc sau khi đã gộp vào README.md & docs/ ==="
mkdir -p docs
OLD_MDS=(
  "CIT-ADVANCED-INTEGRATION.md"
  "CIT-FEATURE-PORTING-MATRIX.md"
  "CIT-INTEGRATION.md"
  "CIT-ORIGINAL-FRONTEND.md"
  "CIT-TEXT-EDITING-UPDATE.md"
  "CIT-TEXT-WORKSPACE.md"
  "IMPLEMENTATION_PROGRESS.md"
  "backend/README.md"
)

for md in "${OLD_MDS[@]}"; do
  if [ -f "$md" ]; then
    git rm -f "$md" 2>/dev/null || rm -f "$md"
    echo "Đã dọn dẹp file Markdown lẻ: $md"
  fi
done

echo "=== [4/4] Hoàn tất dọn dẹp kho lưu trữ PDF-Editor-Hdv! ==="
echo "Các tài liệu tổng hợp mới:"
echo "  - README.md (Tổng quan dự án, Local Engine, Docker & API)"
echo "  - docs/ARCHITECTURE_AND_CIT_INTEGRATION.md (Kiến trúc CIT-PDF, WASM & Công cụ kỹ thuật)"
echo "  - docs/FEATURE_MATRIX_AND_ROADMAP.md (Ma trận tính năng, Thuật toán & Lộ trình)"
