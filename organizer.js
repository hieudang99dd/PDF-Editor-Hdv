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
        this.isTextMode = false;
        
        this.thumbQueue = [];
        this.activeThumbRenders = 0;
        this.activeThumbTasks = new Map();
        
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
            link.href = 'organizer.css?v=17';
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
                    <button class="po-tool-btn" id="po-tb-add-pdf">📑 Chèn từ PDF</button>
                    <button class="po-tool-btn" id="po-tb-dup" disabled>⧉ Nhân đôi</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-rot-l" disabled>↶ Xoay trái</button>
                    <button class="po-tool-btn" id="po-tb-rot-r" disabled>↷ Xoay phải</button>
                    <button class="po-tool-btn" id="po-tb-del" disabled style="color:var(--po-danger)">🗑 Xóa</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-reset">🔄 Làm mới</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-edit-text">✏️ Chỉnh sửa văn bản</button>
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
                        <div class="po-render-progress-container" id="po-render-progress-container" style="margin-top: 12px; display: none;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--po-text-muted); margin-bottom: 4px;">
                                <span>Tiến trình tải trang:</span>
                                <span id="po-render-progress-text">0%</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                                <div id="po-render-progress-fill" style="width: 0%; height: 100%; background: var(--po-primary); transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="po-main-scroll" id="po-main-scroll">
                        <div class="po-grid" id="po-grid"></div>
                    </div>
                </div>
                
                <div class="po-right-col">
                    <div class="po-preview-canvas" id="po-preview-canvas">
                        <div class="po-pv-empty" id="po-pv-empty">Chọn một trang để xem trước</div>
                        <div id="po-preview-wrapper" style="position: relative; display: inline-block;">
                            <img id="po-preview-img" src="" style="display:none; vertical-align: top;">
                            <div id="po-text-layer" class="po-text-layer"></div>
                            <div id="po-format-toolbar" style="display:none;">
                                <select id="po-ft-font" title="Phông chữ">
                                    <option value="sans-serif">Mặc định</option>
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="'Times New Roman', serif">Times New Roman</option>
                                    <option value="'Courier New', monospace">Courier New</option>
                                </select>
                                <input type="number" id="po-ft-size" style="width:45px" title="Cỡ chữ" />
                                <input type="color" id="po-ft-color" title="Màu chữ" value="#000000" />
                                <div class="toolbar-sep"></div>
                                <button id="po-ft-align-left" title="Căn trái">⬅️</button>
                                <button id="po-ft-align-center" title="Căn giữa">↔️</button>
                                <button id="po-ft-align-right" title="Căn phải">➡️</button>
                                <div class="toolbar-sep"></div>
                                <button class="btn-primary" id="po-ft-done" title="Lưu thay đổi">✔ Xong</button>
                            </div>
                        </div>
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
                        <label class="po-form-label">Thư mục lưu</label>
                        <div class="po-input-group">
                            <input type="text" id="po-save-dir" class="po-form-input" readonly placeholder="Chưa chọn thư mục (Lưu tải xuống mặc định)">
                            <button class="po-tool-btn" id="po-save-pick-dir" style="border:1px solid var(--po-border)">Chọn thư mục</button>
                        </div>
                    </div>
                    <div class="po-form-group">
                        <label class="po-form-label">Tên file</label>
                        <input type="text" id="po-save-filename" class="po-form-input">
                    </div>
                    <div class="po-form-group">
                        <label class="po-form-label">Đường dẫn đầy đủ</label>
                        <div id="po-save-preview-path" style="font-size:12px; color:var(--po-text-muted); word-break:break-all; background:#f1f5f9; padding:8px; border-radius:4px;">Tải xuống thư mục mặc định của trình duyệt</div>
                    </div>
                    <div class="po-modal-footer">
                        <button class="po-tool-btn" id="po-save-cancel">Hủy</button>
                        <button class="po-primary-btn" id="po-save-confirm">Lưu file</button>
                    </div>
                </div>
            </div>
            <style>
                .po-context-menu { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .po-menu-item { padding: 8px 16px; cursor: pointer; font-size: 13px; color: var(--po-text-main); border-radius: 4px; }
                .po-menu-item:hover { background: var(--po-primary-light); color: var(--po-primary); }
            </style>
        </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = mainHTML;
        this.appNode = temp.firstElementChild;
        document.body.appendChild(this.appNode);

        this.bindEvents();
    }

    
    commitEdit(div) {
        div.contentEditable = 'false';
        div.classList.remove('editing');
        const tb = document.getElementById('po-format-toolbar');
        if (tb) tb.style.display = 'none';
        this.activeEditDiv = null;
        
        const newText = div.innerText.replace(/\n\s*\n/g, '\n').trim();
        const blockId = div.dataset.id;
        // find block
        const pData = this.pages.find(p => p.pageIndex === this.focusedPageId);
        if (!pData) return;
        
        pData.textEdits = pData.textEdits.filter(e => e.id !== blockId);
        // Compare with original block text? It's stored in div initially but hard to retrieve here.
        // We just always save if it was edited.
        pData.textEdits.push({
            id: blockId,
            newText,
            x: parseFloat(div.dataset.pdfMinX),
            y: parseFloat(div.dataset.pdfMaxY),
            size: parseFloat(div.dataset.pdfSize) || 12,
            width: parseFloat(div.dataset.pdfMaxX) - parseFloat(div.dataset.pdfMinX),
            height: parseFloat(div.dataset.pdfMaxY) - parseFloat(div.dataset.pdfMinY),
            align: div.dataset.align || 'left',
            color: div.dataset.color || '#000000',
            fontFamily: div.dataset.fontFamily || 'sans-serif'
        });
        div.classList.add('edited');
        this.updateTextEditState();
    }


    bindEvents() {
        if (!window.showSaveFilePicker) {
            const pickerLbl = document.getElementById('po-save-mode-picker-lbl');
            if (pickerLbl) pickerLbl.style.display = 'none';
        }

        
        const tb = document.getElementById('po-format-toolbar');
        if (tb) {
            document.getElementById('po-ft-size').addEventListener('input', e => {
                if (this.activeEditDiv) {
                    this.activeEditDiv.dataset.pdfSize = e.target.value;
                    // Tạm thời ko đổi fontSize UI vì nó theo % của viewport, phức tạp. Chỉ lưu data để save.
                }
            });
            document.getElementById('po-ft-color').addEventListener('input', e => {
                if (this.activeEditDiv) {
                    this.activeEditDiv.dataset.color = e.target.value;
                    this.activeEditDiv.style.color = e.target.value;
                }
            });
            document.getElementById('po-ft-font').addEventListener('change', e => {
                if (this.activeEditDiv) {
                    this.activeEditDiv.dataset.fontFamily = e.target.value;
                    this.activeEditDiv.style.fontFamily = e.target.value;
                }
            });
            ['left', 'center', 'right'].forEach(a => {
                document.getElementById('po-ft-align-' + a).addEventListener('click', () => {
                    if (this.activeEditDiv) {
                        this.activeEditDiv.dataset.align = a;
                        this.activeEditDiv.style.textAlign = a;
                        ['left', 'center', 'right'].forEach(x => document.getElementById('po-ft-align-' + x).classList.remove('btn-active'));
                        document.getElementById('po-ft-align-' + a).classList.add('btn-active');
                    }
                });
            });
            document.getElementById('po-ft-done').addEventListener('click', () => {
                if (this.activeEditDiv) {
                    const div = this.activeEditDiv;
                    div.blur(); // this will trigger commit if not handled
                    this.commitEdit(div);
                }
            });
        }

        window.addEventListener('beforeunload', e => {
            if (this.historyIndex !== this.savedHistoryIndex && this.historyIndex !== -1) {
                e.preventDefault();
                e.returnValue = '';
            }
        }, { signal: this.abort.signal });

        window.addEventListener('resize', () => {
            if (this.focusedPageId) {
                this.layoutPreview();
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

        document.getElementById('po-tb-reset').onclick = () => {
            if (confirm('Bạn có chắc chắn muốn làm mới (khôi phục tài liệu về trạng thái ban đầu)?')) {
                if (this.history.length > 0) {
                    const initialState = JSON.parse(this.history[0]);
                    this.pages = initialState.map(p => {
                        const cacheKey = p.type === 'blank' ? p.id : `${p.fileIndex}:${p.pageIndex}`;
                        return {
                            ...p,
                            selected: false,
                            dataUrl: this.thumbCache.get(cacheKey) || null
                        };
                    });
                    
                    // Force push this reverted state as a new history entry
                    const snapshot = this.pages.map(p => ({
                        id: p.id, type: p.type, fileIndex: p.fileIndex, pageIndex: p.pageIndex,
                        rotation: p.rotation, width: p.width, height: p.height
                    }));
                    this.history = this.history.slice(0, this.historyIndex + 1);
                    this.history.push(JSON.stringify(snapshot));
                    this.historyIndex = this.history.length - 1;
                    
                    this.renderGrid();
                    this.updateUndoRedo();
                    this.updateStats();
                    
                    if (this.pages.length > 0) {
                        this.focusPage(this.pages[0].id);
                    }
                }
            }
        };
        document.getElementById('po-tb-edit-text').onclick = (e) => {
            this.isTextMode = !this.isTextMode;
            e.target.classList.toggle('active', this.isTextMode);
            const wrapper = document.getElementById('po-preview-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('text-mode-active', this.isTextMode);
            }
            if (this.isTextMode) {
                e.target.style.backgroundColor = '#eff6ff';
                e.target.style.color = '#2563eb';
                e.target.style.borderColor = '#2563eb';
            } else {
                e.target.style.backgroundColor = '';
                e.target.style.color = '';
                e.target.style.borderColor = '';
            }
        };
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
        
        const btnPickDir = document.getElementById('po-save-pick-dir');
        if (btnPickDir) {
            btnPickDir.onclick = async () => {
                try {
                    this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    document.getElementById('po-save-dir').value = this.dirHandle.name;
                    await this.checkOverwriteAndSuggest();
                } catch(e) { console.log(e); }
            };
        }
        const fileInput = document.getElementById('po-save-filename');
        if (fileInput) {
            fileInput.oninput = () => this.updatePathPreview();
        }

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
        
        const pvCanvas = document.getElementById('po-preview-canvas');
        let wheelTimeout;
        pvCanvas.addEventListener('wheel', e => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                this.adjustZoom(e.deltaY < 0 ? 0.2 : -0.2);
            } else {
                const isScrollable = pvCanvas.scrollHeight > pvCanvas.clientHeight + 10 || pvCanvas.scrollWidth > pvCanvas.clientWidth + 10;
                if (!isScrollable) {
                    e.preventDefault();
                    if (wheelTimeout) return;
                    wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 150);
                    
                    if (e.deltaY > 0) {
                        this.navigateRelative(1);
                    } else if (e.deltaY < 0) {
                        this.navigateRelative(-1);
                    }
                }
            }
        }, { passive: false });
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
        if (this.activeThumbTasks.has(pageId)) {
            const task = this.activeThumbTasks.get(pageId);
            if (task && typeof task.cancel === 'function') {
                try { task.cancel(); } catch(e) {}
            }
            this.activeThumbTasks.delete(pageId);
        }
    }

    updateRenderProgress() {
        if (!this.pages || this.pages.length === 0) return;
        const total = this.pages.length;
        const loaded = this.pages.filter(p => p.dataUrl || p.type === 'blank').length;
        const pct = Math.floor((loaded / total) * 100);
        
        // Theo dõi thời gian để tính ETA
        if (!this.renderTimestamps) this.renderTimestamps = [];
        if (this.lastLoadedCount === undefined) this.lastLoadedCount = 0;
        
        if (loaded > this.lastLoadedCount) {
            this.renderTimestamps.push(Date.now());
            if (this.renderTimestamps.length > 5) this.renderTimestamps.shift(); // Lấy trung bình 5 trang gần nhất
            this.lastLoadedCount = loaded;
        }

        let etaStr = '';
        if (this.renderTimestamps.length >= 2 && loaded < total) {
            const timeDiff = this.renderTimestamps[this.renderTimestamps.length - 1] - this.renderTimestamps[0];
            const pagesRendered = this.renderTimestamps.length - 1;
            
            if (timeDiff > 0 && pagesRendered > 0) {
                const timePerPage = timeDiff / pagesRendered;
                const remainingPages = total - loaded;
                const remainingMs = remainingPages * timePerPage;
                
                const totalSeconds = Math.ceil(remainingMs / 1000);
                if (totalSeconds < 60) {
                    etaStr = ` (Còn ~${totalSeconds}s)`;
                } else {
                    const m = Math.floor(totalSeconds / 60);
                    const s = totalSeconds % 60;
                    etaStr = ` (Còn ~${m}p ${s}s)`;
                }
            }
        }

        const container = document.getElementById('po-render-progress-container');
        const fill = document.getElementById('po-render-progress-fill');
        const text = document.getElementById('po-render-progress-text');
        if (!container || !fill || !text) return;

        if (total > 0 && loaded < total) {
            container.style.display = 'block';
            fill.style.width = `${pct}%`;
            text.textContent = `${pct}%${etaStr}`;
        } else if (loaded === total && total > 0) {
            fill.style.width = `100%`;
            text.textContent = `100% - Hoàn tất`;
            setTimeout(() => {
                if (document.getElementById('po-render-progress-text')?.textContent.includes('Hoàn tất')) {
                    container.style.display = 'none';
                }
            }, 2000);
        }
    }

    async idlePrefetch() {
        if (this.previewTask || this.activeThumbRenders > 0 || this.thumbQueue.length > 0) return;
        
        const nextPage = this.pages.find(p => !p.dataUrl && p.type === 'pdf');
        if (!nextPage) return; // All done

        this.activeThumbRenders++;
        try {
            await this.renderThumbnail(nextPage.id, null);
        } catch (e) {
            if (e.name !== 'RenderingCancelledException' && e.message !== 'Rendering cancelled.') {
                console.error('Idle prefetch error:', e);
            }
        } finally {
            this.activeThumbTasks.delete(nextPage.id);
            this.activeThumbRenders--;
            this.updateRenderProgress();
            
            // Recursively prefetch next if idle
            if (!this.previewTask && this.thumbQueue.length === 0) {
                this.idlePrefetch();
            }
        }
    }

    async processThumbQueue() {
        if (this.previewTask || this.activeThumbRenders >= 3) return;
        
        if (this.thumbQueue.length === 0) {
            this.idlePrefetch();
            return;
        }
        
        this.activeThumbRenders++;
        const { pageId, img } = this.thumbQueue.shift();
        
        try {
            await this.renderThumbnail(pageId, img);
            this.thumbObserver.unobserve(img);
        } catch (e) {
            if (e.name !== 'RenderingCancelledException' && e.message !== 'Rendering cancelled.') {
                console.error('Lỗi render thumbnail', e);
            }
        } finally {
            this.activeThumbTasks.delete(pageId);
            this.activeThumbRenders--;
            this.updateRenderProgress();
            this.processThumbQueue();
        }
    }

    async renderThumbnail(pageId, imgElement) {
        const page = this.pages.find(p => p.id === pageId);
        if (!page) return;
        
        const cacheKey = page.type === 'blank' ? page.id : `${page.fileIndex}:${page.pageIndex}`;
        
        if (this.thumbCache.has(cacheKey)) {
            page.dataUrl = this.thumbCache.get(cacheKey);
            if (imgElement) imgElement.src = page.dataUrl;
            return;
        }

        if (page.type !== 'pdf' || page.dataUrl) {
            if (page.dataUrl && imgElement) imgElement.src = page.dataUrl;
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
            
            const renderTask = pdfPage.render({ canvasContext: ctx, viewport: vp });
            this.activeThumbTasks.set(pageId, renderTask);
            await renderTask.promise;
            this.activeThumbTasks.delete(pageId);
            
            cvs.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                page.dataUrl = url;
                page.width = vp.width;
                page.height = vp.height;
                
                this.thumbCache.set(cacheKey, url);
                
                if (imgElement && imgElement.dataset.id === pageId) {
                    imgElement.src = url;
                } else {
                    const domImg = document.querySelector(`.po-card-preview img[data-id="${pageId}"]`);
                    if (domImg) domImg.src = url;
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
            const insertBefore = document.createElement('div');
            insertBefore.className = 'po-insert-point';
            insertBefore.innerHTML = `<div class="po-insert-line"></div><div class="po-insert-btn" title="Chèn trang vào đây">+</div>`;
            insertBefore.querySelector('.po-insert-btn').onclick = (e) => { e.stopPropagation(); this.showInsertMenu(e, i); };
            grid.appendChild(insertBefore);

            const wrapper = document.createElement('div');
            wrapper.className = 'po-card-wrapper';
            wrapper.dataset.id = p.id;
            
            const card = document.createElement('div');
            card.className = `po-card ${p.selected ? 'selected' : ''}`;
            
            card.innerHTML = `
                <div class="po-card-num">${i + 1}</div>
                <div class="po-card-preview">
                    <img data-id="${p.id}" ${p.dataUrl ? `src="${p.dataUrl}"` : ''} style="transform: rotate(${p.rotation}deg); ${p.type==='blank'?'border:1px solid #e2e8f0':''}">
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
        
        const insertAfter = document.createElement('div');
        insertAfter.className = 'po-insert-point';
        insertAfter.innerHTML = `<div class="po-insert-line"></div><div class="po-insert-btn" title="Chèn trang vào đây">+</div>`;
        insertAfter.querySelector('.po-insert-btn').onclick = (e) => { e.stopPropagation(); this.showInsertMenu(e, this.pages.length); };
        grid.appendChild(insertAfter);
        
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

    
    groupTextItems(items, styles, transform, Util, W, H) {
        const blocks = [];
        items.forEach((item, index) => {
            if (!item.str || item.str.trim() === '') return;
            const t = Util.transform(transform, item.transform);
            const fontH = Math.hypot(t[2], t[3]) || item.height || 10;
            const left = t[4];
            const top = t[5] - fontH;
            const width = Math.max(item.width, fontH * 0.5);
            const pdfX = item.transform[4];
            const pdfY = item.transform[5];
            const pdfSize = Math.hypot(item.transform[2], item.transform[3]) || fontH;
            const pdfWidth = item.width;
            const box = {
                items: [ { ...item, index, pdfX, pdfY, pdfSize, pdfWidth } ],
                pdfMinX: pdfX, pdfMinY: pdfY, pdfMaxX: pdfX + pdfWidth, pdfMaxY: pdfY + pdfSize,
                left, top, right: left + width, bottom: top + fontH * 1.15,
                fontName: item.fontName, size: fontH, pdfSize, text: item.str
            };
            let merged = false;
            for (const b of blocks) {
                if (Math.abs(b.pdfSize - pdfSize) > 4) continue;
                const verticalDist = Math.abs(b.pdfMinY - pdfY);
                if (verticalDist < pdfSize * 2.5) {
                    const isSameLine = verticalDist < pdfSize * 0.5;
                    const isNextLine = verticalDist >= pdfSize * 0.5 && verticalDist < pdfSize * 2.5;
                    if (isSameLine || isNextLine) {
                        b.items.push(box.items[0]);
                        b.pdfMinX = Math.min(b.pdfMinX, box.pdfMinX);
                        b.pdfMinY = Math.min(b.pdfMinY, box.pdfMinY);
                        b.pdfMaxX = Math.max(b.pdfMaxX, box.pdfMaxX);
                        b.pdfMaxY = Math.max(b.pdfMaxY, box.pdfMaxY);
                        b.left = Math.min(b.left, box.left);
                        b.top = Math.min(b.top, box.top);
                        b.right = Math.max(b.right, box.right);
                        b.bottom = Math.max(b.bottom, box.bottom);
                        b.items.sort((a, c) => {
                            if (Math.abs(a.pdfY - c.pdfY) > pdfSize * 0.5) return c.pdfY - a.pdfY;
                            return a.pdfX - c.pdfX;
                        });
                        b.text = b.items.map(i => i.str).join(' ').replace(/\s+/g, ' ');
                        merged = true;
                        break;
                    }
                }
            }
            if (!merged) blocks.push(box);
        });
        return blocks;
    }

    async renderTextLayer(pdfPage, baseVp, pageData) {
        const layer = document.getElementById('po-text-layer');
        if (!layer) return;
        const token = (this._textLayerToken = (this._textLayerToken || 0) + 1);
        layer.innerHTML = '';
        try {
            const textContent = await pdfPage.getTextContent();
            if (token !== this._textLayerToken) return;
            if (!pageData.textEdits) pageData.textEdits = [];
            const Util = window.pdfjsLib.Util;
            const W = baseVp.width, H = baseVp.height;
            const blocks = this.groupTextItems(textContent.items, textContent.styles, baseVp.transform, Util, W, H);
            blocks.forEach((block, index) => {
                const blockId = 'block_' + index;
                const edited = pageData.textEdits.find(e => e.id === blockId);
                const div = document.createElement('div');
                div.className = 'po-text-box' + (edited ? ' edited' : '');
                div.style.left = `${(block.left / W) * 100}%`;
                div.style.top = `${(block.top / H) * 100}%`;
                div.style.width = `${((block.right - block.left) / W) * 100}%`;
                div.style.height = 'auto'; 
                div.style.minHeight = `${((block.bottom - block.top) / H) * 100}%`;
                div.style.fontSize = `${(block.size / H) * 100}cqh`;
                const firstItem = block.items[0];
                div.style.fontFamily = firstItem.fontName && textContent.styles[firstItem.fontName] ? textContent.styles[firstItem.fontName].fontFamily : 'sans-serif';
                div.textContent = edited ? edited.newText : block.text;
                
                div.dataset.id = blockId;
                div.dataset.pdfMinX = block.pdfMinX;
                div.dataset.pdfMaxY = block.pdfMaxY;
                div.dataset.pdfMinY = block.pdfMinY;
                div.dataset.pdfMaxX = block.pdfMaxX;
                div.dataset.pdfSize = edited ? edited.size : block.pdfSize;
                div.dataset.align = edited ? edited.align : 'left'; // Basic extraction can be added later
                div.dataset.color = edited ? edited.color : '#000000';
                div.dataset.fontFamily = edited ? edited.fontFamily : 'sans-serif';
                if (edited) {
                    div.style.textAlign = edited.align;
                    div.style.color = edited.color;
                    div.style.fontFamily = edited.fontFamily;
                }
                div.spellcheck = false;

                div.addEventListener('mousedown', e => { if (this.isTextMode) e.stopPropagation(); });
                
                div.addEventListener('click', (e) => {
                    if (!this.isTextMode) return;
                    e.stopPropagation();
                    div.contentEditable = 'true';
                    div.classList.add('editing');
                    div.focus();
                    
                    const tb = document.getElementById('po-format-toolbar');
                    if (tb) {
                        tb.style.display = 'flex';
                        const rect = div.getBoundingClientRect();
                        const wrapperRect = document.getElementById('po-preview-wrapper').getBoundingClientRect();
                        tb.style.top = Math.max(0, rect.top - wrapperRect.top - 45) + 'px';
                        tb.style.left = (rect.left - wrapperRect.left) + 'px';
                        
                        document.getElementById('po-ft-size').value = Math.round(parseFloat(div.dataset.pdfSize) || block.pdfSize);
                        document.getElementById('po-ft-color').value = div.dataset.color || '#000000';
                        document.getElementById('po-ft-font').value = div.dataset.fontFamily || 'sans-serif';
                        
                        const align = div.dataset.align || 'left';
                        ['left', 'center', 'right'].forEach(a => {
                            const btn = document.getElementById('po-ft-align-' + a);
                            if (a === align) btn.classList.add('btn-active');
                            else btn.classList.remove('btn-active');
                        });
                        this.activeEditDiv = div;
                    }
                });
                div.addEventListener('keydown', (e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { 
                        e.preventDefault(); 
                        div.blur();
                        this.commitEdit(div);
                    }
                });
                div.addEventListener('blur', (e) => {
                    const tb = document.getElementById('po-format-toolbar');
                    if (tb && tb.contains(e.relatedTarget)) {
                        return; // focus moved to toolbar
                    }
                    this.commitEdit(div);
                });

                layer.appendChild(div);
            });
        } catch(e) {
            console.error('Error rendering text layer', e);
        }
    }

    updateTextEditState() {
        const n = this.pages.reduce((a, p) => a + (p.textEdits ? p.textEdits.length : 0), 0);
        this.hasTextEdits = n > 0;
        const save = document.getElementById('po-save');
        if (save && n > 0) save.disabled = false;
        const changesEl = document.getElementById('po-meta-changes');
        if (changesEl && n > 0) {
            const base = changesEl.textContent.replace(/\s*\|?\s*Sửa \d+ đoạn văn bản$/, '');
            changesEl.textContent = (base ? base + ' | ' : '') + `Sửa ${n} đoạn văn bản`;
            changesEl.style.display = 'block';
        }
    }

    async getUnicodeFont(doc) {
        if (!window.fontkit) {
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
                s.onload = res; s.onerror = () => rej(new Error('Không tải được fontkit'));
                document.head.appendChild(s);
            });
        }
        if (!this._fontBytes) {
            const r = await fetch('https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf');
            if (!r.ok) throw new Error('Không tải được font tiếng Việt');
            this._fontBytes = await r.arrayBuffer();
        }
        doc.registerFontkit(window.fontkit);
        return doc.embedFont(this._fontBytes, { subset: true });
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
            if (this.previewTask) {
                this.previewTask.cancel();
                this.previewTask = null;
            }
            
            // Ưu tiên hiển thị preview bằng cách hủy ngay các thumbnail đang render
            this.activeThumbTasks.forEach((task) => {
                if (typeof task.cancel === 'function') {
                    try { task.cancel(); } catch(e) {}
                }
            });
            this.activeThumbTasks.clear();

            // Hiển thị lập tức thumbnail (low-res) để tránh giật lag
            if (page.dataUrl) {
                img.src = page.dataUrl;
            } else {
                img.removeAttribute('src');
                // Hiển thị SVG Spinner
                img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><circle cx="50" cy="50" fill="none" stroke="%232563eb" stroke-width="8" r="35" stroke-dasharray="164.933 56.977"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"></animateTransform></circle></svg>';
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
                        this.renderTextLayer(pdfPage, baseVp, page);
                        
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
                                
                                // ĐỒNG BỘ THUMBNAIL: Tạo thumbnail từ ảnh high-res để hiển thị cùng lúc
                                if (!page.dataUrl) {
                                    const thumbCvs = document.createElement('canvas');
                                    const thumbCtx = thumbCvs.getContext('2d');
                                    const maxDim = 300;
                                    let scale = Math.min(maxDim / cvs.width, maxDim / cvs.height);
                                    if (scale > 1) scale = 1;
                                    thumbCvs.width = cvs.width * scale;
                                    thumbCvs.height = cvs.height * scale;
                                    thumbCtx.drawImage(cvs, 0, 0, thumbCvs.width, thumbCvs.height);
                                    
                                    thumbCvs.toBlob(thumbBlob => {
                                        const thumbUrl = URL.createObjectURL(thumbBlob);
                                        page.dataUrl = thumbUrl;
                                        page.width = baseVp.width;
                                        page.height = baseVp.height;
                                        const cacheKey = page.type === 'blank' ? page.id : `${page.fileIndex}:${page.pageIndex}`;
                                        this.thumbCache.set(cacheKey, thumbUrl);
                                        
                                        const thumbImg = document.querySelector(`.po-card-preview img[data-id="${id}"]`);
                                        if (thumbImg) thumbImg.src = thumbUrl;
                                        
                                        // Gỡ khỏi hàng đợi render thumbnail
                                        this.thumbQueue = this.thumbQueue.filter(q => q.pageId !== id);
                                        this.updateRenderProgress();
                                    }, 'image/jpeg', 0.8);
                                }
                            }, 'image/jpeg', 0.9);
                        });
                    }).catch(e => {
                        if (e.name !== 'RenderingCancelledException' && e.message !== 'Rendering cancelled.') {
                            console.error('Lỗi render high-res:', e);
                        }
                    }).finally(() => {
                        if (this.previewTask && this.previewTask.cancel === taskObj.cancel) {
                            this.previewTask = null;
                            this.processThumbQueue();
                        }
                    });
                }
            }
        }
        
        img.onload = () => this.layoutPreview();
        img.style.display = 'block';
        this.layoutPreview();
    }

    layoutPreview() {
        const img = document.getElementById('po-preview-img');
        const wrapper = document.getElementById('po-preview-wrapper');
        const container = document.getElementById('po-preview-canvas');
        const layer = document.getElementById('po-text-layer');
        if (!img || !wrapper || !container) return;
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page) return;

        let pw = page.width, ph = page.height;
        if (!pw || !ph) { pw = img.naturalWidth || 595; ph = img.naturalHeight || 842; }
        const rot = ((page.rotation % 360) + 360) % 360;
        const sideways = rot === 90 || rot === 270;
        const boxW = sideways ? ph : pw, boxH = sideways ? pw : ph;

        const cs = getComputedStyle(container);
        const aw = Math.max(50, container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
        const ah = Math.max(50, container.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom));
        const base = this.fitMode === 'width' ? aw / boxW : Math.min(aw / boxW, ah / boxH);
        const s = base * (this.zoomLevel || 1);
        const W = Math.round(boxW * s), H = Math.round(boxH * s);

        wrapper.style.width = W + 'px';
        wrapper.style.height = H + 'px';
        wrapper.style.margin = 'auto';
        wrapper.style.flex = 'none';
        Object.assign(img.style, {
            position: 'absolute', maxWidth: 'none', maxHeight: 'none',
            width: (sideways ? H : W) + 'px', height: (sideways ? W : H) + 'px',
            left: sideways ? ((W - H) / 2) + 'px' : '0', top: sideways ? ((H - W) / 2) + 'px' : '0',
            transform: `rotate(${rot}deg)`
        });
        // Lớp text chỉ khớp tọa độ khi trang không bị xoay
        if (layer) layer.style.display = rot === 0 ? '' : 'none';
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
        this.zoomLevel = Math.max(0.2, Math.min(5, this.zoomLevel + delta));
        this.focusPage(this.focusedPageId, delta > 0);
    }
    
    setZoom(type) {
        this.fitMode = type === 'width' ? 'width' : 'page';
        this.zoomLevel = 1;
        this.layoutPreview();
    }

    initSortable() {
        if(this.sortable) this.sortable.destroy();
        const grid = document.getElementById('po-grid');
        this.sortable = new Sortable(grid, {
            animation: 150,
            draggable: '.po-card-wrapper',
            ghostClass: 'sortable-ghost',
            onEnd: e => {
                const oldIdx = e.oldDraggableIndex !== undefined ? e.oldDraggableIndex : Math.floor(e.oldIndex / 2);
                const newIdx = e.newDraggableIndex !== undefined ? e.newDraggableIndex : Math.floor(e.newIndex / 2);
                
                if (oldIdx !== newIdx) {
                    const movedItem = this.pages.splice(oldIdx, 1)[0];
                    this.pages.splice(newIdx, 0, movedItem);
                    this.pushHistory();
                    this.renderGrid();
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
    showInsertMenu(e, index) {
        document.querySelectorAll('.po-context-menu').forEach(el => el.remove());
        
        const menu = document.createElement('div');
        menu.className = 'po-context-menu';
        menu.innerHTML = `
            <div class="po-menu-item" id="menu-add-pdf">📑 Chèn từ file PDF</div>
        `;
        menu.style.position = 'absolute';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.background = '#fff';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        menu.style.borderRadius = '6px';
        menu.style.padding = '4px';
        menu.style.zIndex = '1000';
        
        document.body.appendChild(menu);
        
        menu.querySelector('#menu-add-pdf').onclick = () => {
            menu.remove();
            this.insertIndex = index;
            document.getElementById('po-insert-file').click();
        };
        
        setTimeout(() => {
            const closeMenu = (evt) => {
                if (!menu.contains(evt.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 10);
    }
    
    updatePathPreview() {
        const fname = document.getElementById('po-save-filename').value || 'document.pdf';
        const pv = document.getElementById('po-save-preview-path');
        if (this.dirHandle) {
            pv.textContent = this.dirHandle.name + '\\\\' + fname;
        } else {
            pv.textContent = 'Tải xuống thư mục mặc định của trình duyệt: ' + fname;
        }
    }
    
    async checkOverwriteAndSuggest() {
        if (!this.dirHandle) return;
        let fname = document.getElementById('po-save-filename').value;
        let base = fname.replace(/\.pdf$/i, '');
        
        try {
            while (true) {
                try {
                    await this.dirHandle.getFileHandle(fname);
                    // if no error, file exists!
                    let match = base.match(/_v(\d+)$/);
                    if (match) {
                        base = base.replace(/_v\d+$/, '') + '_v' + (parseInt(match[1]) + 1);
                    } else {
                        base = base + '_v1';
                    }
                    fname = base + '.pdf';
                } catch (e) {
                    // file not found, this name is safe
                    break;
                }
            }
            if (fname !== document.getElementById('po-save-filename').value) {
                alert('Tên file đã tồn tại! Tự động đề xuất version: ' + fname);
                document.getElementById('po-save-filename').value = fname;
            }
            this.updatePathPreview();
        } catch (e) {
            console.error("Check overwrite error", e);
        }
    }

    async showSaveModal() {
        let name = this.baseFilename;
        // Auto versioning regex logic
        let match = name.match(/_v(\d+)$/);
        if (match) {
            name = name.replace(/_v\d+$/, '') + '_v' + (parseInt(match[1]) + 1);
        } else {
            name = name + '_v1';
        }
        
        document.getElementById('po-save-filename').value = name + '.pdf';
        this.updatePathPreview();
        if (this.dirHandle) {
            await this.checkOverwriteAndSuggest();
        }
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
            
            // Apply WYSIWYG Text Edits
            const finalPages = finalDoc.getPages();
            let editFont = null;
            for (let i = 0; i < this.pages.length; i++) {
                const p = this.pages[i];
                if (!p.textEdits || p.textEdits.length === 0) continue;
                if (p.type !== 'pdf' || (!isSingleFile && this.encrypted[p.fileIndex])) continue;
                if (!editFont) editFont = await this.getUnicodeFont(finalDoc);
                const targetPage = finalPages[i];
                if (!targetPage) continue;
                for (const edit of p.textEdits) {
                    const size = edit.size || 12;
                    // Xóa vùng cũ (Block Masking)
                    // edit.y là top, edit.x là left, edit.width và edit.height của block
                    const blockTop = edit.y;
                    const blockBottom = edit.y - edit.height;
                    const rectY = blockBottom - size * 0.28;
                    const rectH = edit.height + size * 0.5;
console.log("DRAWING TEXT", edit.newText, edit.x, edit.y);
                    targetPage.drawRectangle({
                        x: edit.x - 2,
                        y: rectY,
                        width: edit.width + 4,
                        height: rectH,
                        color: window.PDFLib.rgb(1, 1, 1)
                    });
                    
                    if (edit.newText) {
                        const hex = edit.color || '#000000';
                        const r = parseInt(hex.slice(1,3), 16)/255 || 0;
                        const g = parseInt(hex.slice(3,5), 16)/255 || 0;
                        const b = parseInt(hex.slice(5,7), 16)/255 || 0;
                        
                        // Xử lý xuống dòng tự động & căn lề
                        const lines = edit.newText.split('\\n');
                        const lineHeight = size * 1.2;
                        let currentY = blockTop - size;
                        
                        // Để đơn giản, giả sử người dùng gõ xuống dòng bằng Enter.
                        // Nếu cần tự động ngắt dòng, ta có thể viết hàm wrap nhỏ, nhưng hiện tại lấy theo dòng.
                        // Trải nghiệm tốt nhất là wrap qua các từ.
                        const words = edit.newText.replace(/\n/g, ' \n ').split(' ');
                        let wrappedLines = [];
                        let currentLine = '';
                        for (let w of words) {
                            if (w === '\n') {
                                wrappedLines.push(currentLine.trim());
                                currentLine = '';
                                continue;
                            }
                            const testLine = currentLine ? currentLine + ' ' + w : w;
                            const tw = editFont.widthOfTextAtSize(testLine, size);
                            if (tw > edit.width && currentLine !== '') {
                                wrappedLines.push(currentLine.trim());
                                currentLine = w;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine) wrappedLines.push(currentLine.trim());

                        for (const line of wrappedLines) {
                            const tw = editFont.widthOfTextAtSize(line, size);
                            let drawX = edit.x;
                            if (edit.align === 'center') {
                                drawX = edit.x + (edit.width - tw) / 2;
                            } else if (edit.align === 'right') {
                                drawX = edit.x + edit.width - tw;
                            }
                            
                            targetPage.drawText(line, {
                                x: drawX,
                                y: currentY,
                                size: size,
                                font: editFont,
                                color: window.PDFLib.rgb(r, g, b)
                            });
                            currentY -= lineHeight;
                        }
                    }
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
