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
        this.isEditMode = false;
        this.currentAnnTool = 'select';
        this.selectedAnnId = null;
        this.annCounter = 0;
        this.currentAnnColor = '#1a1f36';
        this.currentAnnFontSize = 14;
        this.currentAnnStrokeWidth = 2;
        this.isDrawingPen = false;
        this.currentPenPoints = [];
        this.isCreatingShape = false;
        this.shapeStart = null;
        
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
            link.href = 'organizer.css?v=33';
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
                    <button class="po-primary-btn" id="po-export-sel" style="display:none; margin-right:8px; background:var(--po-primary-light); color:var(--po-primary); border:1px solid var(--po-primary);">Xuất trang chọn</button>
                    <button class="po-primary-btn" id="po-save" disabled>Lưu tài liệu</button>
                </div>
            </header>
            
            <div class="po-toolbar">
                <div class="po-tool-group">
                    <button class="po-tool-btn po-btn-highlight" id="po-tb-add-pdf" style="font-weight:600; color:var(--po-primary); background:var(--po-primary-light);">➕ Thêm tệp / trang</button>
                    <button class="po-tool-btn" id="po-tb-dup" disabled>⧉ Nhân đôi</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-rot-l" disabled>↶ Xoay trái</button>
                    <button class="po-tool-btn" id="po-tb-rot-r" disabled>↷ Xoay phải</button>
                    <button class="po-tool-btn" id="po-tb-del" disabled style="color:var(--po-danger)">🗑 Xóa</button>
                </div>
                <div class="po-tool-group" style="display: flex; gap: 2px; align-items: center; padding: 0 4px;">
                    <input type="text" id="po-tb-sel-range" placeholder="1-5, 8" title="Chọn theo khoảng" style="width: 65px; padding: 4px 6px; font-size: 12px; border: 1px solid var(--po-border); border-radius: 4px; outline: none;">
                    <button class="po-tool-btn" id="po-tb-sel-apply" style="padding: 4px 6px; min-width: 0;" title="Chọn">✓</button>
                    <button class="po-tool-btn" id="po-tb-sel-even" style="padding: 4px 6px;" title="Chọn trang chẵn">Chẵn</button>
                    <button class="po-tool-btn" id="po-tb-sel-odd" style="padding: 4px 6px;" title="Chọn trang lẻ">Lẻ</button>
                    <button class="po-tool-btn" id="po-tb-sel-inv" style="padding: 4px 6px;" title="Đảo vùng chọn">Đảo</button>
                    <button class="po-tool-btn" id="po-tb-rev-order" style="padding: 4px 6px;" title="Đảo ngược thứ tự">⇅</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-reset">🔄 Làm mới</button>
                </div>
                <div class="po-tool-group">
                    <button class="po-tool-btn" id="po-tb-edit-text" style="background:var(--po-primary-light); color:var(--po-primary); font-weight:600;" title="Chỉnh sửa trực tiếp nội dung văn bản trong PDF"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Chỉnh sửa nội dung</button>
                </div>
                <div class="po-tool-group" style="display: flex; align-items: center; padding: 0 8px;">
                    <span style="font-size: 12px; color: var(--po-text-muted); margin-right: 4px;">Cỡ thẻ:</span>
                    <select id="po-tb-thumb-size" style="padding: 2px 4px; font-size: 12px; border: 1px solid var(--po-border); border-radius: 4px; outline: none; background: #fff;">
                        <option value="S">Nhỏ</option>
                        <option value="M">Vừa</option>
                        <option value="L">Lớn</option>
                    </select>
                </div>
                <div class="po-selection-text" id="po-sel-text" style="display:none;"></div>
            </div>
            
            <div id="po-edit-subbar" class="po-edit-subbar" style="display:none;">
                <div class="po-tool-group">
                    <button class="po-edit-tool-btn active" data-tool="select" id="po-tool-select" title="Chọn và di chuyển">👆 Chọn</button>
                    <button class="po-edit-tool-btn" data-tool="text" id="po-tool-text" title="Thêm đoạn văn bản">🔤 Thêm chữ</button>
                    <button class="po-edit-tool-btn" data-tool="whiteout" id="po-tool-whiteout" title="Che trắng / xóa nội dung">⬜ Che trắng</button>
                    <button class="po-edit-tool-btn" data-tool="highlight" id="po-tool-highlight" title="Tô sáng màu vàng">🟡 Tô sáng</button>
                    <button class="po-edit-tool-btn" data-tool="rect" id="po-tool-rect" title="Vẽ khung chữ nhật">🔲 Khung viền</button>
                    <button class="po-edit-tool-btn" data-tool="pen" id="po-tool-pen" title="Vẽ tay tự do">✏ Vẽ tay</button>
                    <button class="po-edit-tool-btn" data-tool="image" id="po-tool-image" title="Chèn ảnh">🖼 Chèn ảnh</button>
                    <button class="po-edit-tool-btn" data-tool="signature" id="po-tool-signature" title="Chèn chữ ký">✍ Chữ ký</button>
                </div>
                <div class="po-tool-group po-edit-props" id="po-edit-props">
                    <label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--po-text-muted);">Màu:
                        <input type="color" id="po-prop-color" value="#1a1f36" style="width:24px;height:24px;border:none;cursor:pointer;padding:0;background:none;">
                    </label>
                    <label id="po-prop-size-wrap" style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--po-text-muted);">Cỡ:
                        <select id="po-prop-size" style="padding:2px 4px;font-size:12px;border:1px solid var(--po-border);border-radius:4px;background:var(--po-surface);">
                            <option value="10">10</option>
                            <option value="12">12</option>
                            <option value="14" selected>14</option>
                            <option value="18">18</option>
                            <option value="24">24</option>
                            <option value="32">32</option>
                        </select>
                    </label>
                </div>
                <div style="margin-left:auto; display:flex; gap:6px;">
                    <button class="po-tool-btn" id="po-edit-delete-sel" title="Xóa đối tượng đang chọn" style="color:var(--po-danger)">🗑 Xóa đối tượng</button>
                    <button class="po-tool-btn" id="po-edit-close" title="Xong / Đóng chế độ sửa" style="background:var(--po-primary);color:#fff;font-weight:600;">✔ Đóng sửa</button>
                </div>
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
                        <div class="po-render-progress-container" id="po-render-progress-container" style="position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); width: 320px; background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; z-index: 9999; display: none;">
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
                            <div id="po-ann-layer" class="po-ann-layer"></div>
                            <canvas id="po-ann-drawing-canvas" class="po-ann-drawing-canvas"></canvas>
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
                        <button class="po-pv-btn" id="pv-zoom-out" title="Thu nhỏ">-</button> <span id="pv-zoom-pct" style="font-size:13px; font-weight:600; min-width:45px; text-align:center; color:var(--po-text-light); user-select:none;">100%</span> <button class="po-pv-btn" id="pv-zoom-in" title="Phóng to">+</button>
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

            <!-- Signature Modal -->
            <input type="file" id="po-ann-img-input" accept="image/*" hidden>
            <div class="po-modal-overlay" id="po-sig-modal">
                <div class="po-modal" style="max-width: 440px;">
                    <h3 class="po-modal-title">✍ Ký tên điện tử</h3>
                    <p style="font-size:12px; color:var(--po-text-muted); margin-bottom:8px;">Vẽ chữ ký của bạn vào khung bên dưới:</p>
                    <div style="border: 1px dashed var(--po-border); border-radius: 6px; background: #fff; overflow: hidden; margin-bottom: 12px;">
                        <canvas id="po-sig-canvas" width="400" height="180" style="display:block; touch-action:none; cursor:crosshair; width:100%; height:180px;"></canvas>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <button class="po-tool-btn" id="po-sig-clear">Xóa chữ ký</button>
                        <div style="display:flex; gap:8px;">
                            <button class="po-tool-btn" id="po-sig-cancel">Hủy</button>
                            <button class="po-primary-btn" id="po-sig-apply">Chèn vào PDF</button>
                        </div>
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
        if (!div || div.contentEditable === 'false') return;
        const newText = div.innerText.replace(/\n\s*\n/g, '\n').trim();
        const blockId = div.dataset.id;
        
        div.contentEditable = 'false';
        div.classList.remove('editing');
        const tb = document.getElementById('po-format-toolbar');
        if (tb) tb.style.display = 'none';
        this.activeEditDiv = null;
        // find block
        const pData = this.pages.find(p => p.id === this.focusedPageId);
        if (!pData) return;
        
        pData.textEdits = pData.textEdits.filter(e => e.id !== blockId);
        // Compare with original block text? It's stored in div initially but hard to retrieve here.
        // We just always save if it was edited.
        pData.textEdits.push({
            id: blockId,
            newText,
            pdfMinX: parseFloat(div.dataset.pdfMinX),
            pdfMaxX: parseFloat(div.dataset.pdfMaxX),
            pdfMinY: parseFloat(div.dataset.pdfMinY),
            pdfMaxY: parseFloat(div.dataset.pdfMaxY),
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
        this.pushHistory();
        
        // Bắt buộc re-render lại để cập nhật Canvas che đi text gốc
        if (this.focusedPageId) {
            this.focusPage(this.focusedPageId, true);
        }
        if (typeof toast === 'function') {
            toast('Đã lưu nội dung văn bản mới');
        }
    }


    bindEvents() {
        const thumbSelect = document.getElementById('po-tb-thumb-size');
        if (thumbSelect) {
            thumbSelect.value = this.thumbSize;
            thumbSelect.addEventListener('change', e => {
                this.thumbSize = e.target.value;
                localStorage.setItem('poThumbSize', this.thumbSize);
                this.renderGrid();
            });
        }
        if (!window.showSaveFilePicker) {
            const pickerLbl = document.getElementById('po-save-mode-picker-lbl');
            if (pickerLbl) pickerLbl.style.display = 'none';
        }

        
        const tb = document.getElementById('po-format-toolbar');
        if (tb) {
            tb.addEventListener('mousedown', e => e.stopPropagation());
            document.getElementById('po-ft-size').addEventListener('input', e => {
                if (this.activeEditDiv) {
                    const newSize = parseFloat(e.target.value) || 12;
                    this.activeEditDiv.dataset.pdfSize = newSize;
                    const origPdfSize = parseFloat(this.activeEditDiv.dataset.origPdfSize) || 12;
                    const initialFontCqh = parseFloat(this.activeEditDiv.dataset.initialFontCqh);
                    if (initialFontCqh && origPdfSize > 0) {
                        this.activeEditDiv.style.fontSize = `${initialFontCqh * (newSize / origPdfSize)}cqh`;
                    }
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

        document.getElementById('po-tb-sel-apply').onclick = () => {
            const val = document.getElementById('po-tb-sel-range').value.replace(/ /g,'');
            if(!val) return;
            const ranges = val.split(',');
            const toSelect = new Set();
            for(let r of ranges) {
                if(r.includes('-')) {
                    let [s, e] = r.split('-').map(Number);
                    if(!isNaN(s) && !isNaN(e)) {
                        for(let i=Math.min(s,e); i<=Math.max(s,e); i++) toSelect.add(i);
                    }
                } else {
                    let n = Number(r);
                    if(!isNaN(n)) toSelect.add(n);
                }
            }
            this.pages.forEach((p, i) => p.selected = toSelect.has(i + 1));
            this.updateSelection();
            this.renderGrid();
        };
        document.getElementById('po-tb-sel-even').onclick = () => {
            this.pages.forEach((p, i) => p.selected = ((i + 1) % 2 === 0));
            this.updateSelection();
            this.renderGrid();
        };
        document.getElementById('po-tb-sel-odd').onclick = () => {
            this.pages.forEach((p, i) => p.selected = ((i + 1) % 2 !== 0));
            this.updateSelection();
            this.renderGrid();
        };
        document.getElementById('po-tb-sel-inv').onclick = () => {
            this.pages.forEach(p => p.selected = !p.selected);
            this.updateSelection();
            this.renderGrid();
        };
        document.getElementById('po-tb-rev-order').onclick = () => {
            const selIndices = this.pages.map((p, i) => p.selected ? i : -1).filter(i => i !== -1);
            if (selIndices.length < 2) return;
            const selPages = selIndices.map(i => this.pages[i]);
            selPages.reverse();
            selIndices.forEach((origIdx, arrIdx) => {
                this.pages[origIdx] = selPages[arrIdx];
            });
            this.pushHistory();
            this.renderGrid();
        };
        
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
        document.getElementById('po-tb-edit-text').onclick = () => {
            this.toggleEditMode();
        };
        document.getElementById('po-tb-add-pdf').onclick = (e) => { this.showInsertMenu(e, this.pages.length); };
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
        document.getElementById('po-save').onclick = () => this.showSaveModal(false);
        const btnExpSel = document.getElementById('po-export-sel');
        if(btnExpSel) btnExpSel.onclick = () => this.showSaveModal(true);
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

        this.bindAnnotationEvents();
    }

    bindAnnotationEvents() {
        const toolBtns = document.querySelectorAll('.po-edit-tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.setAnnTool(tool);
            });
        });

        const colorProp = document.getElementById('po-prop-color');
        if (colorProp) {
            colorProp.addEventListener('input', (e) => {
                this.currentAnnColor = e.target.value;
                if (this.selectedAnnId) {
                    this.updateAnnotation(this.selectedAnnId, { color: this.currentAnnColor });
                }
            });
        }

        const sizeProp = document.getElementById('po-prop-size');
        if (sizeProp) {
            sizeProp.addEventListener('change', (e) => {
                const sz = parseInt(e.target.value, 10);
                this.currentAnnFontSize = sz;
                this.currentAnnStrokeWidth = Math.max(1, Math.round(sz / 7));
                if (this.selectedAnnId) {
                    this.updateAnnotation(this.selectedAnnId, { fontSize: this.currentAnnFontSize, strokeWidth: this.currentAnnStrokeWidth });
                }
            });
        }

        const delAnnBtn = document.getElementById('po-edit-delete-sel');
        if (delAnnBtn) {
            delAnnBtn.addEventListener('click', () => {
                if (this.selectedAnnId) {
                    this.deleteAnnotation(this.selectedAnnId);
                }
            });
        }

        const closeEditBtn = document.getElementById('po-edit-close');
        if (closeEditBtn) {
            closeEditBtn.addEventListener('click', () => {
                this.toggleEditMode(false);
            });
        }

        const imgInput = document.getElementById('po-ann-img-input');
        if (imgInput) {
            imgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    this.addAnnotation({
                        id: 'ann_' + (++this.annCounter),
                        type: 'image',
                        leftPct: 25,
                        topPct: 25,
                        widthPct: 35,
                        heightPct: 25,
                        dataUrl
                    });
                };
                reader.readAsDataURL(file);
                imgInput.value = '';
            });
        }

        const sigModal = document.getElementById('po-sig-modal');
        const sigCanvas = document.getElementById('po-sig-canvas');
        let sigCtx = null;
        let isSigDrawing = false;
        if (sigCanvas) {
            sigCtx = sigCanvas.getContext('2d');
            sigCtx.lineWidth = 2.5;
            sigCtx.lineCap = 'round';
            sigCtx.lineJoin = 'round';
            sigCtx.strokeStyle = '#1a1f36';

            const getSigPos = (e) => {
                const rect = sigCanvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: (clientX - rect.left) * (sigCanvas.width / rect.width),
                    y: (clientY - rect.top) * (sigCanvas.height / rect.height)
                };
            };

            const startSig = (e) => {
                e.preventDefault();
                isSigDrawing = true;
                const pos = getSigPos(e);
                sigCtx.beginPath();
                sigCtx.moveTo(pos.x, pos.y);
            };
            const moveSig = (e) => {
                if (!isSigDrawing) return;
                e.preventDefault();
                const pos = getSigPos(e);
                sigCtx.lineTo(pos.x, pos.y);
                sigCtx.stroke();
            };
            const endSig = () => { isSigDrawing = false; };

            sigCanvas.addEventListener('mousedown', startSig);
            sigCanvas.addEventListener('mousemove', moveSig);
            window.addEventListener('mouseup', endSig);

            sigCanvas.addEventListener('touchstart', startSig, { passive: false });
            sigCanvas.addEventListener('touchmove', moveSig, { passive: false });
            window.addEventListener('touchend', endSig);
        }

        const sigClearBtn = document.getElementById('po-sig-clear');
        if (sigClearBtn && sigCanvas) {
            sigClearBtn.addEventListener('click', () => {
                sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            });
        }

        const sigCancelBtn = document.getElementById('po-sig-cancel');
        if (sigCancelBtn && sigModal) {
            sigCancelBtn.addEventListener('click', () => {
                sigModal.classList.remove('active');
                sigModal.style.display = 'none';
            });
        }

        const sigApplyBtn = document.getElementById('po-sig-apply');
        if (sigApplyBtn && sigModal && sigCanvas) {
            sigApplyBtn.addEventListener('click', () => {
                const dataUrl = sigCanvas.toDataURL('image/png');
                sigModal.classList.remove('active');
                sigModal.style.display = 'none';
                this.addAnnotation({
                    id: 'ann_' + (++this.annCounter),
                    type: 'signature',
                    leftPct: 30,
                    topPct: 40,
                    widthPct: 30,
                    heightPct: 15,
                    dataUrl
                });
            });
        }

        const annLayer = document.getElementById('po-ann-layer');
        const drawCanvas = document.getElementById('po-ann-drawing-canvas');

        if (annLayer) {
            let isCreatingShape = false;
            let startX = 0, startY = 0;
            let tempBox = null;

            const getLayerPosPct = (e) => {
                const rect = annLayer.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    xPct: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
                    yPct: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
                };
            };

            annLayer.addEventListener('mousedown', (e) => {
                if (!this.isEditMode) return;
                if (e.target !== annLayer) return;

                const tool = this.currentAnnTool;
                const pos = getLayerPosPct(e);

                if (tool === 'select') {
                    this.selectAnnotation(null);
                    return;
                }

                if (tool === 'text') {
                    this.addAnnotation({
                        id: 'ann_' + (++this.annCounter),
                        type: 'text',
                        leftPct: pos.xPct,
                        topPct: pos.yPct,
                        widthPct: 25,
                        heightPct: 6,
                        text: 'Văn bản mới',
                        color: this.currentAnnColor,
                        fontSize: this.currentAnnFontSize
                    });
                    return;
                }

                if (['whiteout', 'highlight', 'rect'].includes(tool)) {
                    isCreatingShape = true;
                    startX = pos.xPct;
                    startY = pos.yPct;
                    tempBox = document.createElement('div');
                    tempBox.className = 'po-ann-item po-ann-' + tool;
                    tempBox.style.left = startX + '%';
                    tempBox.style.top = startY + '%';
                    tempBox.style.width = '0%';
                    tempBox.style.height = '0%';
                    if (tool === 'rect') {
                        tempBox.style.borderColor = this.currentAnnColor;
                        tempBox.style.borderWidth = (this.currentAnnStrokeWidth || 2) + 'px';
                    }
                    annLayer.appendChild(tempBox);
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (!isCreatingShape || !tempBox) return;
                const pos = getLayerPosPct(e);
                const left = Math.min(startX, pos.xPct);
                const top = Math.min(startY, pos.yPct);
                const width = Math.abs(pos.xPct - startX);
                const height = Math.abs(pos.yPct - startY);
                tempBox.style.left = left + '%';
                tempBox.style.top = top + '%';
                tempBox.style.width = width + '%';
                tempBox.style.height = height + '%';
            });

            window.addEventListener('mouseup', (e) => {
                if (!isCreatingShape || !tempBox) return;
                isCreatingShape = false;
                const pos = getLayerPosPct(e);
                const left = Math.min(startX, pos.xPct);
                const top = Math.min(startY, pos.yPct);
                const width = Math.abs(pos.xPct - startX);
                const height = Math.abs(pos.yPct - startY);
                tempBox.remove();
                tempBox = null;

                if (width > 1 && height > 1) {
                    this.addAnnotation({
                        id: 'ann_' + (++this.annCounter),
                        type: this.currentAnnTool,
                        leftPct: left,
                        topPct: top,
                        widthPct: width,
                        heightPct: height,
                        color: this.currentAnnColor,
                        strokeWidth: this.currentAnnStrokeWidth || 2
                    });
                }
            });
        }

        if (drawCanvas) {
            let isDrawing = false;
            let currentPoints = [];
            const getCvsPosPct = (e) => {
                const rect = drawCanvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    xPct: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
                    yPct: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
                };
            };

            const startPen = (e) => {
                if (!this.isEditMode || this.currentAnnTool !== 'pen') return;
                e.preventDefault();
                isDrawing = true;
                currentPoints = [getCvsPosPct(e)];
                const ctx = drawCanvas.getContext('2d');
                ctx.beginPath();
                const p = currentPoints[0];
                ctx.moveTo((p.xPct / 100) * drawCanvas.width, (p.yPct / 100) * drawCanvas.height);
                ctx.strokeStyle = this.currentAnnColor;
                ctx.lineWidth = this.currentAnnStrokeWidth || 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            };

            const movePen = (e) => {
                if (!isDrawing) return;
                e.preventDefault();
                const pt = getCvsPosPct(e);
                currentPoints.push(pt);
                const ctx = drawCanvas.getContext('2d');
                ctx.lineTo((pt.xPct / 100) * drawCanvas.width, (pt.yPct / 100) * drawCanvas.height);
                ctx.stroke();
            };

            const endPen = () => {
                if (!isDrawing) return;
                isDrawing = false;
                if (currentPoints.length > 1) {
                    this.addAnnotation({
                        id: 'ann_' + (++this.annCounter),
                        type: 'pen',
                        points: currentPoints,
                        color: this.currentAnnColor,
                        strokeWidth: this.currentAnnStrokeWidth || 2
                    });
                }
                currentPoints = [];
            };

            drawCanvas.addEventListener('mousedown', startPen);
            drawCanvas.addEventListener('mousemove', movePen);
            window.addEventListener('mouseup', endPen);
            drawCanvas.addEventListener('touchstart', startPen, { passive: false });
            drawCanvas.addEventListener('touchmove', movePen, { passive: false });
            window.addEventListener('touchend', endPen);
        }
    }

    setAnnTool(tool) {
        this.currentAnnTool = tool;
        document.querySelectorAll('.po-edit-tool-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tool === tool);
        });
        const wrapper = document.getElementById('po-preview-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('edit-mode-drawing', tool === 'pen');
            wrapper.classList.toggle('drawing-shape-active', ['whiteout', 'highlight', 'rect', 'text'].includes(tool));
        }
        if (tool === 'image') {
            const inp = document.getElementById('po-ann-img-input');
            if (inp) inp.click();
        } else if (tool === 'signature') {
            const sigModal = document.getElementById('po-sig-modal');
            const sigCanvas = document.getElementById('po-sig-canvas');
            if (sigModal) {
                sigModal.classList.add('active');
                sigModal.style.display = 'flex';
                if (sigCanvas) {
                    const ctx = sigCanvas.getContext('2d');
                    ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                }
            }
        }
    }

    toggleEditMode(forceState) {
        this.isEditMode = (forceState !== undefined) ? forceState : !this.isEditMode;
        this.isTextMode = this.isEditMode;
        
        const subbar = document.getElementById('po-edit-subbar');
        const annLayer = document.getElementById('po-ann-layer');
        const drawCanvas = document.getElementById('po-ann-drawing-canvas');
        const wrapper = document.getElementById('po-preview-wrapper');
        const btnEdit = document.getElementById('po-tb-edit-text');

        if (subbar) subbar.style.display = this.isEditMode ? 'flex' : 'none';
        if (annLayer) annLayer.style.display = this.isEditMode ? 'block' : 'none';
        if (drawCanvas) drawCanvas.style.display = this.isEditMode ? 'block' : 'none';
        if (wrapper) {
            wrapper.classList.toggle('edit-mode-active', this.isEditMode);
            wrapper.classList.toggle('text-mode-active', this.isEditMode);
            wrapper.classList.toggle('edit-mode-drawing', this.isEditMode && this.currentAnnTool === 'pen');
            wrapper.classList.toggle('drawing-shape-active', this.isEditMode && ['whiteout', 'highlight', 'rect', 'text'].includes(this.currentAnnTool));
        }
        if (btnEdit) {
            btnEdit.classList.toggle('active', this.isEditMode);
            if (this.isEditMode) {
                btnEdit.style.backgroundColor = '#eff6ff';
                btnEdit.style.color = '#2563eb';
                btnEdit.style.borderColor = '#2563eb';
            } else {
                btnEdit.style.backgroundColor = '';
                btnEdit.style.color = '';
                btnEdit.style.borderColor = '';
            }
        }

        if (this.focusedPageId) {
            const page = this.pages.find(p => p.id === this.focusedPageId);
            if (page) {
                this.renderAnnotations(page);
                this.renderPenStrokes();
            }
        }
    }

    renderAnnotations(page) {
        const annLayer = document.getElementById('po-ann-layer');
        if (!annLayer) return;
        annLayer.innerHTML = '';
        if (!page || !page.annotations) return;

        page.annotations.forEach(ann => {
            if (ann.type === 'pen') return;
            const div = document.createElement('div');
            div.className = `po-ann-item po-ann-${ann.type}` + (this.selectedAnnId === ann.id ? ' selected' : '');
            div.dataset.id = ann.id;
            div.style.left = (ann.leftPct || 0) + '%';
            div.style.top = (ann.topPct || 0) + '%';
            div.style.width = (ann.widthPct || 10) + '%';
            div.style.height = (ann.heightPct || 5) + '%';

            if (ann.type === 'rect') {
                div.style.borderColor = ann.color || '#ef4444';
                div.style.borderWidth = (ann.strokeWidth || 2) + 'px';
            } else if (ann.type === 'text') {
                div.style.color = ann.color || '#1a1f36';
                div.style.fontSize = (ann.fontSize || 14) + 'px';
                div.contentEditable = 'true';
                div.textContent = ann.text || '';
                div.spellcheck = false;
                div.addEventListener('input', () => {
                    ann.text = div.innerText;
                    this.updateAnnCountState();
                });
            } else if (ann.type === 'image' || ann.type === 'signature') {
                const img = document.createElement('img');
                img.src = ann.dataUrl;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                div.appendChild(img);
            }

            const delBtn = document.createElement('div');
            delBtn.className = 'po-ann-delete-btn';
            delBtn.innerHTML = '✕';
            delBtn.title = 'Xóa đối tượng';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteAnnotation(ann.id);
            });
            div.appendChild(delBtn);

            div.addEventListener('mousedown', (e) => {
                if (e.target === delBtn) return;
                e.stopPropagation();
                this.selectAnnotation(ann.id);

                if (this.currentAnnTool === 'select' || !['text', 'whiteout', 'highlight', 'rect', 'pen'].includes(this.currentAnnTool)) {
                    let isDragging = true;
                    const startClientX = e.clientX;
                    const startClientY = e.clientY;
                    const origLeft = ann.leftPct;
                    const origTop = ann.topPct;
                    const layerRect = annLayer.getBoundingClientRect();

                    const onMove = (ev) => {
                        if (!isDragging) return;
                        const dxPct = ((ev.clientX - startClientX) / layerRect.width) * 100;
                        const dyPct = ((ev.clientY - startClientY) / layerRect.height) * 100;
                        const newLeft = Math.max(0, Math.min(100 - (ann.widthPct || 5), origLeft + dxPct));
                        const newTop = Math.max(0, Math.min(100 - (ann.heightPct || 5), origTop + dyPct));
                        div.style.left = newLeft + '%';
                        div.style.top = newTop + '%';
                    };

                    const onUp = (ev) => {
                        if (!isDragging) return;
                        isDragging = false;
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                        const dxPct = ((ev.clientX - startClientX) / layerRect.width) * 100;
                        const dyPct = ((ev.clientY - startClientY) / layerRect.height) * 100;
                        ann.leftPct = Math.max(0, Math.min(100 - (ann.widthPct || 5), origLeft + dxPct));
                        ann.topPct = Math.max(0, Math.min(100 - (ann.heightPct || 5), origTop + dyPct));
                        this.pushHistory();
                        this.updateAnnCountState();
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                }
            });

            annLayer.appendChild(div);
        });
    }

    renderPenStrokes() {
        const drawCanvas = document.getElementById('po-ann-drawing-canvas');
        if (!drawCanvas) return;
        const ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page || !page.annotations) return;

        page.annotations.filter(a => a.type === 'pen').forEach(ann => {
            if (!ann.points || ann.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = ann.color || '#1a1f36';
            ctx.lineWidth = ann.strokeWidth || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo((ann.points[0].xPct / 100) * drawCanvas.width, (ann.points[0].yPct / 100) * drawCanvas.height);
            for (let i = 1; i < ann.points.length; i++) {
                ctx.lineTo((ann.points[i].xPct / 100) * drawCanvas.width, (ann.points[i].yPct / 100) * drawCanvas.height);
            }
            ctx.stroke();
        });
    }

    addAnnotation(ann) {
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page) return;
        if (!page.annotations) page.annotations = [];
        page.annotations.push(ann);
        this.selectAnnotation(ann.id);
        this.renderAnnotations(page);
        this.renderPenStrokes();
        this.pushHistory();
        this.updateAnnCountState();
    }

    updateAnnotation(id, updates) {
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page || !page.annotations) return;
        const ann = page.annotations.find(a => a.id === id);
        if (!ann) return;
        Object.assign(ann, updates);
        this.renderAnnotations(page);
        this.renderPenStrokes();
        this.pushHistory();
        this.updateAnnCountState();
    }

    selectAnnotation(id) {
        this.selectedAnnId = id;
        document.querySelectorAll('.po-ann-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });
        const delBtn = document.getElementById('po-edit-delete-sel');
        if (delBtn) delBtn.disabled = !id;
    }

    deleteAnnotation(id) {
        const page = this.pages.find(p => p.id === this.focusedPageId);
        if (!page || !page.annotations) return;
        page.annotations = page.annotations.filter(a => a.id !== id);
        if (this.selectedAnnId === id) this.selectedAnnId = null;
        this.renderAnnotations(page);
        this.renderPenStrokes();
        this.pushHistory();
        this.updateAnnCountState();
    }

    updateAnnCountState() {
        const annCount = this.pages.reduce((sum, p) => sum + (p.annotations ? p.annotations.length : 0), 0);
        const textCount = this.pages.reduce((sum, p) => sum + (p.textEdits ? p.textEdits.length : 0), 0);
        const save = document.getElementById('po-save');
        if (save && (annCount > 0 || textCount > 0)) save.disabled = false;
        
        const changesEl = document.getElementById('po-meta-changes');
        if (changesEl && (annCount > 0 || textCount > 0)) {
            let msg = [];
            if (textCount > 0) msg.push(`Sửa ${textCount} đoạn văn bản`);
            if (annCount > 0) msg.push(`Thêm ${annCount} ghi chú/đối tượng`);
            changesEl.textContent = msg.join(' | ');
            changesEl.style.display = 'block';
        }
    }

    async loadScripts() {
        if (!window.pdfjsLib && !window['pdfjs-dist/build/pdf']) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'pdf.min.js';
                s.onload = () => {
                    window.pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
                    resolve();
                };
                s.onerror = () => {
                    const s2 = document.createElement('script');
                    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    s2.onload = () => {
                        window.pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
                        resolve();
                    };
                    s2.onerror = resolve;
                    document.head.appendChild(s2);
                };
                document.head.appendChild(s);
                setTimeout(resolve, 4000);
            });
        } else if (!window.pdfjsLib && window['pdfjs-dist/build/pdf']) {
            window.pdfjsLib = window['pdfjs-dist/build/pdf'];
        }

        if (window.pdfjsLib) {
            if (window.location.protocol === 'file:') {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            } else if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
            }
        }

        if (!window.Sortable) {
            await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = 'Sortable.min.js';
                s.onload = resolve;
                s.onerror = () => {
                    const s2 = document.createElement('script');
                    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js';
                    s2.onload = resolve;
                    s2.onerror = resolve;
                    document.head.appendChild(s2);
                };
                document.head.appendChild(s);
                setTimeout(resolve, 4000);
            });
        }
    }

    async handleFiles(fileList, insertAt) {
        if (!fileList || !fileList.length) return;
        const pdfFiles = Array.from(fileList).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (!pdfFiles.length) return alert('Vui lòng chọn tệp PDF');
        
        this.showLoading('Đang đọc trang...');
        try {
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
                let pdf = null;
                
                try {
                    const arrayBuffer = await f.arrayBuffer();
                    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                } catch (readErr) {
                    console.warn('Đọc bằng arrayBuffer thất bại, thử lại bằng ObjectURL:', readErr);
                    if (!f.objUrl) f.objUrl = URL.createObjectURL(f);
                    pdf = await pdfjsLib.getDocument(f.objUrl).promise;
                }
                
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
                this.fitMode = 'page';
                this.focusPage(this.pages[0].id);
            } else if (!isFirstUpload && newPages.length > 0) {
                this.focusPage(newPages[0].id);
                if (typeof toast === 'function') {
                    toast(`Đã chèn thêm ${newPages.length} trang vào tài liệu`);
                }
            }
        } catch (err) {
            console.error('Lỗi nạp tệp PDF:', err);
            this.hideLoading();
            alert('Không thể mở tệp PDF: ' + (err.message || 'Lỗi đọc tệp'));
        }
    }

    async handleImages(fileList, insertAt) {
        if (!fileList || !fileList.length) return;
        const imgFiles = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp)$/i.test(f.name));
        if (!imgFiles.length) return alert('Vui lòng chọn tệp hình ảnh (JPG, PNG, WebP)');
        
        this.showLoading('Đang xử lý hình ảnh...');
        try {
            const isFirstUpload = (this.files.length === 0 && this.pages.length === 0);
            if (isFirstUpload) {
                this.baseFilename = imgFiles[0].name.replace(/\.[^.]+$/, '');
                document.getElementById('po-meta-title').textContent = this.baseFilename;
                document.getElementById('po-meta-info').textContent = `Ảnh | ${(imgFiles[0].size / (1024*1024)).toFixed(1)} MB`;
                document.getElementById('po-initial-upload').style.display = 'none';
                document.getElementById('po-ws').style.display = 'flex';
            }
            
            const newPages = [];
            for (let i = 0; i < imgFiles.length; i++) {
                const f = imgFiles[i];
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(f);
                });
                
                const dims = await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                    img.onerror = () => resolve({ w: 595, h: 842 });
                    img.src = dataUrl;
                });
                
                const pageId = 'pg_' + (this.pageCounter++);
                const isPng = f.type === 'image/png' || f.name.toLowerCase().endsWith('.png');
                
                let ptW = dims.w;
                let ptH = dims.h;
                const maxDim = 1200;
                if (ptW > maxDim || ptH > maxDim) {
                    const s = Math.min(maxDim / ptW, maxDim / ptH);
                    ptW = Math.round(ptW * s);
                    ptH = Math.round(ptH * s);
                }
                
                const pageObj = {
                    id: pageId,
                    type: 'image',
                    width: ptW,
                    height: ptH,
                    rotation: 0,
                    dataUrl: dataUrl,
                    imgDataUrl: dataUrl,
                    imgFormat: isPng ? 'png' : 'jpg',
                    selected: false
                };
                
                this.thumbCache.set(pageId, dataUrl);
                newPages.push(pageObj);
                this.updateProgress(((i + 1) / imgFiles.length) * 100);
            }
            
            const idx = (insertAt !== undefined && insertAt !== null) ? insertAt : this.pages.length;
            this.pages.splice(idx, 0, ...newPages);
            this.hideLoading();
            this.pushHistory();
            this.renderGrid();
            this.updateStats();
            if (newPages.length > 0) {
                this.focusPage(newPages[0].id);
            }
            if (typeof toast === 'function') {
                toast(`Đã chèn thành công ${newPages.length} hình ảnh.`);
            }
        } catch (err) {
            console.error('Lỗi nạp hình ảnh:', err);
            this.hideLoading();
            alert('Không thể chèn hình ảnh: ' + (err.message || 'Lỗi đọc tệp'));
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
            
            const oldW = page.width;
            const oldH = page.height;
            page.width = baseVp.width;
            page.height = baseVp.height;
            
            if (oldW !== page.width || oldH !== page.height) {
                const card = document.querySelector(`.po-card-wrapper[data-id="${page.id}"] .po-card`);
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
            }
            const maxDim = 300;
            let scale = Math.min(maxDim / baseVp.width, maxDim / baseVp.height);
            if (scale > 1) scale = 1; // Don't upscale tiny pages too much
            
            const vp = pdfPage.getViewport({ scale });
            const cvs = document.createElement('canvas');
            const ctx = cvs.getContext('2d');
            cvs.width = vp.width; cvs.height = vp.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            
            const renderTask = pdfPage.render({ canvasContext: ctx, viewport: vp });
            this.activeThumbTasks.set(pageId, renderTask);
            await renderTask.promise;
            this.activeThumbTasks.delete(pageId);
            
            if (page.textEdits && page.textEdits.length > 0) {
                                ctx.fillStyle = 'white';
                                page.textEdits.forEach(edit => {
                                    const minX = edit.pdfMinX !== undefined ? edit.pdfMinX : edit.x;
                                    const maxX = edit.pdfMaxX !== undefined ? edit.pdfMaxX : (edit.x + edit.width);
                                    const minY = edit.pdfMinY !== undefined ? edit.pdfMinY : (edit.y - edit.height);
                                    const maxY = edit.pdfMaxY !== undefined ? edit.pdfMaxY : edit.y;
                                    const rect = vp.convertToViewportRectangle([minX, minY, maxX, maxY]);
                                    const x = Math.min(rect[0], rect[2]);
                                    const y = Math.min(rect[1], rect[3]);
                                    const w = Math.abs(rect[2] - rect[0]);
                                    const h = Math.abs(rect[3] - rect[1]);
                                    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
                                });
                            }
            
            cvs.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                page.dataUrl = url;
                this.thumbCache.set(cacheKey, url);
                if (imgElement) imgElement.src = url;
            }, 'image/jpeg', 0.8);
        } catch (e) {
            console.error('Error rendering thumbnail', e);
        }
    }

    addBlankPage(insertAt) {
        const pageId = 'pg_' + (this.pageCounter++);
        const cvs = document.createElement('canvas');
        cvs.width = 595; cvs.height = 842;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 595, 842);
        const dataUrl = cvs.toDataURL();
        
        this.thumbCache.set(pageId, dataUrl);
        
        const idx = (insertAt !== undefined && insertAt !== null) ? insertAt : this.pages.length;
        this.pages.splice(idx, 0, {
            id: pageId, type: 'blank', width: 595, height: 842,
            rotation: 0, dataUrl: dataUrl, selected: false
        });
        this.pushHistory();
        this.renderGrid();
        this.updateStats();
        this.focusPage(pageId);
        if (typeof toast === 'function') {
            toast('Đã thêm 1 trang trắng');
        }
    }

    pushHistory() {
        const snapshot = this.pages.map(p => ({
            id: p.id,
            type: p.type,
            fileIndex: p.fileIndex,
            pageIndex: p.pageIndex,
            rotation: p.rotation,
            width: p.width,
            height: p.height,
            textEdits: p.textEdits ? JSON.parse(JSON.stringify(p.textEdits)) : [],
            annotations: p.annotations ? JSON.parse(JSON.stringify(p.annotations)) : []
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
                dataUrl: this.thumbCache.get(cacheKey) || null,
                textEdits: p.textEdits ? JSON.parse(JSON.stringify(p.textEdits)) : [],
                annotations: p.annotations ? JSON.parse(JSON.stringify(p.annotations)) : []
            };
        });
        this.renderGrid();
        this.updateUndoRedo();
        this.updateStats();
        if (this.focusedPageId) {
            const page = this.pages.find(p => p.id === this.focusedPageId);
            if (page) {
                this.renderAnnotations(page);
                this.renderPenStrokes();
                this.focusPage(this.focusedPageId, true);
            }
        }
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
        
        const exportBtn = document.getElementById('po-export-sel');
        if (exportBtn) {
            exportBtn.style.display = selCount > 0 ? 'inline-block' : 'none';
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
            let cardW = Math.round(baseH * (boxW / boxH));
            if (cardW > maxW) cardW = maxW;
            if (cardW < baseH * 0.5) cardW = Math.round(baseH * 0.5); // Min width
            
            const card = document.createElement('div');
            card.className = `po-card ${p.selected ? 'selected' : ''}`;
            card.style.width = cardW + 'px';
            card.style.height = baseH + 'px';
            
            card.innerHTML = `
                <div class="po-card-num">${i + 1}</div>
                <div class="po-card-preview">
                    <img data-id="${p.id}" ${p.dataUrl ? `src="${p.dataUrl}"` : ''} style="transform: rotate(${p.rotation}deg); ${p.type==='blank'?'border:1px solid #e2e8f0':''}">
                </div>
                <div class="po-card-label">${p.type === 'blank' ? 'Trang trống' : 'Trang ' + (p.pageIndex + 1)}</div>
            
                <div class="po-card-actions">
                    <button class="po-ca-btn po-ca-rot-l" title="Xoay trái">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                    <button class="po-ca-btn po-ca-rot-r" title="Xoay phải">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </button>
                    <button class="po-ca-btn po-ca-del" title="Xóa trang" style="color:var(--po-danger);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;
            
            // Interaction
            card.onclick = e => this.handleCardClick(e, p, i);
            wrapper.onclick = e => this.handleCardClick(e, p, i);
            
            const btnRotL = card.querySelector('.po-ca-rot-l');
            const btnRotR = card.querySelector('.po-ca-rot-r');
            const btnDel = card.querySelector('.po-ca-del');
            
            if (btnRotL) btnRotL.onclick = (e) => { e.stopPropagation(); p.rotation -= 90; this.pushHistory(); this.renderGrid(); if (this.focusedPageId === p.id) this.layoutPreview(); };
            if (btnRotR) btnRotR.onclick = (e) => { e.stopPropagation(); p.rotation += 90; this.pushHistory(); this.renderGrid(); if (this.focusedPageId === p.id) this.layoutPreview(); };
            if (btnDel) btnDel.onclick = (e) => { e.stopPropagation(); this.pages.splice(i, 1); this.pushHistory(); this.renderGrid(); this.showUndoToast('Đã xóa 1 trang'); if (this.focusedPageId === p.id && this.pages.length > 0) this.focusPage(this.pages[Math.min(i, this.pages.length - 1)].id); };
            
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
        
        const addCardWrapper = document.createElement('div');
        addCardWrapper.className = 'po-card-wrapper po-add-card-wrapper';
        addCardWrapper.innerHTML = `
            <div class="po-card po-add-card" id="po-add-page-card" title="Thêm trang mới hoặc chèn tệp PDF / ảnh">
                <div class="po-add-card-inner">
                    <div class="po-add-card-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <div class="po-add-card-text">Thêm tệp / trang</div>
                </div>
            </div>
        `;
        addCardWrapper.querySelector('.po-add-card').onclick = (e) => {
            e.stopPropagation();
            this.showInsertMenu(e, this.pages.length);
        };
        grid.appendChild(addCardWrapper);
        
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

    
    groupTextItems(items, styles, transform, Util, W, H, baseVp) {
        let processedItems = [];
        items.forEach((item, index) => {
            if (!item.str || item.str.trim() === '') return;
            const t_vp = Util.transform(transform, item.transform);
            
            const scaleX = Math.abs(transform[0]) || 1;
            const scaleY = Math.abs(transform[3]) || 1;
            
            // FONT HEIGHT CALCULATION (30 Years Experience Fix)
            // t_vp[2] and t_vp[3] represent the Y-axis vector in Viewport space.
            let fontH = Math.hypot(t_vp[2], t_vp[3]);
            
            // If fontH is tiny (e.g. text matrix is unscaled or scaled down to 0.01),
            // we must use item.height (unscaled glyph height) and multiply it by the matrix scale!
            if (fontH < 2 && item.height) {
                fontH = item.height * scaleY; 
            }
            if (fontH < 1) fontH = 10;
            
            const origin_vp = [t_vp[4], t_vp[5]];
            const vecX_vp = [t_vp[0], t_vp[1]];
            
            const advanceScale_vp = Math.hypot(vecX_vp[0], vecX_vp[1]) || scaleX;
            const angle_vp = Math.atan2(t_vp[1], t_vp[0]);
            
            const dir_vp = [Math.cos(angle_vp), Math.sin(angle_vp)];
            const normal_vp = [-Math.sin(angle_vp), Math.cos(angle_vp)];
            
            const lenX_user = Math.hypot(item.transform[0], item.transform[1]) || 1;
            let width_vp = (item.width / lenX_user) * advanceScale_vp;
            
            // Fallback for missing or zero-width items (e.g. big titles in some CAD PDFs)
            if (width_vp < 0.1) width_vp = fontH * 0.5 * item.str.length;
            
            if (fontH < 0.1 || width_vp < 0.1) return;
            
            processedItems.push({
                ...item, index, t_vp, origin_vp, fontSize_vp: fontH, angle_vp, dir_vp, normal_vp, width_vp,
                pdfX: item.transform[4], pdfY: item.transform[5],
                pdfSize: Math.hypot(item.transform[2], item.transform[3]) || item.height || (fontH / scaleY)
            });
        });

        // PASS 1: Group into single lines based on baseline collinearity
        let lines = [];
        processedItems.forEach(box => {
            let merged = false;
            for (const l of lines) {
                if (Math.abs(box.angle_vp - l.angle_vp) > 0.05) continue; // Must have same rotation
                if (Math.abs(box.fontSize_vp - l.fontSize_vp) > l.fontSize_vp * 0.3) continue; // Must be similar size
                
                const dx = box.origin_vp[0] - l.origin_vp[0];
                const dy = box.origin_vp[1] - l.origin_vp[1];
                
                // Vertical distance from line's baseline
                const vDist = Math.abs(dx * l.normal_vp[0] + dy * l.normal_vp[1]);
                
                if (vDist <= l.fontSize_vp * 0.35) { // Highly collinear
                    const hStart = dx * l.dir_vp[0] + dy * l.dir_vp[1];
                    const hEnd = hStart + box.width_vp;
                    
                    // Horizontal gap check
                    const gap = Math.max(0, Math.max(l.minH - hEnd, hStart - l.maxH));
                    
                    if (gap <= l.fontSize_vp * 4.0) { // Allow reasonable gaps for spaces
                        l.items.push({ ...box, hStart, hEnd });
                        l.minH = Math.min(l.minH, hStart);
                        l.maxH = Math.max(l.maxH, hEnd);
                        merged = true;
                        break;
                    }
                }
            }
            if (!merged) {
                lines.push({
                    items: [{ ...box, hStart: 0, hEnd: box.width_vp }],
                    origin_vp: box.origin_vp, angle_vp: box.angle_vp, dir_vp: box.dir_vp, normal_vp: box.normal_vp,
                    fontSize_vp: box.fontSize_vp, minH: 0, maxH: box.width_vp,
                    pdfMinY: box.pdfY
                });
            }
        });

        // Format text inside each line
        lines.forEach(l => {
            l.items.sort((a, b) => a.hStart - b.hStart);
            let lineStr = "";
            for (let i = 0; i < l.items.length; i++) {
                if (i === 0) { lineStr += l.items[i].str; }
                else {
                    const gap = l.items[i].hStart - l.items[i-1].hEnd;
                    if (gap > l.fontSize_vp * 0.2) lineStr += " " + l.items[i].str;
                    else lineStr += l.items[i].str;
                }
            }
            l.text = lineStr;
        });

        // SORT LINES TOP-TO-BOTTOM BEFORE MULTI-LINE MERGE
        lines.sort((a, b) => a.origin_vp[1] - b.origin_vp[1]);

        // PASS 2: Group adjacent lines into Blocks (Paragraphs)
        let blocks = [];
        lines.forEach(line => {
            let merged = false;
            for (const b of blocks) {
                if (Math.abs(b.angle_vp - line.angle_vp) > 0.05) continue;
                if (Math.abs(b.fontSize_vp - line.fontSize_vp) > b.fontSize_vp * 0.3) continue;
                
                const dx_block = line.origin_vp[0] - b.origin_vp[0];
                const dy_block = line.origin_vp[1] - b.origin_vp[1];
                const vOffset = dx_block * b.normal_vp[0] + dy_block * b.normal_vp[1];
                
                const lastLine = b.lineObjects[b.lineObjects.length - 1];
                const dx_last = line.origin_vp[0] - lastLine.origin_vp[0];
                const dy_last = line.origin_vp[1] - lastLine.origin_vp[1];
                const vDist = Math.abs(dx_last * b.normal_vp[0] + dy_last * b.normal_vp[1]);
                
                // Only merge if the next line is directly below (0.5 to 3.0 font sizes away)
                if (vDist > b.fontSize_vp * 0.5 && vDist < b.fontSize_vp * 3.0) {
                    const hOffset = dx_block * b.dir_vp[0] + dy_block * b.dir_vp[1];
                    const lineMinH = line.minH + hOffset;
                    const lineMaxH = line.maxH + hOffset;
                    
                    const leftAlign = Math.abs(lastLine.minH_block - lineMinH) < b.fontSize_vp * 2.0;
                    const rightAlign = Math.abs(lastLine.maxH_block - lineMaxH) < b.fontSize_vp * 2.0;
                    const centerAlign = Math.abs((lastLine.minH_block + lastLine.maxH_block)/2 - (lineMinH + lineMaxH)/2) < b.fontSize_vp * 2.0;
                    const hOverlap = Math.min(lastLine.maxH_block, lineMaxH) - Math.max(lastLine.minH_block, lineMinH);
                    
                    if (leftAlign || rightAlign || centerAlign || hOverlap > b.fontSize_vp * 2) {
                        line.minH_block = lineMinH; line.maxH_block = lineMaxH;
                        b.lineObjects.push(line);
                        b.items.push(...line.items);
                        b.minH = Math.min(b.minH, lineMinH);
                        b.maxH = Math.max(b.maxH, lineMaxH);
                        b.minV = Math.min(b.minV, vOffset - line.fontSize_vp);
                        b.maxV = Math.max(b.maxV, vOffset + line.fontSize_vp * 0.2); // descent
                        merged = true;
                        break;
                    }
                }
            }
            if (!merged) {
                line.minH_block = line.minH; line.maxH_block = line.maxH;
                blocks.push({
                    lineObjects: [line], items: [...line.items],
                    origin_vp: line.origin_vp, angle_vp: line.angle_vp, dir_vp: line.dir_vp, normal_vp: line.normal_vp,
                    fontSize_vp: line.fontSize_vp,
                    minH: line.minH, maxH: line.maxH, minV: -line.fontSize_vp, maxV: line.fontSize_vp * 0.2
                });
            }
        });

        // CALCULATE FINAL CSS TRANSFORMS
        blocks.forEach(b => {
            b.lineObjects.sort((a, c) => {
                const dxA = a.origin_vp[0] - b.origin_vp[0]; const dyA = a.origin_vp[1] - b.origin_vp[1];
                const vA = dxA * b.normal_vp[0] + dyA * b.normal_vp[1];
                const dxC = c.origin_vp[0] - b.origin_vp[0]; const dyC = c.origin_vp[1] - b.origin_vp[1];
                const vC = dxC * b.normal_vp[0] + dyC * b.normal_vp[1];
                return vA - vC;
            });
            b.text = b.lineObjects.map(l => l.text).join('\n');
            
            const O = b.origin_vp;
            // P1 is the Top-Left corner of the rotated box
            const P1 = [ O[0] + b.minH * b.dir_vp[0] + b.minV * b.normal_vp[0], O[1] + b.minH * b.dir_vp[1] + b.minV * b.normal_vp[1] ];
            
            b.cssLeft = P1[0]; 
            b.cssTop = P1[1];
            b.cssWidth = b.maxH - b.minH; 
            b.cssHeight = b.maxV - b.minV;
            b.cssTransform = `rotate(${b.angle_vp * 180 / Math.PI}deg)`; // Use deg for better CSS compatibility
            
            // Standard coordinate properties for DOM & backwards-compatibility
            b.left = b.cssLeft;
            b.top = b.cssTop;
            b.right = b.cssLeft + b.cssWidth;
            b.bottom = b.cssTop + b.cssHeight;
            b.width = b.cssWidth;
            b.height = b.cssHeight;

            // Calculate exact PDF User Space bounds using baseVp.convertToPdfPoint (handles any rotation /Rotate 0/90/180/270)
            if (baseVp && typeof baseVp.convertToPdfPoint === 'function') {
                const P2 = [ P1[0] + b.cssWidth * Math.cos(b.angle_vp), P1[1] + b.cssWidth * Math.sin(b.angle_vp) ];
                const P3 = [ P2[0] - b.cssHeight * Math.sin(b.angle_vp), P2[1] + b.cssHeight * Math.cos(b.angle_vp) ];
                const P4 = [ P1[0] - b.cssHeight * Math.sin(b.angle_vp), P1[1] + b.cssHeight * Math.cos(b.angle_vp) ];
                const pts = [
                    baseVp.convertToPdfPoint(P1[0], P1[1]),
                    baseVp.convertToPdfPoint(P2[0], P2[1]),
                    baseVp.convertToPdfPoint(P3[0], P3[1]),
                    baseVp.convertToPdfPoint(P4[0], P4[1])
                ];
                b.pdfMinX = Math.min(...pts.map(p => p[0]));
                b.pdfMaxX = Math.max(...pts.map(p => p[0]));
                b.pdfMinY = Math.min(...pts.map(p => p[1]));
                b.pdfMaxY = Math.max(...pts.map(p => p[1]));
            } else {
                let pdfMinX = Infinity, pdfMaxX = -Infinity, pdfMinY = Infinity, pdfMaxY = -Infinity;
                b.items.forEach(i => {
                    pdfMinX = Math.min(pdfMinX, i.pdfX);
                    pdfMaxX = Math.max(pdfMaxX, i.pdfX + (i.width_vp / (Math.abs(transform[0]) || 1)));
                    pdfMinY = Math.min(pdfMinY, i.pdfY);
                    pdfMaxY = Math.max(pdfMaxY, i.pdfY + i.pdfSize);
                });
                b.pdfMinX = pdfMinX; b.pdfMaxX = pdfMaxX; b.pdfMinY = pdfMinY; b.pdfMaxY = pdfMaxY;
            }
            b.pdfSize = b.items[0].pdfSize;
            b.size = b.fontSize_vp; 
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
            const blocks = this.groupTextItems(textContent.items, textContent.styles, baseVp.transform, Util, W, H, baseVp);
            blocks.forEach((block, index) => {
                const blockId = 'block_' + index;
                const edited = pageData.textEdits.find(e => e.id === blockId);
                const div = document.createElement('div');
                div.className = 'po-text-box' + (edited ? ' edited' : '');
                if (block.lineObjects && block.lineObjects.length === 1) div.classList.add('single-line');
                div.style.left = `${(block.cssLeft / W) * 100}%`;
                div.style.top = `${(block.cssTop / H) * 100}%`;
                div.style.width = `${(block.cssWidth / W) * 100}%`;
                div.style.height = 'auto'; 
                div.style.minHeight = `${(block.cssHeight / H) * 100}%`;
                div.style.transformOrigin = '0 0';
                div.style.transform = block.cssTransform || 'none';
                const fontCqh = (block.size / H) * 100;
                div.style.fontSize = `${fontCqh}cqh`;
                div.dataset.initialFontCqh = fontCqh;
                div.dataset.origPdfSize = block.pdfSize;
                div.style.lineHeight = '1.15';
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
                    if (edited.size && block.pdfSize > 0) {
                        div.style.fontSize = `${fontCqh * (edited.size / block.pdfSize)}cqh`;
                    }
                }
                div.spellcheck = false;

                div.addEventListener('mousedown', e => { if (this.isTextMode) e.stopPropagation(); });

                div.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                });
                
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
                        let top = rect.top - wrapperRect.top - 45;
                        if (top < 0) {
                            top = rect.bottom - wrapperRect.top + 8;
                        }
                        let left = rect.left - wrapperRect.left;
                        const maxLeft = Math.max(0, wrapperRect.width - (tb.offsetWidth || 280));
                        left = Math.max(0, Math.min(left, maxLeft));
                        tb.style.top = top + 'px';
                        tb.style.left = left + 'px';
                        
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
            await new Promise((res) => {
                const s = document.createElement('script');
                s.src = 'fontkit.umd.min.js';
                s.onload = res;
                s.onerror = () => {
                    const s2 = document.createElement('script');
                    s2.src = 'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js';
                    s2.onload = res;
                    s2.onerror = res;
                    document.head.appendChild(s2);
                };
                document.head.appendChild(s);
                setTimeout(res, 4000);
            });
        }
        if (!this._fontBytes) {
            try {
                const r = await fetch('NotoSans-Regular.ttf');
                if (r.ok) this._fontBytes = await r.arrayBuffer();
            } catch (e) {}
            if (!this._fontBytes) {
                try {
                    const r2 = await fetch('https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/NotoSans-Regular.ttf');
                    if (r2.ok) this._fontBytes = await r2.arrayBuffer();
                } catch(e) {}
            }
        }
        if (window.fontkit && this._fontBytes) {
            try {
                doc.registerFontkit(window.fontkit);
                return await doc.embedFont(this._fontBytes, { subset: true });
            } catch (fErr) {
                console.warn('registerFontkit failed, fallback to Helvetica:', fErr);
            }
        }
        return await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
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
                        page.width = baseVp.width;
                        page.height = baseVp.height;
                        
                        this.renderTextLayer(pdfPage, baseVp, page);
                        
                        const finalRot = (pdfPage.rotate + (page.rotation || 0) + 360) % 360;
                        const rotVp = pdfPage.getViewport({ scale: 1, rotation: finalRot });
                        
                        let targetScale = (this.zoomLevel || 1) * (window.devicePixelRatio || 1);
                        if (rotVp.width * targetScale > 3200 || rotVp.height * targetScale > 3200) {
                            targetScale = Math.min(3200 / rotVp.width, 3200 / rotVp.height);
                        }
                        
                        const vp = pdfPage.getViewport({ scale: targetScale, rotation: finalRot });
                        const cvs = document.createElement('canvas');
                        const ctx = cvs.getContext('2d');
                        cvs.width = vp.width; cvs.height = vp.height;
                        
                        // Tô nền trắng trước khi vẽ để tránh tài liệu CAD/vector nền trong suốt bị đen hoặc lỗi
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, cvs.width, cvs.height);
                        
                        const renderTask = pdfPage.render({ canvasContext: ctx, viewport: vp });
                        taskObj.cancel = () => { taskObj.cancelled = true; renderTask.cancel(); };
                        this.previewTask.cancel = taskObj.cancel;

                        return renderTask.promise.then(() => {
                            if (taskObj.cancelled || this.focusedPageId !== id) return;
                            
                            if (page.textEdits && page.textEdits.length > 0) {
                                ctx.fillStyle = 'white';
                                page.textEdits.forEach(edit => {
                                    const rect = vp.convertToViewportRectangle([edit.x, edit.y - edit.height, edit.x + edit.width, edit.y]);
                                    const x = Math.min(rect[0], rect[2]);
                                    const y = Math.min(rect[1], rect[3]);
                                    const w = Math.abs(rect[2] - rect[0]);
                                    const h = Math.abs(rect[3] - rect[1]);
                                    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
                                });
                            }
                            
                            cvs.toBlob(blob => {
                                if (taskObj.cancelled || this.focusedPageId !== id) return;
                                if (!blob) {
                                    if (page.dataUrl) img.src = page.dataUrl;
                                    return;
                                }
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
                                    thumbCtx.fillStyle = '#ffffff';
                                    thumbCtx.fillRect(0, 0, thumbCvs.width, thumbCvs.height);
                                    thumbCtx.drawImage(cvs, 0, 0, thumbCvs.width, thumbCvs.height);
                                    
                                    thumbCvs.toBlob(thumbBlob => {
                                        if (!thumbBlob) return;
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
                            if (page.dataUrl && this.focusedPageId === id) {
                                img.src = page.dataUrl;
                            }
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
        this.renderAnnotations(page);
        this.renderPenStrokes();
        this.layoutPreview();
    }

    layoutPreview() {
        const img = document.getElementById('po-preview-img');
        const wrapper = document.getElementById('po-preview-wrapper');
        const container = document.getElementById('po-preview-canvas');
        const layer = document.getElementById('po-text-layer');
        const drawCanvas = document.getElementById('po-ann-drawing-canvas');
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
        
        if (this.fitMode && container.clientWidth > 100) {
            const fitScale = this.fitMode === 'width' ? aw / boxW : Math.min(aw / boxW, ah / boxH);
            this.zoomLevel = Math.max(0.05, Math.min(5, fitScale));
            this.fitMode = null;
            const pctEl = document.getElementById('pv-zoom-pct');
            if (pctEl) pctEl.textContent = Math.round(this.zoomLevel * 100) + '%';
        } else if (!this.zoomLevel && container.clientWidth > 100) {
            this.zoomLevel = Math.max(0.05, Math.min(5, Math.min(aw / boxW, ah / boxH)));
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

        if (drawCanvas) {
            drawCanvas.width = W;
            drawCanvas.height = H;
            this.renderPenStrokes();
        }
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

    initSortable() {
        if (this.sortable) {
            try { this.sortable.destroy(); } catch (e) {}
            this.sortable = null;
        }
        if (typeof Sortable === 'undefined') {
            console.warn('Thư viện Sortable chưa sẵn sàng, tạm tắt kéo thả.');
            return;
        }
        const grid = document.getElementById('po-grid');
        try {
            this.sortable = new Sortable(grid, {
                animation: 150,
                delay: 200,
                delayOnTouchOnly: true,
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
        } catch (sErr) {
            console.warn('Lỗi khởi tạo Sortable:', sErr);
        }
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
            <div class="po-menu-item" id="menu-add-pdf" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Chèn từ tệp PDF...</span>
            </div>
            <div class="po-menu-item" id="menu-add-img" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Chèn ảnh (JPG / PNG / WebP)...</span>
            </div>
            <div class="po-menu-item" id="menu-add-blank" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                <span>Thêm trang giấy trắng</span>
            </div>
        `;
        let x = e.pageX || (e.clientX ? (e.clientX + window.scrollX) : 100);
        let y = e.pageY || (e.clientY ? (e.clientY + window.scrollY) : 100);
        if (x + 240 > window.innerWidth) x = Math.max(10, window.innerWidth - 250);
        
        menu.style.position = 'absolute';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.background = '#fff';
        menu.style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)';
        menu.style.borderRadius = '8px';
        menu.style.border = '1px solid var(--po-border)';
        menu.style.padding = '6px';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '220px';
        
        document.body.appendChild(menu);
        
        menu.querySelector('#menu-add-blank').onclick = () => {
            menu.remove();
            this.addBlankPage(index);
        };
        menu.querySelector('#menu-add-pdf').onclick = () => {
            menu.remove();
            this.insertIndex = index;
            document.getElementById('po-insert-file').click();
        };
        menu.querySelector('#menu-add-img').onclick = () => {
            menu.remove();
            const fi = document.createElement('input');
            fi.type = 'file';
            fi.accept = 'image/jpeg, image/png, image/webp, image/bmp';
            fi.multiple = true;
            fi.onchange = ev => this.handleImages(ev.target.files, index);
            fi.click();
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

    async showSaveModal(exportSelected = false) {
        this.exportSelectedMode = exportSelected;
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
        
        const exportSelected = this.exportSelectedMode;
        const targetPages = exportSelected ? this.pages.filter(p => p.selected) : this.pages;
        if (targetPages.length === 0) return;
        
        const hasEncrypted = targetPages.some(p => p.type === 'pdf' && this.encrypted[p.fileIndex]);
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
                for (let i = 0; i < targetPages.length; i++) {
                    const p = targetPages[i];
                    if (p.type === 'blank') {
                        finalDoc.addPage([p.width || 595, p.height || 842]);
                    } else if (p.type === 'image') {
                        let imgEmbed;
                        if (p.imgFormat === 'png') {
                            imgEmbed = await finalDoc.embedPng(p.imgDataUrl);
                        } else {
                            imgEmbed = await finalDoc.embedJpg(p.imgDataUrl);
                        }
                        const newPage = finalDoc.addPage([p.width, p.height]);
                        newPage.drawImage(imgEmbed, { x: 0, y: 0, width: p.width, height: p.height });
                        if (p.rotation !== 0) newPage.setRotation(window.PDFLib.degrees(p.rotation));
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
                    this.updateProgress(30 + (50 * i / targetPages.length));
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
                
                const totalOps = targetPages.length;
                
                // P2-1: Gom copyPages
                const fileIndicesMap = {};
                for (let i = 0; i < totalOps; i++) {
                    const p = targetPages[i];
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
                    const p = targetPages[i];
                    if (p.type === 'blank') {
                        finalDoc.addPage([p.width || 595, p.height || 842]);
                    } else if (p.type === 'image') {
                        let imgEmbed;
                        if (p.imgFormat === 'png') {
                            imgEmbed = await finalDoc.embedPng(p.imgDataUrl);
                        } else {
                            imgEmbed = await finalDoc.embedJpg(p.imgDataUrl);
                        }
                        const newPage = finalDoc.addPage([p.width, p.height]);
                        newPage.drawImage(imgEmbed, { x: 0, y: 0, width: p.width, height: p.height });
                        if (p.rotation !== 0) newPage.setRotation(window.PDFLib.degrees(p.rotation));
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
            for (let i = 0; i < targetPages.length; i++) {
                const p = targetPages[i];
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
                    const minX = edit.pdfMinX !== undefined ? edit.pdfMinX : edit.x;
                    const maxX = edit.pdfMaxX !== undefined ? edit.pdfMaxX : (edit.x + edit.width);
                    const minY = edit.pdfMinY !== undefined ? edit.pdfMinY : (edit.y - edit.height);
                    const maxY = edit.pdfMaxY !== undefined ? edit.pdfMaxY : edit.y;
                    targetPage.drawRectangle({
                        x: minX - 2,
                        y: minY - 2,
                        width: (maxX - minX) + 4,
                        height: (maxY - minY) + 4,
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

                        const pageRot = targetPage.getRotation().angle || 0;
                        if (pageRot === 90) {
                            let currentX = minX + size;
                            for (const line of wrappedLines) {
                                const tw = editFont.widthOfTextAtSize(line, size);
                                let drawY = minY;
                                if (edit.align === 'center') {
                                    drawY = minY + ((maxY - minY) - tw) / 2;
                                } else if (edit.align === 'right') {
                                    drawY = maxY - tw;
                                }
                                targetPage.drawText(line, {
                                    x: currentX,
                                    y: drawY,
                                    size: size,
                                    font: editFont,
                                    color: window.PDFLib.rgb(r, g, b),
                                    rotate: window.PDFLib.degrees(90)
                                });
                                currentX += lineHeight;
                            }
                        } else {
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
            }

            // Apply Rich Annotations (Shapes, Text, Images, Signatures, Pen)
            for (let i = 0; i < targetPages.length; i++) {
                const p = targetPages[i];
                if (!p.annotations || p.annotations.length === 0) continue;
                const targetPage = finalPages[i];
                if (!targetPage) continue;
                
                const pageWidth = targetPage.getWidth();
                const pageHeight = targetPage.getHeight();

                for (const ann of p.annotations) {
                    const pdfX = (ann.leftPct / 100) * pageWidth;
                    const pdfY = (1 - (ann.topPct + (ann.heightPct || 5)) / 100) * pageHeight;
                    const pdfW = ((ann.widthPct || 10) / 100) * pageWidth;
                    const pdfH = ((ann.heightPct || 5) / 100) * pageHeight;

                    if (ann.type === 'whiteout') {
                        targetPage.drawRectangle({
                            x: pdfX,
                            y: pdfY,
                            width: pdfW,
                            height: pdfH,
                            color: window.PDFLib.rgb(1, 1, 1)
                        });
                    } else if (ann.type === 'highlight') {
                        targetPage.drawRectangle({
                            x: pdfX,
                            y: pdfY,
                            width: pdfW,
                            height: pdfH,
                            color: window.PDFLib.rgb(1, 0.92, 0.23),
                            opacity: 0.4
                        });
                    } else if (ann.type === 'rect') {
                        const hex = ann.color || '#ef4444';
                        const r = parseInt(hex.slice(1,3), 16)/255 || 0;
                        const g = parseInt(hex.slice(3,5), 16)/255 || 0;
                        const b = parseInt(hex.slice(5,7), 16)/255 || 0;
                        targetPage.drawRectangle({
                            x: pdfX,
                            y: pdfY,
                            width: pdfW,
                            height: pdfH,
                            borderColor: window.PDFLib.rgb(r, g, b),
                            borderWidth: ann.strokeWidth || 2
                        });
                    } else if (ann.type === 'text' && ann.text) {
                        if (!editFont) editFont = await this.getUnicodeFont(finalDoc);
                        const hex = ann.color || '#1a1f36';
                        const r = parseInt(hex.slice(1,3), 16)/255 || 0;
                        const g = parseInt(hex.slice(3,5), 16)/255 || 0;
                        const b = parseInt(hex.slice(5,7), 16)/255 || 0;
                        const fontSize = ann.fontSize || 14;

                        const lines = ann.text.split('\n');
                        let currentY = pdfY + pdfH - fontSize;
                        for (const line of lines) {
                            if (line) {
                                targetPage.drawText(line, {
                                    x: pdfX,
                                    y: currentY,
                                    size: fontSize,
                                    font: editFont,
                                    color: window.PDFLib.rgb(r, g, b)
                                });
                            }
                            currentY -= fontSize * 1.25;
                        }
                    } else if ((ann.type === 'image' || ann.type === 'signature') && ann.dataUrl) {
                        try {
                            let imgEmbed = null;
                            if (ann.dataUrl.startsWith('data:image/png')) {
                                imgEmbed = await finalDoc.embedPng(ann.dataUrl);
                            } else {
                                imgEmbed = await finalDoc.embedJpg(ann.dataUrl);
                            }
                            if (imgEmbed) {
                                targetPage.drawImage(imgEmbed, {
                                    x: pdfX,
                                    y: pdfY,
                                    width: pdfW,
                                    height: pdfH
                                });
                            }
                        } catch (imgErr) {
                            console.error('Lỗi nhúng ảnh/chữ ký:', imgErr);
                        }
                    } else if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
                        const hex = ann.color || '#1a1f36';
                        const r = parseInt(hex.slice(1,3), 16)/255 || 0;
                        const g = parseInt(hex.slice(3,5), 16)/255 || 0;
                        const b = parseInt(hex.slice(5,7), 16)/255 || 0;
                        const thick = ann.strokeWidth || 2;
                        for (let k = 0; k < ann.points.length - 1; k++) {
                            const p1 = ann.points[k];
                            const p2 = ann.points[k+1];
                            const p1X = (p1.xPct / 100) * pageWidth;
                            const p1Y = (1 - p1.yPct / 100) * pageHeight;
                            const p2X = (p2.xPct / 100) * pageWidth;
                            const p2Y = (1 - p2.yPct / 100) * pageHeight;
                            targetPage.drawLine({
                                start: { x: p1X, y: p1Y },
                                end: { x: p2X, y: p2Y },
                                thickness: thick,
                                color: window.PDFLib.rgb(r, g, b)
                            });
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
        if (typeof toast === 'function') {
            toast('Lưu thành công!');
        }
        
        let match = this.baseFilename.match(/_v(\d+)$/);
        if (match) {
            this.baseFilename = this.baseFilename.replace(/_v\d+$/, '') + '_v' + (parseInt(match[1]) + 1);
        } else {
            this.baseFilename = this.baseFilename + '_v1';
        }
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
    window.organizerInstance = org;
    if (files && files.length > 0) {
        org.handleFiles(files, 0);
    }
};





