const fs = require('fs');
let code = fs.readFileSync('.agents/skills/pdf-editor-completion/references/roadmap-editor.md', 'utf8');

code = code.replace(/\[ \] P3-2/g, '[x] P3-2');
code = code.replace(/### \[x\] P3-2.*?(?=\n### )/s, match => match + "\n> Xong " + new Date().toISOString().split('T')[0] + ": Tính t? l? d?a trên kích thu?c th?t; thêm thanh ch?n S/M/L trên toolbar, luu tr?ng thái b?ng localStorage.\n");

code = code.replace(/\[ \] P3-3/g, '[x] P3-3');
code = code.replace(/### \[x\] P3-3.*?(?=\n### )/s, match => match + "\n> Xong " + new Date().toISOString().split('T')[0] + ": Thêm các nút overlay (xoay trái/ph?i, xóa) vào th?, dùng media hover:none d? h? tr? mobile.\n");

code = code.replace(/\[ \] P3-4/g, '[x] P3-4');
code = code.replace(/### \[x\] P3-4.*?(?=\n### )/s, match => match + "\n> Xong " + new Date().toISOString().split('T')[0] + ": Menu chèn t? PDF, trang tr?ng, và ?nh (JPG/PNG). X? lý ?nh luu thành base64 vào memory và v? ra trang PDF m?i khi luu.\n");

fs.writeFileSync('.agents/skills/pdf-editor-completion/references/roadmap-editor.md', code);
