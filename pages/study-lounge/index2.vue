<!--
 * @Author: Merlin
 * @Date: 2023-12-30 14:21:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-13 14:35:01
 * @Description: 
-->
<template>
    <section style="padding: 3vw" >
        {{
            oMediaInfo.pathFull
        }}
        <br/>
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

const sMediaSrc = ref('');
const oMediaInfo = ref({});
const oMediaFile = ref(null);


async function init(){
    // 应该把文件在 indexedDB 中的 id 记录下来，
    // 然后在这直接通过 id 取 indexedDB 的那条记录 
    const mediaInLocal = window.store('media');
    if (!mediaInLocal) return;
    oMediaInfo.value = mediaInLocal;
    const [oFileObj, oFileInfo] = await Promise.all([
        path2file(mediaInLocal.pathFull),
        dxDB.file.get(mediaInLocal.dxID),
    ]);
    
    console.log("oFileObj", oFileObj);
    console.log("oFileInfo", oFileInfo);
    oMediaFile.value = oFileObj;
}

onMounted(()=>{
    // path.value = store.get('path');
});

</script>

