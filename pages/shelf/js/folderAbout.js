import {mySort} from '@/common/js/common-fn.js';
import {handler2List, handler2FileObj} from '@/common/js/fileSystemAPI.js';

const oFn01 = {
    async chooseRoot(){
        let handler = await window.showDirectoryPicker({
            mode: 'readwrite',
        }).catch(err => {});
        if (!handler) return;
        const {kind, name} = handler;
        const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const path = `${createdAt}`;
        await dxDB.directory.add({
            name,
            path,
            handler,
            createdAt, // 当唯一键使用
        });
        this.showRootList();
        const arr = await handler2List(handler, {path});
        this.aDirectory.splice(0, 1/0, arr);
        fillTheList(this.aDirectory[0]);
    },
    async showRootList(){
        const aRoots = await dxDB.directory.toArray();
        // console.log("aRoots", aRoots);
        this.aRoots = aRoots;
        // ↓ 找到有权限的目录，显示出来
        let hasFound;
        this.aRoots.forEach(async (cur, idx) => {
            const answer = await cur.handler.queryPermission();
            cur.permission = answer; // 记录起来，备用 
            if (answer == 'granted' && !hasFound){
                hasFound = true;
                cur.active = true;
                this.setRoot(idx);
            }
        });
    },
    deletRoot(idx){
        const {id, path} = this.aRoots[idx];
        this.aRoots.splice(idx, 1);
        dxDB.directory.delete(id);
        dxDB.file.where('pathFull').startsWith(path).delete();
    },
    async setRoot(idx){
        const {handler, path} = this.aRoots[idx];
        this.aRoots.forEach((cur, index)=>{
            cur.active = idx === index;
        });
        let answer = await handler.requestPermission({ mode: 'readwrite', });
        if (answer != 'granted') return;
        console.log("handler", handler);
        const aRoot = await handler2List(handler, {path});
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    async ckickItem(i1, i2){
        const oItem = this.aDirectory[i1][i2];
        const {isMedia, dxID, hash} = oItem;
        console.log(`点击目标：\n`, oItem, '\n', JSON.parse(JSON.stringify(oItem)));
        if (isMedia) {
            if (dxID && hash) {
                store('media', oItem);
                useRouter().push('/study-lounge');
            }else{
                console.log("不可跳转", );
            }
            return;
        }
        if (oItem.kind !== 'directory') return;
        // 👈处理点击文件夹动作
        // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
        // this.aPath.splice(i1 + 1, Infinity, sItem);
        const arr = await handler2List(oItem.handler, {path: oItem.path});
        console.log("目标的子元素（初步数据）\n", arr);
        this.aDirectory.splice(i1+1, Infinity, arr);
        fillTheList(this.aDirectory[i1+1]);
        this.aRoutesInt.splice(i1, 1/0, i2);
    },
};

export default {
    ...oFn01,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    if (!aList?.length) return;
    for await (const [idx, cur] of aList.entries()){
        if (idx % 3 === 0) await fillOneFile(cur);
        else fillOneFile(cur);
    }
}

async function fillOneFile(oFileInfo){
    const oPathFull = {pathFull: oFileInfo.pathFull};
    const aPromise = await Promise.all([
        handler2FileObj(oFileInfo.handler),
        dxDB.file.where(oPathFull).first(),
    ]);
    let [oFileINfo, oFileInDx] = aPromise;
    Object.assign(oFileInfo, oFileINfo);
    if (!oFileINfo.isMedia) return;
    let [hash, id] = (()=>{
        if (!oFileInDx) return [];
        const aa = oFileInfo.size == oFileInDx.size;
        const bb = oFileInfo.lastModified == oFileInDx.lastModified;
        // console.log("库中 hash", oFileInDx.hash);
        if (aa && bb) {
            return [oFileInDx.hash, oFileInDx.id];
        }
        return [];
    })();
    if (!hash){
        let arrayBuffer = await oFileINfo.oFile.arrayBuffer();
        let arrayData = new Uint8Array(arrayBuffer);
        hash = await hashwasm.xxhash64(arrayData);
        const createdAt = new Date();
        dxDB.file.put({
            hash,
            createdAt,
            updatedAt: createdAt,
            ...oPathFull,
            size: oFileINfo.size,
            lastModified: oFileINfo.lastModified,
        }, oPathFull).then(iID => {
            oFileInfo.dxID = iID;
        });
    }
    oFileInfo.hash = hash;
    if(id) oFileInfo.dxID = id;
}





async function init() {
    const {initBackend} = await import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-main-thread.js');
    let worker = new Worker(new URL('./absurd-sql-worker.js', import.meta.url));
    // This is only required because Safari doesn't support nested
    // workers. This installs a handler that will proxy creating web
    // workers through the main thread
    initBackend(worker);
    console.log(worker);
}