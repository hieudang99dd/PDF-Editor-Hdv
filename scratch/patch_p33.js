const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

code = code.replace(
    /card\.innerHTML = `(.*?)`;/s,
    `card.innerHTML = \`$1
                <div class="po-card-actions">
                    <button class="po-ca-btn po-ca-rot-l" title="Xoay trái">?</button>
                    <button class="po-ca-btn po-ca-rot-r" title="Xoay ph?i">?</button>
                    <button class="po-ca-btn po-ca-del" title="Xóa" style="color:var(--po-danger);">?</button>
                </div>
            \`;`
);

code = code.replace(
    /card\.onclick = e => this\.handleCardClick\(e, p, i\);/,
    `card.onclick = e => this.handleCardClick(e, p, i);
            
            const btnRotL = card.querySelector('.po-ca-rot-l');
            const btnRotR = card.querySelector('.po-ca-rot-r');
            const btnDel = card.querySelector('.po-ca-del');
            
            if (btnRotL) btnRotL.onclick = (e) => { e.stopPropagation(); p.rotation -= 90; this.pushHistory(); this.renderGrid(); if (this.focusedPageId === p.id) this.layoutPreview(); };
            if (btnRotR) btnRotR.onclick = (e) => { e.stopPropagation(); p.rotation += 90; this.pushHistory(); this.renderGrid(); if (this.focusedPageId === p.id) this.layoutPreview(); };
            if (btnDel) btnDel.onclick = (e) => { e.stopPropagation(); this.pages.splice(i, 1); this.pushHistory(); this.renderGrid(); if (this.focusedPageId === p.id && this.pages.length > 0) this.focusPage(this.pages[Math.min(i, this.pages.length - 1)].id); };`
);

fs.writeFileSync('organizer.js', code);

let css = fs.readFileSync('organizer.css', 'utf8');
css += `
.po-card-actions { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; gap: 8px; opacity: 0; transition: opacity 0.2s; z-index: 20; border-radius: 4px; pointer-events: none; }
.po-card:hover .po-card-actions { opacity: 1; pointer-events: auto; }
@media (hover: none) { .po-card.selected .po-card-actions { opacity: 1; pointer-events: auto; } }
.po-ca-btn { background: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.1s; color: var(--po-text); pointer-events: auto; font-size: 16px; }
.po-ca-btn:hover { transform: scale(1.1); }
`;
fs.writeFileSync('organizer.css', css);
