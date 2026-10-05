<#
.SYNOPSIS
  Syntax-check the site, bump cache-buster (?v=N), commit, push and wait for GitHub Pages.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File deploy.ps1 -CheckOnly
  powershell -ExecutionPolicy Bypass -File deploy.ps1 -Message "Fix header after back button"
.NOTES
  Keep this file ASCII-only: Windows PowerShell 5.1 reads BOM-less scripts as ANSI.
#>
param(
    [string]$Message,
    [switch]$CheckOnly
)

$Root    = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$SiteUrl = 'https://hieudang99dd.github.io/PDF-Editor-Hdv/'
$Utf8    = New-Object System.Text.UTF8Encoding($false)

function Fail([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Host "Repo root: $Root"
if (-not (Test-Path (Join-Path $Root 'index.html'))) { Fail "index.html not found in $Root" }

# ---- 1. Syntax check: top-level .js files ----
$jsFiles = @(Get-ChildItem -Path $Root -Filter *.js -File)
foreach ($f in $jsFiles) {
    & node --check $f.FullName
    if ($LASTEXITCODE -ne 0) { Fail "Syntax error in $($f.Name)" }
    Write-Host "OK  $($f.Name)"
}

# ---- 2. Syntax check: inline <script> blocks in index.html ----
$inlineCheck = @'
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, bad = 0;
while ((m = re.exec(html))) {
  i++;
  try { new Function(m[1]); } catch (e) { bad++; console.error('Inline script #' + i + ': ' + e.message); }
}
console.log('Inline scripts checked: ' + i);
process.exit(bad ? 1 : 0);
'@
$tmpJs = Join-Path $env:TEMP 'pdfhub_inline_check.js'
[IO.File]::WriteAllText($tmpJs, $inlineCheck, $Utf8)
& node $tmpJs (Join-Path $Root 'index.html')
if ($LASTEXITCODE -ne 0) { Fail 'Syntax error in inline script of index.html' }

if ($CheckOnly) { Write-Host 'Check passed (no changes made).' -ForegroundColor Green; exit 0 }
if ([string]::IsNullOrWhiteSpace($Message)) { Fail 'Provide -Message "..." (english, no diacritics) or use -CheckOnly' }

# ---- 3. Bump cache-buster ?v=N across index.html and top-level .js ----
$targets = @((Join-Path $Root 'index.html')) + @($jsFiles | ForEach-Object { $_.FullName })
$pattern = '(\.(?:js|css))\?v=(\d+)'
$max = 0
foreach ($t in $targets) {
    $txt = [IO.File]::ReadAllText($t, $Utf8)
    foreach ($m in [regex]::Matches($txt, $pattern)) {
        $n = [int]$m.Groups[2].Value
        if ($n -gt $max) { $max = $n }
    }
}
$new = $max + 1
foreach ($t in $targets) {
    $txt = [IO.File]::ReadAllText($t, $Utf8)
    $upd = [regex]::Replace($txt, $pattern, ('$1?v=' + $new))
    if ($upd -ne $txt) { [IO.File]::WriteAllText($t, $upd, $Utf8); Write-Host "Bumped to v=$new : $(Split-Path $t -Leaf)" }
}

# ---- 4. Commit and push ----
Push-Location $Root
try {
    git add -A
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) { Fail 'git commit failed (nothing to commit?)' }
    git push origin master
    if ($LASTEXITCODE -ne 0) { Fail 'git push failed' }
} finally { Pop-Location }

# ---- 5. Wait for GitHub Pages to serve the new version ----
$pollJs = @'
const [url, needle] = process.argv.slice(2);
(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      const t = await (await fetch(url + '?t=' + Date.now(), { cache: 'no-store' })).text();
      if (t.includes(needle)) { console.log('DEPLOYED after ~' + (i * 5) + 's'); return; }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('TIMEOUT: Pages not updated after 150s (check repo Actions tab)');
  process.exit(2);
})();
'@
$tmpPoll = Join-Path $env:TEMP 'pdfhub_poll.js'
[IO.File]::WriteAllText($tmpPoll, $pollJs, $Utf8)
& node $tmpPoll ($SiteUrl + 'index.html') ("organizer.js?v=$new")
exit $LASTEXITCODE
