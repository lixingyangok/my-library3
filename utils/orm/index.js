/*
 * @Author: 
 * @Date: 2024-01-22 22:45:22
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-06 21:51:53
 * @Description: 
 */

// const sNow = strftime('%Y-%m-%d %H:%M:%f +00:00', 'now')

export class TableFunction {
    db = {};
    tbName = '';
    columns = [];
    oColumnsInfo = {};
    colChangeable = [];
    colReadable = [];
    constructor(oParams){
        this.db = oParams.db;
        this.tbName = oParams.tbName;
        this.columns = this.db.select(`
            SELECT * FROM pragma_table_info('${this.tbName}')
        `);
        const aCanNotChange = ['id', 'createdAt'];
        this.columns.forEach(cur=>{
            this.oColumnsInfo[cur.name] = cur;
            this.colReadable.push(cur.name);
            if (!aCanNotChange.includes(cur.name)){
                this.colChangeable.push(cur.name);
            }
        });
    }
    // 交集
    #getColsArr(obj, changeable){
        const keys = Object.keys(obj);
        const sList = changeable ? 'colChangeable' : 'colReadable';
        const aColName = this[sList].filter((cur) => {
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
            const aColName = this.#getColsArr(params);
            let sWhere = aColName.map(key => {
                let val = params[key];
                let equal = '=';
                if (typeof val === 'string') {
                    val = `'${val.replaceAll("'", "''")}'`;
                }else if (val === null){
                    [equal, val] = ['IS', 'NULL'];
                }
                return ` and ${key} ${equal} ${val}`;
            }).join(' ');
            return sWhere;
        }
    }
    #getUpdateSql(params){
        let sSet = ` updatedAt = strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'), \n`;
        if (typeof params === 'string') {
            sSet += ` ${params}`;
        }
        if (params.constructor.name === 'Array'){
            sSet += params.join(', ');
        }
        if (params.constructor.name === 'Object'){
            const aColName = this.#getColsArr(params, true);
            const aSetArr = aColName.map(key => {
                const sColType = this.oColumnsInfo[key].type;
                let value = params[key] ?? null; // 用 null 顶替 undefined
                let sValType = typeof value;
                if (sValType === 'string') {
                    value = `'${value.replaceAll("'", "''")}'`;
                }else if (sValType === 'number' && sColType === 'DATETIME'){
                    value = `strftime('%Y-%m-%d %H:%M:%f +00:00', ${value / 1000}, 'unixepoch')`; 
                }
                return `${key} = ${value}`; 
            });
            sSet += aSetArr.join(',\n');
        }
        sSet = sSet.trimEnd().replace(/,+$/, '') + ' ';
        return sSet;
    }
    // ▲ 私有方法 ------------------------------------------------------
    // ▼ 新增 -------------------------------------------------------
    saveBatch(arr){
        arr.forEach(cur => {
            if (cur.id) this.updateOne(cur);
            else this.insertOne(cur);
        });
    }
    saveOne(obj){
        if (obj.id) {
            return this.updateOne(obj);
        }
        return this.insertOne(obj);
    }
    insertOne(oParams){
        if (!oParams) return;
        const aColName = this.#getColsArr(oParams, true);
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
        // console.log("sFullSql", sFullSql);
        // console.log("thisArr", thisArr);
        const res = this.db.run(sFullSql, thisArr);
        var id = this.db.exec("SELECT last_insert_rowid();")[0].values[0][0];
        if (id) this.db.persist();
        return id;
    }
    insert(arr){
        if (!arr?.length) return;
        const aRes = arr.map(cur => this.insertOne(cur));
        return aRes;
    }
    // ▲ 新增 ============================================================ 
    // ▼ 删除 ============================================================ 
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
        if (res) this.db.persist();
        return res;
    }
    deleteById(id){
        let toDelArr = [];
        if (typeof id === 'number'){
            toDelArr.push(id);
        }else if(id?.constructor?.name === 'Array'){
            toDelArr = id;
        }else{
            console.error('无法删除', id);
            return;
        }
        const del_sql = `
            delete from ${this.tbName}
            where id in (${toDelArr.join(',')})
        `;
        console.log("del_sql\n", del_sql);
        const res = this.db.run(del_sql);
        if (res) this.db.persist();
        return true;
    }
    // ▲ 删除 ========================================================
    // ▼ 更新方法 ------------------------------------------------------
    // 似乎应该使用 saveBatch
    // update(oParams){ 
    //     return;
    //     const {set, where = {}} = oParams;
    //     if (!set.id && !where) return;
    //     let sql = `
    //         update ${this.tbName}
    //         set ${this.#getUpdateSql(set)}
    //         where 1 = 1 
    //     `;
    //     if (set.id){
    //         sql += ` and id = ${set.id}`;
    //     }else{
    //         sql += this.#getWhereSql(where);
    //     }
    //     console.log("sql", sql);
    //     const res = this.db.run(sql);
    //     return res;
    // }
    updateOne(oParams){
        if (!oParams.id) {
            return console.warn('no data id');
        }
        let sql = `
            update ${this.tbName}
            set ${this.#getUpdateSql(oParams)}
            where id = ${oParams.id}
        `;
        // console.log("修改语句：\n", sql);
        this.db.run(sql);
        this.db.persist();
        return;
    }
    // ▼ 查询方法 ------------------------------------------------------
    select(params, tail){
        if (!params) return console.warn('no params');
        let sql = `
            select * from ${this.tbName} 
            where 1 = 1
            ${this.#getWhereSql(params)}
        `;
        if (tail) sql += ` ${tail}`; 
        const arr = this.db.select(sql);
        // console.log("sql\n", sql);
        // console.log("result\n", arr);
        return arr;
    }
    getOne(params){
        if (!params) return console.warn('no params');
        if (typeof params === 'number'){
            params = {id: params}
        }
        const [res] = this.select(params, ' limit 1');
        return res;
    }
}

