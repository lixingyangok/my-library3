<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: Merlin
 * @LastEditTime: 2024-04-13 12:57:24
 * @Description: 
-->
<template>
    <article class="wave-coat" >
        <video controls
            class="player"
            ref="oAudio"
            id="media-player"
            v-if="!leftVideoVisible"
            v-show="mediaPath.match(/\.mp4$/i)"
            :style="{width: '200px'}"
            :src="mediaSrc"
        ></video>
        <section ref="oMyWaveBar"
            class="my-wave-bar"
            :class="sWaveBarClassName"
        >
            <canvas class="canvas" ref="oCanvasDom"/>
            <!-- ▲画布 -->
            <!-- ▼横长条的视口 -->
            <section class="viewport"
                ref="oViewport"
                :style="oStyle4WaveBox"
                @mousewheel="wheelOnWave"
                @scroll="waveWrapScroll"
                @contextmenu.prevent="()=>null"
                AAAcontextmenu="clickOnWave"
                AAAmousedown="mouseDownFn"
            >
                <div class="long-bar" ref="oLongBar"
                    :style="{width: `${(iFinalDuration + 0.6) * fPerSecPx}px`}"
                >
                    <ul class="scale-ul">
                        <li v-for="(cur) of aGapMarks" :key="cur" v-show="cur"
                            class="one-second" :class="cur % 10 == 0 ? 'ten-times' : ''"
                            :style="{left: `${cur * fPerSecPx}px`}"
                        >
                            <b className="mark"/>
                            <span v-show="(cur % 2 == 0) || iPerSecPx >= 50">{{~~(cur/60)}}'{{cur%60}}</span>
                        </li>
                    </ul>
                    <!-- ↑ 时间刻度 -->
                    <!-- ↓ 区间标记 -->
                    <ul class="region-ul"
                        @contextmenu.prevent="clickOnWave"
                        @mousedown="mouseDownFn"
                    >
                        <li v-for="(cur, idx) of aGapRegions" :key="idx" 
                            :class="{
                                region: true,
                                cur: cur.idx === iCurLineIdx,
                            }"
                            :style="{
                                left: `${cur.start * fPerSecPx}px`,
                                width: `${(cur.end - cur.start) * fPerSecPx}px`,
                            }"
                        >
                            <i class="idx">
                                <span v-if="cur.iRate && cur.iRate < 100" class="region-info"
                                    :class="{
                                        'small-step': parseInt(cur.iRate) % 2 == 0 && parseInt(cur.iRate) > parseInt(aGapRegions[idx-1]?.iRate),
                                        'big-step': cur.iRate >= 5 && parseInt(cur.iRate / 5) > parseInt(aGapRegions[idx-1]?.iRate / 5)
                                    }"
                                >
                                    {{cur.iRate}}%
                                </span>
                            </i>
                            <!-- ↓ 当前行文本 -->
                            <p class="text" v-if="fPerSecPx>100">
                                {{ cur.text }}
                            </p>
                        </li>
                    </ul>
                    <i ref="oPointer" class="pointer" :class="{playing: playing}"/>
                </div>
                <!-- <ol class="percentage-box" >
                    <li v-for="(idx) of 9" :key="idx">{{idx*10}}%</li>
                </ol> -->
            </section>
        </section>
    </article>
</template>


<script>
import { toRefs, computed } from 'vue';
import w01, {getKeyDownFnMap} from './js/wave.js';
import {registerKeydownFn} from '@/common/js/common-fn.js'

export default {
    name: 'my-wave-bar',
    props: {
        mediaDuration: {
            type: Number,
            default: 0,
        },
        mediaPath: String, // 文件路径
        leftVideoVisible: Boolean, 
        oBigVideo: Object, 
        oMediaFile: { // 新增
            type: Object,
        },
        aLineArr: {
            type: Array,
            default: ()=>[],
        },
        iCurLineIdx: {
            type: Number,
            default: 0,
        },
        oMediaInfo: {
            type: Object,
            default: ()=>({}),
        },
    },
    // ▼ 与 props 类似
    // ▼ 声明当前组件<example/>可以在行间定义的属性
    emits: ['pipe', 'setTimeTube'],
    setup(props){
        if (!import.meta.client) return;
        const {oDom, oFn, oData, iFinalDuration} = w01();
        // console.log("oFn", oFn);
        // oFn.initFn(props.oMediaFile);
        // ▼视口范围 [起点秒，终点秒]
        const aGapSeconds = computed(() => {
            const iWidth = oDom?.oViewport?.offsetWidth || window.innerWidth;
            const start = Math.floor(oData.iScrollLeft / oData.fPerSecPx);
            const end = Math.ceil((oData.iScrollLeft + iWidth) / oData.fPerSecPx); 
            // end = math.min(end, duration*oData.fPerSecPx) // 这行留着做将来的参考，有必要就打开
            return [Math.max(start, 0), end];
        });
        const aGapMarks = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.value;
            const arr = [];
            for(let idx = iLeftSec; idx < iRightSec; idx++ ) {
                arr.push(idx);
            }
            return arr;
        });
        const aGapRegions = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.value;
            if (!iRightSec) return [];
            const myArr = [];
            const {length} = props.aLineArr;
            for (let idx = 0; idx < length; idx++){
                const oCur = props.aLineArr[idx];
                const {start, end} = oCur;
                const IsShow = end > iLeftSec || end > iRightSec; // 此处正确无误
                // const IsShow = end > iLeftSec || start < iRightSec; // 新
                if (!IsShow) continue;
                oCur.idx = idx;
                if (iFinalDuration.value > 100){
                    oCur.iRate = (oCur.start / iFinalDuration.value * 100).toFixed(1) * 1;
                }
                myArr.push(oCur);
                if (end > iRightSec) break;
            }
            return myArr;
        });
        return {
            ...toRefs(oDom),
            ...toRefs(oData),
            ...oFn,
            aGapRegions,
            aGapMarks,
            iFinalDuration,
        };
    },
    mounted(){
        // 此处 this === getCurrentInstance()
        console.log("注册按键", );
        const oFnList = getKeyDownFnMap(this, 'obj');
        registerKeydownFn(oFnList);
    },
    beforeUnmount(){
        this.toPause();
        cancelAnimationFrame(this.scrollTimer);
    },
};
</script>

<style scoped src="./style/wave.scss"></style>