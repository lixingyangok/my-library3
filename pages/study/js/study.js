/*
 * @Author: Merlin
 * @Date: 2024-02-04 18:34:13
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-07 20:21:08
 * @Description: 
 */
const sqlite = await useSqlite();

export const useFn = () => {
    const oInstance = getCurrentInstance();
    const oIns = getCurrentInstance();

    const oFn = {
        // ↓ 显示窗口
        showAddingDialog(){
            const {addingForm, addingFormEmpty} = oIns.setupState;
            oInstance.setupState.dialogVisible = true;
            Object.assign(addingForm, {
                ...addingFormEmpty,
            });
        },
        // ↓点击保存
        async clickSave(){
            const {addingForm, addingFormEmpty} = oIns.setupState;
            const articleId = await oFn.saveArticle(addingForm);
            const inserting = !addingForm.id && articleId > 0;
            console.log("正在", inserting ? '新增': '修改');
            if (!inserting) return;
            if (!addingForm?.article?.split) return;
            // oIns.setupState.dialogVisible = false;
            const aLines = [];
            const aSectionArr = addingForm.article.trim().split('\n');
            aSectionArr.forEach((oSection, idx01) => {
                const sTrimed = (oSection || '').trim();
                const arr = sTrimed.split(/(?<=[.!?])\s/);
                arr.forEach((sLine, idx02)=>{
                    const oRow = {
                        articleId,
                        text: sLine.trim(),
                        articleRowNo: aLines.length + 1,
                    };
                    if (idx02) oRow.follow = 1; // 1 = 与前一句同在一段内
                    aLines.push(oRow);
                });
            });
            console.log("aLines", aLines);
            sqlite.tb.line.insert(aLines);
        },
        // ↓ 存入数据库
        async saveArticle(oForm){
            console.log("oForm", );
            console.log(oForm.$dc());
            // const sqlite = await useSqlite();
            const id = sqlite.tb.article.saveOne(oForm);
            oFn.getArticleList();
            return id;
        },
        async editeArtile(oForm){
            console.log("oForm", oForm);
            oIns.setupState.dialogVisible = true;
            const {addingForm} = oIns.setupState;
            Object.keys(addingForm).forEach(key=>{
                addingForm[key] = oForm[key];
            });
        },
        async delArtile(oArticle){
            console.log("oArticle", );
            console.log(oArticle.$dc());
            const confirm = await ElMessageBox.confirm(
                '确认删除?',
                '请确认',
                {
                    confirmButtonText: '确认删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                }
            ).catch(xx=>xx);
            console.log("answer:", confirm);
            if (confirm != 'confirm') return;
            sqlite.tb.article.deleteById(oArticle.id);
            oFn.getArticleList();
        },
        async getArticleList(){
            // const sqlite = await useSqlite();
            const arr = sqlite.select(`
                select *
                from article
            `);
            oIns.setupState.aArtile.splice(0, 1/0, ...arr);
        },
        async read(oArticle){
            const oResult = sqlite.tb.line.getPage({
                articleId: oArticle.id,
            }, {
                column: 'id, articleId, articleRowNo, follow, readTimes, text',
                tail: 'order by articleRowNo',
            });
            const aSection = [];
            oResult.rows.forEach(oCur => {
                if (!oCur.follow) aSection.push([]);
                aSection.at(-1).push(oCur)
            }, []);
            console.log("aSection", aSection.$dc());
            oIns.setupState.aSection.splice(0, 1/0, ...aSection);
        },
    };
    return oFn;
}

