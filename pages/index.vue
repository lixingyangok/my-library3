<template>
    <section style="padding: 5vh">
        <h1>
            index.vue 
            <i class="fa fa-solid fa-house"></i>
        </h1>
        <br/>
        <div>
            <button @click="()=>insertMany(1)">
                插入数据
            </button>
            <button @click="()=>insertMany(0)">
                插入数据（批量）
            </button>
            &nbsp;
            <button @click="exportSqlite">
                保存到 indexedDB
            </button>
            &nbsp;
            <button @click="getCount">
                统计 getCount
            </button>
        </div>
        <div>
            <br/>count: {{count}}
            <br/>体 积: {{iMB}} MB
        </div>
    </section>
</template>

<script setup lang="js">
const config = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
}

let sqlite;
let dxDB;
const count = ref(0);
const iMB = ref(0);

if (import.meta.client){
}
onMounted(async ()=>{
    // 新建一个名为 xx 的库，如果已经存在，就会连接上 作者：西芹术士 https://www.bilibili.com/read/cv15712691/ 出处：bilibili
    dxDB = new Dexie("dxDB");
    dxDB.version(1).stores({
        dbData: "++id", // 表名与索引列
    });
    console.log("onMounted", );
    // console.log(dxDB);
    // console.log(dxDB.dbData);
    sqlite = await startupSqlite();
    createTables();
    getCount();
});

function createTables(){
    const aResult = sqlite.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const aTable = aResult?.[0]?.values?.[0] || [];
    console.log("aTable", aTable);
    if (aTable.includes('test')) return;
    sqlite.run("CREATE TABLE test (id INTEGER, time TEXT);");
}


async function startupSqlite(){
    const [SQL, oFirst] = await Promise.all([
        initSqlJs(config),
        dxDB.dbData.where('id').above(-1).first(),
    ]);
    let data = oFirst?.data;
    if (data?.arrayBuffer) {
        data = await data.arrayBuffer();
    }
    const Uint8Arr = data ? new Uint8Array(data) : void 0;
    const sqlite = new SQL.Database(Uint8Arr);
    return sqlite;
}

async function getCount(){
    const oCount = sqlite.exec("SELECT count(*) FROM test");
    const aData = sqlite.exec("SELECT * FROM test limit 20");
    count.value = oCount[0].values[0].toLocaleString();
    iMB.value = (sqlite.export().length / 1024 / 1024).toFixed(2);
    console.log("count:", count.value );
    console.log("aData", aData);
    console.log("sqlite\n", sqlite);
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
    await dxDB.dbData.where('id').above(-1).delete();
    // const aCollection = await dxDB.dbData.toArray();
    // await aCollection.delete();
    console.time('保存数据到 dxDB');
    // const {byteLength} = data;
    // const iBatch = 200_000;
    // const iPieces = Math.ceil(byteLength/iBatch);
    // console.log('byteLength', byteLength);
    // console.log('iPieces', iPieces);
    dxDB.dbData.add({
        time: new Date().toLocaleString(),
        data,
    });
    console.timeEnd('保存数据到 dxDB');
}



// ↓ 停用 

async function gotFile(ev){
    const {target} = ev;
    const [file] = target.files;
    let resolve = null;
    const oPromise = new Promise((f1, f2) => resolve = f1);
    const reader01 = Object.assign(new FileReader(), {
        onload(ev) {
            console.log("ev.result", ev.target.result);
            const aUint8Arr = new Uint8Array(ev.target.result);
            var db = new SQL.Database(aUint8Arr);
            resolve({
                db,
                aUint8Arr,
            });
        },
    });
    reader01.readAsArrayBuffer(file);
    const {db, aUint8Arr} = await oPromise;
    // const aData = db.exec("SELECT * FROM media limit 10");
    const aData = db.exec("SELECT * FROM employees limit 10");
    console.log("aData", aData);
    
    dxDB.version(1).stores({
        dbData: "++id, time, data"
    });
    console.time("myBlob", );
    var myBlob = new Blob(aUint8Arr);
    console.timeEnd("myBlob", );
    console.log("保存01", new Date()*1);
    console.time('保存到 indexedDB');

    console.timeEnd('保存到 indexedDB');
    console.log("保存02", new Date()*1);
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
