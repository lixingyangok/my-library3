/*
 * @Author: 李星阳
 * @Date: 2023-08-12 12:05:57
 * @LastEditors: 李星阳
 * @LastEditTime: 2023-08-23 22:03:33
 * @Description: 本文件删除于 2023.08.23 22:03:36 星期三 
 */

// import { mapStores, defineStore } from 'pinia';
// import * as btSqliteDB from '@/database/action-db.js';

// const iOneDayMinites = 24 * 60; // 全天分钟数
// const shortMinutes = 50; // 短分钟（每分钟播放达到此秒数即视为100%高饱和）
// const iGapSec2Merge = 120; // 间距小于此值，合并

// 你可以对 `defineStore()` 的返回值进行任意命名，但最好使用 store 的名字，同时以 `use` 开头且以 `Store` 结尾。(比如 `useUserStore`，`useCartStore`，`useProductStore`)
// 第一个参数是你的应用中 Store 的唯一 ID。

// export const useActionStore = defineStore('action', {
//     state: () => ({ 
//         count: 1,
//         aTodayAction: [], // 当天记录
//         aDaysAction: [], // 多天记录
//     }),
//     getters: {
//         double: (state) => state.count * 2,
//     },
//     actions: {
//         async init(){
//             this.count++;
//             // if (this.count % 2) return;
//             // const sToday = moment().format('yyyy-MM-DD');
//             console.time('♥查询耗时');
//             const aResult = btSqliteDB.getActionByDay();
//             console.timeEnd('♥查询耗时');
//             // console.log('aResult', aResult);
//             console.time('♥播放记录合并耗时');
//             this.processMinites(aResult);
//             console.timeEnd('♥播放记录合并耗时');
//         },
//         async processMinites(aResult){
//             const sToday = moment().format('yyyy-MM-DD') + ' 00:00:00';
//             const oZeroClock = moment(sToday);
//             const aFixed = [];
//             aResult.forEach((oCur, idx) => {
//                 let oLast = aFixed.at(-1);
//                 const {actionBeginAt, actionEndAt, duration} = oCur;
//                 const oActionBeginAt = moment(actionBeginAt);
//                 const iMinutesStart = oActionBeginAt.diff(oZeroClock, 'minute');
//                 const iGap2PrevSec = oLast?.actionEndAt && oActionBeginAt.diff(oLast.actionEndAt, 'second');
//                 const pushNewOne = (iGap2PrevSec > iGapSec2Merge) || (idx==0);
//                 if (pushNewOne){
//                     oLast = {
//                         actionBeginAt, // 行动起点
//                         iMinutesStart, // 行动起点（分数序号
//                         leftAt: iMinutesStart / iOneDayMinites * 100,
//                     };
//                 }
//                 oLast.iGap2PrevSec = iGap2PrevSec; // 目前没用，将来用于数据分析
//                 oLast.actionQty = (oLast.actionQty || 0) + 1; // 目前没用，将来用于数据分析
//                 oLast.iMinutesLong = (()=>{ // 计算最左到最右的距离
//                     let second = moment(actionEndAt).diff(oLast.actionBeginAt, 'second');
//                     return Math.max(1, second / 60); // 最小1分钟
//                 })();
//                 oLast.actionEndAt = actionEndAt; // 行动终点
//                 oLast.duration = (oLast.duration || 0) + duration;
//                 oLast.height = oLast.duration / (oLast.iMinutesLong * shortMinutes) * 100,
//                 oLast.width = oLast.iMinutesLong / iOneDayMinites * 100;
//                 // oLast.saturation = oLast.duration / (iMinutesLong * shortMinutes); // 时长饱和度百分数
//                 // oLast.kids = (oLast.kids || []).contract(oCur); // 当前没用上
//                 // console.log(`饱和分-秒 ${iMinutesLong}-${oLast.duration.toFixed(0)} -${oLast.saturation}`);
//                 pushNewOne && aFixed.push(oLast);
//             });
//             console.log(`#${this.count} 播放记录合并前后数量：${aResult.length}:${aFixed.length}`);
//             this.aTodayAction = aFixed;
//         },
//     },
// });

// export default {
//     computed: {
//         // 注意，我们不是在传递一个数组，而是一个接一个的 store。
//         // 可以 id+'Store' 的形式访问每个 store 。
//         ...mapStores(useActionStore)
//     },
//     methods: {
//         async buyStuff() {
//             console.log('buyStuff');
//             // 可以在任何地方使用他们！
//             // if (this.userStore.isAuthenticated()) {
//             //     await this.cartStore.buy()
//             //     this.$router.push('/purchased')
//             // }
//         },
//     },
// }




