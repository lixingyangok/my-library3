/*
 * @Author: Merlin
 * @Date: 2024-02-03 11:38:12
 * @LastEditors: Merlin
 * @LastEditTime: 2025-05-04 14:32:03
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
        const dxDB = await useDexie();
        console.log('Web worker: 开始保存到 indexedDB...');
        const createdAt = new Date();
        const time = createdAt.toLocaleString();
        const t01 = Date.now();
        const rowID = await scheduler.postTask(()=>{
            return dxDB.sqlite.add({
                type: dbType,
                uint8Arr,
                time, // 用于查询后展示
                createdAt,
                updatedAt: createdAt,
            });
        }, {
            priority: 'background',
        });
        console.log(`Web worker: ${dbType} 已经保存到 indexedDB, consumed ms:`, Date.now() - t01);
        console.log(`Web worker: added row, id=${rowID} | at time=${time}`);
        const t02 = Date.now();
        let keys = await dxDB.sqlite.where('type').equals(dbType).and(cur => {
            return cur.id  < rowID;
        }).primaryKeys() || [];
        keys.sort((aa, bb) => aa - bb); // 升序 
        console.log('All old rows', [...keys]);
        const maxOldRows = 2; // 旧行最多保留 2 行  
        if (keys.length > maxOldRows){
            const delay = 800;
            await scheduler.postTask(async ()=>{
                keys.splice(maxOldRows * -1); // 把最右侧最新的 2 个移除，防止被删掉 
                const iRows = await dxDB.sqlite.bulkDelete(keys);
                // console.log('iRows deleted', iRows); // 2参一直是空的   
                return iRows;
            }, {
                delay,
                priority: 'background',
            });
            console.log('Deleted rows：', keys, 'consumed ms:', Date.now() - t02 - delay);
        }
        postMessage({
            command: 'saved',
            data: {importing},
        });
    },
}


