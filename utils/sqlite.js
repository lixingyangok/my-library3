/*
 * @Author: Merlin
 * @Date: 2024-01-08 09:35:15
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-26 21:55:18
 * @Description: 
 */
import { dxDB } from "./dxDB";
import {saveFile} from '@/common/js/fileSystemAPI.js';
import {line} from './orm/line.js';
import {TableFunction} from './orm/index.js';

const oTableFuns = {
    line,
};

export const useSqlite = (async ()=>{
    if (!import.meta.client) return;
    console.time('加载数据库 1');
    const [SQL, oFirst] = await Promise.all([
        window.initSqlJs({ 
            locateFile: () => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
        }),
        dxDB.sqlite.orderBy('createdAt').last(),
    ]);
    console.timeEnd('加载数据库 1');
    console.time('加载数据库 2');
    let oldData = oFirst?.blob;
    if (oldData?.arrayBuffer) {
        oldData = await oldData.arrayBuffer();
    }else{
        console.log("创建空表，保存到 dxDB", );
    }
    const Uint8Arr = oldData ? new Uint8Array(oldData) : void 0;
    const sqlite = new SQL.Database(Uint8Arr);
    console.timeEnd('加载数据库 2');
    console.time('加载数据库 3');
    toAttach(sqlite);
    console.timeEnd('加载数据库 3');
    window.db = sqlite; // 用于调试
    console.log("window.db\n", window.db);
    return sqlite;
})();


function toAttach(sqlite){
    Object.assign(sqlite, {
        ...commonDatabaseFn,
        tableList: [],
        tb: {},
        taskTimer: null, // 
    });
    let aTablesAndView = sqlite.select(`
        SELECT * FROM sqlite_master
        WHERE type in ('table', 'view')
        and name != 'sqlite_sequence'
    `);
    sqlite.tableList = aTablesAndView;
    // console.log("tables", tables);
    const tables = aTablesAndView.filter(cur => cur.type == 'table').map(cur => cur.name);
    sqlite.tb = tables.reduce((oResult, tbName) => {
        const theClass = oTableFuns[tbName] || TableFunction;
        oResult[tbName] = new theClass({
            db: sqlite,
            tbName,
        });
        return oResult;
    }, {});
}


const commonDatabaseFn = {
    select(sql){
        const aData = this.exec(sql);
        if (!aData?.length) return [];
        const {columns, values} = aData[0];
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
    },
    // ↓ 持久化 TODO 添加节流功能
    async persist(blob){
        if (blob){
            console.log("导入数据库");
        }else{
            console.time('sqlite.export()');
            const exported = this.export(); // get Uint8Array
            console.timeEnd('sqlite.export()');
            console.time('new Blob()');
            blob = new Blob([exported]);
            console.timeEnd('new Blob()');
        }
        console.log("已经设定了持久化任务");
        clearTimeout(this.taskTimer);
        this.taskTimer = setTimeout(async () => {
            const createdAt = new Date();
            const time = createdAt.toLocaleString();
            dxDB.sqlite.add({ // 耗时小于 1ms
                blob,
                time, // 用于查询后展示
                createdAt, // 用于查询最新或最旧的数据
            }).then(res => {
                console.log(`已经持久化, id=${res}： ${time}`);
            });
            const oCollection = dxDB.sqlite.orderBy('createdAt');
            const count = await oCollection.count();
            if (count <= 3) return;
            const first = await oCollection.first();
            dxDB.sqlite.delete(first.id);
        }, 1000);
    },
    // ↓ 导出
    async toExport(toCut){
        const res = await dxDB.sqlite.orderBy('createdAt').last();
        const {blob} = res;
        const iMB = toCut ? 5 : 999; // 999MB一般无法达到
        const iBatch = iMB * (1024 * 1024); // 9MB
        const iAllBatch = Math.ceil(blob.size / iBatch) || 1;
        const sAllBatch = String(iAllBatch).padStart(2, '0');
        // const sTime = new Date().toLocaleString().replace(/\//g, '-').replace(/:/g, '');
        const sTime = dayjs().format('YYYY.MM.DD HH.mm.ss');
        const aItems = [...Array(iAllBatch).keys()].map((cur, idx) => {
            const iStart = cur * iBatch;
            const sIndex = String(idx+1).padStart(2, '0');
            return {
                name: `Sqlite_${sTime}(${sAllBatch}-${sIndex}).blob`,
                content: blob.slice(iStart, iStart + iBatch),
            };
        });
        console.log("开始写入到磁盘");
        saveFile(aItems);
    }
};



// ↓ 检查导入的数据是不是有效数据 
export async function checkDataForDB(blob){
    const [SQL, aBuffer] = await Promise.all([
        window.initSqlJs({ 
            locateFile: () => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
        }),
        blob.arrayBuffer(),
    ]);
    const Uint8Arr = new Uint8Array(aBuffer);
    const sqlite = new SQL.Database(Uint8Arr);
    try{
        const [tables] = sqlite.exec(`SELECT name FROM sqlite_master WHERE type='table'`);
        console.log("导入库包含表：\n", tables.values);
        return tables.values;
    }catch(err){}
    return false;
}



// 👇 实测：只返回空数组
// db.exec(`update dev_history set note = '测试中中' where id=1`)

// ↓ 实测：返回 db 对象本身
// db.run(`update dev_history set note = '测试中中' where id=1`)




// .run()
// .exec()
// .prepare()


// UPDATE Customers
// SET ContactName = 'Alfred Schmidt', City= 'Frankfurt'
// WHERE CustomerID = 1;
