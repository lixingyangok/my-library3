
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
}



