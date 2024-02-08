<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-08 22:34:25
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
                    {{ aReadingIndex.join(', ') }}
                </div>
            </div>
            <div class="article " >
                <article class="section-box">
                    <div>
                        {{ oReadingLine.textArr }}
                    </div>
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
                                reading: oLine.reading,
                                'line-has-read': 0,
                            }"
                        >
                            <template v-if="oLine.reading">
                                <span v-for="(sWord, i03) of oLine.textArr" :key="i03"
                                    class="word"
                                    :class="{
                                        'word-has-read': 0
                                    }"
                                >
                                    <template v-if="i03">&nbsp;</template>{{sWord}}
                                </span>
                            </template>
                            <template v-else>
                                {{ oLine.text }}
                            </template>
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

const aReadingIndex = ref([]);
const aParagraph = ref([]);
const oArticleInfo = ref(
    import.meta.client ? store('article') : {}
);
const aParagraph4Show = computed(()=>{
    // const [iParagraph, iLine] = aReadingIndex.value;
    const arr01 = aParagraph.value.map((aRows, i01)=>{
        const isTargetParagraph = i01 === aReadingIndex.value[0];
        const arr02 = aRows.map((oRow, i02) => {
            const reading = isTargetParagraph && (i02 === aReadingIndex.value[1]);
            if (reading){
                oRow.reading = true;
                oRow.textArr = oRow.text.split(/\s+/);
            }
            return oRow;
        });
        return arr02;
    });
    return arr01;
});
const oReadingLine = computed(()=>{
    if (aReadingIndex.value.length < 3) return {};
    const aLines = aParagraph4Show.value[
        aReadingIndex.value[0]
    ];
    const oLine = aLines[aReadingIndex.value[1]];
    return oLine;
});


const pager = [
    // 'total, sizes, prev, pager, next, jumper',
    'total, sizes, jumper',
    'prev, pager, next',
]


onMounted(()=>{
    init();
});

async function init(){
    showPage();
}

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
    const arr = [];
    oResult.rows.forEach((oCur, idx) => {
        if (idx===0 && !oCur.text) return;
        if (!oCur.follow || !arr[0]) {
            arr.push([]);
        }
        arr.at(-1).push(oCur)
    }, []);
    // console.log("oResult\n", oResult.$dc());
    console.log("arr\n", arr.$dc());
    aParagraph.value = arr;
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
    for (const [idx01, aRows] of aParagraph.value.entries()){
        const iUnread = aRows.findIndex(cur => !cur.readTimes);
        if (iUnread == -1) continue;
        aReadingIndex.value = [idx01, iUnread, 0];
        break;
    }
    console.log("aIdx", aReadingIndex.value.$dc());
}

function keyDown(ev){
    // console.log("ev", ev);
    const {key} = ev;
    console.log("key", key);
    let iWordIndex = aReadingIndex.value[2] + 1;
    if (iWordIndex < oReadingLine.value.textArr.length){
        aReadingIndex.value[2] = iWordIndex;
        return;
    }
    iWordIndex=0;
    let iSentenceIdx = aReadingIndex.value[1] + 1;
    const aLines = aParagraph4Show.value[
        aReadingIndex.value[0]
    ];
    if (iWordIndex < aLines.length){
        aReadingIndex.value[1] = iSentenceIdx;
        aReadingIndex.value[2] = iWordIndex;
        return;
    }

}


onMounted(()=>{
    document.addEventListener('keydown', keyDown);
});
onBeforeUnmount(()=>{
    document.removeEventListener('keydown', keyDown);
});

</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

