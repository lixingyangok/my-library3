/*
 * @Author: Merlin
 * @Date: 2024-02-03 11:38:12
 * @LastEditors: Merlin
 * @LastEditTime: 2025-05-06 12:42:37
 * @Description: 
 */
import { useDexie } from "./dxDB";
console.log('👍 worker01.js loaded');

self.addEventListener('message', async (ev) => {
    const {command, data } = ev.data;
    console.log("command:", command);
    const fn = fnLib[command];
    if (!fn){
        return console.error('未知指令：', command);
    }
    fn(data);
});


const fnLib = {
    async updateSqlite(data){
        const {dbType, uint8Arr, importing} = data;
        if (!dbType || !uint8Arr) {
            return console.error('缺少必要参数');
        }
        const t01 = Date.now();
        console.log('Web worker: 开始保存到 indexedDB...');
        const rowID = await scheduler.postTask(()=>{
            return doPutOneRow(dbType, uint8Arr); 
        }, {
            priority: 'background',
        });
        console.log('Web worker: 完成保存，耗时总计 ms', Date.now() - t01);
        postMessage({
            command: 'saved',
            data: {importing},
        });
    },
}

async function doPutOneRow(
    dbType,
    uint8Arr,
) {
    const dxDB = await useDexie();
    const t01 = Date.now();
    const aRows = await dxDB.sqlite.where('type').equals(dbType).toArray();
    aRows.sort((aa, bb)=>{
        return aa.updatedAt.getTime() - bb.updatedAt.getTime();
    }).forEach(cur=>{
        cur.uint8Arr = null; // 清空
    });
    const createdAt = new Date();
    const time = createdAt.toLocaleString();
    const oRow = { 
        // id, // 没有 id 将执行新增 
        // createdAt, // 新增行时专用 
        type: dbType,
        uint8Arr,
        time, // 是 updatedAt 字符形态，用于肉眼阅读 
        updatedAt: createdAt,
    }
    // ↓ 有多条记录，覆盖最“旧” 的一行 
    if (aRows.length > 1){
        oRow.id = aRows[0].id;
    }else{
        oRow.createdAt = createdAt;
    }
    const iRowID = await dxDB.sqlite.put(oRow);
    console.log(`Web worker: Affected row [${iRowID}]`);
    console.log('Web worker: 查询旧行耗时 ms', createdAt - t01, aRows);
    console.log(`Web worker: 保存 ${dbType} 耗时 ms`, Date.now() - createdAt);
    return iRowID;
}


/* 
async updateSqlite(data){
        const {dbType, uint8Arr, importing} = data;
        if (!dbType || !uint8Arr) {
            return console.error('缺少必要参数');
        }
        const dxDB = await useDexie();
        console.log('Web worker: 开始保存到 indexedDB...');
        const t01 = Date.now();
        const rowID = await scheduler.postTask(async ()=>{
            const createdAt = new Date();
            const time = createdAt.toLocaleString();
            const res = await dxDB.sqlite.add({
                type: dbType,
                uint8Arr,
                time, // 用于查询后展示
                createdAt,
                updatedAt: createdAt,
            });
            console.log(`Web worker: ${dbType} 已经保存到 indexedDB, consumed ms:`, Date.now() - t01);
            console.log(`Web worker: Added row`, res, `At ${time}`);
            return res;
        }, {
            priority: 'background',
        });

        const t02 = Date.now();
        const keys = await dxDB.sqlite.where('type').equals(dbType).and(cur => {
            return cur.id  < rowID;
        }).primaryKeys() || [];
        keys.sort((aa, bb) => aa - bb); // 升序 
        console.log('All old rows', ...keys, 'Consumed ms:', Date.now() - t02);
        keys.splice(-2); // 把最右侧最“新” 的 2 个移除，把余下的旧行都删除 
        if (keys.length){
            const delay = 800;
            await scheduler.postTask(async ()=>{
                const iRows = await dxDB.sqlite.bulkDelete(keys);
                // console.log('iRows deleted', iRows); // 2参一直是空的   
                return iRows;
            }, {
                delay,
                priority: 'background',
            });
            console.log('Deleted rows', ...keys, 'Consumed ms:', Date.now() - t02 - delay);
        }
        postMessage({
            command: 'saved',
            data: {importing},
        });
    },
*/


