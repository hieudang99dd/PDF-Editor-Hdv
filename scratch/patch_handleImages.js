const fs = require('fs');
let code = fs.readFileSync('organizer.js', 'utf8');

const handleImgCode = `
    async handleImages(fileList, insertIndex) {
        if (!fileList || fileList.length === 0) return;
        this.showLoading('Ðang x? lý ?nh...');
        let inserted = 0;
        
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const dataUrl = await new Promise(res => {
                const reader = new FileReader();
                reader.onload = e => res(e.target.result);
                reader.readAsDataURL(file);
            });
            
            const img = new Image();
            await new Promise(res => { img.onload = res; img.src = dataUrl; });
            
            const pageId = 'pg_' + (this.pageCounter++);
            this.thumbCache.set(pageId, dataUrl); // Use original image as thumbnail
            
            this.pages.splice(insertIndex + inserted, 0, {
                id: pageId, type: 'image',
                fileIndex: -1, pageIndex: -1,
                width: img.width, height: img.height,
                rotation: 0, dataUrl: dataUrl, selected: false,
                imgFormat: file.type === 'image/png' ? 'png' : 'jpeg',
                imgDataUrl: dataUrl
            });
            inserted++;
        }
        
        this.hideLoading();
        this.pushHistory();
        this.renderGrid();
    }
`;

code = code.replace(
    /handleFiles\(fileList, insertIndex = this\.pages\.length\) \{/,
    handleImgCode + '\n    handleFiles(fileList, insertIndex = this.pages.length) {'
);

fs.writeFileSync('organizer.js', code);
