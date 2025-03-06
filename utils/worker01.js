/*
 * @Author: Merlin
 * @Date: 2024-02-03 11:38:12
 * @LastEditors: Merlin
 * @LastEditTime: 2025-02-09 16:23:53
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
        console.log('Web worker: 开始保存到 indexedDB...');
        const dxDB = await useDexie();
        const createdAt = new Date();
        const time = createdAt.toLocaleString();
        console.time(`Web worker: ${dbType} 已经保存到 indexedDB`);
        const rowID = await dxDB.sqlite.add({
            type: dbType,
            uint8Arr,
            time, // 用于查询后展示
            createdAt,
            updatedAt: createdAt,
        });
        console.timeEnd(`Web worker: ${dbType} 已经保存到 indexedDB`);
        console.log(`Web worker: row id=${rowID} | time=${time}`);
        await scheduler.yield(); 
        // id 是自增的，所以删除值最小的一行（最旧的数据）
        const oCollection = dxDB.sqlite.orderBy('id').filter(cur => {
            return cur.type === dbType;
        });
        const count = await oCollection.count();
        console.log('查询总计行数量：', count, '删除目标行数量：', count - 3); 
        if (count <= 3) return;
        // ↓ 只保留最新的三条数据
        oCollection.limit(count - 3).delete(); 
        postMessage({
            command: 'saved',
            data: {importing},
        });
    },
}


