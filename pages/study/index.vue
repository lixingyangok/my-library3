<!--
 * @Author: Merlin
 * @Date: 2024-02-04 15:59:59
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-14 16:00:55
 * @Description: 
-->
<template>
    <div class="top-box" >
        <el-button type="primary"
            @click="oFn.showAddingDialog"
        >
            添加短文/文章/书籍
        </el-button>
        <el-button type="primary" @click="oFn.showSentenceDialog">
            添加句子
        </el-button>
        <ul class="article-list" >
            <li v-for="(cur, idx) of aArtile" :key="cur.id" >
                中文标题：{{ cur.titleZh }}
                <br/>
                英文标题：{{ cur.titleEn }}
                <br/>
                <el-button link type="primary"
                    @click="oFn.read(cur)"
                >
                    阅读
                </el-button>
                <el-button link type="primary"
                    @click="oFn.editeArtile(cur)"
                >
                    修改
                </el-button>
                <el-button link type="primary"
                    @click="oFn.addMore(cur)"
                >
                    追加文本
                </el-button>
                <el-button link type="primary"
                    @click=oFn.delArtile(cur)
                >
                    删除
                </el-button>
            </li>
        </ul>
        <hr/>
        <!-- ↓句子 -->
        <ul class="sentence-list" >
            <li class="sentence"
                v-for="(oCur, idx) of oLine.rows" :key="oCur.id"
            >
                <p class="text">
                    {{ oCur.text }}
                </p>
                <div class="trans">
                    <p class=""
                        v-for="(sTran, i02) of oCur.aTrans" :key="`${idx}-${i02}`"
                    >
                        {{ sTran }}
                    </p>
                </div>
                <div class="buttons">
                    <el-button link @click="oFn.delSentence(oCur, idx)">
                        删除
                    </el-button>
                </div>
            </li>
        </ul>
    </div>
    <!-- 
        ↓弹出窗口
    -->
    <el-dialog
        title="添加句子"
        width="900px"
        top="10vh"
        v-model="oVisibleControl.sentenceDialog"
    >
        <el-form label-width="80px"
            :model="oSentenceForm"
            :rules="oSentenceRules"
            ref="oSentenceFormRef"
        >
            <el-form-item label="">
                正在添加第 x 句
            </el-form-item>
            <el-form-item label="语言">
                <el-radio-group v-model="oSentenceForm.lang">
                    <el-radio :label="cur.value"
                        v-for="(cur, key) of aLangOption.slice(1)" :key="key"
                    >
                        {{ cur.label }}
                    </el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="句子" prop="text">
                <el-input v-model="oSentenceForm.text" type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    maxlangth="800"
                />
            </el-form-item>
            <el-form-item
                v-for="(cur, idx) of oSentenceForm.aTrans"
                :key="idx"
                :label="'译文' + (idx + 1)"
            >
                <el-input v-model="cur.tranText" type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    maxlangth="500"
                />
                <el-button link v-if="oSentenceForm.aTrans.length > 1"
                    @click="oFn.delOneTrans(idx)"
                >
                    删除
                </el-button>
            </el-form-item>
            <el-form-item>
                <el-button @click="oFn.addMoreTrans">
                    添加译文
                </el-button>
            </el-form-item>
        </el-form>
        <!--  -->
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="oVisibleControl.sentenceDialog = false" >
                    取消
                </el-button>
                <el-button @click="oFn.saveSentence(true)">
                    保存并继续添加
                </el-button>
                <el-button type="primary" @click="oFn.saveSentence()">
                    保存并关闭
                </el-button>
            </div>
        </template>
    </el-dialog>
    <!--  -->
    <el-dialog
        title="添加短文/文章/书籍"
        width="900px"
        top="10vh"
        v-model="oVisibleControl.articleDialog"
    >
        <el-form
            label-width="80px"
            :model="oArticleForm"
            :rules="oArticleRules"
        >
            <template v-if="!oArticleForm.appending">
                <el-form-item label="中文名" prop="titleZh">
                    <el-input v-model="oArticleForm.titleZh" />
                </el-form-item>
                <el-form-item label="英文名">
                    <el-input v-model="oArticleForm.titleEn" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="oArticleForm.desc" type="textarea" 
                        :autosize="{ minRows: 2, maxRows: 4 }"
                        maxlangth="800"
                    />
                </el-form-item>
                <el-form-item label="笔记">
                    <el-input v-model="oArticleForm.note" type="textarea" 
                        :autosize="{ minRows: 2, maxRows: 4 }"
                        maxlangth="800"
                    />
                </el-form-item>
                <el-form-item label="语言">
                    <el-radio-group v-model="oArticleForm.lang">
                        <el-radio :label="cur.value"
                            v-for="(cur, key) of aLangOption" :key="key"
                        >
                            {{ cur.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
            </template>
            <!-- 分界 -->
            <el-form-item label="正文"
                v-if="oArticleForm.appending || (oArticleForm.id > 0 === false)"
            >
                <el-input v-model="oArticleForm.article" type="textarea" 
                    :autosize="{ minRows: 8, maxRows: 15 }"
                />
            </el-form-item>
        </el-form>
        <!--  -->
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="oVisibleControl.articleDialog = false" >
                    取消
                </el-button>
                <el-button type="primary" @click="oFn.clickSave">
                    保存
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { onMounted } from 'vue';
import {useFn} from './js/study.js';

const oVisibleControl = ref({
    articleDialog: false,
    sentenceDialog: false,
});

const oSentenceFormRef = ref(null);
const aArtile = reactive([]);
const aLangOption = [
    { value: 'En', label: '英语' },
    { value: 'EnZh', label: '英中' },
    { value: 'ZhEn', label: '中英' },
];

const oArticleFormEmpty = Object.freeze({
    id: null,
    titleZh: '',
    titleEn: '',
    note: '',
    desc: '',
    article: '',
    lang: 'En',
    appending: false,
});
const oTrans = Object.freeze({
    tranText: '',
});

const oSentenceFormEmpty = Object.freeze({
    id: null,
    lang: aLangOption[1].value,
    text: '',
    trans: '', // 分隔符用|
    aTrans: [{...oTrans}],
    // note: '',
    // tag: 0,
});

// const aSection = reactive([]);
const oLine = reactive({
    rows: [],
    pageIndex: 1,
    pageSize: 20,
});

const oArticleForm = reactive({
    ...structuredClone(oArticleFormEmpty),
});
const oSentenceForm = reactive({
    ...structuredClone(oSentenceFormEmpty),
});

const oArticleRules = {
    titleZh: {required: true, message: 'required', trigger: 'blur'},
};
const oSentenceRules = {
    text: {required: true, message: 'required', trigger: 'blur'},
};

const oFn = useFn();


onMounted(async ()=>{
    console.log('oFn2')
    console.log(oFn)
    oFn.getArticleList();
    oFn.getSentence();
});



</script>


<style scoped lang="scss" src="./style/study.scss"></style>