/*
 * @Author: Merlin
 * @Date: 2024-02-03 11:38:12
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-03 15:09:29
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
        const {dbType, uint8Arr} = data;
        if (!dbType || !uint8Arr) {
            return console.error('缺少必要参数');
        }
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
        // id 是自增的，所以删除值最小的一行（最旧的数据）
        const oCollection = dxDB.sqlite.orderBy('id').filter(cur => {
            return cur.type === dbType;
        });
        const count = await oCollection.count();
        if (count <= 3) return;
        oCollection.limit(count - 3).delete(); // 只保留最新的三条数据
    },
}


