import { get as getIdb, set as setIdb, keys, del } from 'idb-keyval';

let aFolders = [];
const oFn01 = {
    async chooseFolder(){
        let oHandler = await window.showDirectoryPicker({
            id: 'id01',
            mode: 'readwrite',
        }).catch(err => err);
        if (!oHandler) return;
        console.log("oHandler", oHandler);
        const {kind, name} = oHandler;
        // (new Date()).toLocaleString()
        const sTime = (new Date()).toLocaleString();
        const sKey = `${kind}__${name}__${sTime}`; 
        console.log(oHandler);
        const oSaveInfo = await setIdb(sKey, oHandler);
        console.log(sKey, oSaveInfo);
        this.getFolders();
    },
    async getFolders(){
        const aKeys = await keys() || [];
        if (!aKeys.length) return;
        const arr = [];
        for (const sCurKey of aKeys){
            const handler = await getIdb(sCurKey);
            arr.push({
                sKey: sCurKey,
                handler,
            });
        }
        this.aFolders = arr;
    },
    delFolder(idx){
        const sKey = this.aFolders[idx].sKey;
        this.aFolders.splice(idx, 1);
        del(sKey);
    },
    async readFolder(idx){
        const {sKey, handler} = this.aFolders[idx];
        let answer = await handler.requestPermission({ mode: 'readwrite', });
        if (answer != 'granted') return;
        console.log("handler", handler);
        const aRoot = await handler2List(handler);
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    async ckickItem(i1, i2, cur){
        const oItem = this.aDirectory[i1][i2];
        console.log("点击目标：", oItem);
        console.log(JSON.parse(JSON.stringify(oItem)));
        if (oItem.kind === 'directory') { // 👈处理点击文件夹动作
            // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
            // this.aPath.splice(i1 + 1, Infinity, sItem);
            const arr = await handler2List(oItem.handler);
            this.aDirectory.splice(i1+1, Infinity, arr);
            fillTheList(this.aDirectory[i1+1]);
            return;
        }
        if (!oItem.isMedia) return;
        console.time('准备计算 hash');
        let arrayBuffer = await oItem.oFile.arrayBuffer();
        let arrayData = new Uint8Array(arrayBuffer);
        console.timeEnd('准备计算 hash');
        // Uint8Array
        console.time('计算 hash');
        const sHash = await hashwasm.xxhash64(arrayData);
        console.timeEnd('计算 hash');
        console.log('sHash', sHash);
    }
};

export default {
    ...oFn01,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    aList.forEach(async (cur, idx) => {
        const oFileINfo = await handler2FileObj(cur.handler);
        Object.assign(cur, oFileINfo);
    });
}

// 从文件夹 handler 返回其子元素列表
async function handler2List(handler){
    const directory = handler.kind == 'directory';
    if (!directory) return [];
    const aSkipFormat = ['ecdl'];
    const aResult = [];
    for await (const oItem of handler.values()){
        const suffix = oItem.name.split('.').pop().toLowerCase(); 
        const toSkip = aSkipFormat.includes(suffix); 
        if (toSkip) continue;
        aResult.push({
            name: oItem.name,
            kind: oItem.kind,
            handler: oItem,
        });
    }
    return aResult;
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
    if (isMedia) oResult.oFile = oFile;
    return oResult;
}

