<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: 李星阳
 * @LastEditTime: 2023-08-20 13:30:06
 * @Description: 
-->
<template>
    <article class="wave-coat" >
        <video controls class="player" ref="oAudio"
            id="media-player"
            v-show="(mediaPath || '').endsWith('.mp4')"
            :style="{width: '600px'}"
            :src="mediaPath"
        ></video>
        <section class="my-wave-bar" ref="oMyWaveBar"
            :class="sWaveBarClassName"
        >
            <canvas class="canvas" ref="oCanvasDom"/>
            <!-- ▲画布 -->
            <!-- ▼横长条的视口 -->
            <section class="viewport" ref="oViewport"
                @mousewheel="wheelOnWave"
                @scroll="waveWrapScroll"
                @contextmenu="clickOnWave"
                @mousedown="mouseDownFn"
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
                    <ul class="region-ul">
                        <li v-for="(cur, idx) of aGapRegions" :key="idx" 
                            class="region" :class="cur.idx === iCurLineIdx ? 'cur' : ''"
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
import {registerKeydownFn} from '../../common/js/common-fn.js'

export default {
    name: 'my-wave-bar',
    props: {
        mediaDuration: {
            type: Number,
            default: 0,
        },
        mediaPath: String,
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
        const {oDom, oFn, oData, iFinalDuration} = w01();
        // ▼视口范围 [起点秒，终点秒]
        const aGapSeconds = computed(() => {
            const iWidth = oDom?.oViewport?.offsetWidth || window.innerWidth;
            const start = ~~(oData.iScrollLeft / oData.fPerSecPx);
            const end = ~~((oData.iScrollLeft + iWidth) / oData.fPerSecPx);
            // end = math.min(end, duration*oData.fPerSecPx) // 这行留着做将来的参考，有必要就打开
            return [Math.max(start, 0), end];
        });
        const aGapMarks = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.v;
            const arr = [];
            for(let idx = iLeftSec; idx < iRightSec; idx++ ) {
                arr.push(idx);
            }
            return arr;
        });
        const aGapRegions = computed(() => {
            const [iLeftSec, iRightSec] = aGapSeconds.v;
            if (!iRightSec) return [];
            const myArr = [];
            const {length} = props.aLineArr;
            for (let idx = 0; idx < length; idx++){
                const oCur = props.aLineArr[idx];
                const {end} = oCur;
                const IsShow = end > iLeftSec || end > iRightSec; // 此处正确无误
                if (!IsShow) continue;
                oCur.idx = idx;
                if (iFinalDuration.v > 100){
                    oCur.iRate = (oCur.start / iFinalDuration.v * 100).toFixed(1) * 1;
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
        const oFnList = getKeyDownFnMap(this, 'obj');
        registerKeydownFn(oFnList);
    },
    beforeUnmount(){
        this.toPause();
    },
};
</script>

<style scoped src="./style/wave.scss"></style>