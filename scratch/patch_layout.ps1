$code = Get-Content -Raw "organizer.js"

$oldLayout = '(?s)layoutPreview\(\) \{.*?if \(layer\) layer.style.display = rot === 0 \? '''' : ''none'';\s*\}'

$newLayout = @"
layoutPreview() {
        const img = document.getElementById('po-preview-img');
        const wrapper = document.getElementById('po-preview-wrapper');
        const container = document.getElementById('po-preview-canvas');
        const layer = document.getElementById('po-text-layer');
        if (!img || !wrapper || !container) return;
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page) return;

        let pw = page.width || 595;
        let ph = page.height || 842;
        const rot = ((page.rotation || 0) % 360 + 360) % 360;
        const sideways = rot === 90 || rot === 270;
        const boxW = sideways ? ph : pw;
        const boxH = sideways ? pw : ph;

        const cs = getComputedStyle(container);
        const aw = Math.max(50, container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
        const ah = Math.max(50, container.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom));
        
        if (this.fitMode) {
            const fitScale = this.fitMode === 'width' ? aw / boxW : Math.min(aw / boxW, ah / boxH);
            this.zoomLevel = fitScale;
            this.fitMode = null;
            const pctEl = document.getElementById('pv-zoom-pct');
            if (pctEl) pctEl.textContent = Math.round(this.zoomLevel * 100) + '%';
        }

        const W = Math.round(boxW * (this.zoomLevel || 1));
        const H = Math.round(boxH * (this.zoomLevel || 1));

        wrapper.style.width = W + 'px';
        wrapper.style.height = H + 'px';
        wrapper.style.margin = 'auto';
        wrapper.style.flex = 'none';
        
        Object.assign(img.style, {
            position: 'absolute', maxWidth: 'none', maxHeight: 'none',
            width: W + 'px', height: H + 'px',
            left: '0', top: '0',
            transform: 'none'
        });
        
        if (layer) {
            layer.style.display = rot === 0 ? '' : 'none';
        }
    }
"@

$code = $code -replace $oldLayout, $newLayout
Set-Content "organizer.js" $code
