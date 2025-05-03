<!--
 * @Author: 李星阳
 * @Date: 2022-04-15 18:02:43
 * @LastEditors: Merlin
 * @LastEditTime: 2025-03-31 10:27:34
 * @Description: TODO 切换显示：当前媒体数据和全部数据
-->
<template>
    <div class="today-bar" >
        统计数据：
        <div class="cell">
            🕓投入时长：
            <em> {{ oInfo.sPracticedTodayDuration }} </em>
            <i class="divide" />
            <em> {{ oInfo.sPracticedDuration }} </em>
        </div>
        <div class="cell">
            🎯累计次数：
            <em> {{ oInfo.fPracticedTodayTimes.toFixed(2) }} </em>
            <i class="divide" />
            <em> {{ oInfo.fPracticedTimes.toFixed(1) }} </em>
        </div>
        <!-- <div class="cell">
            录入时长：
            <ul class="lights">
                <li v-for="iOrder, of 10" :key="iOrder"
                    :class="{lighting: ~~(oInfo.iFiDuration / 60) >= oInfo.tenQty * 10 + iOrder}"
                    :name="oInfo.tenQty * 10 + iOrder"
                ></li>
            </ul>
            <em>{{oInfo.sFiDuration}}</em>
            <b class="addition" v-if="oInfo.iFiDuration_">{{oInfo.iFiDuration_}}</b>
        </div> -->
        <span class="cell" @click="init">
            💻录入统计：
            <em>{{oInfo.iFilled}}行</em>
            <i class="divide" />
            <em>{{oInfo.iFilledWords}}词</em>
            <i class="divide" />
            <em>{{oInfo.sFiDuration}}</em>
        </span>
    </div>
</template>

<script setup>
import {getTodayHistory} from '@/common/js/fs-fn.js';
import {getMediaActionTotal} from '@/common/js/action-db.js';
import {secToStr} from '@/common/js/pure-fn.js';

const oProps = defineProps({
    iMediaID: Number,
});

let oInfo = ref({
    tenQty: 0,
    iFilled: 0,
    iCreated: 0,
    iFilledWords: 0,
    // ---------------------------------------------
    sPracticedDuration: '', // 累积训练时长 
    sPracticedTodayDuration: '', // 当日训练时长 
    fPracticedTimes: 0, // 累积训练次数 
    fPracticedTodayTimes: 0, // 当日训练次数 
});

const oData = reactive({
    showAnimation: false,
    isFirstRun: true,
});

const sqlite = await useSqlite();

async function init(){
    console.log('today-history.vue ♦️ init()');  
    // ↓ 新增于 2025.03.22 21:48:56 星期六 
    fnTotalPracticed(); 
    const oRes = await getTodayHistory(oProps.iMediaID);
    if (!oRes) return;
    console.log('oRes 001', oRes.$dc());
    oInfo.value.tenQty = Math.floor(oRes.iFiDuration / 600);
    if (oData.isFirstRun){
        oData.isFirstRun = false;
        // oInfo.value = oRes;
        Object.assign(oInfo.value, oRes);
        return;
    }
    // { "iCreated": 0, "sCrDuration": "00:00:00", "iFilled": 154, "iFilledWords": 1214, "sFiDuration": "00:10:54", "iCrDuration": 0, "iFiDuration": 654 }
    // ▼ 统计已经听写了几个十分钟，启动定时器 
    setValue(oRes);
}

async function fnTotalPracticed(){
    const [oLines] = sqlite.select(`
        SELECT
            count(*) as rowsQty,
            sum(end - start) as seconds
        FROM line
        where mediaId = ${oProps.iMediaID} 
    `);
    if (!oLines) return; 
    const oPractice = await getMediaActionTotal(oProps.iMediaID);
    const {durationAll, durationToday} = oPractice;
    const oResult = {
        // rowsQty: oLines.rowsQty,
        // sRowsDuration: secToStr(oLines.seconds), // 所有行时长总计 
        // -------------------------------------- 
        sPracticedDuration: secToStr(durationAll, ''), // 累积训练时长 
        sPracticedTodayDuration: secToStr(durationToday, ''), // 当日训练时长 
        fPracticedTimes: durationAll / oLines.seconds, // 累积训练次数 
        fPracticedTodayTimes: durationToday / oLines.seconds, // 当日训练次数 
    }; 
    Object.assign(oInfo.value, oResult);
    console.log('训练统计：\n', oResult);
}


function setValue(oRes){
    Object.entries(oRes).forEach(([key, val])=>{
        const sKeyNew = `${key}_`;
        const iAddition = val - oInfo.value[key];
        oInfo.value[key] = val;
        oInfo.value[sKeyNew] = (iAddition > 0) ? iAddition : 0;
    });
    setTimeout(()=>{
        Object.keys(oInfo.value).forEach((key)=>{
            if (!key.endsWith('_')) return;
            oInfo.value[key] = 0;
        });
    }, 2 * 1000);
}

watch(
    () => oProps.iMediaID,
    (iNew, iOld) => {
        if (!iNew && (iNew == iOld)){
            return;
        }
        init();
    },
    {immediate: true},
);

let lastTime = 0;  
let lastRun = null;
function update() {
    clearTimeout(lastRun); 
    const now = Date.now();
    const frequency = 1_000;
    const iDelay = (
        now - lastTime > frequency
        ? 0
        : frequency
    );
    lastRun = setTimeout(init, iDelay);
    lastTime = now;
}

//关键点 把方法暴露给父组件
defineExpose({
    update,
});
</script>

<style lang="scss" src="./style/today-history.scss" scoped ></style>
