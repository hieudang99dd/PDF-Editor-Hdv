const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

// 1. Add select to toolbar
code = code.replace(
    /<div class="po-tool-group">\s*<button class="po-tool-btn" id="po-tb-edit-text">.*?<\/div>\s*<div class="po-selection-text"/s,
    `<div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-edit-text">? Ch?nh s?a van b?n</button>
                </div>
                <div class="po-tool-group" style="display: flex; align-items: center; padding: 0 8px;">
                    <span style="font-size: 12px; color: var(--po-text-muted); margin-right: 4px;">C? th?:</span>
                    <select id="po-tb-thumb-size" style="padding: 2px 4px; font-size: 12px; border: 1px solid var(--po-border); border-radius: 4px; outline: none; background: #fff;">
                        <option value="S">Nh?</option>
                        <option value="M">V?a</option>
                        <option value="L">L?n</option>
                    </select>
                </div>
                <div class="po-selection-text"`
);

// 2. Add thumbSize to constructor
code = code.replace(
    /this\.zoomLevel = 1;\s*this\.thumbObserver/s,
    `this.zoomLevel = 1;\n        this.thumbSize = localStorage.getItem('poThumbSize') || 'M';\n        this.thumbObserver`
);

// 3. Add event listener to bindEvents
code = code.replace(
    /bindEvents\(\) \{\s*if \(\!window\.showSaveFilePicker\)/s,
    `bindEvents() {
        const thumbSelect = document.getElementById('po-tb-thumb-size');
        if (thumbSelect) {
            thumbSelect.value = this.thumbSize;
            thumbSelect.addEventListener('change', e => {
                this.thumbSize = e.target.value;
                localStorage.setItem('poThumbSize', this.thumbSize);
                this.renderGrid();
            });
        }
        if (!window.showSaveFilePicker)`
);

// 4. Update renderGrid
code = code.replace(
    /const card = document\.createElement\('div'\);\s*card\.className = `po-card \$\{p\.selected \? 'selected' : ''\}`;\s*card\.innerHTML = `/s,
    `let baseH = 184;
            if (this.thumbSize === 'S') baseH = 120;
            if (this.thumbSize === 'L') baseH = 260;
            
            let pw = p.width || 595;
            let ph = p.height || 842;
            const rot = ((p.rotation || 0) % 360 + 360) % 360;
            const sideways = rot === 90 || rot === 270;
            const boxW = sideways ? ph : pw;
            const boxH = sideways ? pw : ph;
            
            const maxW = baseH * 2;
            let cardW = Math.round(baseH * (boxW / boxH));
            if (cardW > maxW) cardW = maxW;
            if (cardW < baseH * 0.5) cardW = Math.round(baseH * 0.5); // Min width
            
            const card = document.createElement('div');
            card.className = \`po-card \${p.selected ? 'selected' : ''}\`;
            card.style.width = cardW + 'px';
            card.style.height = baseH + 'px';
            
            card.innerHTML = \``
);

fs.writeFileSync('organizer.js', code);
