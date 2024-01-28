/*
 * @Author: Merlin
 * @Date: 2024-01-07 21:07:28
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-28 15:17:25
 * @Description: 
 */

export const dxDB = (()=>{
    if (!import.meta.client) return;
    // 新建一个名为 xx 的库，如果已经存在，就会连接上 作者：西芹术士 https://www.bilibili.com/read/cv15712691/ 出处：bilibili
    const myDB = new window.Dexie("dxDB");
    // ↓ 每次修改建库参数需要加大版本号
    myDB.version(14).stores({
        // 表名：索引列,（非索引列不需要添加
        sqlite: "++id, createdAt, updatedAt, type", // type=main|cache
        directory: '++id, createdAt',
        // ▼ & 是唯一键标记。注意这里的 hash 不能设为唯一键，因为同一文件会出现在不同的目录下
        file: '++id, &pathFull, [size+lastModified], path, hash, createdAt, updatedAt',
    });
    return myDB;
})();

if (import.meta.client){
    window.dxDB = dxDB; // 测试
}

