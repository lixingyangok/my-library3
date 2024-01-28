<template>
    <div class="database-page" >
        <br/>
        <br/>
        <br/>
        <!-- <label class="label-btn" style="border: solid 1px #aaa" >
            导入数据库 Blob
            <input v-show="0" multiple type="file" @change="loadDbData" />
        </label> -->
        <hr/>
        <label class="label-btn" style="border: solid 1px #aaa" >
            导入 Uint8Array
            <input v-show="0" multiple type="file" @change="importUinit8Array" />
        </label>
        <button @click="exportUint8Arr">
            导出数据库: Uint8Array
        </button>
    </div>
</template>

<script setup>


async function loadDbData(ev){
    const files = [...ev.target.files];
    files.sort((aa, bb) => aa.name.localeCompare(bb.name));
    console.log('这些文件将导入到数据库\n', files);
    if (!files.length) return;
    const aPromise = files.map(curFile=>{
        let resolve = null;
        const oPromise = new Promise((f1, f2) => resolve = f1);
        const reader01 = Object.assign(new FileReader(), {
            onload: ev => resolve(ev.target.result),
        });
        reader01.readAsArrayBuffer(curFile);
        return oPromise;
    });
    const aFileArrBuffer = await Promise.all(aPromise);

    const oBlob = new Blob(aFileArrBuffer);
    const aArrayBuffer = await oBlob.arrayBuffer()
    const uint8Arr = new Uint8Array(aArrayBuffer);
    const aTables = await checkDataForDB(uint8Arr);
    if (!aTables?.length) return;
    console.log(aTables.flat());
    const sqlite = await useSqlite();
    sqlite.persist(uint8Arr);
}


async function importUinit8Array(ev){
    const files = [...ev.target.files];
    if (!files.length) return;
    files.sort((aa, bb) => aa.name.localeCompare(bb.name));
    console.log("files", files[0]);
    let resolve = null;
    const oPromise = new Promise((f1, f2) => resolve = f1);
    const reader01 = Object.assign(new FileReader(), {
        onload: ev => resolve(ev.target.result),
    });
    reader01.readAsArrayBuffer(files[0]);
    const res = await oPromise;
    console.log("res", res);
    const uint8arr = new Uint8Array(res);
    const sqlite = await useSqlite();
    sqlite.persist(uint8arr);
}

async function exportUint8Arr(){
    const sqlite = await useSqlite();
    sqlite.toExport();
}

</script>

<style scoped lang="scss">
.label-btn{
    padding: 3px 8px;
    cursor: pointer;
}
.database-page{
    padding: 20px;
}

</style>

