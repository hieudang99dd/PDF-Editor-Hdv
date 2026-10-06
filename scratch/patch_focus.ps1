$code = Get-Content -Raw "organizer.js"

$oldFocus = '(?s)const cw = container\.clientWidth \|\| 800;.*?const vp = pdfPage\.getViewport\(\{ scale: targetScale \}\);'

$newFocus = @"
                        const cw = container.clientWidth || 800;
                        const ch = container.clientHeight || 800;
                        
                        const baseVp = pdfPage.getViewport({ scale: 1 });
                        page.width = baseVp.width;
                        page.height = baseVp.height;
                        
                        this.renderTextLayer(pdfPage, baseVp, page);
                        
                        const finalRot = (pdfPage.rotate + (page.rotation || 0) + 360) % 360;
                        const rotVp = pdfPage.getViewport({ scale: 1, rotation: finalRot });
                        
                        let targetScale = (this.zoomLevel || 1) * (window.devicePixelRatio || 1);
                        if (rotVp.width * targetScale > 4096 || rotVp.height * targetScale > 4096) {
                            targetScale = Math.min(4096 / rotVp.width, 4096 / rotVp.height);
                        }
                        
                        const vp = pdfPage.getViewport({ scale: targetScale, rotation: finalRot });
"@

$code = $code -replace $oldFocus, $newFocus
Set-Content "organizer.js" $code
