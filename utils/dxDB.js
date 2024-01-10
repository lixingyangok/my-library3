
export const dxDB = (()=>{
    if (!import.meta.client) return;
    // 新建一个名为 xx 的库，如果已经存在，就会连接上 作者：西芹术士 https://www.bilibili.com/read/cv15712691/ 出处：bilibili
    const myDB = new window.Dexie("dxDB");
    myDB.version(8).stores({
        // 表名：索引列， // 其它列
        sqlite: "++id", // 
        directory: '++id, createdAt',
        // ▼ hash 不能设为唯一键，因为不同的目录有可能包含相同的文件
        file: '++id, &pathFull, hash, createdAt, updatedAt', // createdAt, updatedAt
    });
    return myDB;
})();
