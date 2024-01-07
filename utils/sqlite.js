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
    return sqlite;
})();

