<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-08 19:35:12
 * @Description: 
-->
<template>
    <div class="page-body">
        <section class='at-left' >
            <div>
                
            </div>
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
            </div>
            <div class="article " >
                <!-- <p v-for="cur of 222" :key="cur"> {{ cur }} </p> -->
                <article class="sentence-box">
                    <div v-for="(aRows, idx) of aSection" :key="idx"
                        class="paragraph"
                    >
                        <span v-for="(oLine, idx) of aRows" :key="oLine.id"
                            class="sentence"
                        >
                            {{ oLine.text }}
                        </span>
                    </div>
                </article>
                <!-- 分界 -->
                <div class="page-box">
                    <el-pagination
                        v-for="(sCurLayout, idx) of pager" :key="idx"
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

const aSection = ref([]);
const oArticleInfo = ref(
    import.meta.client ? store('article') : {}
);
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
    console.log("oResult\n", oResult.$dc());
    aSection.value = arr;
}

function handleSizeChange(pageSize){
    console.log("pageSize", pageSize);
    oArticleInfo.value.pageSize = pageSize;
    showPage();

}

function handleCurrentChange(pageIndex){
    console.log("pageIndex", pageIndex);
    oArticleInfo.value.pageIndex = pageIndex;
    showPage();
}



</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

