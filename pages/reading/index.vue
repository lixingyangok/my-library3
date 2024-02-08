<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-08 11:13:06
 * @Description: 
-->
<template>
    <div class="page-body">
        <!-- <div class="full-wide"></div> -->
        <div class="title " >
            title
        </div>
        <article class="article " >
            <section v-for="(aRows, idx) of aSection" :key="idx">
                <span class="sentence" v-for="(oLine, idx) of aRows" :key="oLine.id" >
                    <!-- {{ idx ? '&nbsp;': '' }} -->
                    {{ oLine.text }}
                </span>
            </section>
        </article>
    </div>
</template>

<script setup>

const aSection = ref([]);

onMounted(()=>{
    init();
});

async function init(){
    const sqlite = await useSqlite();
    const oArticle = store('article');
    const oResult = sqlite.tb.line.getPage({
        articleId: oArticle.id,
    }, {
        column: 'id, articleId, articleRowNo, follow, readTimes, text',
        tail: 'order by articleRowNo',
        pageSize: 30,
        pageIndex: 1,
    });
    const arr = [];
    oResult.rows.forEach(oCur => {
        if (!oCur.follow) arr.push([]);
        arr.at(-1).push(oCur)
    }, []);
    console.log("arr", arr.$dc());
    aSection.value = arr;
}

</script>

<style scoped lang="scss" src="./style/reading.scss"></style>

