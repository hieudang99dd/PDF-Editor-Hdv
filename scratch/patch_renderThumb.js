const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

code = code.replace(
    /const baseVp = pdfPage\.getViewport\(\{ scale: 1 \}\);/s,
    `const baseVp = pdfPage.getViewport({ scale: 1 });
            
            const oldW = page.width;
            const oldH = page.height;
            page.width = baseVp.width;
            page.height = baseVp.height;
            
            if (oldW !== page.width || oldH !== page.height) {
                const card = document.querySelector(\`.po-card-wrapper[data-id="\${page.id}"] .po-card\`);
                if (card) {
                    let baseH = 184;
                    if (this.thumbSize === 'S') baseH = 120;
                    if (this.thumbSize === 'L') baseH = 260;
                    const rot = ((page.rotation || 0) % 360 + 360) % 360;
                    const sideways = rot === 90 || rot === 270;
                    const boxW = sideways ? page.height : page.width;
                    const boxH = sideways ? page.width : page.height;
                    let cardW = Math.round(baseH * (boxW / boxH));
                    const maxW = baseH * 2;
                    if (cardW > maxW) cardW = maxW;
                    if (cardW < baseH * 0.5) cardW = Math.round(baseH * 0.5);
                    card.style.width = cardW + 'px';
                }
            }`
);

fs.writeFileSync('organizer.js', code);
