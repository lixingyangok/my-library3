<!--
 * @Author: 
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2025-02-09 15:50:21
 * @Description: 
-->
<template>
    <Navigation class="nav" ></Navigation>
    <main class="main-part">
        <NuxtPage v-if="showing"/>
    </main>
    <button class="f5-btn" @click="f5">
        刷新
    </button>
</template>

<script setup>

useHead({
    title: '😄 哈哈学习',
    link: [{
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/reset-css@5.0.2/reset.min.css',
    }, {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.2/css/all.min.css',
        // href: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/fontawesome.min.css',
    }, {
        rel: 'stylesheet',
        type: 'text/css',
        href: '//unpkg.com/element-plus/dist/index.css',
    }],
    // ------------------------------------------------------------
    script: [{ // echarts
        src: 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js',
    },{ // store
        src: 'https://cdn.jsdelivr.net/npm/store2@2.14.2/dist/store2.min.js',
    },{ // dayjs
        src: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js',
    }, { // hashwasm.xxhash64
        src: 'https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/xxhash64.umd.min.js',
    }, { // initSqlJs
        src: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.js',
    },
    // {
    //     type: 'module',
    //     src: 'https://cdn.bootcdn.net/ajax/libs/ffmpeg/0.12.6/esm/classes.js',
    // },{
    //     type: 'module',
    //     src:'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.10/esm/index.js',
    // }
    ],
});

const showing = ref(true);
const oIns = getCurrentInstance();

function f5(){
    showing.value = false;
    oIns.proxy.$nextTick(()=>{
        setTimeout(()=>{
            showing.value = true;
        }, 100);
    });
}

if (process.client){
    // var camera = window.FontAwesome.icon({ prefix: 'fas', iconName: 'camera' });
    // console.log("camera", camera);
    store('oRecent') || store('oRecent', {});
    // import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm').then(res=>{
    //     console.log("pdf-viewer", );
    //     console.log(res);
    // });
    // https://cdnjs.com/libraries/ffmpeg
    // import('https://cdn.bootcdn.net/ajax/libs/ffmpeg/0.12.6/esm/classes.js').then(res=>{
    //     console.log(res.FFmpeg);
    // });
}

</script>

<style lang="scss" >
*{
    box-sizing: border-box;
}
body > #__nuxt{
    line-height: 1.2;
    --nav-width: 55px;
    position: relative;
    .nav{
        width: var(--nav-width);
        flex: 0 0 auto;
        position: absolute;
        inset: 0 auto 0 0;
    }
    .main-part{
        margin-left: var(--nav-width);
        height: 100vh;
        overflow-y: auto;
    }
}
.f5-btn{
    position: absolute;
    left: 5px;
    bottom: 200px;
}

</style>
