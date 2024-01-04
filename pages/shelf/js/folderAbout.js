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
        const aRoot = await handler2array(handler);
        this.aDirectory.splice(0, Infinity, aRoot);
    },
    async ckickItem(i1, i2, cur){
        const oItem = this.aDirectory[i1][i2];
        console.log("目标");
        console.log(JSON.parse(JSON.stringify(oItem)));
        if (oItem.kind === 'directory') { // 👈处理点击文件夹动作
            // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
            // this.aPath.splice(i1 + 1, Infinity, sItem);
            const arr = await handler2array(oItem.handler);
            this.aDirectory.splice(i1+1, Infinity, arr);
            return;
        }
        
        // ▲文件夹，▼文件
        // const sFilePath = `${this.aPath.join('/')}/${sItem}`;
        // const isMedia = await checkFile(sFilePath, oConfig.oMedia)
        // if (!isMedia) return;
    }
};

export default {
    ...oFn01,
};

// 接收一个文件夹 handler 返回其子元素
async function handler2array(handler){
    const directory = handler.kind == 'directory';
    if (!directory) return [];
    const aResult = [];
    for await (const oItem of handler.values()){
        const oFileInfo = await getTheFileObj(oItem);
        aResult.push({
            name: oItem.name,
            kind: oItem.kind,
            handler: oItem,
            ...oFileInfo,
        });
    }
    return aResult;
}

async function getTheFileObj(handler){
    const file = handler.kind === 'file';
    if (!file) return {};
    const oInfoObj = await handler.getFile();
    // console.log("oInfoObj", oInfoObj);
    const oResult = {
        lastModified: oInfoObj.lastModified,
        lastModifiedDate: oInfoObj.lastModifiedDate,
        size: oInfoObj.size,
        webkitRelativePath: oInfoObj.webkitRelativePath,
        type: oInfoObj.type, // "audio/mpeg", "video/mp4"
        isMedia: !!oInfoObj.type.match(/audio|video/),
    };
    return oResult;
}

