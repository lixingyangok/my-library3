<!--
 * @Author: Merlin
 * @Date: 2024-02-07 21:12:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-08 15:28:48
 * @Description: 
-->
<template>
    <div class="page-body">
        <section class='at-left' >
            <div>
                123
            </div>
        </section>
        <!-- ↑左栏，↓中部 -->
        <section class="at-center" >
            <div class="title " >
                title
            </div>
            <article class="article " >
                <p v-for="cur of 222" :key="cur">
                    {{ cur }}
                </p>
                <section v-for="(aRows, idx) of aSection" :key="idx">
                    <span class="sentence" v-for="(oLine, idx) of aRows" :key="oLine.id" >
                        <!-- {{ idx ? '&nbsp;': '' }} -->
                        {{ oLine.text }}
                    </span>
                </section>
            </article>
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

