<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-09 14:23:41
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
                        >
                            <span v-for="(sWord, i03) of oLine.textArr" :key="i03"
                                class="word"
                                :class="{
                                    'word-has-read': oLine.reading && i03 <= aReading[1],
                                }"
                            >
                                {{(i03 ? ' ' : '') + sWord}}
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
</template>


<script setup>
import dictionaryVue from '../dictionary/index.vue';

const oArticleInfo = ref(
    import.meta.client ? store('article') : {}
);
const aReading = ref([0, 0]);
const aLinesFlat = ref([]);
const aLinesCom = computed(() => {
    return aLinesFlat.value.map((cur, idx)=>{
        const isReading = aReading.value[0] === idx;
        cur.reading = isReading;
        return cur;
    });
});
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
    showPage();
});


async function showArticleInfo(){
    const sqlite = await useSqlite();
    const oInfo = sqlite.tb.article.getOne({
        articleId: oArticleInfo.value.id,
    });
}

async function showPage(){
    const sqlite = await useSqlite();
    const oResult = sqlite.tb.line.getPage({
        articleId: oArticleInfo.value.id,
    }, {
        column: 'id, articleId, articleRowNo, follow, readTimes, text',
        tail: 'order by articleRowNo',
        pageSize: oArticleInfo.value.pageSize,
        pageIndex: oArticleInfo.value.pageIndex,
    });
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
    showPage();
}

function handleCurrentChange(pageIndex){
    oArticleInfo.value.pageIndex = pageIndex;
    document.querySelectorAll('.main-part')[0].scrollTop=0;
    showPage();
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

function readNextWord(iDirection){
    const iMax = oLineReading.value.textArr.length - 1; 
    let iLineIndex = aReading.value[0];
    let iWordIndex = aReading.value[1] + (iDirection * 1);
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



onMounted(()=>{
    document.addEventListener('keydown', keyDown);
});
onBeforeUnmount(()=>{
    document.removeEventListener('keydown', keyDown);
});

</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

