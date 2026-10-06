$code = Get-Content -Raw "organizer.js"

$oldConstructor = '(?s)this\.zoomLevel = 1;.*?this\.thumbObserver = new IntersectionObserver'
$newConstructor = @"
this.zoomLevel = 1;
        this.thumbSize = localStorage.getItem('poThumbSize') || 'M';
        this.thumbObserver = new IntersectionObserver
"@
$code = $code -replace $oldConstructor, $newConstructor

$oldBind = '(?s)bindEvents\(\) \{.*?if \(\!window\.showSaveFilePicker\)'
$newBind = @"
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
        if (!window.showSaveFilePicker)
"@
$code = $code -replace $oldBind, $newBind

Set-Content "organizer.js" $code
