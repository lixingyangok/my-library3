/*
 * @Author: Merlin
 * @Date: 2024-01-07 21:07:28
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-02 22:03:00
 * @Description: 
 */

export const dxDB = (()=>{
    if (!import.meta.client) return;
    // 新建一个名为 xx 的库，如果已经存在，就会连接上 作者：西芹术士 https://www.bilibili.com/read/cv15712691/ 出处：bilibili
    const myDB = new window.Dexie("dxDB");
    // ↓ 每次修改建库参数需要加大版本号
    myDB.version(18).stores({
        // 表名：索引列,（非索引列不需要添加
        text: '++id, &mediaId, createdAt, updatedAt, type', // type=pdf|txt
        sqlite: "++id, createdAt, updatedAt, type", // type=main|cache
        directory: '++id, createdAt',
    });
    return myDB;
})();

if (import.meta.client){
    window.dxDB = dxDB; // 用于测试
}

