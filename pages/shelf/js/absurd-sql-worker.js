/*
 * @Author: Merlin
 * @Date: 2024-01-06 16:03:35
 * @LastEditors: Merlin
 * @LastEditTime: 2024-01-06 18:16:35
 * @Description: 
 */
// import initSqlJs from '@jlongster/sql.js';
// import { SQLiteFS } from 'absurd-sql';
// import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend';

run();
async function run() {
    const aLoadList = await Promise.all([
        import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/index.min.js'),
        import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-backend.js'),
        import('./sql-wasm.min.js'),
    ]);
    const {SQLiteFS} = aLoadList[0];
    const IndexedDBBackend = aLoadList[1].default;
    const {initSqlJs} = aLoadList[2];

    let SQL = await initSqlJs({ locateFile: file => file });
    let sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
    SQL.register_for_idb(sqlFS);

    SQL.FS.mkdir('/sql');
    SQL.FS.mount(sqlFS, {}, '/sql');

    const path = '/sql/db.sqlite';
    if (typeof SharedArrayBuffer === 'undefined') {
        console.log("SharedArrayBuffer", SharedArrayBuffer);
        let stream = SQL.FS.open(path, 'a+');
        await stream.node.contents.readIfFallback();
        SQL.FS.close(stream);
    }

    let db = new SQL.Database(path, { filename: true });
    // You might want to try `PRAGMA page_size=8192;` too!
    db.exec(`
        PRAGMA journal_mode=MEMORY;
    `);

//    Your code
}






// async function init() {
//     console.log("init", );
//     console.log(globalThis);
//     const aLoadList = await Promise.all([
//         import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/index.min.js'),
//         import('https://cdn.jsdelivr.net/npm/absurd-sql@0.0.54/dist/indexeddb-backend.js'),
//         // import('https://cdn.jsdelivr.net/npm/@jlongster/sql.js@1.6.7/+esm'),
//         import('./sql-wasm.min.js'),
//     ]);
//     const {SQLiteFS} = aLoadList[0];
//     const IndexedDBBackend = aLoadList[1].default;
//     const {initSqlJs} = aLoadList[2];



//     let SQL = await initSqlJs({ locateFile: file => file });
//     let sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
//     SQL.register_for_idb(sqlFS);

//     SQL.FS.mkdir('/sql');
//     SQL.FS.mount(sqlFS, {}, '/sql');

//     let db = new SQL.Database('/sql/db.sqlite', { filename: true });
//     db.exec(`
//         PRAGMA page_size=8192;
//         PRAGMA journal_mode=MEMORY;
//     `);
//     return db;
// }

// runQueries();

// async function runQueries() {
//     let db = await init();
//     // return console.log('stop here 1');
//     try {
//         db.exec('CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT)');
//     } catch (e) {}
//     // return console.log('stop here 2');
//     db.exec('BEGIN TRANSACTION');
//     let stmt = db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)');
//     for (let i = 0; i < 5; i++) {
//       stmt.run([i, ((Math.random() * 100) | 0).toString()]);
//     }
//     stmt.free();
//     db.exec('COMMIT');
//     stmt = db.prepare(`SELECT SUM(value) FROM kv`);
//     stmt.step();
//     console.log('Result:', stmt.getAsObject());
//     stmt.free();
// }

