<!--
 * @Author: Merlin
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-13 19:32:08
 * @Description: 
-->
<template>
    <Navigation class="nav" ></Navigation>
    <main class="main-part">
        <NuxtPage />
    </main>
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
    } ],
    script: [{
        src: 'https://cdn.jsdelivr.net/npm/store2@2.14.2/dist/store2.min.js',
    },{
        // dayjs
        src: 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js',
    },{
        // Dexie
        src: 'https://unpkg.com/dexie@latest/dist/dexie.js',
    }, {
        // hashwasm.xxhash64
        src: 'https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/xxhash64.umd.min.js',
    }, {
        // initSqlJs
        src: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.js',
    }]
});

if (process.client){
    // var camera = window.FontAwesome.icon({ prefix: 'fas', iconName: 'camera' });
    // console.log("camera", camera);
    store('oRecent') || store('oRecent', {});
    import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/+esm').then(res=>{
        console.log("pdf-viewer", );
        console.log(res);
    });
}

</script>

<style lang="scss" >
*{
    box-sizing: border-box;
}
body > #__nuxt{
    &{
        line-height: 1.2;
    }
    // display: flex;
    --nav-width: 55px;
    // min-height: 100vh;
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
</style>
