import { TableFunction } from './index.js';

export class line extends TableFunction {
    // ↓ 查询媒体行
    getLineByMedia(iMediaId){
        console.time("查询媒体行", );
        const aRows = this.db.select(`
            select id, start, end, text, filledAt
            from ${this.tbName}
            where mediaId = ${iMediaId}
            order by start asc
        `);
        console.timeEnd("查询媒体行", );
        return aRows;
    }
    // ↓ 保存并返回
    async updateMediaLines(obj){
        const {toSaveArr=[], toDelArr=[], isReturnAll, mediaId} = obj;
        if (toSaveArr.length) {
            const sNow = new Date().toISOString().replace('T', ' ').replace('Z', ' +00:00');
            obj.toSaveArr.forEach(cur => {
                if (cur.text && !cur.filledAt){
                    cur.filledAt = sNow;
                }
                if (cur.id) this.updateOne(cur);
                else this.insertOne(cur);
            });
        }
        if (toDelArr.length) {
            this.deleteById(toDelArr)
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
    }
}




