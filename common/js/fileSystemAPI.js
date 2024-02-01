/*
 * @Author: 
 * @Date: 2024-01-10 22:32:22
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-01 21:44:50
 * @Description: 
 */
import {mySort} from '@/common/js/common-fn.js';

const aMediaList = ['mp3', 'ogg', 'mp4', 'm4a', 'acc', 'aac', 'opus'];
const oMediaLib = aMediaList.reduce((oResult, sCur)=>{
    oResult[sCur] = true;
    return oResult;
}, {});

function checkMediaByName(sName){
    const stail = sName.split('.').pop().toLowerCase();
    return oMediaLib[stail];
}

export async function searchFile(oConfig){
    let { handle, target, path, } = oConfig;
    let oFile = null;
    const pathFull = `${path}/${handle.name}`;
    if (handle.kind === 'directory'){
        for await (const oItem of handle.values()){
            oFile = await searchFile({
                handle: oItem,
                target,
                path: pathFull,
            });
            if (oFile) return oFile;
        }
    }else if(handle.name === target.name){
        oFile = await handle.getFile();
        if (oFile.size === target.size){
            oFile.path = path;
            oFile.pathFull = pathFull;
            console.log("文件名+体积相同：", path);
            return oFile;
        }else{
            console.log("同名，体积不同：", path);
        }
    }
}

export async function requestPermission(handle){
    let answer = '';
    try{
        answer = await handle.requestPermission();
    }catch(err){
        console.log("无法申请文件权限");
    }
    if (answer === 'granted'){
        handleManager(handle);
        return true;
    }
}



// 从文件夹 handle 返回其子元素列表
export async function handle2List(handle, oConfig={}){
    let {
        path, // handle 不知其自身的上层目录信息，需要指明，
        findingName,
        findingType,
        mediaOnly,
    } = oConfig;
    const directory = handle.kind == 'directory';
    if (!directory) return [];
    path &&= `${path}/${handle.name}`; // 补全路径
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
export async function path2handle(sPath, sKind='file'){
    const rootID = sPath.slice(0, 19);
    const aPath = sPath.slice(20).split('/');
    const oRoot = await dxDB.directory.get({
        createdAt: rootID,
    });
    if (!oRoot) return [];
    let answer = '';// await oRoot.handle.queryPermission(); // 似乎没必要查之后再询问，直接问
    if (answer != 'granted') {
        try{
            answer = await oRoot.handle.requestPermission({
                // mode: 'readwrite',
            });
        }catch(err){
            console.log("无法申请文件权限：\n", err);
            return [];
        }
    }
    if (answer != 'granted') return [];
    handleManager(oRoot.handle);
    let topLevel = null;
    let oTargetHandle = oRoot.handle;
    for await (const [idx, cur] of aPath.entries()){
        if (idx === 0) continue;
        const type = idx === aPath.length-1 ? sKind : 'directory';
        oTargetHandle = await handle2List(oTargetHandle, {
            findingName: cur,
            findingType: type,
        });
        if (idx === aPath.length-2){
            topLevel = oTargetHandle;
        }
        if (!oTargetHandle) return [];
    }
    let oFile;
    if (sKind==='file'){
        oFile = await oTargetHandle.getFile();
    }
    return {
        handle: oTargetHandle,
        belong: topLevel,
        file: oFile,
        root: oRoot,
    };
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
