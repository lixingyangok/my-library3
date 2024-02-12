<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-12 15:50:00
 * @Description: 
-->
<template>
    <div class="page-body">
        <section class='at-left' 
            v-if="0"
        >
            <div> asdf </div>
        </section>
        <!-- ↑左栏，↓中部 -->
        <section class="at-center" >
            <div class="title " >
                <h1 v-if="oArticleInfo.titleEn">
                    {{ oArticleInfo.titleEn }}
                </h1>
                <h1 v-if="oArticleInfo.titleZh">
                    {{ oArticleInfo.titleZh }}
                </h1>
                <div class="btn-group" >
                    <el-button link @click="continueRead">
                        继续阅读
                    </el-button >
                    <el-button link >开始阅读</el-button >
                    {{ aReading.join(', ') }}
                    <!-- [\u4e00-\u9fa5] -->
                    <input type="text" v-model="sReExp"/>
                    <el-button link @click="toFindTargetWord">
                        定位目标
                    </el-button >
                    <el-button link @click="toReplaceTargetWords">
                        替换
                    </el-button >
                </div>
            </div>
            <div class="article " >
                <article class="section-box">
                    <section v-for="(aRows, i01) of aParagraph4Show"
                        :key="i01"
                        class="paragraph"
                        :class="{
                            empty: aRows.length === 1 && !aRows[0].text,
                        }"
                        
                    >
                        <p v-for="(oLine, i02) of aRows" :key="oLine.id"
                            class="sentence"
                            :class="{
                                'reading-line': oLine.reading,
                            }"
                            @click.alt="sentenceEditing($event, oLine)"
                            @click.ctrl="sentenceMarking($event, oLine)"
                            :data-sentence="oLine.text"
                        >
                            <span v-for="(vWord, i03) of (oLine.textMatchedArr || oLine.textArr)"
                                :key="i03"
                                class="word"
                                :class="{
                                    'word-has-read': oLine.reading && i03 <= aReading[1],
                                    'matched': vWord.isMatched,
                                }"
                            >
                                {{
                                    ((i03 && !vWord.text) ? ' ' : '') +
                                    (vWord.text || vWord)
                                }}
                            </span>
                        </p>
                    </section>
                </article>
                <!-- 分界 -->
                <div class="page-box">
                    <el-pagination
                        v-for="(sCurLayout, idx) of pager"
                        :key="idx"
                        hide-on-single-page
                        :small="!true"
                        :background="false"
                        v-model:current-page="oArticleInfo.pageIndex"
                        v-model:page-size="oArticleInfo.pageSize"
                        :total="oArticleInfo.total || 1"
                        :page-sizes="[20, 40, 60, 80, 100]"
                        :layout="sCurLayout"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                    />
                </div>
            </div>
        </section>
        <!-- ↑正文 ↓字典 -->
        <div class='at-right'>
            <dictionaryVue ></dictionaryVue>
        </div>
    </div>


    <el-tour :mask="true"
        v-model="oSentence.visible"
    >
        <el-tour-step :target="oSentence.dom"
            title="操作"
            placement="top"
        >
            <p>
                {{ oSentence.oLine.text }}
            </p>
            <el-button link @click="setAsNewChapter">
                设为章节标记
            </el-button>
            <el-button link AAclick="setAsNewChapter">
                删除
            </el-button>
        </el-tour-step>
        <template #indicators></template>
    </el-tour>
</template>


<script setup>
import dictionaryVue from '../dictionary/index.vue';
import {ElTourStep} from 'element-plus'

const sqlite = import.meta.client && await useSqlite();
const oArticleInfo = ref(
    import.meta.client ? store('article') : {}
);
const aReading = ref([0, 0]);
const aLinesFlat = ref([]);
const sReExp = ref('');
const oReExp = ref(null);


const oSentence = ref({
    visible: false,
    dom: null,
    oLine: {},
});

const aLinesCom = computed(() => {
    return aLinesFlat.value.map((cur, idx)=>{
        const isReading = aReading.value[0] === idx;
        cur.reading = isReading;
        cur.textMatchedArr = separate(cur.text);
        return cur;
    });
});

function separate(text){
    if (!oReExp.value) return null;
    var iEndAt = 0;
    var arr = [];
    text.replace(oReExp.value, (sMatched, iStart, sWhole)=>{
        const thisPice = sWhole.slice(iEndAt, iStart);
        const aPushTo = [{
            text: thisPice,
        }, {
            text: sMatched,
            isMatched: true,
        }];
        if (iStart === 0 || iStart === iEndAt) {
            aPushTo.shift();
        }
        arr.push(...aPushTo);
        iEndAt = iStart + sMatched.length;    
    });
    if (!arr.length) return null;
    if (iEndAt < text.length){
        arr.push({
            text: text.slice(iEndAt),
        });
    }
    return arr;
}

const oLineReading = computed(()=>{
    return aLinesCom.value.find((cur, idx)=>{
        return idx === aReading.value[0];
    });
});


const aParagraph4Show = computed(()=>{
    const arr = [];
    aLinesCom.value.forEach((oCur, idx) => {
        // if (idx===0 && !oCur.text) return;
        if (!oCur.follow || !arr[0]) {
            arr.push([]);
        }
        arr.at(-1).push(oCur)
    }, []);
    return arr;
});



const pager = [
    'total, sizes, jumper',
    'prev, pager, next',
]

onMounted(()=>{
    init();
});


async function showArticleInfo(){
    const oInfo = sqlite.tb.article.getOne({
        mediaId: oArticleInfo.value.id,
    });
}

async function init(){
    const oResult = sqlite.tb.line.getPage({
        mediaId: oArticleInfo.value.id,
    }, {
        column: 'id, mediaId, articleRowNo, follow, readTimes, text, chapterMark',
        tail: 'order by articleRowNo',
        pageSize: oArticleInfo.value.pageSize,
        pageIndex: oArticleInfo.value.pageIndex,
    });
    console.log("oResult\n", oResult.$dc());
    const oArticleInfoNew = {
        ...oArticleInfo.value,
        ...oResult,
        rows: [],
    };
    store('article', oArticleInfoNew);
    oArticleInfo.value = oArticleInfoNew;
    aLinesFlat.value = oResult.rows.map(cur=>{
        cur.textArr = cur.text.split(/\s+/);
        return cur;
    });
}


function handleSizeChange(pageSize){
    oArticleInfo.value.pageSize = pageSize;
    init();
}

function handleCurrentChange(pageIndex){
    oArticleInfo.value.pageIndex = pageIndex;
    document.querySelectorAll('.main-part')[0].scrollTop=0;
    init();
}

function continueRead(){
    const idx = aLinesFlat.value.findIndex(cur => {
        return !cur.readTimes;
    });
}

function keyDown(ev){
    const {key} = ev;
    console.log("key:", key);
    if (key=='d') readNextWord(1);
    else if (key=='a') readNextWord(-1);
    else if (key=='w') readNextLine(-1);
    else if (key=='s') readNextLine(1);
}

function readNextLine(iDirection){
    let iLineIndex = aReading.value[0] + iDirection;
    if (iLineIndex < 0) iLineIndex = 0;
    if (iLineIndex > aLinesFlat.length-1){
        iLineIndex = aLinesFlat.length-1
    }
    aReading.value[0] = iLineIndex;
    aReading.value[1] = 0;
}

// ↓步进步退
function readNextWord(iDirection){
    const iStepLong = iDirection * 2;
    const iMax = oLineReading.value.textArr.length - 1; 
    let iLineIndex = aReading.value[0];
    let iWordIndex = aReading.value[1] + iStepLong;
    if (iWordIndex < 0) {
        if (aReading.value[1] === 0){ // 位于句首
            iLineIndex = Math.max(0, iLineIndex - 1);
            const iPre = Math.max(0, aReading.value[0]-1);
            iWordIndex = aLinesFlat.value[iPre].textArr.length - 1;
        }else{
            iWordIndex = 0;
        }
    }else if (iWordIndex > iMax) { 
        if (aReading.value[1] === iMax){ // 位于句尾
            iWordIndex = 0;
            iLineIndex = Math.min(
                iLineIndex + 1,
                aLinesFlat.value.length - 1,
            );
        }else{
            iWordIndex = iMax;
        }
    }
    aReading.value[0] = iLineIndex;
    aReading.value[1] = iWordIndex;
}


function sentenceEditing(ev, oLine){
    const {currentTarget} = ev;
    const range = window.getSelection().getRangeAt(0)
    console.log("currentTarget", currentTarget);
    console.log("range", range);
    oSentence.value.dom = currentTarget;
    oSentence.value.oLine = oLine;
    currentTarget.setAttribute('contenteditable', true)
    currentTarget.focus();
}


// ↓显示气泡窗口
function sentenceMarking(ev, oLine){
    const {currentTarget} = ev;
    console.log("currentTarget\n", currentTarget);
    oSentence.value.dom = currentTarget;
    oSentence.value.oLine = oLine;
    oSentence.value.visible = true;
}

// ↓设为章节标记
function setAsNewChapter(){
    const { oLine}= oSentence.value;
    console.log("oLine", oLine.$dc());
    sqlite.tb.line.updateOne({
        id: oLine.id,
        chapterMark: oLine.chapterMark ? 0 : 1,
    })
}

// ↓匹配替换项
function toFindTargetWord(){
    let sReExp01 = sReExp.value;
    if (!sReExp01) {
        oReExp.value = null;
        return;
    }
    // /^\d+$/.test('1')
    sReExp01 = new RegExp(sReExp01, 'g');
    console.log("sReExp01", sReExp01);
    oReExp.value = sReExp01;
}

// ↓
function toReplaceTargetWords(){
    if (!oReExp.value) return;
    const arr = aLinesCom.value.filter(cur=>{
        return cur.textMatchedArr;
    }).map(cur=>{
        return {
            id: cur.id,
            text: cur.text.replaceAll(oReExp.value, ''),
        };
    });
    console.log('arr', arr.$dc());
    arr.forEach(cur=>{
        sqlite.tb.line.updateOne(cur);
    });
    init();
}


onMounted(()=>{
    document.addEventListener('keydown', keyDown);
});
onBeforeUnmount(()=>{
    document.removeEventListener('keydown', keyDown);
});

</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

