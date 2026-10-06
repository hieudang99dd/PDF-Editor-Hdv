const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

code = code.replace(
    /menu\.innerHTML = `[\s\S]*?`;/,
    `menu.innerHTML = \`
            <div class="po-menu-item" id="menu-add-blank">? Trang tr?ng</div>
            <div class="po-menu-item" id="menu-add-pdf">?? T? file PDF</div>
            <div class="po-menu-item" id="menu-add-img">??? T? ?nh (JPG/PNG)</div>
        \`;`
);

code = code.replace(
    /menu\.querySelector\('#menu-add-pdf'\)\.onclick = \(\) => \{[\s\S]*?\};\s*setTimeout/s,
    `
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
            fi.accept = 'image/jpeg, image/png';
            fi.multiple = true;
            fi.onchange = ev => this.handleImages(ev.target.files, index);
            fi.click();
        };
        
        setTimeout`
);

fs.writeFileSync('organizer.js', code);
