



// ALTER TABLE 表名
// ADD COLUMN lastModified INTEGER;

/* 
添加一个新列记录文件上次修改时间 (lastModified) 为 “整型” 
将来通过文件 size、lastModified、name 取得文件信息定位文件

取不到时再计算 hash，通过 hash 再次到 db 中查询信息

*/
