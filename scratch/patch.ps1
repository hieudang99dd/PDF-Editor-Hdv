$code = Get-Content -Raw "organizer.js"

# 1. Add zoom percentage to toolbar
$code = $code -replace '<button class="po-pv-btn" id="pv-zoom-out" title="Thu nh? \(- / Ctrl -\)">-</button>', '<button class="po-pv-btn" id="pv-zoom-out" title="Thu nh? (Ctrl -)">-</button><span id="pv-zoom-pct" style="font-size:13px; font-weight:600; min-width:45px; text-align:center; color:var(--po-text-light);">100%</span>'
# Or more generic if title is different
$code = $code -replace '(<button class="po-pv-btn" id="pv-zoom-out"[^>]*>.*?</button>)\s*(<button class="po-pv-btn" id="pv-zoom-in")', '$1 <span id="pv-zoom-pct" style="font-size:13px; font-weight:600; min-width:45px; text-align:center; color:var(--po-text-light); user-select:none;">100%</span> $2'

# Write back
Set-Content "organizer.js" $code
