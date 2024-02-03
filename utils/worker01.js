/*
 * @Author: Merlin
 * @Date: 2024-02-03 11:38:12
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-03 15:09:29
 * @Description: 
 */
import { useDexie } from "./dxDB";
const dxDB = await useDexie();

// var abc = importScripts('./dxDB.js').then(res=>{
//     console.log("res", res);
// });

console.log('👍 here is worker01.js');

// self.onmessage = ev => {
//     const sSendBack = ev.data + ' 呵呵1~';
//     postMessage(sSendBack);
//     console.log('收到了：', sSendBack)
// }

self.addEventListener('message', async (ev) => {
    console.log("ev", ev);
    const {command, data, id, ts} = ev.data;
    console.log("command:", command);
    const fn = fnLib[command];
    if (fn) fn(data);
    // const sSendBack = ev.data + ' 呵呵2~';
    // postMessage(sSendBack);
});

const fnLib = {
    async updateSqlite(data){
        const {dbType, uint8Arr} = data;
        if (!dbType || !uint8Arr) {
            return console.error('缺少必要参数');
        }
        const createdAt = new Date();
        const time = createdAt.toLocaleString();
        console.time(`Web worker: 保存 ${dbType} 到 indexedDB`);
        const rowID = await dxDB.sqlite.add({
            type: dbType,
            uint8Arr,
            time, // 用于查询后展示
            createdAt,
            updatedAt: createdAt,
        });
        console.timeEnd(`Web worker: 保存 ${dbType} 到 indexedDB`);
        console.log(`Web worker: ${dbType} 已经持久化 | ID=${rowID} | Time=${time}`);
        // id 是自增的，所以删除值最小的一行（最旧的数据）
        const oCollection = dxDB.sqlite.orderBy('id').filter(cur => {
            return cur.type === dbType;
        });
        const count = await oCollection.count();
        if (count <= 3) return;
        oCollection.limit(count - 3).delete(); // 只保留最新的三条数据
    },
}



// console.log('worker01 收到了：\n', ev);
    
// console.log("子进程 dxDB", );
// console.log(dxDB);
// const arr = await dxDB.sqlite.toArray();
// console.log(arr);


// self.addEventListener('message', function (ev) {
//     self.postMessage('You said: ' + ev.data);
//     console.log("ev.data", ev.data);
// }, false);

// import.meta.resolve('./worker01.js').then(resolvedPath => {
//     myWorker = new Worker(resolvedPath, {
//         type: 'module',
//     });
//     window.myWorker = myWorker;
// });