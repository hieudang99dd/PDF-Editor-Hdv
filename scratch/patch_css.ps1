$css = Get-Content -Raw "organizer.css"
$css = $css -replace '(?s)\.po-preview-canvas \{[^\}]+\}', '.po-preview-canvas { flex: 1; overflow: auto; display: block; position: relative; padding: 24px 24px 80px 24px; text-align: center; }'
$css = $css -replace '(?s)\.po-preview-canvas img \{[^\}]+\}', '.po-preview-canvas img { max-width: none; max-height: none; object-fit: contain; box-shadow: var(--po-shadow); background: #fff; transform-origin: top left; }'
Set-Content "organizer.css" $css
