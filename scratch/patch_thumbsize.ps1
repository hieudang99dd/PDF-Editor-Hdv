$code = Get-Content -Raw "organizer.js"

$oldToolbar = '(?s)<div class="po-tool-group">\s*<button class="po-tool-btn" id="po-tb-edit-text">.*?</div>\s*<div class="po-selection-text"'

$newToolbar = @"
<div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-edit-text">? Ch?nh s?a van b?n</button>
                </div>
                <div class="po-tool-group" style="display: flex; align-items: center; padding: 0 8px;">
                    <span style="font-size: 12px; color: var(--po-text-muted); margin-right: 4px;">Th?:</span>
                    <select id="po-tb-thumb-size" style="padding: 2px 4px; font-size: 12px; border: 1px solid var(--po-border); border-radius: 4px; outline: none; background: #fff;">
                        <option value="S">Nh?</option>
                        <option value="M">V?a</option>
                        <option value="L">L?n</option>
                    </select>
                </div>
                <div class="po-selection-text"
"@

$code = $code -replace $oldToolbar, $newToolbar
Set-Content "organizer.js" $code
