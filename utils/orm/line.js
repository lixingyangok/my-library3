

export const line = {
    async toDelete(toDelArr){
        if (!toDelArr.length) return true;
        const delResult = this.db.exec(`
            delete from ${this.tbName}
            where id in (${toDelArr.join(',')})
        `);
        console.log("delResult", delResult);
        return true;
    },
    getLineByMedia(iMediaId){
        const aRows = this.db.select(`
            select id, start, end, text, filledAt
            from ${this.tbName}
            where mediaId = ${iMediaId}
            order by start asc
        `);
        return aRows;
    },
    // ------------------------------------------
    async updateMediaLines(obj){
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

    async toInsert (arr){
        let sFullSql = `
            INSERT INTO ${this.tbName}
            (createdAt, updatedAt, filledAt, start, end, mediaId, text, trans)
            VALUES (
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                ?, ?, ?, ?, ?, ?
            );
        `;
        arr.forEach(cur => {
            const thisArr = [
                cur.filledAt ?? null,
                cur.start ?? null,
                cur.end ?? null,
                cur.mediaId ?? null,
                cur.text ?? null,
                cur.trans ?? null
            ];
            db.run(sFullSql, thisArr);
        });
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
                UPDATE ${this.tbName} SET
                updatedAt = strftime('%Y-%m-%d %H:%M:%f +00:00', 'now'),
                ${items}
                where id = ${cur.id}
            `;
            // console.log("sFullSql", sFullSql);
            this.db.exec(sFullSql);
        });
        return true;
    },
}

