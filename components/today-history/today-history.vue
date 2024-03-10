<!--
 * @Author: 李星阳
 * @Date: 2022-04-15 18:02:43
 * @LastEditors: Merlin
 * @LastEditTime: 2024-03-10 19:03:25
 * @Description: TODO 切换显示：当前媒体数据和全部数据
-->
<template>
    <div class="today-bar" >
        今日数据：
        <div class="cell">
            录入时长：
            <ul class="lights">
                <li v-for="iOrder, of 10" :key="iOrder"
                    :class="{lighting: ~~(oInfo.iFiDuration / 60) >= oInfo.tenQty * 10 + iOrder}"
                    :name="oInfo.tenQty * 10 + iOrder"
                ></li>
            </ul>
            <em>{{oInfo.sFiDuration}}</em>
            <b class="addition" v-if="oInfo.iFiDuration_">{{oInfo.iFiDuration_}}</b>
        </div>
        <span class="cell" @click="showUp">
            行数：<em>{{oInfo.iFilled}}/{{ oInfo.iCreated }} ({{oInfo.iFilledWords}} words)</em>
            <!-- 尾部有下划线的属性来源不明，先注释掉 2024.03.08 22:29:3 星期五  -->
        </span>
        <span class="cell">
            时长：<em>{{oInfo.sFiDuration}}/{{oInfo.sCrDuration}}</em>
        </span>
    </div>
</template>

<script setup>
import {reactive, ref, watch} from 'vue';
import {getTodayHistory} from '@/common/js/fs-fn.js';

let oInfo = ref({
    tenQty: 0,
});
const oData = reactive({
    showAnimation: false,
    isFirstRun: true,
});
const oProps = defineProps({
    iMediaID: Number,
});

async function init(){
    const oRes = await getTodayHistory(oProps.iMediaID);
    if (!oRes) return;
    oInfo.value.tenQty = Math.floor(oRes.iFiDuration / 600);
    if (oData.isFirstRun){
        oData.isFirstRun = false;
        // oInfo.value = oRes;
        Object.assign(oInfo.value, oRes);
        return;
    }
    // { "iCreated": 0, "sCrDuration": "00:00:00", "iFilled": 154, "iFilledWords": 1214, "sFiDuration": "00:10:54", "iCrDuration": 0, "iFiDuration": 654 }
    // ▼ 统计已经听写了几个十分钟
    setValue(oRes);
}
onMounted(()=>{
    init();
});

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
watch(() => oProps.iMediaID, (iNew, iOld) => {
    if (iNew != iOld){
        init();
        console.log('hello 2');
    }
});

function showUp(){
    init();
    console.log('hello 1');
}

//关键点 把方法暴露给父组件
defineExpose({
    init,
});
</script>

<style lang="scss" src="./style/today-history.scss" scoped ></style>
