import re

with open('organizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add bindEvents logic for toolbar
bind_events_addition = '''
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
'''
# inject into bindEvents
content = content.replace("this.bindEvents();\n    }", "this.bindEvents();\n    }\n\n    commitEdit(div) {\n        // manual commit if needed\n    }")
content = content.replace("window.addEventListener('beforeunload'", bind_events_addition + "\n        window.addEventListener('beforeunload'")

# 2. Update renderTextLayer to load and show toolbar
render_click = '''
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
'''

# Replace old listeners
# We find div.addEventListener('click'... to div.addEventListener('blur'... });
import re
content = re.sub(r"div\.addEventListener\('click', \(e\) => \{.*?layer\.appendChild\(div\);", render_click + "\n                layer.appendChild(div);", content, flags=re.DOTALL)

# Add commitEdit method logic
commit_edit = '''
    commitEdit(div) {
        div.contentEditable = 'false';
        div.classList.remove('editing');
        const tb = document.getElementById('po-format-toolbar');
        if (tb) tb.style.display = 'none';
        this.activeEditDiv = null;
        
        const newText = div.innerText.replace(/\\n\\s*\\n/g, '\\n').trim();
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
'''
content = content.replace("commitEdit(div) {\n        // manual commit if needed\n    }", commit_edit)

# Ensure datasets are set when creating div
dataset_setup = '''
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
'''
content = re.sub(r"div\.dataset\.id = blockId;\s*div\.spellcheck = false;", dataset_setup, content)

with open('organizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated organizer.js for editing UI')
