import {mySort} from '@/common/js/common-fn.js';

const oFn01 = {
    async chooseFolder(){
        let handler = await window.showDirectoryPicker({
            // id: 'id01',
            mode: 'readwrite',
        }).catch(err => err);
        if (!handler) return;
        console.log("handler", handler);
        const {kind, name} = handler;
        const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const path = `${time}`;
        console.log("name", name);
        const arr = await handler2List(handler, {path});
        this.aDirectory.splice(0, 1/0, arr);
        fillTheList(this.aDirectory[0]);
        this.aRoutes.splice(0, 1/0);
        await dxDB.directory.add({
            name,
            time, // 当 id 使用
            path,
            handler
        });
        this.setRootList();
    },
    async setRootList(){
        const aDirectory = await dxDB.directory.toArray();
        console.log("aDirectory", aDirectory);
        this.aFolders = aDirectory;
    },
    delRootFolder(idx){
        const {id} = this.aFolders[idx];
        this.aFolders.splice(idx, 1);
        dxDB.directory.where('id').equals(id).delete();
    },
    async setRootFolder(idx){
        const {handler, path} = this.aFolders[idx];
        console.log("path", path);
        let answer = await handler.requestPermission({ mode: 'readwrite', });
        if (answer != 'granted') return;
        console.log("handler", handler);
        const aRoot = await handler2List(handler, {path});
        // mySort(aRoot, 'name');
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    async ckickItem(i1, i2){
        const oItem = this.aDirectory[i1][i2];
        console.log("点击目标：", oItem);
        console.log("点击目标：", JSON.parse(JSON.stringify(oItem)));
        if (oItem.isMedia) return;
        if (oItem.kind !== 'directory') return;
        // 👈处理点击文件夹动作
        // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
        // this.aPath.splice(i1 + 1, Infinity, sItem);
        const arr = await handler2List(oItem.handler, {path: oItem.path});
        console.log("目标的子元素\n", arr);
        this.aDirectory.splice(i1+1, Infinity, arr);
        fillTheList(this.aDirectory[i1+1]);
        this.aRoutes.splice(i1, 1/0, oItem.name);
    },
};

export default {
    ...oFn01,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    aList.forEach(async (cur, idx) => {
        if (idx % 2) await fillOneFile(cur);
        else fillOneFile(cur);
    });
}

async function fillOneFile(cur){
    const aPromise = await Promise.all([
        handler2FileObj(cur.handler),
        dxDB.file.where({pathFull: cur.pathFull}).first(),
    ]);
    let [oFileINfo, oFileInDx] = aPromise;
    Object.assign(cur, oFileINfo);
    if (!oFileINfo.isMedia) return;
    let hash = (()=>{
        if (!oFileInDx) return '';
        const aa = cur.size == oFileInDx.size;
        const bb = cur.lastModified == oFileInDx.lastModified;
        if (aa && bb) return oFileInDx.hash;
    })();
    if (!hash){
        console.log("从头计算 hash", );
        let arrayBuffer = await oFileINfo.oFile.arrayBuffer();
        let arrayData = new Uint8Array(arrayBuffer);
        hash = await hashwasm.xxhash64(arrayData);
        console.log("从头计算 hash", hash);
        dxDB.file.put({
            hash,
            size: oFileINfo.size,
            lastModified: oFileINfo.lastModified,
            pathFull: cur.pathFull,
            createdAt: new Date(),
        },{
            hash: cur.hash
        });
    }
    oFileINfo.hash = hash;
}



// 从文件夹 handler 返回其子元素列表
async function handler2List(handler, oConfig={}){
    let {path} = oConfig;
    const directory = handler.kind == 'directory';
    if (!directory) return [];
    path &&= `${path}/${handler.name}`;
    const aSkipFormat = ['ecdl'];
    const aMediaList = ['mp4', 'mp3', 'ogg', 'm4a', 'acc', 'aac', 'opus',];
    const aResult = [
        [], // 文件夹
        [], // 媒体文件
        [], // 其它
    ];
    for await (const oItem of handler.values()){
        const {name, kind} = oItem;
        const suffix = name.split('.').pop().toLowerCase(); 
        const toSkip = aSkipFormat.includes(suffix); 
        if (toSkip) continue;
        const isMedia = aMediaList.includes(suffix);
        const iTarget = (() => {
            if (kind === 'directory') return 0;
            return isMedia ? 1: 2;
        })();
        const oThisOne = {
            name,
            kind,
            handler: oItem,
            path,
            pathFull: `${path}/${name}`,
        };
        if (isMedia) oThisOne.isMedia = true;
        aResult[iTarget].push(oThisOne);
    }
    // console.log("aResult", JSON.parse(JSON.stringify(aResult)));
    aResult.forEach(curArr => mySort(curArr, 'name'));
    // console.log("aResult", JSON.parse(JSON.stringify(aResult)));
    return aResult.flat(1/0);
}

// 👇 从文件 handler 读取文件信息 
async function handler2FileObj(handler){
    const file = handler.kind === 'file';
    if (!file) return {};
    const oFile = await handler.getFile();
    const isMedia = !!oFile.type.match(/audio|video/);
    const oResult = {
        lastModified: oFile.lastModified,
        lastModifiedDate: oFile.lastModifiedDate,
        size: oFile.size,
        webkitRelativePath: oFile.webkitRelativePath,
        type: oFile.type,
        isMedia,
    };
    if (isMedia) {
        oResult.oFile = oFile;
        oResult.hash = '';
    }
    return oResult;
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