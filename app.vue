<!--
 * @Author: Merlin
 * @Date: 2023-12-30 10:38:50
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-06 18:49:47
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
    title: 'haha',
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
        // hashwasm.xxhash64
        src: 'https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/xxhash64.umd.min.js',
    }, {
        // {initSqlJs}
        // type: 'module',
        // src: 'https://cdn.jsdelivr.net/npm/@jlongster/sql.js@1.6.7/+esm',
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
    var config = {
    //   locateFile: filename => `/dist/${filename}`
        locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
    }
    // The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
    // We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
    initSqlJs(config).then(function(SQL){
      //Create the database
        const db = new SQL.Database();
        // Run a query without reading the results
        db.run("CREATE TABLE test (col1, col2);");
        // Insert two rows: (1,111) and (2,222)
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);
        db.run("INSERT INTO test VALUES (?,?), (?,?)", [1,111,2,222]);

        // Prepare a statement
        const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
        stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

        // Bind new values
        stmt.bind({$start:1, $end:2});
        while(stmt.step()) { //
            const row = stmt.getAsObject();
            console.log('Here is a row: ' + JSON.stringify(row));
        }
        console.log("db", db); 
        const export01 = db.export(); // Uint8Array
        const export02 = new Blob(export01); // Uint8Array
        // 
        console.log("export01", export01);
        console.log("export02", export02);

    });
}

</script>

<style lang="scss" >
body > #__nuxt{
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
