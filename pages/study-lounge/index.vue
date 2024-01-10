<!--
 * @Author: Merlin
 * @Date: 2023-12-30 14:21:39
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-10 22:52:26
 * @Description: 
-->
<template>
    <section >
        {{path}}<br/>
        <button @click="init">
            取得目标文件
        </button>
    </section>
</template>

<script setup lang="ts">
import {handler2List, handler2FileObj} from '@/common/js/fileSystemAPI.js';

const path = ref('');



async function init(){
    path.value = store.get('path');
    const rootID = path.value.slice(0,19);
    const aPath = path.value.slice(20).split('/');
    const oRoot = await dxDB.directory.get({
        createdAt: rootID,
    });
    if (!oRoot) return;
    let answer = await oRoot.handler.requestPermission({
        mode: 'readwrite'
    });
    if (answer != 'granted') return;
    console.log('aPath', aPath);
    let oTargetHandler = oRoot.handler;
    for await (const [idx, cur] of aPath.entries()){
        if (idx === 0) continue;
        const type = (idx === aPath.length-1) ? 'file' : 'directory';
        oTargetHandler = await handler2List(oTargetHandler, {
            findingName: cur,
            findingType: type,
        });
        if (!oTargetHandler) break;
        console.log("thisOne", oTargetHandler);
    }
}

onMounted(()=>{
    path.value = store.get('path');
});

</script>

