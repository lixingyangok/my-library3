/*
 * @Author: Merlin
 * @Date: 2024-02-04 18:34:13
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-14 15:46:50
 * @Description: 
 */
const sqlite = await useSqlite();

export const useFn = () => {
    const oIns = getCurrentInstance();

    const oSentenceFn = {
        // ↓显示窗口
        showSentenceDialog(){
            const {
                oSentenceForm,
                oVisibleControl,
                oSentenceFormEmpty,
                oSentenceFormRef,
                oTrans,
            } = oIns.setupState;
            Object.assign(oSentenceForm, oSentenceFormEmpty.$dc());
            oVisibleControl.sentenceDialog = true;
        },
        // ↓添加更多译文
        addMoreTrans(){
            const {oSentenceForm, oTrans} = oIns.setupState;
            if (oSentenceForm.aTrans.length >= 3){
                return console.log('3 is enough');
            }
            oSentenceForm.aTrans.push({...oTrans});
        },
        // ↓删除译文
        delOneTrans(idx){
            const {oSentenceForm, oSentenceFormEmpty} = oIns.setupState;
            if (oSentenceForm.aTrans.length <= 1){
                return console.log('at last one');
            }
            oSentenceForm.aTrans.splice(idx, 1);
        },
        // ↓保存句子
        async saveSentence(isContinue){
            const {
                oSentenceForm,
                oVisibleControl,
                oSentenceFormEmpty,
                oSentenceFormRef,
            } = oIns.setupState;
            const isOK = await oSentenceFormRef.validate().catch(err=>{

            });
            console.log("isOK", isOK);
            if (!isOK) return;
            const trans = oSentenceForm.aTrans.map(cur => {
                return cur.tranText.trim();
            }).filter(Boolean).join('||');
            const oForm = {
                ...oSentenceForm,
                aTrans: undefined, // 删除
                trans,
            };
            console.log("oForm", oForm.$dc());
            if (!oForm.text) return;
            // return;
            const res = sqlite.tb.line.saveOne(oForm);
            if (!res) return;
            ElMessage.success('已经保存');
            Object.assign(oSentenceForm, oSentenceFormEmpty.$dc());
            oFn.getSentence();
            oVisibleControl.sentenceDialog = !!isContinue;
        },
        // ↓查询句子
        getSentence(){
            const {oLine} = oIns.setupState;
            const oResult = sqlite.tb.line.getPage({
                mediaId: null,
                articleRowNo: null,
            },{
                pageIndex: 1,
                pageSize: 100,
            });
            oResult.rows.forEach(cur=>{
                cur.aTrans = cur.trans.split('||');
            });
            console.log("oResult\n", oResult.$dc());
            oLine.rows = oResult.rows;
        },
        delSentence(oTarget, idx){
            const {oLine} = oIns.setupState;
            console.log("oTarget", oTarget.$dc());
            const res = sqlite.tb.line.deleteById(oTarget);
            if (!res) return;
            oLine.rows.splice(idx, 1);
        },
    };

    const oFn = {
        ...oSentenceFn,
        // ↓ 显示窗口
        showAddingDialog(){
            const {oArticleForm, oArticleFormEmpty} = oIns.setupState;
            oIns.setupState.oVisibleControl.articleDialog = true;
            Object.assign(oArticleForm, {
                ...oArticleFormEmpty,
            });
        },
        // ↓点击保存
        async clickSave(){
            const {oArticleForm, oArticleFormEmpty} = oIns.setupState;
            const isAppending = !!oArticleForm.appending;
            let mediaId = oArticleForm.id;
            let iRowNoFrom = 0;
            if (!oArticleForm.titleZh){
                return console.log('no titleZh');
            }
            if (isAppending){
                const [res] = sqlite.select(`
                    select max(articleRowNo) as maxRowNo
                    from line
                    where mediaId = ${mediaId}
                `);
                iRowNoFrom = res.maxRowNo;
                console.log("iRowNoFrom:", iRowNoFrom);
                if (!iRowNoFrom) return alert('没有行号');
            }else{
                mediaId = await oFn.saveArticle(oArticleForm);
            }
            const inserting = !oArticleForm.id && mediaId > 0;
            console.log("正在", inserting ? '新增': '修改');
            if (!isAppending && !inserting){
                return;
            }
            if (!oArticleForm?.article?.split) return;
            // oIns.setupState.oVisibleControl.articleDialog = false;
            const aLines = [];
            const aSectionArr = oArticleForm.article.trim().split('\n');
            aSectionArr.forEach((oSection, idx01) => {
                const sTrimed = (oSection || '').trim();
                const arr = sTrimed.split(/(?<=[.!?])\s/);
                arr.forEach((sLine, idx02)=>{
                    const oRow = {
                        mediaId,
                        text: sLine.trim(),
                        articleRowNo: (iRowNoFrom + 1) + aLines.length,
                    };
                    if (idx02) oRow.follow = 1; // 1 = 与前一句同在一段内
                    aLines.push(oRow);
                });
            });
            console.log("aLines", aLines);
            sqlite.tb.line.insert(aLines);
            oIns.setupState.dialogVisible = false;
        },
        // ↓ 存入数据库
        async saveArticle(oForm){
            console.log("oForm", );
            console.log(oForm.$dc());
            // const sqlite = await useSqlite();
            const id = sqlite.tb.media.saveOne(oForm);
            oFn.getArticleList();
            return id;
        },
        async editeArtile(oForm){
            console.log("oForm", oForm);
            oIns.setupState.dialogVisible = true;
            const {oArticleForm} = oIns.setupState;
            Object.keys(oArticleForm).forEach(key=>{
                oArticleForm[key] = oForm[key];
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
            sqlite.tb.media.deleteById(oArticle.id);
            oFn.getArticleList();
        },
        async getArticleList(){
            // const sqlite = await useSqlite();
            const arr = sqlite.select(`
                select *
                from media
                where hash is null
            `);
            oIns.setupState.aArtile.splice(0, 1/0, ...arr);
        },
        async read(oArticle){
            console.log("oArticle", oArticle.$dc());
            store('article', oArticle);
            const oRouter = useRouter();
            console.log("oRouter", oRouter);
            oRouter.push('/reading');
        },
        addMore(oForm){
            oFn.editeArtile(oForm);
            oIns.setupState.oArticleForm.appending = true;
        },
    };
    return oFn;
}

