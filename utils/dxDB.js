/*
 * @Author: Merlin
 * @Date: 2024-01-07 21:07:28
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-03 13:24:20
 * @Description: 
 */

export const useDexie = (()=>{
    if (!import.meta.client) return ()=>{};
    let dxDB = null;
    return async ()=>{
        if (dxDB || !import.meta.client) return dxDB;
        const {Dexie} = await import('https://cdn.jsdelivr.net/npm/dexie@3.2.4/+esm');
        dxDB = new Dexie("dxDB");
        // ↓ 每次修改建库参数需要加大版本号
        dxDB.version(18).stores({
            // 表名：索引列,（非索引列不需要添加
            text: '++id, &mediaId, createdAt, updatedAt, type', // type=pdf|txt
            sqlite: "++id, createdAt, updatedAt, type", // type=main|cache
            directory: '++id, createdAt',
        });
        if (typeof window === 'object'){
            window.dxDB = dxDB; // 便于调试
        }
        return dxDB;
    };
})();
