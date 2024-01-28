/*
 * @Author: 
 * @Date: 2024-01-10 22:32:22
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-28 17:10:43
 * @Description: 
 */
import {mySort} from '@/common/js/common-fn.js';

const aMediaList = ['mp4', 'mp3', 'ogg', 'm4a', 'acc', 'aac', 'opus',];

function checkMediaByName(sName){
    const stail = sName.split('.').pop().toLowerCase();
    return aMediaList.includes(stail);
}

// 从文件夹 handle 返回其子元素列表
export async function handle2List(handle, oConfig={}){
    let {
        path,
        findingName,
        findingType,
        mediaOnly,
    } = oConfig;
    const directory = handle.kind == 'directory';
    if (!directory) return [];
    path &&= `${path}/${handle.name}`;
    const aSkipFormat = ['ecdl'];
    const aResult = [
        [], // 文件夹
        [], // 媒体文件
        [], // 其它
    ];
    for await (const oItem of handle.values()){
        const {name, kind} = oItem;
        if (findingName && findingType){
            const aa = name == findingName;
            const bb = kind == findingType;
            if (aa && bb) return oItem;
        }
        const suffix = name.split('.').pop().toLowerCase(); 
        const toSkip = aSkipFormat.includes(suffix); 
        if (toSkip) continue;
        const isMedia = checkMediaByName(name); // aMediaList.includes(suffix);
        if (mediaOnly && !isMedia) continue;
        const iTarget = (() => {
            if (kind === 'directory') return 0;
            return isMedia ? 1: 2;
        })();
        const oThisOne = {
            name,
            kind,
            handle: oItem,
            path,
            pathFull: `${path}/${name}`,
        };
        if (isMedia) {
            oThisOne.isMedia = true;
            oThisOne.hash = '';
        }
        aResult[iTarget].push(oThisOne);
    }
    if (findingName){
        return; // 找而不得，返回空，表示没找到
    }
    // console.log("aResult", JSON.parse(JSON.stringify(aResult)));
    aResult.forEach(curArr => mySort(curArr, 'name'));
    // console.log("aResult", JSON.parse(JSON.stringify(aResult)));
    return aResult.flat(1/0);
}

// 👇 从文件 handle 读取文件信息 
export async function handle2FileObj(handle){
    if (handle.kind !== 'file') return {};
    const oFile = await handle.getFile();
    const oResult = {
        lastModified: oFile.lastModified,
        lastModifiedDate: oFile.lastModifiedDate,
        size: oFile.size,
        webkitRelativePath: oFile.webkitRelativePath,
        type: oFile.type,
        isMedia: checkMediaByName(handle.name),
    };
    if (oResult.isMedia) {
        oResult.hash = ''; // 预置
        oResult.oFile = oFile;
        oResult.sizeMB = (oFile.size/1024/1024).toFixed(2);
    }
    return oResult;
}

// ↓通过路径找到目标
export async function path2handle(sPath, sKing='file'){
    const rootID = sPath.slice(0, 19);
    const aPath = sPath.slice(20).split('/');
    const oRoot = await dxDB.directory.get({
        createdAt: rootID,
    });
    if (!oRoot) return [];
    let answer = await oRoot.handle.queryPermission();
    if (answer != 'granted') {
        try{
            answer = await oRoot.handle.requestPermission({
                mode: 'readwrite',
            });
        }catch(err){
            console.log("无法申请文件权限：\n", err);
            return [];
        }
    }
    if (answer != 'granted') return [];
    handleManager(oRoot.handle);
    let oTargetHandle = oRoot.handle;
    for await (const [idx, cur] of aPath.entries()){
        if (idx === 0) continue;
        const type = idx === aPath.length-1 ? sKing : 'directory';
        oTargetHandle = await handle2List(oTargetHandle, {
            findingName: cur,
            findingType: type,
        });
        if (!oTargetHandle) return [];
    }
    let oFile;
    if (sKing==='file'){
        oFile = await oTargetHandle.getFile();
    }
    return [oTargetHandle, oFile];
}


export async function saveFile(aFiles, oParams={}){
    // 👇保存到指定的 folder 目录内
    let {directoryHandle, folderName} = oParams;
    directoryHandle ||= await window.showDirectoryPicker({
        mode: 'readwrite',
    }).catch(err => {});
    if (!directoryHandle) return;
    const sTime = dayjs().format('YYYY.MM.DD HH.mm.ss');
    const newFolderHandle = await directoryHandle.getDirectoryHandle(sTime, { 
        create: true,
    });
    for (const { name, content } of aFiles) {
        const fileHandle = await newFolderHandle.getFileHandle(name, {
            create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log("已经保存：", name);
    }
}

// 保存到全局防止权限被回收，
export async function handleManager(handle){
    window.aHandleArr ||= new Set();
    if (handle){
        window.aHandleArr.add(handle);
    }
    return [...window.aHandleArr];
}
