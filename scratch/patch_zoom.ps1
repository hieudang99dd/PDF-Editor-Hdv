$code = Get-Content -Raw "organizer.js"

$oldZoom = '(?s)adjustZoom\(delta\) \{.*?setZoom\(type\) \{.*?layoutPreview\(\);\s*\}'

$newZoom = @"
adjustZoom(delta) {
        const factor = delta > 0 ? 1.2 : (1 / 1.2);
        this.adjustZoomOrigin(factor);
    }

    adjustZoomOrigin(factor, mouseX, mouseY) {
        if (!this.focusedPageId) return;
        const container = document.getElementById('po-preview-canvas');
        if (!container) return;

        const oldZoom = this.zoomLevel || 1;
        let newZoom = oldZoom * factor;
        newZoom = Math.max(0.1, Math.min(10, newZoom));
        this.zoomLevel = newZoom;

        const pctEl = document.getElementById('pv-zoom-pct');
        if (pctEl) pctEl.textContent = Math.round(this.zoomLevel * 100) + '%';

        this.layoutPreview();

        if (mouseX !== undefined && mouseY !== undefined) {
            const scaleRatio = newZoom / oldZoom;
            container.scrollLeft = (container.scrollLeft + mouseX) * scaleRatio - mouseX;
            container.scrollTop = (container.scrollTop + mouseY) * scaleRatio - mouseY;
        }

        if (this.zoomTimeout) clearTimeout(this.zoomTimeout);
        this.zoomTimeout = setTimeout(() => {
            this.focusPage(this.focusedPageId, true);
        }, 300);
    }
    
    setZoom(type) {
        this.fitMode = type === 'width' ? 'width' : 'page';
        this.zoomLevel = 1;
        this.layoutPreview();
        this.focusPage(this.focusedPageId, true);
    }
"@

$code = $code -replace $oldZoom, $newZoom
Set-Content "organizer.js" $code
