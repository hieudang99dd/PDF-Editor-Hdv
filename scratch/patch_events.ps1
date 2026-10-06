$code = Get-Content -Raw "organizer.js"

$oldWheel = '(?s)const pvCanvas = document.getElementById\(''po-preview-canvas''\);\s*let wheelTimeout;\s*pvCanvas.addEventListener\(''wheel'', e => \{.*?(?=\},\s*\{ passive: false \}\);).*?\}\);'

$newWheel = @"
const pvCanvas = document.getElementById('po-preview-canvas');
        let wheelTimeout;
        pvCanvas.addEventListener('wheel', e => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const rect = pvCanvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const zoomFactor = e.deltaY < 0 ? 1.2 : (1 / 1.2);
                this.adjustZoomOrigin(zoomFactor, mouseX, mouseY);
            } else {
                const isScrollable = pvCanvas.scrollHeight > pvCanvas.clientHeight + 10 || pvCanvas.scrollWidth > pvCanvas.clientWidth + 10;
                if (!isScrollable) {
                    e.preventDefault();
                    if (wheelTimeout) return;
                    wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 150);
                    if (e.deltaY > 0) this.navigateRelative(1);
                    else if (e.deltaY < 0) this.navigateRelative(-1);
                }
            }
        }, { passive: false });

        let spacePressed = false;
        document.addEventListener('keydown', e => {
            if (e.code === 'Space' && e.target === document.body) { spacePressed = true; e.preventDefault(); }
        }, { signal: this.abort.signal });
        document.addEventListener('keyup', e => {
            if (e.code === 'Space') spacePressed = false;
        }, { signal: this.abort.signal });

        let isPanning = false, panStartX, panStartY, panScrollL, panScrollT;
        pvCanvas.addEventListener('mousedown', e => {
            if (e.button === 1 || (e.button === 0 && spacePressed)) {
                isPanning = true;
                panStartX = e.clientX; panStartY = e.clientY;
                panScrollL = pvCanvas.scrollLeft; panScrollT = pvCanvas.scrollTop;
                pvCanvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        window.addEventListener('mousemove', e => {
            if (!isPanning) return;
            pvCanvas.scrollLeft = panScrollL - (e.clientX - panStartX);
            pvCanvas.scrollTop = panScrollT - (e.clientY - panStartY);
        }, { signal: this.abort.signal });
        window.addEventListener('mouseup', () => {
            isPanning = false;
            pvCanvas.style.cursor = '';
        }, { signal: this.abort.signal });
"@

$code = $code -replace $oldWheel, $newWheel
Set-Content "organizer.js" $code
