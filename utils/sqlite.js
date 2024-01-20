/*
 * @Author: Merlin
 * @Date: 2024-01-08 09:35:15
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-20 16:37:48
 * @Description: 
 */
import { dxDB } from "./dxDB";

export const useSqlite = (async ()=>{
    if (!import.meta.client) return;
    const [SQL, oFirst] = await Promise.all([
        window.initSqlJs({ 
            locateFile: () => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
        }),
        dxDB.sqlite.orderBy('createdAt').last(),
    ]);
    let oldData = oFirst?.blob;
    if (oldData?.arrayBuffer) {
        oldData = await oldData.arrayBuffer();
    }else{
        console.log("创建空表，保存到 dxDB", );
    }
    const Uint8Arr = oldData ? new Uint8Array(oldData) : void 0;
    const sqlite = new SQL.Database(Uint8Arr);
    Object.assign(sqlite, {
        select,
        persist,
        toExport,
    });
    window.db = sqlite; // 用于调试
    console.log("window.db\n", window.db);
    return sqlite;
})();

function select(sql){
    const iStart = Date.now();
    const aData = this.exec(sql);
    // console.log(sql, Date.now() - iStart);
    const {columns, values} = aData[0] || {};
    if (!columns) return [];
    // columns: ['id', 'mediaId', 'start', 'end', 'text', 'trans', 'createdAt', 'updatedAt', 'filledAt']
    // values: [Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9), Array(9)]
    const aRows = values.map(cur => {
        const obj = {};
        columns.forEach((key, idx)=>{
            obj[key] = cur[idx];
        });
        return obj;
    });
    return aRows;
}

// ↓ 持久化
async function persist(){
    console.time('sqlite.export()');
    const exported = this.export(); // get Uint8Array
    console.timeEnd('sqlite.export()');
    console.time('new Blob()');
    const blob = new Blob([exported]);
    console.timeEnd('new Blob()');
    const createdAt = new Date();
    dxDB.sqlite.add({ // 耗时小于 1ms
        blob,
        time: createdAt.toLocaleString(), // 用于查询后展示
        createdAt, // 用于查询最新或最旧的数据
    });
    const oCollection = dxDB.sqlite.orderBy('createdAt');
    const count = await oCollection.count();
    if (count <= 3) return;
    const first = await oCollection.first();
    dxDB.sqlite.delete(first.id);
}

// ↓ 导出
async function toExport(){
    const res = await dxDB.sqlite.orderBy('createdAt').last();
    const {blob} = res;
    const iBatch = 9 * (1024 * 1024); // 9MB
    const iAllBatch = Math.ceil(blob.size / iBatch);
    const aResult = [...Array(iAllBatch).keys()].map((cur, idx) => {
        const iStart = cur * iBatch;
        return {
            name: `sqlite ${iAllBatch}-${idx+1}.blob`,
            content: blob.slice(iStart, iStart + iBatch),
        };
    });
    // 开始导出
    // const newOne = new Blob(aResult);
    // this.writeFile(aResult);
}








