
export const dxDB = (()=>{
    if (!import.meta.client) return;
    // 新建一个名为 xx 的库，如果已经存在，就会连接上 作者：西芹术士 https://www.bilibili.com/read/cv15712691/ 出处：bilibili
    const myDB = new window.Dexie("dxDB");
    myDB.version(1).stores({
        sqlite: "++id", // 表名: 索引列名
        directory: '++id',
    });
    return myDB;
})();
