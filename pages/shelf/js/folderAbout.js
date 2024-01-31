import {goToLounage} from '@/common/js/common-fn.js';
import {handle2List, handle2FileObj, handleManager} from '@/common/js/fileSystemAPI.js';
import {copyString, getMediaDuration} from '@/common/js/pure-fn.js';
import {fillOneFile} from '@/common/js/fs-fn.js';

const sqlite = await useSqlite();

const oFn01 = {
    // ▼删除一项（待验证）
    async toForgetMedia(oMedia){
        const {id} = oMedia;
        // console.log(oMedia.$dc());
        const confirm = await ElMessageBox.confirm(
            '确认移除记录?',
            '请确认',
            {
                confirmButtonText: '确认移除',
                cancelButtonText: '取消',
                type: 'warning',
            }
        ).catch(xx=>xx);
        console.log("answer:", confirm);
        if (confirm != 'confirm') return;
        sqlite.run(`DELETE FROM action WHERE mediaId=${id};`),
        sqlite.run(`DELETE FROM new_word WHERE mediaId=${id};`),
        sqlite.run(`DELETE FROM line WHERE mediaId=${id};`),
        sqlite.run(`DELETE FROM media WHERE id=${id};`);
        this.ckickItem(...this.aLastFolder);
    },
    // ▼如果文件名，体积，修改时间变化了，此方法用于记录新的信息到数据库
    async updateMediaInfo(){
        let aLast = this.aDirectory.at(-1);
        aLast = aLast.filter(cur => {
            return cur?.infoAtDb?.id && !cur.bNameRight;
        });
        console.log("Wrong list\n", aLast);
        for await (let [idx, val] of aLast.entries()){
            const {infoAtDb, oFile} = val;
            const oDuration = await getMediaDuration(oFile);
            sqlite.tb.media.updateOne({
                id: infoAtDb.id,
                name: oFile.name,
                size: oFile.size,
                ...oDuration,
            });
            ElMessage.success(`文件信息更新完成：${oFile.name}`);
        }
        this.ckickItem(...this.aLastFolder);
    },
    // ↓ 将媒体配对（未完全完成）
    switchMp3(){
        let aLast = this.aDirectory.at(-1);
        if (!aLast?.length) return;
        this.oFileChanging.isShowDialog = true;
        let aItemsOld = [];
        const oMatched = {};
        aLast.forEach(oCur => {
            if (!oCur.isMedia) return;
            let [sNameShorten, sTail] = oCur.name.split(/\.(?=[a-z0-9]{2,5}$)/i);
            sTail &&= sTail.toLowerCase();
            oCur.sNameShorten = sNameShorten;
            const usable = !oCur.infoAtDb && ['ogg'].includes(sTail);
            if (sTail === 'mp3' && oCur.infoAtDb){
                aItemsOld.push(oCur);
            }else if(usable){
                oMatched[sNameShorten] ||= [];
                oMatched[sNameShorten].push(oCur);
                getMediaDuration(oCur.oFile).then(oDuration => {
                    Object.assign(oCur, oDuration);
                });
            }
        }, {});
        aItemsOld = aItemsOld.filter(oMedia => {
            oMedia.aMatched = oMatched[oMedia.sNameShorten];
            return oMedia.aMatched;
        });
        this.oFileChanging.aListMatched = aItemsOld;
        console.log("aItemsOld\n", aItemsOld.$dc());
    },
    // ↓ 保存到数据库
    async changeMediaFile(oNewMedia, idx){
        if (!oNewMedia.hash) return;
        const oOld = this.oFileChanging.aListMatched[idx];
        if (oOld.changingMark) return;
        const oDuration = await getMediaDuration(oNewMedia.oFile);
        console.log("old, new\n", oOld.$dc(), '\n', oNewMedia.$dc());
        const oNewInfo = {
            id: oOld.infoAtDb.id,
            dir: oNewMedia.path,
            name: oNewMedia.name,
            size: oNewMedia.size,
            hash: oNewMedia.hash,
            ...oDuration,
        };
        sqlite.tb.media.updateOne(oNewInfo);
        console.log("oNewInfo\n", oNewInfo.$dc());
        oNewMedia.changingMark = '✔';
    },
}



const oFn02 = {
    copyHash(hash){
        const res = copyString(hash);
        if (!res) return;
        this.hashCopied = hash;
        ElMessage.success(`已复制 ${hash}`);
    },
    // ↓ 添加一个根目录
    async chooseRoot(){
        let handle = await window.showDirectoryPicker({
            mode: 'readwrite',
        }).catch(err => {});
        if (!handle) return;
        const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const path = `${createdAt}`;
        await dxDB.directory.add({
            name: handle.name,
            handle,
            path,
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
        this.aRoots = aRoots || [];
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
    // ↓选择根目录
    async setRoot(idx){
        const {handle, path} = this.aRoots[idx];
        this.aRoots.forEach((cur, index)=>{
            cur.active = idx === index;
        });
        let answer = await handle.requestPermission({
            // mode: 'readwrite',
        });
        if (answer != 'granted') return;
        handleManager(handle);
        const aRoot = await handle2List(handle, {path});
        this.aDirectory.splice(0, Infinity, aRoot);
        fillTheList(this.aDirectory[0]);
    },
    // ↓ 点击文件夹、文件
    async ckickItem(i1, i2){
        const oItem = this.aDirectory[i1][i2];
        const {isMedia, dxID, hash, pathFull} = oItem;
        console.log(`点击目标：\n`, oItem.$dc());
        if (isMedia) {
            if (hash) goToLounage(oItem);
            else console.log("注意，不可跳转", );
            return;
        }
        if (oItem.kind !== 'directory') return;
        this.aLastFolder = [i1, i2];
        // 👈处理点击文件夹动作
        // ▼ this.aPath 正在被 watch 监听，操作会触发后续动作
        // this.aPath.splice(i1 + 1, Infinity, sItem);
        const arr = await handle2List(oItem.handle, {path: oItem.path});
        console.log("目标的子元素（初步数据）\n", arr);
        this.aDirectory.splice(i1+1, Infinity, arr);
        fillTheList(this.aDirectory[i1+1]);
        this.aRoutesInt.splice(i1, 1/0, i2);
    },

    // ↓ 切换媒体文件
    async useAnotherMedia(oMedia){
        console.log(`点击列\n`, oMedia.$dc());
        const {name, infoAtDb} = oMedia;
        const sTitle = `请输入16位文件 hash`;
        const sTip = `正在修改：${name}`;
        const oAnswer = await ElMessageBox.prompt(sTip, sTitle, {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
        }).catch(err => {
            console.log("取消了", err);
        });
        const value = oAnswer?.value || '';
        // hash : "9361db3653916c8a" // ← 16位
        const [hash] = value.match(/^[0-9a-z]{16}$/i) || [];
        console.log("hash", hash);
        if (!hash || !infoAtDb.id) return;
        return alert('停止，需要优化')
        const res = sqlite.tb.media.updateOne({
            id: infoAtDb.id,
            hash,
        });
        if (!res) return;
        this.ckickItem(...this.aLastFolder);
        // 从 dxDB 中移或修改记录
    },
};


// ↓ 专门处理媒体气泡
const oMediaPopper = {
    // 👇光标停于文件上方
    hoverIn(ev, oTarget){
        if (!oTarget.isMedia) return; 
        this.mediaPopperToggle(true);
        const {duration} = oTarget;
        const iMBLong = (()=>{
            if (!duration) return 0;
            return 1 * (duration / 60 / oTarget.sizeMB).toFixed(1);
        })();
        const sStarts = (()=>{
            if (iMBLong < 1) return '☆';
            let sResult = '★'.repeat(iMBLong);
            if (iMBLong % 1 >= 0.5) sResult += '☆';
            return sResult;
        })();
        this.oHoveringMedia = {
            ...oTarget,
            iMBLong,
            sStarts,
            dom: ev.target,
            show: true,
        };
    },
    // ↓ 控制气泡可性性 01
    mediaPopperToggle(isShow){
        clearTimeout(this.iHoverTimer);
        if (isShow) return;
        this.iHoverTimer = setTimeout(()=>{
            this.oHoveringMedia.show = false; // 用于隐藏气泡
        }, 300);
    },
    // ↓ 控制气泡可性性 02
    takePopperDOM(oPopper){
        const {contentRef} = oPopper?.popperRef || {};
        if (!contentRef) return;
        contentRef.onmouseenter = ()=>this.mediaPopperToggle(true);
        contentRef.onmouseleave = ()=>this.mediaPopperToggle(false);
    },
};


export default {
    ...oFn01,
    ...oFn02,
    ...oMediaPopper,
};

// 为文件列表填充文件信息
async function fillTheList(aList){
    if (!aList?.length) return;
    let index = 0;
    const config = {
        force: true,
        record: true,
    };
    for await (const [idx, cur] of aList.entries()){
        if (!cur.isMedia) continue;
        // if (!index) console.log('before filling:', cur.$dc());
        if (++index % 3 == 0) await fillOneFile(cur, config);
        else fillOneFile(cur, config);
    }
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

// const iLastDot = oCur.name.lastIndexOf('.');
// const sTail = oCur.name.slice(iLastDot + 1);
// const sNameShorten = oCur.name.slice(0, iLastDot);


// async function fillOneFile(oFileInfo){
//     const oPathFull = {pathFull: oFileInfo.pathFull};
//     const aPromise = await Promise.all([
//         handle2FileObj(oFileInfo.handle),
//         dxDB.file.where(oPathFull).first(),
//     ]);
//     let [oFileINfo, oFileInDx] = aPromise;
//     Object.assign(oFileInfo, oFileINfo);
//     if (!oFileINfo.isMedia) return;
//     let [hash, id] = (()=>{
//         if (!oFileInDx) return [];
//         const aa = oFileInfo.size == oFileInDx.size;
//         if (!aa || !bb) return [];
//         return [oFileInDx.hash, oFileInDx.id];
//     })();
//     // console.log("dxDB 中的 hash: ", hash || '暂无');
//     if (!hash){
//         let arrayBuffer = await oFileINfo.oFile.arrayBuffer();
//         let arrayData = new Uint8Array(arrayBuffer);
//         hash = await hashwasm.xxhash64(arrayData);
//         const createdAt = new Date();
//         dxDB.file.put({
//             hash,
//             createdAt,
//             updatedAt: createdAt,
//             ...oPathFull,
//             path: oFileInfo.pathFull.match(/.+(?=\/)/)[0],
//             size: oFileINfo.size,
//         }, oPathFull).then(iID => {
//             oFileInfo.dxID = iID;
//         });
//     }
//     Promise.resolve().then(()=>{
//         // console.time('查询hash 对应的媒体')
//         const res = sqlite.select(`select * from media where hash='${hash}'`);
//         // console.timeEnd('查询hash 对应的媒体')
//         if (!res?.[0]) return;
//         oFileInfo.infoAtDb = res[0];
//         oFileInfo.bNameRight = res[0].name === oFileInfo.name;
//     });
//     oFileInfo.hash = hash;
//     if(id) oFileInfo.dxID = id;
// }
