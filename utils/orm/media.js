



// sqlite.run(` ALTER TABLE media ADD COLUMN lastModified INTEGER `);

/* 
添加一个新列记录文件上次修改时间 (lastModified) 为 “整型” 
将来通过文件 size、lastModified、name 取得文件信息定位文件

取不到时再计算 hash，通过 hash 再次到 db 中查询信息
*/

/* 
sqlite.select(`
    select
        size, lastModified, count(*) as ct
    from media
    group by size, lastModified
    having ct > 1
    limit 20
`)


*/

// ↓ 修改时间重复
var aa = [
    {lastModified: 1246383538000, ct: 2},
    {lastModified: 1614079841180, ct: 2},
    {lastModified: 1246382596000, ct: 2},
    {lastModified: 1246382604000, ct: 3},
    {lastModified: 1246382608000, ct: 2},
    {lastModified: 1246382628000, ct: 4},
    {lastModified: 1246382630000, ct: 3},
    {lastModified: 1246382634000, ct: 2},
    {lastModified: 1246382636000, ct: 3},
    {lastModified: 1246383514000, ct: 3},
    {lastModified: 1246383518000, ct: 4},
    {lastModified: 1246383520000, ct: 4},
    {lastModified: 1246383524000, ct: 2},
    {lastModified: 1246383526000, ct: 3},
    {lastModified: 1246383528000, ct: 4},
    {lastModified: 1246383530000, ct: 3},
    {lastModified: 1246383534000, ct: 10},
    {lastModified: 1246382598000, ct: 7},
    {lastModified: 1246382600000, ct: 5},
    {lastModified: 1246382602000, ct: 4},
    {lastModified: 1246382594000, ct: 4},
    {lastModified: 1246382606000, ct: 4},
    {lastModified: 1246383512000, ct: 4},
    {lastModified: 1246383516000, ct: 6},
    {lastModified: 1246383522000, ct: 5},
    {lastModified: 1246383536000, ct: 5},
];

