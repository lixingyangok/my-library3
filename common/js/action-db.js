
// ▼查询某个媒体的练习记录
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





