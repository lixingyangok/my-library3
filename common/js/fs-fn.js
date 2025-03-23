/*
 * @Author: 李星阳
 * @Date: 2022-01-22 19:31:55
 * @LastEditors: Merlin
 * @LastEditTime: 2025-03-23 21:44:16
 * @Description: 与文件夹/文件相关的方法（纯函数）
 */
// 本包将来可修改为，提供数据查询的包

import {mySort} from './common-fn.js';
import {secToStr, getMediaDuration} from './pure-fn.js';
import {handle2FileObj} from '@/common/js/fileSystemAPI.js';


// ▼查询：某文件夹内的媒体文件与配对的字幕文件
export async function getFolderKids(sPath){
    return;
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return;
    const aKids = await fsp.readdir(sPath);
    const aResultArr = [];
    const aPromises = aKids.map(async sFile => {
        const sTail = path.extname(sFile).toLowerCase();
        if (!oConfig.oMedia[sTail]) return;
        const sCurFile = `${sPath}/${sFile}`;
        const oStat = await fsp.stat(sCurFile);
        if (oStat.isDirectory()) return;
        const oItem = {
            name: sFile,
            sPath: sCurFile,
            isMedia: true,
        };
        const spouse = sFile.split('.').slice(0, -1).join('.') + '.srt';
        if (aKids.includes(spouse)) oItem.srt = `${sPath}/${spouse}`;
        aResultArr.push(oItem);
    });
    await Promise.all(aPromises);
    mySort(aResultArr, 'name');
    // console.log('aResult\n', aResult.$dc());
    return aResultArr;
}

// ▲这上下2相邻的函数内容太相似▼

// ▼查询：某文件夹内的媒体文件与配对的字幕文件
export async function getFolderChildren(sPath){
    return;
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return;
    const aItems = await fsp.readdir(sPath);
    let [a01, a02, a03] = [[], [], []];
    const oSrtFiles = {};
    const aPromises = aItems.map(async sItem => {
        const sCurPath = `${sPath}/${sItem}`;
        const oStat = await fsp.stat(sCurPath);
        const oItem = { 
            sItem,
            sPath: sCurPath,
            isDirectory: oStat.isDirectory(), 
            isMedia: false,
            hasMedia: false,
            infoAtDb: null,
            srt: null,
            bNameRight: false, // false 表示文件名与库中记录不一致
        };
        if (oItem.isDirectory) {
            oItem.hasMedia = await findMedia(sCurPath);
            return a01.push(oItem);
        }
        const sTail = path.extname(sCurPath).toLowerCase();
        oItem.isMedia = oConfig.oMedia[sTail];
        if (oItem.isMedia) {
            const spouse = sItem.split('.').slice(0, -1).join('.') + '.srt';
            oItem.srt = aItems.includes(spouse) && `${sPath}/${spouse}`;
            oSrtFiles[oItem.srt] = !!oItem.srt;
            return a02.push(oItem);
        }
        // await checkFile(sCurPath) && a03.push(oItem);
        a03.push(oItem);
    });
    await Promise.all(aPromises);
    a03 = a03.filter(cur => {
        return !oSrtFiles[`${sPath}/${cur.sItem}`];
    });
    [a01, a02, a03].forEach(curArr => mySort(curArr, 'sItem'));
    const arr = [...a01, ...a02, ...a03];
    return arr;
}

// ▼补充媒体的字幕信息
// export async function addMediaSrt(oItem){
//     const sSrtFile = oItem.sPath.split('.').slice(0, -1).join('.') + '.srt';
//     const oStat = await fsp.stat(sSrtFile).catch(()=>false);
//     if (oStat) oItem.srt = sSrtFile;
//     return oItem;
// }

// 看似目前使用 fillOneFile() 替代此 
export async function addAllMediaDbInfo(arr, oneByOne){
    if (!arr) return;
    for (const [idx, oMedia] of arr.entries()) {
        if (!oMedia.isMedia && !oMedia.hash) {
            continue;
        }
        if ((idx % 4) && !oneByOne) AaddMediaInfoFromDB(oMedia);
        else await AaddMediaInfoFromDB(oMedia);
    }
}

// ▼查询【某1个媒体】在DB中的信息
export async function AaddMediaInfoFromDB(oMedia){
    const sqlite = await useSqlite();
    const {hash} = oMedia;
    const res = sqlite.select(`select * from media where hash='${hash}'`);
    if (res?.[0]){
        oMedia.infoAtDb = res[0];
        oMedia.bNameRight = oMedia.sPath == ( // 记录文件位置&名称是否与库中记录的一样
            `${res[0].dir}/${res[0].name}`
        );
    }
    // if ('调试' && oMedia.sItem.includes('邦蒂')){
    //     console.log('oMedia', oMedia.$dc());
    // }
}

// ▼查询是否为媒体文件
export async function checkFile(sFilePath, oFileType=oConfig.oFileType) {
    return;
    const sTail = path.extname(sFilePath).toLowerCase();
    if (!oFileType[sTail]) return;
    const oStat = await fsp.stat(sFilePath);
    return !oStat.isDirectory();
}

// ▼查询目录是否为【媒体文件夹】
export async function findMedia(sPath, oTarget) {
    return;
    const oStat = await fsp.stat(sPath);
    if (!oStat.isDirectory()) return 0;
    let iSum = 0;
    const aDirKids = await fsp.readdir(sPath);
    const arr = aDirKids.map(async sCur=>{
        const isMedia = await checkFile(`${sPath}/${sCur}`, oConfig.oMedia);
        if (isMedia) iSum++;
    });
    await Promise.all(arr);
    return iSum;
}


// 查询：某天或某几天：创建行，录入行数据 
export async function getLearningHistory(iMediaID){
    // gap = days ago 
    let sql = `
        SELECT
            *,
            julianday('now', 'localtime') - julianday(createdAt, 'localtime') as gap
        FROM "line"
        where
            (
                julianday('now', 'localtime') - julianday(date(createdAt, 'localtime')) < 1 or
                julianday('now', 'localtime') - julianday(date(filledAt, 'localtime')) < 1
            )
    `;
    if (iMediaID){
        sql += `and mediaId = ${iMediaID}`;
    }
    const sqlite = await useSqlite();
    const res = await sqlite.select(sql);
    return res;
}

// 查询：当天的创建行，录入行数据
export async function getTodayHistory(iMediaID){
    const arr = await getLearningHistory(iMediaID);
    if (!arr) return;
    const oResult = {
        iCreated: 0,
        sCrDuration: '',
        // -------------------
        iFilled: 0,
        iFilledWords: 0,
        sFiDuration: '',
    };
    // ↓ 录入时长+创建时长（秒）
    let [iFiDuration, iCrDuration] = [0, 0];
    arr.forEach(cur => {
        // 如果在当天创建行并同时录入只记一份功，即：录入，似乎可以记2份
        const {filledAt, text, start, end} = cur;
        const sKey = filledAt ? 'iFilled' : 'iCreated';
        oResult[sKey]++;
        if (filledAt){
            oResult.iFilledWords += text.match(/\S+/g)?.length || 0;
            iFiDuration += (end - start);
        }else{
            iCrDuration += (end - start);
        }
    });
    Object.assign(oResult, {
        sCrDuration: secToStr(iCrDuration, ''),
        sFiDuration: secToStr(iFiDuration, ''),
        iCrDuration: Number.parseInt(iCrDuration),
        iFiDuration: Number.parseInt(iFiDuration),
    });
    return oResult;
}

// 👇 填充媒体文件信息
export async function fillOneFile(oFileObject, config={}){
    if (!oFileObject.isMedia) return;
    const oInfoFromHandle = await handle2FileObj(oFileObject.handle);
    Object.assign(oFileObject, oInfoFromHandle);
    // const t01 = Date.now();
    let oCache = await findHash(oFileObject, {
        force: config.force,
        record: config.record,
    });
    if (!oCache?.hash) {
        console.log("没有hash", oFileObject.$dc());
        return;
    }
    oFileObject.hash = oCache.hash;
    const oMediaInfoInDB = sqlite.tb.media.getOne({
        hash: oCache.hash,
    });
    // console.log("查找 Hash 和媒体记录", Date.now()-t01);
    const oInfo = oMediaInfoInDB || oCache || {};
    oFileObject.duration = oInfo.duration;
    oFileObject.durationStr = oInfo.durationStr;
    if (!oMediaInfoInDB) return;
    oFileObject.infoAtDb = oMediaInfoInDB;
    oFileObject.bNameRight = [
        oFileObject.name === oMediaInfoInDB.name,
        oFileObject.size === oMediaInfoInDB.size,
        oFileObject.duration > 0, // 没有时长就补充
    ].every(Boolean);
}


// 查询文件 hash
export async function findHash(oParam, config={}){
    const cacheDB = await useSqlite('cache');
    const {
        force, // 找不到就计算
        record, // 计算之后保存起来
    } = config;
    const oQuery = {
        size: oParam.size,
        lastModified: oParam.lastModified,
    };
    if (!oParam.size || !oParam.lastModified){
        console.log("注意，没有文件体积信息", oParam);
        return {};
    }
    const aChash = cacheDB.tb.file.select(oQuery);
    let [oCache01, oCache02] = aChash || [];
    if (oCache01 && !oCache02){
        return oCache01; // 找到了 hash
    }
    if (oCache02){ // 似乎很少执行到此
        console.warn(`在数据库中存在多个媒体记录`); 
    }
    let oResult = {};
    if ((!oCache01 || oCache02) && force){ // 找不到，或 hash 无效
        const [hash, oDuration] = await Promise.all([
            getFileHash(oParam.oFile),
            getMediaDuration(oParam.oFile),
        ]);
        Object.assign(oResult, {hash, ...oDuration});
        if (record){
            const toRecord = {
                name: oParam.name,
                path: oParam.path, // 此值没有更新机制，因此有可能是旧的错值，
                ...oQuery,
                ...oResult,
            };
            cacheDB.tb.file.insertOne(toRecord);
        }
    }
    return oResult;
}


// 生成文件 hash
export async function getFileHash(oFile){
    const arrayBuffer = await oFile.arrayBuffer();
    const aUint8Arr = new Uint8Array(arrayBuffer);
    const hash = await window.hashwasm.xxhash64(aUint8Arr);
    return hash;
}
