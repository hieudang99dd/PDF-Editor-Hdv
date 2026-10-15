// Local-only PDF processing; no document bytes leave this worker.
import {NativeTextEditor} from './pdf-native-text.mjs?v=39';
let editor;
async function initialize() {
    const fonts=[];
    for(const family of ['Tinos','Noto Sans']) {
        for(const [variant,bold,italic] of [['Regular',false,false],['Bold',true,false],['Italic',false,true],['BoldItalic',true,true]]) {
            const path=family==='Tinos' ? 'fonts/Tinos-'+variant+'.ttf' : 'NotoSans-'+variant+'.ttf';
            const response=await fetch(new URL(path,import.meta.url));
            if(!response.ok) throw new Error('Không tải được font '+path);
            fonts.push({family,bold,italic,bytes:new Uint8Array(await response.arrayBuffer())});
        }
    }
    return new NativeTextEditor().init(fonts);
}
let queue=Promise.resolve();
self.onmessage=({data})=>{
    queue=queue.catch(()=>{}).then(async()=>{
        try {
            if(!editor) editor=initialize().catch(error=>{editor=null;throw error;});
            const result=await (await editor).rewrite(data.bytes,data.pages);
            self.postMessage({id:data.id,result},[result.bytes.buffer]);
        } catch(error) {self.postMessage({id:data.id,error:error.message || String(error)});}
    });
};
