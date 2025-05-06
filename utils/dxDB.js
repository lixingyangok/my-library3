/*
 * @Author: Merlin
 * @Date: 2024-01-07 21:07:28
 * @LastEditors: Merlin
 * @LastEditTime: 2025-05-06 09:23:43
 * @Description: 
 */

export const useDexie = (()=>{
    if (!import.meta.client) return () => null;
    const oResolvers = {};
    return async ()=>{
        if (!import.meta.client) return null;
        // console.log('Try to use dexie.js 📦');
        if (oResolvers.promise) {
            return oResolvers.promise; 
        }
        // console.log('Started to: import(dexie.js); 📦'); // 只会打印1次 
        Object.assign(
            oResolvers,
            Promise.withResolvers(),
        );
        const {Dexie} = await import('https://cdn.jsdelivr.net/npm/dexie@4.0.11/+esm');
        const dxDB = new Dexie("dxDB");
        // ↓ 每次修改建库参数需要加大版本号
        dxDB.version(19).stores({
            // 表名：索引列,（非索引列不需要添加
            text: '++id, &mediaId, createdAt, updatedAt, type', // type=pdf|txt
            sqlite: "++id, createdAt, updatedAt, type, [type+updatedAt]", // type=main|cache
            directory: '++id, createdAt',
        });
        if (typeof window === 'object'){
            window.dxDB = dxDB; // 便于调试
        }
        oResolvers.resolve(dxDB);
        return oResolvers.promise;
    };
})();
