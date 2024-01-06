import { get as getIdb, set as setIdb, keys, del } from 'idb-keyval';
import {mySort} from '@/common/js/common-fn.js';
// import * as abs from 'https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/index.min.js';




async function init() {
    const {initBackend} = await import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-main-thread.js');
    let worker = new Worker(new URL('./absurd-sql-worker.js', import.meta.url));
    // This is only required because Safari doesn't support nested
    // workers. This installs a handler that will proxy creating web
    // workers through the main thread
    initBackend(worker);
    console.log(worker);
}



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
        // mySort(aRoot, 'name');
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    async ckickItem(i1, i2, cur){
        const oItem = this.aDirectory[i1][i2];
        console.log("点击目标：", oItem);
        console.log("点击目标：", JSON.parse(JSON.stringify(oItem)));
        if (oItem.kind === 'directory') { // 👈处理点击文件夹动作
            // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
            // this.aPath.splice(i1 + 1, Infinity, sItem);
            const arr = await handler2List(oItem.handler);
            // mySort(arr, 'name');
            this.aDirectory.splice(i1+1, Infinity, arr);
            fillTheList(this.aDirectory[i1+1]);
            return;
        }
        if (!oItem.isMedia) return;

    }
};

export default {
    ...oFn01,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    aList.forEach(async (cur, idx) => {
        if (idx % 3 === 0) await fillOneFile(cur);
        else fillOneFile(cur);
    });
}

async function fillOneFile(cur){
    const oFileINfo = await handler2FileObj(cur.handler);
    Object.assign(cur, oFileINfo);
    if (!oFileINfo.isMedia) return;
    // console.time('准备计算 hash');
    let arrayBuffer = await oFileINfo.oFile.arrayBuffer();
    let arrayData = new Uint8Array(arrayBuffer);
    // console.timeEnd('准备计算 hash');
    // console.time('计算 hash');
    const hash = await hashwasm.xxhash64(arrayData);
    // console.timeEnd('计算 hash');
    console.log('hash', hash);
    oFileINfo.hash = hash;
}

// 从文件夹 handler 返回其子元素列表
async function handler2List(handler){
    const directory = handler.kind == 'directory';
    if (!directory) return [];
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
        };
        aResult[iTarget].push(oThisOne);
    }
    aResult.forEach(curArr => mySort(curArr, 'name'));
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



