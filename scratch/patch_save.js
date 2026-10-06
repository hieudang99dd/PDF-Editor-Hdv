const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

const imgLogic = `} else if (p.type === 'image') {
                        let imgEmbed;
                        if (p.imgFormat === 'png') {
                            imgEmbed = await finalDoc.embedPng(p.imgDataUrl);
                        } else {
                            imgEmbed = await finalDoc.embedJpg(p.imgDataUrl);
                        }
                        const newPage = finalDoc.addPage([p.width, p.height]);
                        newPage.drawImage(imgEmbed, { x: 0, y: 0, width: p.width, height: p.height });
                        if (p.rotation !== 0) newPage.setRotation(window.PDFLib.degrees(p.rotation));
                    `;

code = code.replace(
    /if \(p\.type === 'blank'\) \{\s*finalDoc\.addPage\(\[p\.width \|\| 595, p\.height \|\| 842\]\);\s*\} else \{/g,
    `if (p.type === 'blank') {
                        finalDoc.addPage([p.width || 595, p.height || 842]);
                    ${imgLogic}} else {`
);

fs.writeFileSync('organizer.js', code);
