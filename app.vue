<!--
 * @Author: Merlin
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-08 21:09:15
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
    }, {
        rel: 'stylesheet',
        type: 'text/css',
        href: '//unpkg.com/element-plus/dist/index.css',
    } ],
    script: [{
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
    },{
        // {SQLiteFS}
        type: 'module',
        src: 'https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/index.min.js',
    }, {
        // default: IndexedDBBackend
        type: 'module',
        src: 'https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-backend.js',
    }, {
        // { initBackend }
        type: 'module',
        src: 'https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-main-thread.js',
    }]
});

if (process.client){
    // var camera = window.FontAwesome.icon({ prefix: 'fas', iconName: 'camera' });
    // console.log("camera", camera);
    
}

</script>

<style lang="scss" >
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
