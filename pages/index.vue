<!--
 * @Author: 
 * @Date: 2024-01-07 18:47:20
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-07 22:20:18
 * @Description: 
-->
<template>
    <section style="padding: 5vh">
        <h1>
            index.vue 
            <i class="fa fa-solid fa-house"></i>
        </h1>
        <br/>
        <div>
            <input type="file" @change="loadDbData" />
            <br/>
            <!-- <button @click="()=>insertMany(1)">
                插入数据
            </button>
            <button @click="()=>insertMany(0)">
                插入数据（批量）
            </button> -->
            <button @click="exportSqlite">
                保存到 indexedDB
            </button>
            &nbsp;
            <button @click="getCount">
                统计 getCount
            </button>
        </div>
        <br/>
        <br/>
        <div>
            体 积: {{iMB}} MB
            <hr>
        </div>
        <ul>
            <li  v-for="(cur,idx) of aTables" :key="idx">
                {{ idx+1 }}: {{ cur }}
            </li>
        </ul>
    </section>
</template>

<script setup lang="js">

let sqlite = await useSqlite;
let aTables = ref([]);
const iMB = ref(0);

onMounted(async ()=>{
    // console.log("onMounted", );
    console.log("sqlite", sqlite);
    getCount();
});

function createTables(){
    const aResult = sqlite.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const aTable = aResult?.[0]?.values?.[0] || [];
    console.log("aTable", aTable);
    if (aTable.includes('test')) return;
    sqlite.run("CREATE TABLE test (id INTEGER, time TEXT);");
}


async function getCount(){
    iMB.value = (sqlite.export().length / 1024 / 1024).toFixed(2);
    // 
    const aResult = sqlite.exec("SELECT name from sqlite_master where type='table'");
    const aTableResult = (aResult?.[0]?.values || []).map(cur=>{
        return cur[0];
    });
    aTables.value = aTableResult;
    const [lines] = sqlite.exec('select * from line limit 50');
    console.log("lines", lines);
}

async function insertMany(times){
    times ||= prompt() * 1;
    for (let cur of Array(times).keys()){
        console.log(`进程：${cur+1}/${times}`);
        await toInsertLots();
        await getCount();
    }
    await exportSqlite();
}

async function interOneBatch(){
    await toInsertLots();
    await getCount();
    await exportSqlite();
}

async function exportSqlite(){
    console.time('执行 sqlite.export()');
    const export01 = sqlite.export(); // Uint8Array
    console.timeEnd('执行 sqlite.export()');
    iMB.value = (export01.length/1024/1024).toFixed(2);
    console.time('执行 new Blob');
    const myBlob = new Blob([export01]);
    console.timeEnd('执行 new Blob');
    await saveData2DxDB(myBlob);
}

async function toInsertLots(){
    console.time('插入数据');
    const iTimes = 1_000;
    const sTime = new Date().toLocaleString();
    for (let idx = 0; idx < iTimes; idx += 2){
        sqlite.run("INSERT INTO test VALUES (?,?), (?,?)", [
            idx, sTime,
            idx+1, sTime
        ]);
    }
    console.timeEnd('插入数据');
}


// 👇保存数据
async function saveData2DxDB(data=''){
    await dxDB.sqlite.where('id').above(-1).delete();
    console.time('保存数据到 dxDB');
    // const {byteLength} = data;
    // const iBatch = 200_000;
    // const iPieces = Math.ceil(byteLength/iBatch);
    // console.log('byteLength', byteLength);
    // console.log('iPieces', iPieces);
    dxDB.sqlite.add({
        time: new Date().toLocaleString(),
        data,
    });
    console.timeEnd('保存数据到 dxDB');
}


async function loadDbData(ev){
    const {target} = ev;
    const [file] = target.files;
    if (!file) return;
    // console.log("file", file);
    // return;
    let resolve = null;
    const oPromise = new Promise((f1, f2) => resolve = f1);
    const reader01 = Object.assign(new FileReader(), {
        onload: ev => resolve(ev.target.result),
    });
    reader01.readAsArrayBuffer(file);
    const aFileArrBuffer = await oPromise;
    // const aUint8Arr = new Uint8Array();
    const oBlob = new Blob([aFileArrBuffer]);
    saveData2DxDB(oBlob);
}

// The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
// We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
async function startSQL(){
    const SQL = await initSqlJs(config);
    //Create the database
    const db = new SQL.Database();
    console.log("打印 db", db); 

    // Run a query without reading the results
    db.run("CREATE TABLE test (col1, col2);");
    // Insert two rows: (1,111) and (2,222)
    for(let cur of Array(50).keys()){
        console.log(`cur ${cur}`, );
        toInsertLots(db);
    }
    const count = db.exec("SELECT count(*) FROM test");
    console.log("count:", count[0].values[0].toLocaleString());
    const aData = db.exec("SELECT * FROM test limit 10");
    console.log("aData", aData);
    // Prepare a statement
    // const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
    // stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}
    // Bind new values
    // stmt.bind({$start:1, $end:2});
    // while(stmt.step()) { //
    //     const row = stmt.getAsObject();
    //     console.log('Here is a row: ' + JSON.stringify(row));
    // }

    // console.time('new Blob(export01)');
    // const export02 = new Blob(export01); // Uint8Array
    // console.timeEnd('new Blob(export01)');
}
</script>
