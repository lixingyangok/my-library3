/*
 * @Author: Merlin
 * @Date: 2024-01-08 09:35:15
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-16 22:24:14
 * @Description: 
 */
import { dxDB } from "./dxDB";

export const useSqlite = (async ()=>{
    if (!import.meta.client) return;
    // console.log("创建 sqlit", );
    const sSqliteWasmCDN = `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`;
    const [SQL, oFirst] = await Promise.all([
        window.initSqlJs({ locateFile: () => sSqliteWasmCDN }),
        dxDB?.sqlite.where('id').above(-1).first(),
    ]);
    let oldData = oFirst?.data;
    if (oldData?.arrayBuffer) {
        oldData = await oldData.arrayBuffer();
    }else{
        console.log("创建空表，保存到 dxDB", );
    }
    const Uint8Arr = oldData ? new Uint8Array(oldData) : void 0;
    const sqlite = new SQL.Database(Uint8Arr);
    Object.assign(sqlite, {
        select,
        save,
    });
    if (globalThis?.alert){
        console.log("window.db", window.db);
        window.db = sqlite; // 用于调试
    }
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
    const aRows = values.map(cur=>{
        const obj = {};
        columns.forEach((key, idx)=>{
            obj[key] = cur[idx];
        });
        return obj;
    });
    return aRows;
}

function save(){
    console.log("保存到 dxDB", );
}






