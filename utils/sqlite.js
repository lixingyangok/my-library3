/*
 * @Author: Merlin
 * @Date: 2024-01-08 09:35:15
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-22 22:46:25
 * @Description: 
 */
import { dxDB } from "./dxDB";
import {saveFile} from '@/common/js/fileSystemAPI.js';
import {line} from './orm/line.js';

const additional = {
    line,
};

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
    console.time('加载数据库方法');
    toAttach(sqlite);
    console.timeEnd('加载数据库方法');
    window.db = sqlite; // 用于调试
    console.log("window.db\n", window.db);
    return sqlite;
})();


function toAttach(sqlite){
    Object.assign(sqlite, {
        ...commonDatabaseFn,
        tableList: [],
        tb: {},
    });
    let aTablesAndView = sqlite.select(`
        SELECT * FROM sqlite_master
        WHERE type in ('table', 'view')
    `);
    sqlite.tableList = aTablesAndView;
    // console.log("tables", tables);
    const tables = aTablesAndView.filter(cur => cur.type == 'table').map(cur => cur.name);
    sqlite.tb = tables.reduce((oResult, tbName) => {
        oResult[tbName] = new TableFunction({
            db: sqlite,
            tbName,
        });
        return oResult;
    }, {});
    Object.entries(sqlite.tb).forEach(thisTable=>{
        const [tableName, oTableFn] = thisTable;
        const oNewFn = additional[tableName];
        if (!oNewFn) return;
        Object.values(oNewFn).forEach(thisFn => {
            if (oTableFn[thisFn.name]) {
                return console.error('重名了');
            }
            oTableFn[thisFn.name] = thisFn;
        });
    });
}


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
    // ↓ 持久化
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
        const createdAt = new Date();
        const time = createdAt.toLocaleString();
        dxDB.sqlite.add({ // 耗时小于 1ms
            blob,
            time, // 用于查询后展示
            createdAt, // 用于查询最新或最旧的数据
        }).then(res=>{
            console.log("已经导入库：", time, res);
        });
        const oCollection = dxDB.sqlite.orderBy('createdAt');
        const count = await oCollection.count();
        if (count <= 3) return;
        const first = await oCollection.first();
        dxDB.sqlite.delete(first.id);
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



// 👇 实测：只返回空数组
// db.exec(`update dev_history set note = '测试中中' where id=1`)

// ↓ 实测：返回 db 对象本身
// db.run(`update dev_history set note = '测试中中' where id=1`)

class TableFunction {
    db = {};
    tbName = '';
    columns = [];
    colChangeable = [];
    constructor(oParams){
        this.db = oParams.db;
        this.tbName = oParams.tbName;
        this.columns = this.db.select(`
            SELECT * FROM pragma_table_info('${this.tbName}')
        `);
        const aCanNotChange = ['id', 'createdAt'];
        this.colChangeable = this.columns.map(cur => {
            return cur.name;
        }).filter(cur => {
            return !aCanNotChange.includes(cur);
        });
    }
    // 交集
    #getColsArr(obj){
        const keys = Object.keys(obj);
        const aColName = this.colChangeable.filter((cur) => {
            return keys.includes(cur);
        });
        return aColName;
    }
    #getWhereSql(params){
        if (typeof params === 'string') {
            // params = params.trim();
            return `and ${params}`;
        }
        if (params.constructor.name === 'Array'){
            let sWhere = params.map(cur=>{
                return ` and ${cur}`;
            });
            return sWhere;
        }
        if (params.constructor.name === 'Object'){
            let sWhere = Object.entries(params).map(cur=>{
                let [key, val] = cur;
                if (typeof val === 'string') {
                    val = `'${val.replaceAll("'", "''")}'`;
                }
                return ` and ${key} = ${val}`;
            }).join(' ');
            return sWhere;
        }
    }
    #getUpdateSql(params){
        let sSet = ` updatedAt = strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'), \n`;
        const aColName = this.#getColsArr(params);
        if (typeof params === 'string') {
            sSet += ` ${params}`;
        }
        if (params.constructor.name === 'Array'){
            sSet += params.join(', ');
        }
        if (params.constructor.name === 'Object'){
            const aSetArr = aColName.map(key => {
                const val = params[key];
                if ((typeof val === 'string') && val) {
                    val = `'${val.replaceAll("'", "''")}'`;
                }
                return `${key} = ${val}`;
            });
            sSet += aSetArr.filter(Boolean).join(', ');
        }
        sSet = sSet.trimEnd().replace(/,+$/, '') + ' ';
        return sSet;
    }
    // ▲ 私有方法 ----------------------------------------------
    select(params, onlyOne){
        if (!params) return;
        let sql = `
            select * from ${this.tbName} 
            where 1 = 1 ${this.#getWhereSql(params)}
        `;
        if (onlyOne) sql += ` limit 1`; 
        // console.log("sql", sql);
        const arr = this.db.select(sql);
        return arr;
    }
    getOne(params){
        const [res] = this.db.select(params, true);
        return res;
    }
    update(oParams){
        return;
        const {set, where = {}} = oParams;
        if (!set.id && !where) return;
        let sql = `
            update ${this.tbName}
            set ${this.#getUpdateSql(set)}
            where 1 = 1 
        `;
        if (set.id){
            sql += ` and id = ${set.id}`;
        }else{
            sql += this.#getWhereSql(where);
        }
        console.log("sql", sql);
        const res = this.db.run(sql);
        return res;
    }
    updateOne(oParams){
        if (!oParams.id) return;
        let sql = `
            update ${this.tbName}
            set ${this.#getUpdateSql(oParams)}
            where id = ${oParams.id}
        `;
        console.log("sql", sql);
        const res = this.db.run(sql);
        return res;
    }
    insertOne(oParams){
        if (!oParams) return;
        const aColName = this.#getColsArr(oParams);
        let sFullSql = `
            INSERT INTO ${this.tbName}
            (
                createdAt, updatedAt,
                ${aColName.join(', ')}
            )
            VALUES (
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                ${aColName.map(() => '?').join(', ')}
            );
        `;
        const thisArr = aColName.map(cur => {
            return oParams[cur] ?? null;
        });
        console.log("sFullSql", sFullSql);
        console.log("thisArr", thisArr);
        const inserted = db.run(sFullSql, thisArr);
        console.log("inserted", inserted);
        return inserted;
    }
    insert(aParams){
        if (!aParams?.length) return;
        forEach(cur=>{
            this.insertOne(cur);
        });
    }
    delete(params){
        if (!params) return;
        let sWhere = '';
        if (typeof params === 'number'){
            sWhere = ` id = ${params}`;
        }else {
            sWhere = this.#getWhereSql(params);
        }
        let sFullSql = `
            DELETE FROM ${this.tbName}
            WHERE ${sWhere};
        `;
        const res = this.db.run(sFullSql);
        return res;
    }
    saveBatch(arr){
        arr.forEach(cur => {
            if (cur.id) this.updateOne(cur);
            else this.insertOne(cur);
        });
    }
}




// .run()
// .exec()
// .prepare()


// UPDATE Customers
// SET ContactName = 'Alfred Schmidt', City= 'Frankfurt'
// WHERE CustomerID = 1;
