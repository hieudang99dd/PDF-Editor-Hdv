$code = Get-Content -Raw "organizer.js"

$oldGrid = '(?s)const card = document\.createElement\(''div''\);\s*card\.className = `po-card \$\{p\.selected \? ''selected'' : ''''\}`;\s*card\.innerHTML = `'

$newGrid = @"
            let baseH = 184;
            if (this.thumbSize === 'S') baseH = 120;
            if (this.thumbSize === 'L') baseH = 260;
            
            let pw = p.width || 595;
            let ph = p.height || 842;
            const rot = ((p.rotation || 0) % 360 + 360) % 360;
            const sideways = rot === 90 || rot === 270;
            const boxW = sideways ? ph : pw;
            const boxH = sideways ? pw : ph;
            
            const maxW = baseH * 2;
            const cardW = Math.min(maxW, Math.round(baseH * (boxW / boxH)));
            
            const card = document.createElement('div');
            card.className = \`po-card \${p.selected ? 'selected' : ''}\`;
            card.style.width = cardW + 'px';
            card.style.height = baseH + 'px';
            
            card.innerHTML = \`
"@

$code = $code -replace $oldGrid, $newGrid
Set-Content "organizer.js" $code
