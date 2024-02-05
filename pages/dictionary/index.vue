<!--
 * @Author: 李星阳
 * @Date: 2022-01-23 18:49:41
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-05 21:57:46
 * @Description: 
-->
<template>
    <article class="outer-dom">
        <div class="search-bar">
            <input v-model="sKey" @input="toSearch"/>
            <button @click="toSearch">
                搜索
            </button>
            <!-- <button Aclick="toSearch"> 全字匹配 </button> -->
            <span>
                结果{{iResult}}条
            </span>
        </div>
        <!--  -->
        <ul class="result-list">
            <li class="one-dir" v-for="(cur,idx) of aResult" :key="idx">
                <h3 class="dir-name" >
                    {{cur.dir.split('/').slice(2).join(' > ')}}
                </h3>
                <ul class="one-file" >
                    <li class="one-sentence" v-for="(item, i02) of cur.aList" :key="i02"
                        AAAclick="clickSentense(item)"
                    >
                        <h4 class="file-name" v-if="(i02 === 0) || item.name != cur.aList[i02-1].name">
                            {{item.name}}
                        </h4>
                        <p title="secToStr(item.start)">
                            <time class="start">{{secToStr(item.start)}}</time>
                            <span v-for="(sWord, i02) of splitSentence(item.text, sKey || word)"
                                class="one-word"
                                :class="{'matched': sWord.word}"
                                :key="`${idx}-${i02}`"
                            >
                                {{sWord.word || sWord}}
                            </span>
                        </p>
                    </li>
                </ul>
            </li>
        </ul>
    </article>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted, onBeforeUnmount } from 'vue';
import { splitSentence, groupThem, clickSentense } from './js/dictionary.js';
import {secToStr} from '@/common/js/pure-fn.js';

const props = defineProps({
    dialogVisible: Boolean,
    word: { type: String, default: '', },
});
const emit = defineEmits(['update:dialogVisible']);
const isShowSelf = computed({
    get: () => {
        return props.dialogVisible;
    },
    set: val => {
        emit('update:dialogVisible', val);
    },
});

let iSearchingQ = 0;
const sKey = ref(''); // 可填入测试用的搜索关键字
const iResult = ref(0); // 搜索结果数量
const aResult = ref({});
const sqlite = await useSqlite();

toSearch();
async function toSearch(){
    const sAim = sKey.value.replaceAll("'", "''");
    if (sAim.length < 2) return (aResult.value = {}); // 返回对象不返回数组？
    (async idx => {
        const sWhere = `WHERE text like '%${sAim}%' and text like '% %'`; // 至少包含1个空格  
        console.time('搜索单词');
        const aRes = sqlite.select(`
			SELECT
                line.text, media.id, media.dir, media.name,
                line.start, line.end, 
                (media.dir || '/' || media.name) as path
            FROM line left join media
            ON line.mediaId = media.id ${sWhere}
            ORDER BY media.dir, media.name, line.start
            limit 50
		`);
        console.timeEnd('搜索单词');
        const aCount = sqlite.select(`
			SELECT count(*) as iCount FROM line ${sWhere}
		`);
        if (idx != iSearchingQ) return;
        iResult.value = aCount[0]?.iCount;
        const aArr = groupThem(aRes);
        aResult.value = aArr;
    })(++iSearchingQ);
}

watch(
    isShowSelf,
    (newVal, oldVal) => {
        if (!newVal) return fnInvoke('BrowserView', 'hide');
        if (props.word.trim()) sKey.v = props.word.trim();
        toSearch();
    },
);
</script>

<style scoped lang="scss" src="./style/dictionary.scss" ></style>

