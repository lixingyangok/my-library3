<template>
    <h1>
        index.vue 
        <i class="fa fa-solid fa-house"></i>
    </h1>
    <div>
        <input type="file" @change="gotFile" />
    </div>
    <ul>
        <li v-for="cur,idx of 11" :key="cur">
            row: {{ cur }}
        </li>
    </ul>
</template>

<script setup lang="js">



// db.friends.add({name: "Josephine", age: 21}).then(function() {
//     return db.friends.where("age").below(25).toArray();
// }).then(function (youngFriends) {
//     alert ("My young friends: " + JSON.stringify(youngFriends));
// }).catch(function (e) {
//     alert ("Error: " + (e.stack || e));
// });

async function gotFile(ev){
    const SQL = await initSqlJs(config);

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
    const aData = db.exec("SELECT * FROM media limit 10");
    console.log("aData", aData);
    
    var dxDB = new Dexie("dxDB");
    dxDB.version(1).stores({
        dbData: "++id, time, data"
    });
    console.time("myBlob", );
    var myBlob = new Blob(aUint8Arr);
    console.timeEnd("myBlob", );
    console.log("保存01", new Date()*1);
    console.time('保存到 indexedDB');

    // await dxDB.dbData.add({
    //     time: new Date().toLocaleString(),
    //     data: myBlob,
    // });
    console.timeEnd('保存到 indexedDB');
    console.log("保存02", new Date()*1);
}

var config = {
//   locateFile: filename => `/dist/${filename}`
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/sql-wasm.wasm`,
}



// The `initSqlJs` function is globally provided by all of the main dist files if loaded in the browser.
// We must specify this locateFile function if we are loading a wasm file from anywhere other than the current html page's folder.
async function useSQL(){
    const SQL = await initSqlJs(config);
    //Create the database
    const db = new SQL.Database();
    // Run a query without reading the results
    db.run("CREATE TABLE test (col1, col2);");
    // Insert two rows: (1,111) and (2,222)
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
    console.log("export01", export01);
}
if (import.meta.client){
    useSQL();
}

</script>