/*
 * @Author: 
 * @Date: 2024-01-14 21:38:06
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-15 22:39:28
 * @Description: 
 */

const sqlite = await useSqlite;


export const LineDB = {
    async updateMediaLines(obj){
        console.log("sqlite", sqlite);
        const {toSaveArr=[], toDelArr=[], isReturnAll, mediaId} = obj;
        const [aInsert, aUpdate] = [[], []];
        const arr = [[], 0];
        const aPromise = [];
        if (toSaveArr.length) {
            const sNow = new Date().toISOString().replace('T', ' ').replace('Z', ' +00:00');
            obj.toSaveArr.forEach(cur => {
                if (cur.text && !cur.filledAt){
                    cur.filledAt = sNow;
                }
                if (cur.id) aUpdate.push(cur);
                else aInsert.push(cur);
            });
            // arr[0] = oFn.saveLine(toSaveArr);
        }
        if (toDelArr.length) {
            aPromise.push(this.toDelete(toDelArr));
            // 👇删除练习记录
            // if (!fnRemoveLineID){
            //     const {default: oFn} = await import("./action.js");
            //     fnRemoveLineID = oFn.removeLineID;
            // }
            // await fnRemoveLineID(toDelArr);
            // arr[1] = oLine.destroy({
            //     where: { id: obj.toDelArr },
            // });
        }
        if (aInsert.length){
            aPromise.push(this.toInsert(aInsert));
        }
        if (aUpdate.length){
            aPromise.push(this.toUpdate(aUpdate));
        }
        await Promise.all(aPromise);
        let newRows = [];
        if (isReturnAll){
            newRows = this.getLineByMedia(mediaId);
        }
        const oResult = {
            save: toSaveArr.length, // 假值
            delete: toDelArr.length, // 假值
            newRows,
        };
        return oResult;
    },
    async toDelete(toDelArr){
        if (!toDelArr.length) return true;
        const delResult = sqlite.exec(`
            delete from line
            where id in (${toDelArr.join(',')})
        `);
        console.log("delResult", delResult);
        return true;
    },
    async toInsert (arr){
        const stmt = sqlite.prepare(`
            INSERT INTO line
            (createdAt, updatedAt, filledAt, start, end, mediaId, text, trans)
            VALUES (
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                :filledAt, :start, :end, :mediaId, :text, :trans
            );
        `);
        arr.forEach((cur, idx) => {
            stmt.bind({
                ':filledAt': cur.filledAt ?? null,
                ':start': cur.start ?? null,
                ':end': cur.end ?? null,
                ':mediaId': cur.mediaId ?? null,
                ':text': cur.text ?? null,
                ':trans': cur.trans ?? null,
            });
        });
        while (stmt.step()) {
            debugger;
            console.log('stmt.get()', stmt.get()); 
        }
        stmt.free();
        return true;
    },
    async toUpdate(arr){
        // 'id', 'createdAt', 'updatedAt', 
        var aKeys = ['end', 'start', 'filledAt', 'mediaId', 'text', 'trans'];
        arr.forEach((cur, idx) => {
            let items = Object.entries(cur).reduce((sResult, oCur)=>{
                let [key, val] = oCur;
                const toSkip = [
                    val === void 0,
                    val === null,
                    key === 'id',
                    !aKeys.includes(key),
                ].some(cur=>cur);
                if (toSkip) return sResult;
                if ((typeof val) === 'string'){
                    val = `'${val.replace(/'/g, `''`)}'`;
                }
                return sResult + `${key} = ${val}, `;
            }, '');
            if (items.endsWith(', ')) items = items.slice(0, -2);
            const sFullSql = `
                UPDATE line SET
                updatedAt = strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                ${items}
                where id = ${cur.id}
            `;
            console.log("sFullSql", sFullSql);
            sqlite.exec(sFullSql);
        });
        return true;
    },
    getLineByMedia(iMediaId){
        const aRows = sqlite.select(`
            select id, start, end, text, filledAt
            from line
            where mediaId = ${iMediaId}
            order by start asc
        `);
        return aRows;
    }
}



// UPDATE line
// SET column1 = value1, column2 = value2...., columnN = valueN
// WHERE [condition];

// INSERT INTO line [(column1, column2, column3,...columnN)]  
// VALUES (value1, value2, value3,...valueN);

// strftime('%Y-%m-%d %H:%M:%f', 'now')


// id:1
// createdAt:"2022-01-30 05:12:50.319 +00:00"
// updatedAt:"2022-01-30 05:12:50.319 +00:00"
// filledAt:"2022-04-13 13:04:47.255 +00:00"
// start:0.6200000000000001
// end:3.38
// mediaId: 1090
// text: "This table is reserved for you, sir"
// trans: null