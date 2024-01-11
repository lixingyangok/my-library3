<!--
 * @Author: Merlin
 * @Date: 2023-12-30 14:21:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-11 21:54:44
 * @Description: 
-->
<template>
    <section style="padding: 3vw" >
        {{path}}<br/>
        <Wave ref="oMyWave"
            :media-path="sMediaSrc"
            :oMediaFile="oMediaFile"
            v-if="oMediaFile"
        />
            <!-- :a-line-arr="aLineArr"
            :i-cur-line-idx="iCurLineIdx"
            :mediaDuration="oMediaInfo.duration"
            :oMediaInfo="oMediaInfo"
            
            @pipe="bufferReceiver"
            @setTimeTube="setTime" -->
        <button @click="init">
            取得目标文件
        </button>
    </section>
</template>

<script setup lang="ts">
import {path2file} from '@/common/js/fileSystemAPI.js';

const path = ref('');
const sMediaSrc = ref('');
const oMediaFile = ref(null);


async function init(){
    path.value = store.get('path');
    const oFile = await path2file(path.value);
    console.log("oFile", oFile);
    oMediaFile.value = oFile;
    // sMediaSrc.value = objectURL;
    // var objectURL = URL.createObjectURL(oFile);
    // console.log("objectURL", objectURL);

}

onMounted(()=>{
    path.value = store.get('path');
});

</script>

