<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-14 18:25:28
 * @Description: 
-->
<template>
    <div class="page-body">
        <div class="article-container">
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
                        <el-autocomplete
                            clearable
                            v-model="sReExp"
                            :fetch-suggestions="querySearch"
                            @select="handleSelect"
                        />
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
                                    'has-read-line': oLine.readTimes > oArticleInfo.readTimes,
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
        <!-- ↓ -->
        <div class="status-bar">
            <div class="bar-left">
                <span>阅读行：{{hasReadInfo.lines}}</span>
                <span>阅读字数：{{hasReadInfo.words}}</span>
            </div>
            <div class="bar-right">
                <ClientOnly>
                    <el-select v-model="sEnVoiceName"
                        placeholder="Select"
                        style="width: 160px"
                        size="small"
                    >
                        <el-option-group v-for="group in aLangOptions.en"
                            :key="group.label"
                            :label="group.label"
                        >
                            <el-option v-for="item in group.options"
                                :key="item.value"
                                :label="item.name"
                                :value="item.name"
                            />
                        </el-option-group>
                    </el-select>
            
                    <el-select v-model="sZhVoiceName"
                        placeholder="Select"
                        style="width: 160px"
                        size="small"
                    >
                        <el-option v-for="item in aLangOptions.zh"
                            :key="item.value"
                            :label="item.name"
                            :value="item.name"
                        />
                    </el-select>
                </ClientOnly>
                <el-button link @click="drawerShowing=true">
                    drawerShowing
                </el-button>
            </div>
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
            <br/>
            <el-button link AAAAclick="setAsNewChapter">
                从此阅读
            </el-button>
            <el-button link @click="setAsNewChapter">
                设为章节标记
            </el-button>
            <el-button link @click="delOneLine(oSentence.oLine)">
                删除
            </el-button>
        </el-tour-step>
        <template #indicators></template>
    </el-tour>
    <!--  -->
    <el-drawer v-model="drawerShowing">
        <template #header>
            <h4>set title by slot 123</h4>
        </template>
        <template #default>
            <div class="one-lang"
                v-for="(curLang, idx) of aVoiceTypeList" :key="idx"
            >
                <h3>{{ curLang.title }}</h3>
                <div v-for="sex of ['M', 'F']" :key="sex"
                    class="sex-type"
                >
                    <i class="icon fa-solid fa-user-large"
                        :class="sex"
                    ></i>
                    <span class="one-voice"
                        v-for="(item, i02) of curLang.list.filter(thisOne => thisOne.note.sex === sex)"
                        :key="item.name"
                        :title="item.name"
                        @click="tryVoice(item)"
                        :style="{order: item.note.child ? 99 : 1}"
                    >
                        {{ item.nameShort }}
                        {{ item.note.child ? '童声' : '' }}
                    </span>
                </div>
            </div>
        </template>
        <!-- <template #footer>
            <div style="flex: auto">
                <el-button @click="drawerShowing=false">cancel</el-button>
                <el-button type="primary" @click="drawerShowing=false">confirm</el-button>
            </div>
        </template> -->
    </el-drawer>
</template>


<script setup>
import dictionaryVue from '../dictionary/index.vue';
import {ElTourStep} from 'element-plus'
import {registerKeydownFn, getVoiceList} from '@/common/js/common-fn.js';

const pager = [
    'total, sizes, jumper',
    'prev, pager, next',
];
const sEnVoiceName = ref('');
const sZhVoiceName = ref('');
const drawerShowing= ref(false);
const aVoiceList = ref([]);
const aVoiceTypeList = computed(()=>{
    const aResult = [{
        lang: 'en-US',
        title: '美式英语',
        list: [],
    },{
        lang: 'en-GB',
        title: '英式英语',
        list: [],
    },{
        lang: 'zh-',
        title: '中文',
        list: [],
    }];
    aResult.forEach(cur => {
        cur.list = aVoiceList.value.filter(item => {
            return item.lang.includes(cur.lang);
        });
    });
    return aResult;
});

const aLangOptions = computed(()=>{
    const en = [
        {
            label: '美式英语',
            options:  aVoiceList.value.filter(cur=> cur.lang.includes('en-US')),
        }, {
            label: '英式英语',
            options:  aVoiceList.value.filter(cur=> cur.lang.includes('en-GB')),
        },
    ];
    const zh = aVoiceList.value.filter(cur=> {
        return cur.lang.includes('zh-');
    });
    return {en, zh};
});




const sqlite = import.meta.client && await useSqlite();
const oArticleInfo = ref(
    import.meta.client ? store('article') : {}
);
const aReading = ref([0, 0]);
const aLinesFlat = ref([]);
const sReExp = ref('');
const oReExp = ref(null);
const hasReadInfo = ref({
    lines: 0,
    words: 0,
});

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

// ↓当前行
const oLineReading = computed(()=>{
    return aLinesCom.value[
        aReading.value[0]
    ];
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




async function showArticleInfo(){
    const oInfo = sqlite.tb.media.getOne({
        id: oArticleInfo.value.id,
    });
    console.log("媒体信息：", oInfo.$dc());
    oArticleInfo.value = {
        ...oArticleInfo.value,
        ...oInfo,
    }
}

async function init(){
    const oResult = sqlite.tb.line.getPage({
        mediaId: oArticleInfo.value.id,
    }, {
        column: 'id, mediaId, articleRowNo, follow, readTimes, text, chapterMark, lastTimeReadAt',
        tail: 'order by articleRowNo',
        pageSize: oArticleInfo.value.pageSize,
        pageIndex: oArticleInfo.value.pageIndex,
    });
    console.log("媒体行：\n", oResult.$dc());
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

// 修改每页行数量
function handleSizeChange(pageSize){
    oArticleInfo.value.pageSize = pageSize;
    init();
    store('article', oArticleInfo.value.$dc());
}

// 翻页
function handleCurrentChange(pageIndex){
    aReading.value = [0, 0];
    oArticleInfo.value.pageIndex = pageIndex;
    document.querySelectorAll('.main-part')[0].scrollTop=0;
    init();
    store('article', oArticleInfo.value.$dc());
}

// ↓继续阅读
function continueRead(){
    let idx = 0;
    let prev = aLinesFlat.value[0];
    for(const [iKey, oLine] of aLinesFlat.value.entries()){
        if (!oLine.lastTimeReadAt){
            idx = iKey;
            break;
        }
        const iReadAt = new Date(oLine.lastTimeReadAt).getTime();
        if (iReadAt > new Date(prev.lastTimeReadAt).getTime()){
            idx = iKey;
        }
    }
    console.log("继续阅读行：", idx);
    aReading.value = [idx, 0];
}


// ↓ 上一行/下一行
function readNextLine(iDirection){
    let iLineIndex = aReading.value[0] + iDirection;
    if (iLineIndex < 0) iLineIndex = 0;
    if (iLineIndex > aLinesFlat.value.length - 1){
        iLineIndex = aLinesFlat.value.length - 1;
    }
    console.log("iLineIndex", iLineIndex);
    aReading.value[0] = iLineIndex;
    aReading.value[1] = 0;
}

// ↓ 上一词/下一词
function readNextWord(iDirection){
    const iStep = 2; // 走1或2
    const iStepLong = iDirection * iStep;
    const iStep01 = iStep === 2 ? 1 : 0;
    const iWordsMax = oLineReading.value.textArr.length - 1; 
    let iLineIndex = aReading.value[0];
    let iWordIndex = aReading.value[1] + iStepLong;
    // let iWordIndex = Math.max(1, aReading.value[1] + iStepLong);
    console.log("当前行", oLineReading.value.$dc());
    const atEmptyLine = !oLineReading.value.text;
    if (iWordIndex < 0) {
        if (atEmptyLine || (aReading.value[1] <= iStep)){ // 位于句首
            iLineIndex = Math.max(0, iLineIndex - 1);
            const {text} = aLinesFlat.value[iLineIndex];
            console.log("text", text);
            if (aReading.value[0] > 0){
                const iPre = Math.max(0, aReading.value[0]-1);
                iWordIndex = aLinesFlat.value[iPre].textArr.length - 1;
            }else{
                iWordIndex = iStep01;
            }
        }else{
            iWordIndex = iStep01;
        }
    }else if (iWordIndex > iWordsMax) { 
        if (atEmptyLine || (aReading.value[1] === iWordsMax)){ // 位于句尾
            setLineAsRead(oLineReading.value.$dc()); // 设为已读
            iLineIndex++;
            const maxLine = aLinesFlat.value.length - 1;
            if (iLineIndex > maxLine){
                iLineIndex = maxLine;
                ElMessage.success('是否前往下一页');
                iWordIndex = iWordsMax;
            }else{
                iWordIndex = iStep01;
            }
        }else{
            iWordIndex = iWordsMax;
        }
    }
    // iWordIndex = Math.max(1, iWordIndex);
    console.log("行-字", iLineIndex, iWordIndex);
    aReading.value[0] = iLineIndex;
    aReading.value[1] = iWordIndex;
}

// ↓ 设定为已读
function setLineAsRead(oLineReadingDC){
    // console.log("阅读完毕：\n", oLineReadingDC);
    const {readTimes: iArticleReadTimes } = oArticleInfo.value;
    if (oLineReadingDC.readTimes > iArticleReadTimes) {
        return;
    }
    const readTimes = iArticleReadTimes + 1;
    const bRes = sqlite.tb.line.updateOne({
        id: oLineReadingDC.id,
        lastTimeReadAt: Date.now(),
        readTimes,
    });
    if (!bRes) return;
    if (oLineReadingDC.text){
        ElMessage.success('已读+1');
    }
    const oTargetLine = aLinesFlat.value.find(cur=>{
        return cur.id=== oLineReadingDC.id;
    });
    oTargetLine.readTimes = readTimes; 
    checkLinesReadOfToday();
}


// ↓统计阅读量
function checkLinesReadOfToday(){
    // julianday(lastTimeReadAt, 'localtime') - date('now', 'start of day') as gap
    let sql = `
        SELECT
            text,
            mediaId,
            datetime(lastTimeReadAt, 'localtime') as lastTimeReadAt,
            julianday(lastTimeReadAt, 'localtime') - julianday(date('now', 'localtime'))  as gap
        FROM "line"
        where gap > 0
    `;
    const res = sqlite.select(sql);
    let count = 0;
    res.forEach(cur=>{
        if (!cur.text) return;
        count += cur.text.split(/\s+/).length;
    });
    hasReadInfo.value.lines = res.length;
    hasReadInfo.value.words = count;
    console.log("当天阅读：\n", res.$dc());
}


// ↓修改行
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

// ↓替换（删除）目标文字
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


// ↓删除行
function delOneLine(oLine){
    sqlite.tb.line.deleteById(oLine);
    init();
    oSentence.value.visible = false;
}

// ↓提供候选项
function querySearch(str, callback){
    // [\u4e00-\u9fa5]
    const arr01 = [{
        value: /[\u4e00-\u9fa5]/.toString(),
    }]
    callback(arr01);
}
function handleSelect(newVal){
    console.log("newVal", newVal);
}

function tryVoice(voice){
    console.log('voice')
    console.log(voice)
    var text = '许多人认为当他们富有，取得成功时，幸福自然就会随之而来。我告诉你:事实并非如此';
    var text = 'Many people think that when they become rich and successful, happiness will naturally follow.'; 
    var text = 'hello，你好'; 
    var oMsg = Object.assign(new SpeechSynthesisUtterance(), {
        voice,
        volume: 100,
        rate: 1, // 速度
        pitch: 1, // 值大音尖
        text,
    });
    window.speechSynthesis.speak(oMsg);
}


const withNothing = [
    { key: 'w', name: '上一句', fn:()=> readNextLine(-1)},
    { key: 's', name: '下一句', fn:()=> readNextLine(1)},
    { key: 'a', name: '上一字', fn:()=> readNextWord(-1)},
    { key: 'd', name: '下一字', fn:()=> readNextWord(1)},
];
const oFnObj = [...withNothing].reduce((oResult, cur) => {
    oResult[cur.key] = cur.fn;
    return oResult;
}, {});



import.meta.client && window.speechSynthesis.getVoices(); // 有必要触发

onMounted(()=>{
    init();
    showArticleInfo();
    checkLinesReadOfToday();
    registerKeydownFn(oFnObj);
    setTimeout(()=>{
        aVoiceList.value = getVoiceList();
    }, 100);
});


</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

