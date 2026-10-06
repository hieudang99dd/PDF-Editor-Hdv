$css = Get-Content -Raw "organizer.css"
$css = $css -replace '(?s)\.po-pv-empty \{[^\}]+\}', '.po-pv-empty { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--po-text-muted); font-size: 14px; font-weight: 500; }'
Set-Content "organizer.css" $css
