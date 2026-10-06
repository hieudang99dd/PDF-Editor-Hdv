lines = open('organizer.js', 'r', encoding='utf-8').readlines()
toolbar_html = '''                            <div id="po-format-toolbar" style="display:none;">
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
'''
for i, l in enumerate(lines):
    if 'id="po-text-layer"' in l:
        lines.insert(i + 1, toolbar_html)
        break
with open('organizer.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
