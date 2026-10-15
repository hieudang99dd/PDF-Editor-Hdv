// Load the original HDV editor only when it is opened, not for the tool catalog.
(() => {
 let loading;
 const script=(path,ready)=>{
  if(ready())return Promise.resolve();
  return new Promise((resolve,reject)=>{
   const element=document.createElement('script');element.src=path;
   element.onload=()=>ready()?resolve():reject(new Error('Không khởi tạo được thư viện chỉnh sửa PDF.'));
   element.onerror=()=>{element.remove();reject(new Error('Không tải được công cụ chỉnh sửa. Hãy kiểm tra kết nối và thử lại.'));};
   document.head.appendChild(element);
  });
 };
 window.ensureHDVEditorLibraries=()=>{
  if(!loading)loading=(async()=>{
   await Promise.all([
    script('pdf-lib.min.js',()=>!!window.PDFLib),
    script('pdf.min.js',()=>!!(window.pdfjsLib || window['pdfjs-dist/build/pdf'])),
    script('Sortable.min.js',()=>!!window.Sortable),
    script('jszip.min.js',()=>!!window.JSZip),
    script('fontkit.umd.min.js',()=>!!window.fontkit),
    script('pdf-text-layout.js?v=40',()=>!!window.PDFTextLayout)
   ]);
   window.pdfjsLib=window.pdfjsLib || window['pdfjs-dist/build/pdf'];
   window.pdfjsLib.GlobalWorkerOptions.workerSrc='pdf.worker.min.js';
   await script('organizer.js?v=40',()=>window.initOrganizer!==openEditor);
  })().catch(error=>{loading=null;throw error;});
  return loading;
 };
 const openEditor=async files=>{await window.ensureHDVEditorLibraries();return window.initOrganizer(files);};
 window.initOrganizer=openEditor;
})();
