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
        // let status = await handler.queryPermission({ mode: 'readwrite', });
        let answer = await handler.requestPermission({ mode: 'readwrite', });
        if (answer != 'granted') return;
        console.log("handler", handler);
        console.log("handler.entries()", handler.entries());
        var aResult = [];
        for await (const cur of handler.entries()){
            aResult.push(cur);
        }
        var aResult02 = aResult.map(cur => {
            return new Promise((fnResolve) => {
                const [fileName, oHandler] = cur;
                const {kind, name} = oHandler;
                if (oHandler.getFile){
                    oHandler.getFile().then(fileInfo => {
                        console.log("fileInfo", fileInfo);
                        fnResolve({
                            fileInfo,
                            kind, name, ...fileInfo
                        });
                    });
                }else{
                    console.log("oHandler", oHandler);
                    fnResolve({ kind, name });
                }
            });
        });
        const aReulst03 = await Promise.all(aResult02);
        console.log("aReulst03", aReulst03);
    },
};

export default {
    ...oFn01,
};

