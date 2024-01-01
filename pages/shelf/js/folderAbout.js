import { get as getIdb, set as setIdb, keys } from 'idb-keyval';

let aFolders = [];
const oFn01 = {
    async chooseFolder(){
        let oHandler = await window.showDirectoryPicker({
            id: 'id01',
        }).catch(err => err);
        if (!oHandler) return;
        console.log("oHandler", oHandler);

        // const {kind, name} = oHandler;
        // // (new Date()).toLocaleString()
        // const sTime = (new Date()).toLocaleString();
        // const sKey = `${kind}__${name}__${sTime}`; 
        // console.log(oHandler);
        // const oSaveInfo = await setIdb(sKey, oHandler);
        // console.log(sKey, oSaveInfo);
    },
    async getFolders(){
        const aKeys = await keys() || [];
        const [sFirst] = aKeys;
        if (!sFirst) return;
        const oFirst = await getIdb(sFirst);
        console.log("aKeys", aKeys);
        console.log("oFirst", oFirst);
        this.aFolders = [
            oFirst,
        ];
    }
};

export default {
    ...oFn01,
};

