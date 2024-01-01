/*
 * @Author: 李星阳
 * @Date: 2022-01-09 17:59:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2023-08-26 09:03:50
 * @Description: 
 */

import { onBeforeUnmount } from 'vue';
import { keyMap } from './key-map.js';

// ▼注册按键监听
export function registerKeydownFn(oFnList) {
    let spacePressedAt = 0;
    function keyDownFnCaller(ev) {
        const ctrl = ev.ctrlKey ? 'ctrl + ' : '';
        const alt = ev.altKey ? 'alt + ' : '';
        const shift = ev.shiftKey ? 'shift + ' : '';
        const keyName = keyMap[ev.keyCode] || '';
        const keyStr = ctrl + alt + shift + keyName;
        let theFn = oFnList[keyStr];
        if (!theFn) return;
        const toPrevent = (()=>{
            const iTyping = ['TEXTAREA', 'INPUT'].includes(ev.target.nodeName);
            if (!iTyping) return true; //不在输入状态，则阻止默认事件
            if (keyStr.length === 1 || keyStr === 'Space'){
                theFn = null;
                return false;
            }
            // else if (Space){
            //     // console.log(`双击与长按：${iGap}-${ev.repeat}`);
            //     if (ev.repeat) return true; // 长按时，无条件阻断默认事件
            //     let iGap = -1 * (spacePressedAt - (spacePressedAt = new Date().getTime()));
            //     if (iGap < 300) {
            //         ev.dbclick = true;
            //         return true;
            //     }
            // }
            // if (keyStr != 'Space') return !['Home', 'End'].includes(keyStr);
            return true; // 在输入框之外也阻断;
        })();
        if (toPrevent){
            ev.preventDefault();
            ev.stopPropagation();
        }
        theFn?.(ev);
    }
    document.addEventListener('keydown', keyDownFnCaller);
    onBeforeUnmount(() => {
        console.log('卸载-取消按键监听');
        document.removeEventListener('keydown', keyDownFnCaller);
    });
}

// ▼注册主进程的监听员（似乎废弃了）
export function listenFromMainProcess(sName, fn) {
    oRenderer.on(sName, fn);
    onBeforeUnmount(() => {
        oRenderer.removeListener(sName, fn);
    });
}

export function getTubePath(sPath) {
    // sPath = encodeURI(sPath); // 无效
    sPath = encodeURIComponent(sPath); 
    return 'tube://abc?path=' + sPath;
}

// ▼文件名数字排序
export function mySort(arr, sKey) {
    if (!arr) return;
    const regexp = /[^\d]+|\d+/g;
    arr.sort((aa, bb) => {
        let pos = 0;
        const weightsA = (aa?.[sKey] || '').match(regexp);
        const weightsB = (bb?.[sKey] || '').match(regexp);
        let weightA = weightsA[pos];
        let weightB = weightsB[pos];
        while (weightA && weightB) {
            const vv = weightA - weightB;
            if (!isNaN(vv) && vv !== 0) return vv;
            if (weightA !== weightB) return weightA > weightB ? 1 : -1;
            pos += 1;
            weightA = weightsA[pos];
            weightB = weightsB[pos];
        }
        return weightA ? 1 : -1;
    });
}

// ▼跳转到目标页
export function goToLounage(sFilePath){
    ls('sFilePath', sFilePath);
    vm.$router.push({
        name: 'studyLounge',
    });
}

// const [a1, a2=0] = (aa?.[sKey] || '').match(/\d+/g) || [];
// const [b1, b2=0] = (bb?.[sKey] || '').match(/\d+/g) || [];
// // console.log(a1, b1);
// if (a1 && b1) {
//     return (a1*999 + a2*1) - (b1*999 + b2*1);
// }
// return aa[sKey].localeCompare(bb[sKey]);

export function SortLikeWin(v1, v2) {
    var reg = /[0-9]+/g;
    var [a, b] = [v1.name, v2.name];
    var [lista, listb] = [a.match(reg), b.match(reg)];
    if (!lista || !listb) return a.localeCompare(b);
    for (var i = 0, minLen = Math.min(lista.length, listb.length); i < minLen; i++) {
        //数字所在位置序号
        var [indexa, indexb] = [a.indexOf(lista[i]), b.indexOf(listb[i])];
        //数字前面的前缀
        var [prefixa, prefixb] = [a.substring(0, indexa), b.substring(0, indexb)];
        var [stra, strb] = [lista[i], listb[i]]; //数字的string
        var [numa, numb] = [parseInt(stra), parseInt(strb)]; //数字的值
        // 如果数字的序号不等或前缀不等，属于前缀不同的情况，直接比较
        if (indexa != indexb || prefixa != prefixb) {
            return a.localeCompare(b);
        }
        // 数字的string全等
        if (stra === strb) {
            //如果是最后一个数字，比较数字的后缀
            if (i == minLen - 1) {
                return a.substring(indexa).localeCompare(b.substring(indexb));
            }
            //如果不是最后一个数字，则循环跳转到下一个数字，并去掉前面相同的部分
            a = a.substring(indexa + stra.length);
            b = b.substring(indexa + stra.length);
        }
        // 如果数字的string不全等，但值相等
        else if (numa == numb) { //直接比较数字前缀0的个数，多的更小
            return strb.lastIndexOf(numb + '') - stra.lastIndexOf(numa + '');
        }
        // 如果数字不等，直接比较数字大小
        return numa - numb;
    }
}
// 使用方法,Array.sort(SortLikeWin);
// 注：localecompare 比较中文的时候有问题，替换为

function commonCompare(v1, v2) {
    if (v1 === v2) return 0;
    else return v1 < v2 ? -1 : 1;
}


export function getDateDiff(dateTimeStamp){
    var minute = 1000 * 60;
    var hour = minute * 60;
    var day = hour * 24;
    var month = day * 30;
    var diffValue = new Date().getTime() - dateTimeStamp;
    if (diffValue < 0) return;
    var monthC = diffValue / month;
    var weekC = diffValue / (7*day);
    var dayC = diffValue / day;
    var hourC = diffValue / hour;
    var minC = diffValue / minute;
    if (monthC >= 1) {
        if(monthC <= 12) return "" + parseInt(monthC) + "月前";
        return "" + parseInt(monthC/12) + "年前";
    } else if (weekC >= 1) {
        return "" + parseInt(weekC) + "周前";
    } else if (dayC >= 1) {
        return "" + parseInt(dayC) + "天前";
    } else if (hourC >= 1) {
        return "" + parseInt(hourC) + "小时前";
    } else if (minC >= 1) {
        return "" + parseInt(minC) + "分钟前";
    }
    return "刚刚";
}
