export class NativeTextClient {
    constructor() {
        this.pending=new Map();this.sequence=0;
        this.worker=new Worker(new URL('./pdf-native-worker.mjs?v=39',import.meta.url),{type:'module'});
        this.worker.onmessage=({data})=>{
            const task=this.pending.get(data.id);if(!task)return;
            this.pending.delete(data.id);clearTimeout(task.timer);
            if(data.error) task.reject(new Error(data.error));else task.resolve(data.result);
        };
        this.worker.onerror=()=>this.destroy(new Error('Không tải được engine sửa chữ. Hãy tải lại trang và thử lại.'));
    }
    rewrite(source,pages) {
        if(this.closed) return Promise.reject(new Error('Phiên sửa chữ đã đóng. Hãy mở lại công cụ.'));
        const bytes=source.slice(), id=++this.sequence;
        return new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>this.destroy(new Error('Xử lý chữ quá thời gian. Tài liệu chưa bị thay đổi; hãy mở lại công cụ.')),120000);
            this.pending.set(id,{resolve,reject,timer});
            this.worker.postMessage({id,bytes,pages},[bytes.buffer]);
        });
    }
    destroy(error=new Error('Phiên sửa chữ đã đóng.')) {
        this.closed=true;this.worker.terminate();
        for(const task of this.pending.values()) {clearTimeout(task.timer);task.reject(error);}
        this.pending.clear();
    }
}
