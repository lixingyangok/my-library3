/*
 * @Author: Merlin
 * @Date: 2024-03-10 21:12:57
 * @LastEditors: Merlin
 * @LastEditTime: 2025-05-03 17:06:58
 * @Description: 
 */

// ▼查询某个媒体的 “各行” 练习记录 
export async function getMediaActionRows(iMediaID){
    let sqlite = await useSqlite();
    let sSql = `
        SELECT
            lineId,
            mediaId,
            count(*) as practice_times,
            sum(duration) as duration_um
        from action_view
        where action_view.mediaId = ${iMediaID}
        group by lineId, mediaId
    `;
    // console.time('查询某个媒体练习记录');
    const aResult = sqlite.select(sSql);
    // console.timeEnd('查询某个媒体练习记录'); // 耗时xx
    return aResult;
}

// ▼查询某个媒体的“总” 练习记录
export async function getMediaActionTotal(iMediaID){
    let sqlite = await useSqlite();
    // julianday(date(日期时间)) 取得的是某天0点的时间  
    /* 
        julianday('now', 'localtime') - julianday(date(actionBeginAt)) as daysAgo01, ❤️ 可信 
        julianday('now') - julianday(date(actionBeginAt)) as daysAgo02,
        -- ↓ 在 19:12 查询，结果如下 --------------------------------------------
        actionBeginAt: 2025-03-22 18:59:16, // 这里的具体时间没什么用，因为用 date() 取0点了 
        daysAgo01: 0.80, // 本地当前时间 19:12 - 某日0点，已过去了 0.80 天（19.20小时）
        daysAgo02: 0.46, // UTC.当前时间 11:12 - 某日0点，已过去了 0.46 天（11.04小时）
    */
    let sSql = `
        SELECT
            count(*) as count,
            coalesce(sum(durationInToday), 0) as durationToday,
            coalesce(sum(duration), 0) as durationAll
        from (
            SELECT
                CASE
                    WHEN julianday('now', 'localtime') - julianday(date(actionBeginAt)) < 1
                    THEN duration
                    ELSE 0 END
                AS durationInToday,
                duration
            from action_view
            where action_view.mediaId = ${iMediaID}
        )
    `;
    const t01 = Date.now();
    const aResult = sqlite.select(sSql);
    console.log('查询某个媒体操练时长： consumed ms', Date.now()-t01); // 耗时xx
    return aResult[0];
}

// ▼查询每天的练习记录
export async function getActionByDay(sToday){
    const sqlite = await useSqlite();
    const {default: moment} = await import('https://cdn.jsdelivr.net/npm/moment@2.30.1/+esm');
    sToday ||= moment().format('yyyy-MM-DD');
    const sql = `
        SELECT *
        from action_view
        where actionBeginAt like '${sToday}%'
        order by actionBeginAt
    `;
    const aResult = sqlite.select(sql);
    // console.log(`当天练习记录 ${sToday} 数量: `, aResult);
    // console.log(`当天练习记录 ${sToday} 数量: `, aResult.length);
    return aResult;
}

// TODO 查询累计所有的练习时长，本周，本月，每月，每年，





