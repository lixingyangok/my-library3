import {mySort} from '@/common/js/common-fn.js';
import {handle2List, handle2FileObj, handleManager} from '@/common/js/fileSystemAPI.js';
const sqlite = await useSqlite;

const oFn01 = {
    async chooseRoot(){
        let handle = await window.showDirectoryPicker({
            mode: 'readwrite',
        }).catch(err => {});
        if (!handle) return;
        const {kind, name} = handle;
        const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const path = `${createdAt}`;
        await dxDB.directory.add({
            name,
            path,
            handle,
            createdAt, // 当唯一键使用
        });
        this.showRootList();
        const arr = await handle2List(handle, {path});
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
            const answer = await cur.handle.queryPermission();
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
        const {handle, path} = this.aRoots[idx];
        this.aRoots.forEach((cur, index)=>{
            cur.active = idx === index;
        });
        let answer = await handle.requestPermission({
            mode: 'readwrite',
        });
        if (answer != 'granted') return;
        handleManager(handle);
        const aRoot = await handle2List(handle, {path});
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    async ckickItem(i1, i2){
        const oItem = this.aDirectory[i1][i2];
        const {isMedia, dxID, hash, pathFull} = oItem;
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
        const arr = await handle2List(oItem.handle, {path: oItem.path});
        console.log("目标的子元素（初步数据）\n", arr);
        this.aDirectory.splice(i1+1, Infinity, arr);
        fillTheList(this.aDirectory[i1+1]);
        this.aRoutesInt.splice(i1, 1/0, i2);
    },
    exportDatabase(){
        sqlite.toExport(true);
    },
    // 👇光标停于文件上方
    hoverHandler(oTarget){
        if (!oTarget.isMedia) return; 
        oTarget.hovered = true;
    },
};


export default {
    ...oFn01,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    if (!aList?.length) return;
    for await (const [idx, cur] of aList.entries()){
        if (idx % 3 == 0) await fillOneFile(cur);
        else fillOneFile(cur);
    }
}

// 👇 取得文件
async function fillOneFile(oFileInfo){
    const oPathFull = {pathFull: oFileInfo.pathFull};
    const aPromise = await Promise.all([
        handle2FileObj(oFileInfo.handle),
        dxDB.file.where(oPathFull).first(),
    ]);
    let [oFileINfo, oFileInDx] = aPromise;
    Object.assign(oFileInfo, oFileINfo);
    if (!oFileINfo.isMedia) return;
    let [hash, id] = (()=>{
        if (!oFileInDx) return [];
        const aa = oFileInfo.size == oFileInDx.size;
        const bb = oFileInfo.lastModified == oFileInDx.lastModified;
        if (!aa || !bb) return [];
        return [oFileInDx.hash, oFileInDx.id];
    })();
    // console.log("dxDB 中的 hash: ", hash || '暂无');
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
            path: oFileInfo.pathFull.match(/.+(?=\/)/)[0],
            size: oFileINfo.size,
            lastModified: oFileINfo.lastModified,
        }, oPathFull).then(iID => {
            oFileInfo.dxID = iID;
        });
    }
    Promise.resolve().then(()=>{
        // console.time('查询hash 对应的媒体')
        const res = sqlite.select(`select * from media where hash='${hash}'`);
        // console.timeEnd('查询hash 对应的媒体')
        if (!res?.[0]) return;
        oFileInfo.infoAtDb = res[0];
    });
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
