class PDFOrganizer {
    constructor() {
        this.abort = new AbortController();
        this.files = [];
        this.pages = [];
        this.originalPages = [];
        this.history = [];
        this.historyIndex = -1;
        this.savedHistoryIndex = -1;
        this.pageCounter = 0;
        this.insertIndex = 0;
        
        this.pdfDocs = {}; // Store PDF documents for high-res preview rendering
        this.encrypted = {};
        this.thumbCache = new Map();
        
        this.lastSelectedId = null;
        this.focusedPageId = null;
        this.zoomLevel = 1;
        this.dirHandle = null;
        
        this.thumbQueue = [];
        this.activeThumbRenders = 0;
        
        this.thumbObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target;
                const pageId = img.dataset.id;
                if (entry.isIntersecting) {
                    this.queueThumbnail(pageId, img);
                } else {
                    this.dequeueThumbnail(pageId);
                }
            });
        }, { root: null, rootMargin: '100px' });

        this.initDOM();
    }

    initDOM() {
        if (!document.getElementById('po-style')) {
            const link = document.createElement('link');
            link.id = 'po-style';
            link.rel = 'stylesheet';
            link.href = 'organizer.css?v=9';
            document.head.appendChild(link);
        }
        
        const mainHTML = `
        <div class="po-container">
            <header class="po-header">
                <div class="po-header-left">
                    <button class="po-icon-btn" id="po-back" title="Quay lại">←</button>
                    <div class="po-title">Chỉnh sửa PDF</div>
                </div>
                <div class="po-header-right">
                    <button class="po-icon-btn" id="po-undo" title="Hoàn tác (Ctrl+Z)" disabled>↶</button>
                    <button class="po-icon-btn" id="po-redo" title="Làm lại (Ctrl+Y)" disabled>↷</button>
                    <button class="po-primary-btn" id="po-save" disabled>Lưu tài liệu</button>
                </div>
            </header>
            
            <div class="po-toolbar">
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-add-blank">📄 Trang trống</button>
                    <button class="po-tool-btn" id="po-tb-add-pdf">📑 Chèn từ PDF</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-rot-l" disabled>↶ Xoay trái</button>
                    <button class="po-tool-btn" id="po-tb-rot-r" disabled>↷ Xoay phải</button>
                    <button class="po-tool-btn" id="po-tb-dup" disabled>⧉ Nhân đôi</button>
                    <button class="po-tool-btn" id="po-tb-del" disabled style="color:var(--po-danger)">🗑 Xóa</button>
                </div>
                <div class="po-selection-text" id="po-sel-text" style="display:none;"></div>
            </div>
            
            <div class="po-workspace" id="po-ws" style="display:none;">
                <div class="po-left-col">
                    <div class="po-meta-card">
                        <div class="po-meta-title" id="po-meta-title">Tài liệu</div>
                        <div class="po-meta-info" id="po-meta-info">PDF | -- MB</div>
                        <div class="po-meta-stats">
                            <span class="po-meta-badge" id="po-meta-init">Ban đầu: 0</span>
                            <span class="po-meta-badge" id="po-meta-curr">Hiện tại: 0</span>
                            <span class="po-meta-badge add" id="po-meta-add">Thêm: +0</span>
                            <span class="po-meta-badge del" id="po-meta-del">Xóa: -0</span>
                        </div>
                        <div class="po-meta-changes" id="po-meta-changes"></div>
                        <div class="po-meta-deleted" id="po-meta-deleted">Lịch sử xóa: Không có</div>
                    </div>
                    <div class="po-main-scroll" id="po-main-scroll">
                        <div class="po-grid" id="po-grid"></div>
                    </div>
                </div>
                
                <div class="po-right-col">
                    <div class="po-preview-canvas" id="po-preview-canvas">
                        <div class="po-pv-empty" id="po-pv-empty">Chọn một trang để xem trước</div>
                        <img id="po-preview-img" src="" style="display:none;">
                    </div>
                    <div class="po-preview-toolbar" id="po-pv-tb" style="display:none;">
                        <button class="po-pv-btn" id="pv-first" title="Trang đầu">|&lt;</button>
                        <button class="po-pv-btn" id="pv-prev" title="Trang trước">&lt;</button>
                        <input type="text" id="pv-page-input" class="po-pv-input" title="Nhập trang và nhấn Enter" value="1">
                        <span class="po-pv-text"> / <span id="pv-page-total">1</span></span>
                        <button class="po-pv-btn" id="pv-next" title="Trang sau">&gt;</button>
                        <button class="po-pv-btn" id="pv-last" title="Trang cuối">&gt;|</button>
                        <div class="po-pv-toolbar-sep"></div>
                        <button class="po-pv-btn" id="pv-zoom-out" title="Thu nhỏ">-</button>
                        <button class="po-pv-btn" id="pv-zoom-in" title="Phóng to">+</button>
                        <button class="po-pv-btn" id="pv-fit-w">Fit Width</button>
                        <button class="po-pv-btn" id="pv-fit-p">Fit Page</button>
                    </div>
                </div>
            </div>
            
            <div id="po-initial-upload" class="po-upload-area">
                <div class="po-upload-icon">📄</div>
                <h3 class="po-upload-text">Tải lên tệp PDF</h3>
                <p class="po-upload-sub">Kéo thả hoặc nhấp để chọn tệp</p>
            </div>
            
            <input type="file" id="po-file-input" accept=".pdf" multiple hidden>
            <input type="file" id="po-insert-file" accept=".pdf" multiple hidden>
            
            <div class="po-loading" id="po-loading">
                <div style="font-size:20px; color:var(--po-primary); margin-bottom:8px; font-weight:600;" id="po-loading-text">Đang xử lý...</div>
                <div class="po-progress-bar"><div class="po-progress-fill" id="po-progress"></div></div>
            </div>
            
            <!-- Save Modal -->
            <div class="po-modal-overlay" id="po-save-modal">
                <div class="po-modal">
                    <h3 class="po-modal-title">Lưu tài liệu thông minh</h3>
                    <div class="po-form-group">
                        <label class="po-form-label">Tên file</label>
                        <input type="text" id="po-save-filename" class="po-form-input">
                    </div>
                    <div class="po-modal-footer">
                        <button class="po-tool-btn" id="po-save-cancel">Hủy</button>
                        <button class="po-primary-btn" id="po-save-confirm">Tải xuống</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = mainHTML;
        this.appNode = temp.firstElementChild;
        document.body.appendChild(this.appNode);

        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('beforeunload', e => {
            if (this.historyIndex !== this.savedHistoryIndex && this.historyIndex !== -1) {
                e.preventDefault();
                e.returnValue = '';
            }
        }, { signal: this.abort.signal });

        document.getElementById('po-back').onclick = () => {
            if (this.historyIndex !== this.savedHistoryIndex && this.historyIndex !== -1) {
                if (!confirm('Bạn có thay đổi chưa lưu. Chắc chắn muốn thoát?')) return;
            }
            this.destroy();
            if (typeof back === 'function') {
                document.querySelector('header').style.display = 'flex';
                back();
            } else {
                document.getElementById('home').style.display = 'block';
                document.querySelector('header').style.display = 'flex';
                document.getElementById('ws').style.display = 'none';
            }
        };

        const initUpload = document.getElementById('po-initial-upload');
        const fileIn = document.getElementById('po-file-input');
        initUpload.onclick = () => fileIn.click();
        initUpload.ondragover = e => { e.preventDefault(); initUpload.style.borderColor = 'var(--po-primary)'; };
        initUpload.ondragleave = () => initUpload.style.borderColor = '';
        initUpload.ondrop = e => { e.preventDefault(); this.handleFiles(e.dataTransfer.files, 0); };
        fileIn.onchange = e => this.handleFiles(e.target.files, 0);

        document.getElementById('po-tb-add-blank').onclick = () => this.addBlankPage(this.pages.length);
        document.getElementById('po-tb-add-pdf').onclick = () => { this.insertIndex = this.pages.length; document.getElementById('po-insert-file').click(); };
        document.getElementById('po-insert-file').onchange = e => this.handleFiles(e.target.files, this.insertIndex);

        document.getElementById('po-tb-rot-l').onclick = () => this.actionSelected(p => p.rotation = (p.rotation - 90) % 360);
        document.getElementById('po-tb-rot-r').onclick = () => this.actionSelected(p => p.rotation = (p.rotation + 90) % 360);
        document.getElementById('po-tb-dup').onclick = () => this.duplicateSelected();
        document.getElementById('po-tb-del').onclick = () => this.deleteSelected();

        document.getElementById('po-undo').onclick = () => this.undo();
        document.getElementById('po-redo').onclick = () => this.redo();
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', e => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
            if (document.getElementById('po-save-modal').classList.contains('active')) return;
            
            if (e.ctrlKey || e.metaKey) {
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    this.undo();
                }
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    this.redo();
                }
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    this.pages.forEach(p => p.selected = true);
                    this.updateSelection();
                    this.renderGrid();
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.deleteSelected();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.navigateKeyboard(e.key);
            }
        }, { signal: this.abort.signal });

        // Save Flow
        document.getElementById('po-save').onclick = () => this.showSaveModal();
        document.getElementById('po-save-cancel').onclick = () => document.getElementById('po-save-modal').classList.remove('active');
        document.getElementById('po-save-confirm').onclick = () => this.executeSave();

        // Preview Toolbar
        document.getElementById('pv-zoom-in').onclick = () => this.adjustZoom(0.2);
        document.getElementById('pv-zoom-out').onclick = () => this.adjustZoom(-0.2);
        document.getElementById('pv-fit-w').onclick = () => this.setZoom('width');
        document.getElementById('pv-fit-p').onclick = () => this.setZoom('page');
        document.getElementById('pv-first').onclick = () => this.navigateToPage(0);
        document.getElementById('pv-prev').onclick = () => this.navigateRelative(-1);
        document.getElementById('pv-next').onclick = () => this.navigateRelative(1);
        document.getElementById('pv-last').onclick = () => this.navigateToPage(this.pages.length - 1);
        document.getElementById('pv-page-input').onkeydown = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                let val = parseInt(e.target.value);
                if (!isNaN(val)) this.navigateToPage(val - 1);
            }
        };
    }

    async loadScripts() {
        if (!window.pdfjsLib) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                s.onload = () => {
                    window.pdfjsLib = window['pdfjs-dist/build/pdf'];
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    resolve();
                };
                document.head.appendChild(s);
            });
        }
        if (!window.Sortable) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js';
                s.onload = resolve;
                document.head.appendChild(s);
            });
        }
        // window.PDFLib is already loaded in index.html
    }

    async handleFiles(fileList, insertAt) {
        if (!fileList.length) return;
        const pdfFiles = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (!pdfFiles.length) return alert('Vui lòng chọn tệp PDF');
        
        this.showLoading('Đang đọc trang...');
        await this.loadScripts();
        
        const isFirstUpload = (this.files.length === 0);
        const startIndex = this.files.length;
        this.files = [...this.files, ...pdfFiles];
        
        if (isFirstUpload) {
            this.baseFilename = pdfFiles[0].name.replace(/\.pdf$/i, '');
            const sizeMB = (pdfFiles[0].size / (1024*1024)).toFixed(1);
            document.getElementById('po-meta-title').textContent = this.baseFilename;
            document.getElementById('po-meta-info').textContent = `PDF | ${sizeMB} MB`;
            document.getElementById('po-initial-upload').style.display = 'none';
            document.getElementById('po-ws').style.display = 'flex';
        }
        
        let newPages = [];
        for (let i = 0; i < pdfFiles.length; i++) {
            const f = pdfFiles[i];
            if (!f.objUrl) f.objUrl = URL.createObjectURL(f);
            const pdf = await pdfjsLib.getDocument(f.objUrl).promise;
            this.pdfDocs[startIndex + i] = pdf;
            
            try {
                const perms = await pdf.getPermissions();
                if (perms !== null) {
                    this.encrypted[startIndex + i] = true;
                    if (typeof toast === 'function') {
                        toast('Tệp có bảo vệ quyền. Khi lưu sẽ được chuyển thành dạng ảnh.');
                    }
                }
            } catch (e) {
                console.warn('Could not check permissions', e);
            }
            
            for (let p = 1; p <= pdf.numPages; p++) {
                const pageId = 'pg_' + (this.pageCounter++);
                newPages.push({
                    id: pageId,
                    fileIndex: startIndex + i,
                    pageIndex: p - 1,
                    rotation: 0,
                    dataUrl: null, // Render lazily
                    selected: false,
                    type: 'pdf',
                    width: 595,
                    height: 842
                });
                
                if (isFirstUpload) {
                    this.originalPages.push({ id: pageId, pageNum: p });
                }
            }
            this.updateProgress(((i+1)/pdfFiles.length)*100);
        }
        
        this.pages.splice(insertAt, 0, ...newPages);
        this.hideLoading();
        this.pushHistory();
        this.renderGrid();
        if (isFirstUpload && this.pages.length > 0) {
            this.focusPage(this.pages[0].id);
        }
    }

    queueThumbnail(pageId, img) {
        if (!this.thumbQueue.find(q => q.pageId === pageId)) {
            this.thumbQueue.unshift({ pageId, img });
            this.processThumbQueue();
        }
    }

    dequeueThumbnail(pageId) {
        this.thumbQueue = this.thumbQueue.filter(q => q.pageId !== pageId);
    }

    async processThumbQueue() {
        if (this.activeThumbRenders >= 3 || this.thumbQueue.length === 0) return;
        
        this.activeThumbRenders++;
        const { pageId, img } = this.thumbQueue.shift();
        
        try {
            await this.renderThumbnail(pageId, img);
            this.thumbObserver.unobserve(img);
        } catch (e) {
            console.error('Lỗi render thumbnail', e);
        } finally {
            this.activeThumbRenders--;
            this.processThumbQueue();
        }
    }

    async renderThumbnail(pageId, imgElement) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) return;
        
        const cacheKey = page.type === 'blank' ? page.id : `${page.fileIndex}:${page.pageIndex}`;
        
        if (this.thumbCache.has(cacheKey)) {
            page.dataUrl = this.thumbCache.get(cacheKey);
            imgElement.src = page.dataUrl;
            return;
        }

        if (page.type !== 'pdf' || page.dataUrl) {
            if (page.dataUrl) imgElement.src = page.dataUrl;
            return;
        }
        
        try {
            const pdf = this.pdfDocs[page.fileIndex];
            const pdfPage = await pdf.getPage(page.pageIndex + 1);
            
            const baseVp = pdfPage.getViewport({ scale: 1 });
            const maxDim = 300;
            let scale = Math.min(maxDim / baseVp.width, maxDim / baseVp.height);
            if (scale > 1) scale = 1; // Don't upscale tiny pages too much
            
            const vp = pdfPage.getViewport({ scale });
            const cvs = document.createElement('canvas');
            const ctx = cvs.getContext('2d');
            cvs.width = vp.width; cvs.height = vp.height;
            await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;
            
            cvs.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                page.dataUrl = url;
                page.width = vp.width;
                page.height = vp.height;
                
                this.thumbCache.set(cacheKey, url);
                
                if (imgElement.dataset.id === pageId) {
                    imgElement.src = url;
                }
                
                if (this.focusedPageId === pageId) {
                    const pvImg = document.getElementById('po-preview-img');
                    if (!pvImg.src || pvImg.src === window.location.href || pvImg.src.endsWith('null')) {
                        pvImg.src = url;
                    }
                }
            }, 'image/jpeg', 0.8);
        } catch (e) {
            console.error('Error rendering thumbnail', e);
        }
    }

    addBlankPage(insertAt) {
        const pageId = 'pg_' + (this.pageCounter++);
        const cvs = document.createElement('canvas');
        cvs.width = 400; cvs.height = 565;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,400,565);
        const dataUrl = cvs.toDataURL();
        
        this.thumbCache.set(pageId, dataUrl);
        
        this.pages.splice(insertAt, 0, {
            id: pageId, type: 'blank', width: 595, height: 842,
            rotation: 0, dataUrl: dataUrl, selected: false
        });
        this.pushHistory();
        this.renderGrid();
    }

    pushHistory() {
        const snapshot = this.pages.map(p => ({
            id: p.id,
            type: p.type,
            fileIndex: p.fileIndex,
            pageIndex: p.pageIndex,
            rotation: p.rotation,
            width: p.width,
            height: p.height
        }));
        const state = JSON.stringify(snapshot);
        if (this.historyIndex >= 0 && this.history[this.historyIndex] === state) return;
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        this.updateUndoRedo();
        this.updateStats();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState();
        }
    }

    restoreState() {
        const snapshot = JSON.parse(this.history[this.historyIndex]);
        const selectedIds = new Set(this.pages.filter(p => p.selected).map(p => p.id));
        
        this.pages = snapshot.map(p => {
            const cacheKey = p.type === 'blank' ? p.id : `${p.fileIndex}:${p.pageIndex}`;
            return {
                ...p,
                selected: selectedIds.has(p.id),
                dataUrl: this.thumbCache.get(cacheKey) || null
            };
        });
        this.renderGrid();
        this.updateUndoRedo();
        this.updateStats();
    }
    
    updateUndoRedo() {
        document.getElementById('po-undo').disabled = this.historyIndex <= 0;
        document.getElementById('po-redo').disabled = this.historyIndex >= this.history.length - 1;
        document.getElementById('po-save').disabled = this.pages.length === 0;
    }

    updateStats() {
        if (!this.originalPages || this.originalPages.length === 0) return;
        const init = this.originalPages.length;
        const curr = this.pages.length;
        document.getElementById('po-meta-init').textContent = `Ban đầu: ${init}`;
        document.getElementById('po-meta-curr').textContent = `Hiện tại: ${curr}`;
        
        const currentPageIds = new Set(this.pages.map(p => p.id));
        const deletedOriginals = this.originalPages.filter(op => !currentPageIds.has(op.id)).map(op => op.pageNum);
        const addedCount = this.pages.filter(p => !this.originalPages.some(op => op.id === p.id)).length;
        
        document.getElementById('po-meta-add').textContent = `Thêm: +${addedCount}`;
        document.getElementById('po-meta-del').textContent = `Xóa: -${deletedOriginals.length}`;
        document.getElementById('po-meta-deleted').textContent = deletedOriginals.length > 0 ? `Lịch sử xóa gốc: Trang ${deletedOriginals.join(', ')}` : 'Lịch sử xóa gốc: Không có';
        
        let changesStr = [];
        if (addedCount > 0) changesStr.push(`thêm ${addedCount} trang`);
        if (deletedOriginals.length > 0) changesStr.push(`xóa ${deletedOriginals.length} trang`);
        if (this.pages.some(p => p.rotation !== 0)) changesStr.push(`xoay trang`);
        
        const changesEl = document.getElementById('po-meta-changes');
        if (changesStr.length > 0) {
            changesEl.textContent = `Đã thay đổi: ${changesStr.join(', ')}`;
            changesEl.style.display = 'block';
        } else {
            changesEl.style.display = 'none';
        }
    }

    actionSelected(fn) {
        let changed = false;
        this.pages.forEach(p => { if (p.selected) { fn(p); changed = true; } });
        if (changed) { this.pushHistory(); this.updateRotationDOM(); }
    }
    
    deleteSelected() {
        this.pages = this.pages.filter(p => !p.selected);
        this.pushHistory();
        this.renderGrid();
    }
    
    duplicateSelected() {
        let newPages = [];
        this.pages.forEach(p => {
            newPages.push(p);
            if (p.selected) {
                const dup = JSON.parse(JSON.stringify(p));
                dup.id = 'pg_' + (this.pageCounter++);
                dup.selected = false;
                newPages.push(dup);
            }
        });
        this.pages = newPages;
        this.pushHistory();
        this.renderGrid();
    }

    updateSelection() {
        const selCount = this.pages.filter(p => p.selected).length;
        const txt = document.getElementById('po-sel-text');
        
        if (selCount === 0) {
            txt.style.display = 'none';
        } else if (selCount === 1) {
            const idx = this.pages.findIndex(p => p.selected);
            txt.textContent = `Đang chọn: Trang ${idx + 1}`;
            txt.style.display = 'block';
        } else {
            txt.textContent = `Đã chọn: ${selCount} trang`;
            txt.style.display = 'block';
        }
        
        ['po-tb-rot-l', 'po-tb-rot-r', 'po-tb-dup', 'po-tb-del'].forEach(id => {
            document.getElementById(id).disabled = selCount === 0;
        });
    }

    updateSelectionDOM() {
        this.pages.forEach(p => {
            const card = document.querySelector(`.po-card-wrapper[data-id="${p.id}"] .po-card`);
            if (card) {
                if (p.selected) card.classList.add('selected');
                else card.classList.remove('selected');
            }
        });
        this.updateSelection();
    }

    updateRotationDOM() {
        this.pages.forEach(p => {
            const img = document.querySelector(`.po-card-wrapper[data-id="${p.id}"] img`);
            if (img) {
                img.style.transform = `rotate(${p.rotation}deg)`;
            }
        });
    }

    renderGrid() {
        const grid = document.getElementById('po-grid');
        grid.innerHTML = '';
        
        this.pages.forEach((p, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'po-card-wrapper';
            wrapper.dataset.id = p.id;
            
            const card = document.createElement('div');
            card.className = `po-card ${p.selected ? 'selected' : ''}`;
            
            card.innerHTML = `
                <div class="po-card-num">${i + 1}</div>
                <div class="po-card-preview">
                    <img data-id="${p.id}" ${p.dataUrl ? `src="${p.dataUrl}"` : ''} style="transform: rotate(${p.rotation}deg); ${p.type==='blank'?'border:1px solid #e2e8f0':''}" loading="lazy">
                </div>
                <div class="po-card-label">${p.type === 'blank' ? 'Trang trống' : 'Trang ' + (p.pageIndex + 1)}</div>
            `;
            
            // Interaction
            card.onclick = e => this.handleCardClick(e, p, i);
            
            // Long press for mobile
            let touchTimer;
            card.addEventListener('touchstart', e => {
                touchTimer = setTimeout(() => {
                    p.selected = true;
                    this.updateSelectionDOM();
                    navigator.vibrate?.(50);
                }, 500);
            });
            card.addEventListener('touchend', () => clearTimeout(touchTimer));
            card.addEventListener('touchmove', () => clearTimeout(touchTimer));

            wrapper.appendChild(card);
            grid.appendChild(wrapper);
            
            // Lazy load thumbnail
            if (!p.dataUrl && p.type === 'pdf') {
                const img = card.querySelector('img');
                this.thumbObserver.observe(img);
            }
        });
        
        this.updateSelection();
        this.initSortable();
    }

    handleCardClick(e, p, index) {
        if (e.shiftKey && this.lastSelectedId) {
            const lastIdx = this.pages.findIndex(page => page.id === this.lastSelectedId);
            const start = Math.min(lastIdx, index);
            const end = Math.max(lastIdx, index);
            for (let i = start; i <= end; i++) {
                this.pages[i].selected = true;
            }
        } else if (e.ctrlKey || e.metaKey) {
            p.selected = !p.selected;
            if (p.selected) this.lastSelectedId = p.id;
        } else {
            this.pages.forEach(page => page.selected = false);
            p.selected = true;
            this.lastSelectedId = p.id;
        }
        
        // Focus for preview
        if (p.selected) {
            this.focusPage(p.id);
        }
        
        this.updateSelectionDOM();
    }

    focusPage(id, forceRender = false) {
        const pageChanged = (this.focusedPageId !== id);
        this.focusedPageId = id;
        const page = this.pages.find(p => p.id === id);
        if (!page) return;
        
        document.getElementById('po-pv-empty').style.display = 'none';
        document.getElementById('po-pv-tb').style.display = 'flex';
        
        const currIdx = this.pages.findIndex(p => p.id === id);
        if (currIdx !== -1) {
            document.getElementById('pv-page-input').value = currIdx + 1;
        }
        document.getElementById('pv-page-total').textContent = this.pages.length;
        
        const img = document.getElementById('po-preview-img');
        img.dataset.id = id;
        
        if (pageChanged || forceRender) {
            // Hiển thị lập tức thumbnail (low-res) để tránh giật lag
            if (page.dataUrl) {
                img.src = page.dataUrl;
            } else {
                img.removeAttribute('src');
                this.renderThumbnail(page.id, img);
            }
            
            if (this.previewTask) {
                this.previewTask.cancel();
                this.previewTask = null;
            }

            // Xử lý render high-res bất đồng bộ
            if (page.type === 'pdf') {
                const pdf = this.pdfDocs[page.fileIndex];
                if (pdf) {
                    const taskObj = { cancelled: false };
                    this.previewTask = { cancel: () => { taskObj.cancelled = true; } };

                    pdf.getPage(page.pageIndex + 1).then(pdfPage => {
                        if (taskObj.cancelled) return;
                        
                        const container = document.getElementById('po-preview-canvas');
                        const cw = container.clientWidth || 800;
                        const ch = container.clientHeight || 800;
                        const baseVp = pdfPage.getViewport({ scale: 1 });
                        
                        const fitScale = Math.min(cw / baseVp.width, ch / baseVp.height);
                        let targetScale = fitScale * (window.devicePixelRatio || 1) * Math.max(1, this.zoomLevel) * 2;
                        
                        if (baseVp.width * targetScale > 4096 || baseVp.height * targetScale > 4096) {
                            targetScale = Math.min(4096 / baseVp.width, 4096 / baseVp.height);
                        }
                        
                        const vp = pdfPage.getViewport({ scale: targetScale });
                        const cvs = document.createElement('canvas');
                        const ctx = cvs.getContext('2d');
                        cvs.width = vp.width; cvs.height = vp.height;
                        
                        const renderTask = pdfPage.render({ canvasContext: ctx, viewport: vp });
                        taskObj.cancel = () => { taskObj.cancelled = true; renderTask.cancel(); };
                        this.previewTask.cancel = taskObj.cancel;

                        return renderTask.promise.then(() => {
                            if (taskObj.cancelled || this.focusedPageId !== id) return;
                            cvs.toBlob(blob => {
                                if (taskObj.cancelled || this.focusedPageId !== id) return;
                                if (this.previewObjUrl) URL.revokeObjectURL(this.previewObjUrl);
                                this.previewObjUrl = URL.createObjectURL(blob);
                                img.src = this.previewObjUrl;
                            }, 'image/jpeg', 0.9);
                        });
                    }).catch(e => {
                        if (e.name !== 'RenderingCancelledException' && e.message !== 'Rendering cancelled.') {
                            console.error('Lỗi render high-res:', e);
                        }
                    });
                }
            }
        }
        
        img.style.display = 'block';
        img.style.transform = `scale(${this.zoomLevel}) rotate(${page.rotation}deg)`;
    }

    navigateKeyboard(key) {
        if (this.pages.length === 0) return;
        let currIdx = this.pages.findIndex(p => p.id === this.focusedPageId);
        if (currIdx === -1) currIdx = 0;
        
        if (key === 'ArrowRight' || key === 'ArrowDown') {
            currIdx = Math.min(this.pages.length - 1, currIdx + 1);
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
            currIdx = Math.max(0, currIdx - 1);
        }
        
        this.navigateToPage(currIdx);
    }
    
    navigateRelative(delta) {
        if (this.pages.length === 0) return;
        let currIdx = this.pages.findIndex(p => p.id === this.focusedPageId);
        if (currIdx === -1) currIdx = 0;
        this.navigateToPage(currIdx + delta);
    }
    
    navigateToPage(index) {
        if (this.pages.length === 0) return;
        index = Math.max(0, Math.min(this.pages.length - 1, index));
        
        this.pages.forEach(p => p.selected = false);
        this.pages[index].selected = true;
        this.lastSelectedId = this.pages[index].id;
        this.focusPage(this.pages[index].id);
        this.updateSelectionDOM();
        
        // Scroll to view
        const wrapper = document.querySelector(`.po-card-wrapper[data-id="${this.pages[index].id}"]`);
        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    adjustZoom(delta) {
        this.zoomLevel = Math.max(0.2, Math.min(3, this.zoomLevel + delta));
        this.focusPage(this.focusedPageId);
    }
    
    setZoom(type) {
        const img = document.getElementById('po-preview-img');
        const canvas = document.getElementById('po-preview-canvas');
        if (type === 'width') {
            img.style.width = '100%';
            img.style.height = 'auto';
            this.zoomLevel = 1;
        } else {
            img.style.width = 'auto';
            img.style.height = '100%';
            this.zoomLevel = 1;
        }
        img.style.transform = `rotate(${this.pages.find(p => p.id === this.focusedPageId)?.rotation || 0}deg)`;
    }

    initSortable() {
        if(this.sortable) this.sortable.destroy();
        const grid = document.getElementById('po-grid');
        this.sortable = new Sortable(grid, {
            animation: 150,
            draggable: '.po-card-wrapper',
            ghostClass: 'sortable-ghost',
            onEnd: e => {
                if (e.oldIndex !== e.newIndex) {
                    const movedItem = this.pages.splice(e.oldIndex, 1)[0];
                    this.pages.splice(e.newIndex, 0, movedItem);
                    this.pushHistory();
                    
                    // Update numbers directly without rebuilding DOM
                    const nums = grid.querySelectorAll('.po-card-num');
                    nums.forEach((el, i) => { el.textContent = i + 1; });
                }
            }
        });
    }

    showLoading(msg) {
        document.getElementById('po-loading').style.display = 'flex';
        document.getElementById('po-loading-text').textContent = msg;
        document.getElementById('po-progress').style.width = '0%';
    }
    hideLoading() {
        document.getElementById('po-loading').style.display = 'none';
    }
    updateProgress(pct) {
        document.getElementById('po-progress').style.width = pct + '%';
    }

    /* --- Smart Save Logic --- */
    showSaveModal() {
        let name = this.baseFilename;
        // Auto versioning regex logic
        let match = name.match(/_v(\d+)$/);
        if (match) {
            name = name.replace(/_v\d+$/, '') + '_v' + (parseInt(match[1]) + 1);
        } else {
            name = name + '_v1';
        }
        
        document.getElementById('po-save-filename').value = name + '.pdf';
        document.getElementById('po-save-modal').classList.add('active');
    }

    async executeSave() {
        document.getElementById('po-save-modal').classList.remove('active');
        
        const hasEncrypted = this.pages.some(p => p.type === 'pdf' && this.encrypted[p.fileIndex]);
        if (hasEncrypted) {
            if (!confirm('Tài liệu có chứa trang từ tệp được bảo vệ quyền. Các trang này sẽ được lưu dưới dạng ảnh (không thể chọn chữ). Tiếp tục?')) {
                return;
            }
        }
        
        this.showLoading('Đang xử lý PDF trên trình duyệt...');
        this.updateProgress(10);
        
        try {
            const { PDFDocument } = window.PDFLib;
            let finalDoc;
            
            const isSingleFile = this.files.length === 1 && !this.encrypted[0];
            
            if (isSingleFile) {
                // Chiến lược A: Giữ nguyên doc gốc để giữ bookmark
                const buffer = await this.files[0].arrayBuffer();
                finalDoc = await PDFDocument.load(buffer);
                
                if (finalDoc.getForm && finalDoc.getForm().getFields) {
                    const hasSig = finalDoc.getForm().getFields().some(f => f.constructor.name === 'PDFSignature');
                    if (hasSig && !confirm('File có chữ ký số. Chữ ký sẽ mất hiệu lực sau khi chỉnh sửa. Tiếp tục?')) {
                        this.hideLoading();
                        return;
                    }
                }
                
                const origPages = finalDoc.getPages();
                
                // Xóa tất cả trang hiện có
                const pageCount = finalDoc.getPageCount();
                for (let i = pageCount - 1; i >= 0; i--) {
                    finalDoc.removePage(i);
                }
                
                const processedIndices = new Set();
                for (let i = 0; i < this.pages.length; i++) {
                    const p = this.pages[i];
                    if (p.type === 'blank') {
                        finalDoc.addPage([p.width || 595, p.height || 842]);
                    } else {
                        if (!processedIndices.has(p.pageIndex)) {
                            finalDoc.addPage(origPages[p.pageIndex]);
                            processedIndices.add(p.pageIndex);
                            
                            const lastAdded = finalDoc.getPage(finalDoc.getPageCount() - 1);
                            if (p.rotation !== 0) {
                                const currentRot = lastAdded.getRotation().angle;
                                lastAdded.setRotation(window.PDFLib.degrees(currentRot + p.rotation));
                            }
                        } else {
                            // Bản sao (nhân đôi)
                            const [copiedPage] = await finalDoc.copyPages(finalDoc, [p.pageIndex]);
                            finalDoc.addPage(copiedPage);
                            if (p.rotation !== 0) {
                                const currentRot = copiedPage.getRotation().angle;
                                copiedPage.setRotation(window.PDFLib.degrees(currentRot + p.rotation));
                            }
                        }
                    }
                    this.updateProgress(30 + (50 * i / this.pages.length));
                }
            } else {
                // Chiến lược B: Nhiều file hoặc có file mã hóa
                finalDoc = await PDFDocument.create();
                
                // Chép metadata từ file đầu tiên (nếu không mã hóa)
                if (!this.encrypted[0]) {
                    const buffer = await this.files[0].arrayBuffer();
                    const firstDoc = await PDFDocument.load(buffer);
                    if (firstDoc.getTitle()) finalDoc.setTitle(firstDoc.getTitle());
                    if (firstDoc.getAuthor()) finalDoc.setAuthor(firstDoc.getAuthor());
                    if (firstDoc.getSubject()) finalDoc.setSubject(firstDoc.getSubject());
                    if (firstDoc.getKeywords()) finalDoc.setKeywords(firstDoc.getKeywords().split(' '));
                    if (firstDoc.getCreator()) finalDoc.setCreator(firstDoc.getCreator());
                    if (firstDoc.getLanguage()) finalDoc.setLanguage(firstDoc.getLanguage());
                }
                
                if (typeof toast === 'function' && this.files.length > 1) {
                    toast('Đang gộp nhiều tệp. Mục lục (nếu có) sẽ không được giữ.');
                }
                
                const srcDocs = [];
                for (let i = 0; i < this.files.length; i++) {
                    this.updateProgress(10 + (20 * i / this.files.length));
                    if (this.encrypted[i]) {
                        srcDocs.push(null);
                    } else {
                        const buffer = await this.files[i].arrayBuffer();
                        const doc = await PDFDocument.load(buffer);
                        
                        if (doc.getForm && doc.getForm().getFields) {
                            const hasSig = doc.getForm().getFields().some(f => f.constructor.name === 'PDFSignature');
                            if (hasSig && !confirm(`File "${this.files[i].name}" có chữ ký số. Chữ ký sẽ mất hiệu lực sau khi chỉnh sửa. Tiếp tục?`)) {
                                this.hideLoading();
                                return;
                            }
                        }
                        
                        srcDocs.push(doc);
                    }
                }
                
                this.updateProgress(30);
                
                const totalOps = this.pages.length;
                
                // P2-1: Gom copyPages
                const fileIndicesMap = {};
                for (let i = 0; i < totalOps; i++) {
                    const p = this.pages[i];
                    if (p.type === 'pdf' && !this.encrypted[p.fileIndex]) {
                        if (!fileIndicesMap[p.fileIndex]) fileIndicesMap[p.fileIndex] = [];
                        fileIndicesMap[p.fileIndex].push(p.pageIndex);
                    }
                }
                
                const copiedPagesByFile = {};
                const usageIndexByFile = {};
                for (const fileIdxStr in fileIndicesMap) {
                    const fileIdx = parseInt(fileIdxStr);
                    copiedPagesByFile[fileIdx] = await finalDoc.copyPages(srcDocs[fileIdx], fileIndicesMap[fileIdx]);
                    usageIndexByFile[fileIdx] = 0;
                }

                for (let i = 0; i < totalOps; i++) {
                    const p = this.pages[i];
                    if (p.type === 'blank') {
                        finalDoc.addPage([p.width || 595, p.height || 842]);
                    } else {
                        if (this.encrypted[p.fileIndex]) {
                            // Render as image using pdf.js
                            const pdf = this.pdfDocs[p.fileIndex];
                            const pdfPage = await pdf.getPage(p.pageIndex + 1);
                            const vp = pdfPage.getViewport({ scale: 2.083 });
                            const cvs = document.createElement('canvas');
                            const ctx = cvs.getContext('2d');
                            cvs.width = vp.width;
                            cvs.height = vp.height;
                            await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;
                            
                            const imgData = cvs.toDataURL('image/jpeg', 0.9);
                            const jpgImage = await finalDoc.embedJpg(imgData);
                            
                            const ptWidth = vp.width / 2.083;
                            const ptHeight = vp.height / 2.083;
                            const newPage = finalDoc.addPage([ptWidth, ptHeight]);
                            newPage.drawImage(jpgImage, {
                                x: 0, y: 0,
                                width: ptWidth, height: ptHeight
                            });
                            if (p.rotation !== 0) {
                                newPage.setRotation(window.PDFLib.degrees(p.rotation));
                            }
                        } else {
                            const copiedPage = copiedPagesByFile[p.fileIndex][usageIndexByFile[p.fileIndex]++];
                            
                            if (p.rotation !== 0) {
                                const currentRot = copiedPage.getRotation().angle;
                                copiedPage.setRotation(window.PDFLib.degrees(currentRot + p.rotation));
                            }
                            finalDoc.addPage(copiedPage);
                        }
                    }
                    this.updateProgress(30 + (50 * i / totalOps));
                }
            }
            
            this.updateProgress(85);
            const pdfBytes = await finalDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const filename = document.getElementById('po-save-filename').value || 'organized.pdf';
            
            if (window.showSaveFilePicker) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{ description: 'PDF Document', accept: {'application/pdf': ['.pdf']} }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    this.hideLoading();
                    this.savedHistoryIndex = this.historyIndex;
                    this.showSuccess();
                    return;
                } catch (e) {
                    if (e.name !== 'AbortError') console.error(e);
                }
            }
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.savedHistoryIndex = this.historyIndex;
            this.showSuccess();
            
        } catch (e) {
            this.hideLoading();
            alert('Lỗi: ' + e.message);
        }
    }

    showSuccess() {
        document.getElementById('po-ws').innerHTML = `
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#fff;">
                <div style="font-size:48px; color:var(--po-success); margin-bottom:16px;">✓</div>
                <h2 style="margin:0 0 8px">Lưu thành công!</h2>
                <p style="color:var(--po-text-muted); margin-bottom:24px">Tài liệu đã được lưu an toàn.</p>
                <button class="po-primary-btn" onclick="location.reload()">Tiếp tục làm việc</button>
            </div>
        `;
    }

    destroy() {
        if (this.abort) this.abort.abort();
        if (this.thumbObserver) this.thumbObserver.disconnect();
        if (this.sortable) this.sortable.destroy();
        
        Object.values(this.pdfDocs).forEach(pdf => {
            if (pdf && typeof pdf.destroy === 'function') {
                pdf.destroy();
            }
        });
        
        this.pages.forEach(p => {
            if (p.dataUrl && p.dataUrl.startsWith('blob:')) {
                URL.revokeObjectURL(p.dataUrl);
            }
        });
        
        if (this.previewObjUrl) {
            URL.revokeObjectURL(this.previewObjUrl);
        }
        
        this.files.forEach(f => {
            if (f.objUrl) URL.revokeObjectURL(f.objUrl);
        });
        
        if (this.appNode) {
            this.appNode.remove();
        }
    }
}

window.initOrganizer = (files) => {
    document.getElementById('home').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.getElementById('ws').style.display = 'none';
    const org = new PDFOrganizer();
    if (files && files.length > 0) {
        org.handleFiles(files, 0);
    }
};
