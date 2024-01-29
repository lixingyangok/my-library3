/*
 * @Author: Merlin
 * @Date: 2024-01-08 09:35:15
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-29 23:45:10
 * @Description: 
 */
import { dxDB } from "./dxDB";
import {saveFile} from '@/common/js/fileSystemAPI.js';
import {line} from './orm/line.js';
import {TableFunction} from './orm/index.js';

const oTableFuns = {
    line,
};

/* 
创建第2个数据库，用于缓存每个文件的 hash （此库不需要导出，存在本地）
将来使用文件的 size, lastmodified 来定位文件
*/
const getSQL = (()=>{
    let theSQL;
    return ()=>{
        theSQL ||= window.initSqlJs({ 
            locateFile: ()=> `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
        });
        return theSQL;
    };
})();

export const useSqlite = (() => {
    if (!import.meta.client) return ()=>{};
    const oResult = {};
    return (dbType = 'main')=>{
        if (!import.meta.client) return;
        oResult[dbType] ||= createOneDB(dbType);
        return oResult[dbType];
    };
})();


async function createOneDB(dbType){
    let iLastTime = Date.now();
    const [SQL, oLast] = await Promise.all([
        getSQL(),
        dxDB.sqlite.orderBy('updatedAt').filter(({type}) => type === dbType).last(),
    ]);
    console.log(`加载数据库 ${dbType}-1: `, Date.now() - iLastTime);
    iLastTime = Date.now();
    const sqlite = new SQL.Database(oLast?.uint8Arr);
    sqlite.dbType = dbType;
    console.log(`加载数据库 ${dbType}-2: `, Date.now() - iLastTime);
    toAttach(sqlite);
    if (!oLast?.uint8Arr){
        console.log('需要从头建库');
        const arr = getCreateTableSql(dbType);
        if (arr.length){
            arr.forEach(sCurSql => sqlite.run(sCurSql));
            console.log('已经从头建库');
            sqlite.persist();
        }
    }
    const nameOnWindow = dbType === 'main' ? 'sqlite' : 'cache';
    window[nameOnWindow] = sqlite; // 用于调试
    return sqlite;
}


function toAttach(sqlite){
    Object.assign(sqlite, {
        ...commonDatabaseFn,
        tb: {},
        tableList: [],
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
    persist(uint8Arr){
        clearTimeout(this.taskTimer);
        // 收到了 uint8Arr 说明在首次导入，0延时，
        const iDelay = uint8Arr ? 0 : 1000;
        console.log("已经设定了持久化任务");
        this.taskTimer = setTimeout(()=>this.persistExecutor(uint8Arr), iDelay);
    },
    // ↓持久化
    async persistExecutor(uint8Arr){
        if (uint8Arr){
            console.log("导入数据库");
        }
        const createdAt = new Date();
        const time = createdAt.toLocaleString();
        console.time('保存 sqlite 到 indexedDB');
        dxDB.sqlite.add({ // 耗时小于 1ms
            uint8Arr: uint8Arr || this.export(),
            time, // 用于查询后展示
            createdAt, // 用于查询最新或最旧的数据
            updatedAt: createdAt,
            type: this.dbType,
        }).then(res => {
            console.timeEnd('保存 sqlite 到 indexedDB');
            console.log(`🎉 已经持久化, id=${res}： ${time}`);
        });
        const oCollection = dxDB.sqlite.orderBy('updatedAt').filter(({type}) => type === this.dbType);
        const count = await oCollection.count();
        if (count <= 3) return;
        const first = await oCollection.first();
        dxDB.sqlite.delete(first.id);
    },
    // ↓ 导出到本地（如导出 Uint8Array 格式的数据 Navicat 可直接调用
    async toExport(toCut){
        const sTime = dayjs().format('YYYY.MM.DD HH.mm.ss');
        saveFile([{
            name: `Sqlite_${sTime}.db`,
            content: this.export(),
        }]);
        return;
        const res = await dxDB.sqlite.orderBy('updatedAt').filter(({type}) => type === this.dbType).last();
        const {blob} = res || {};
        if (!blob) return console.warn('无法导出');
        const iMB = toCut ? 5 : 999; // 999MB一般无法达到
        const iBatch = iMB * (1024 * 1024); // 9MB
        const iAllBatch = Math.ceil(blob.size / iBatch) || 1;
        const sAllBatch = String(iAllBatch).padStart(2, '0');
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
export async function checkDataForDB(uint8Arr){
    const SQL = await getSQL();
    const sqlite = new SQL.Database(uint8Arr);
    try{
        const [tables] = sqlite.exec(`
            SELECT name
            FROM sqlite_master
            WHERE type='table'
        `);
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

const aCacheInit = [
    // hash 不需要 unique，因为有可能同一个文件被复制了一份，此时 lastModified 变化了但 hash 不会变
    // 所以有可能 size=1, lastModified=2 而且 size=1, lastModified=3 指向的是同一个 hash 
    `
        CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            hash VARCHAR(255) NOT NULL,
            size INTEGER NOT NULL,
            lastModified INTEGER NOT NULL,
            duration INTEGER FLOAT NOT NULL,
            durationStr VARCHAR(8) NOT NULL,
            name VARCHAR(255) NOT NULL,
            path VARCHAR(255),
            pathFull VARCHAR(255)
        );
    `,
];
// ↓ 添加索引
// CREATE INDEX idx_size ON Users(size);
// CREATE INDEX idx_lastModified ON Users(lastModified);

function getCreateTableSql(dbType){
    if (dbType==='cache'){
        return aCacheInit;
    }
    return [];
};

// ↓ 似乎用不上了，
async function blod2Uint8Arr(blob){
    if (!blob?.arrayBuffer) return;
    const arrBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrBuffer);
}