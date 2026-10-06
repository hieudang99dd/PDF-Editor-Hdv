$content = Get-Content -Raw ".agents/skills/pdf-editor-completion/references/roadmap-editor.md"
$content = $content -replace '\[ \] P3-1\. Zoom/pan th?t cho xem tru?c', '[x] P3-1. Zoom/pan th?t cho xem tru?c'
$content = $content -replace '(?s)(### \[x\] P3-1\. Zoom/pan th?t cho xem tru?c.*?)(?=\n### \[ )', "$1`n> Xong $(Get-Date -Format 'yyyy-MM-dd'): Thay th? transform: scale b?ng render theo viewport, h? tr? cu?n chu?t xoay/pan.`n"
Set-Content ".agents/skills/pdf-editor-completion/references/roadmap-editor.md" $content
