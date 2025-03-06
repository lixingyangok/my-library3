/*
 * @Author: Merlin
 * @Date: 2024-01-07 21:07:28
 * @LastEditors: Merlin
 * @LastEditTime: 2025-02-09 15:42:28
 * @Description: 
 */

export const useDexie = (()=>{
    if (!import.meta.client) return ()=>{};
    let dxDB = null;
    return async ()=>{
        if (dxDB || !import.meta.client) return dxDB;
        const {Dexie} = await import('https://cdn.jsdelivr.net/npm/dexie@3.2.7/+esm');
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
