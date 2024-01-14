/*
 * @Author: 
 * @Date: 2024-01-14 21:38:06
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-14 23:10:25
 * @Description: 
 */

const sqlite = await useSqlite;


export const LineDB = {
    async updateMediaLines(obj){
        console.log("sqlite", sqlite);
        const {toSaveArr=[], toDelArr=[], isReturnAll, mediaId} = obj;
        const [toInsert, toUpdate] = [[], []];
        const arr = [[], 0];
        if (toSaveArr.length) {
            obj.toSaveArr.forEach(cur => {
                if (cur.text && !cur.filledAt){
                    cur.filledAt = new Date();
                }
                if (cur.id) toInsert.push(cur);
                else toUpdate.push(cur);
            });
            // arr[0] = oFn.saveLine(toSaveArr);
            ['id', 'createdAt', 'updatedAt', 'end', 'start', 'filledAt', 'mediaId', 'text', 'trans', ]
        }
        if (toDelArr.length) {
            const delResult = sqlite.exec(`
                delete from line
                where id in (${toDelArr.join(',')})
            `);
            console.log("delResult", delResult);
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
        // const res = await Promise.all(arr);
        // let aNewRows = [];
        // // if (isReturnAll){
        // //     aNewRows = await oFn.getLineByMedia(mediaId);
        // // }
        // const oResult = {
        //     save: res[0]?.map(cur => cur.dataValues) || [],
        //     delete: res[1],
        //     newRows: aNewRows,
        // };
        // return oResult;
    },
    toInsert (arr=[{},{},{},]){
        const stmt = sqlite.prepare(`
            INSERT INTO line
            (createdAt, updatedAt, filledAt, start, end, mediaId, text, trans)
            VALUES (
                strftime('%Y-%m-%d %H:%M:%f', 'now'),
                strftime('%Y-%m-%d %H:%M:%f', 'now'),
                :filledAt, :start, :end, :mediaId, :text, :trans
            );
        `);
        arr.forEach((cur, idx) => {
            stmt.bind({
                ':filledAt': "strftime('%Y-%m-%d %H:%M:%f', 'now')",
                ':start': idx+1,
                ':end': idx+1+1,
                ':mediaId': 789,
                ':text': 'abc',
                ':trans': '',
            });
        });
        while (stmt.step()) {
            console.log('stmt.get()', stmt.get()); 
        }
        stmt.free();
    },
    toUpdate(arr){
        arr.forEach((cur, idx) => {
            let items = Object.entries(({a:1, b:2})).reduce((sResult, oCur)=>{
                const [key, val] = oCur;
                if (val == void 0 || val == null || key == 'id') {
                    return sResult;
                }
                if (typeof val ==  'string'){
                    val.replace(`'`, `''`);
                    val = `'${val}'`;
                }
                sResult += `${key} = ${val}, `;
                return sResult
            }, '');
            if (items.endsWith(', ')) items = items.slice(0, -2);
            sqlite.exec(`
                UPDATE line SET
                updatedAt = strftime('%Y-%m-%d %H:%M:%f', 'now'),
                ${items}
                where id = ${cur.id}
            `);
        });
    },
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