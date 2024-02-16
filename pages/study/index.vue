<!--
 * @Author: Merlin
 * @Date: 2024-02-04 15:59:59
 * @LastEditors: Merlin
 * @LastEditTime: 2024-02-16 14:33:38
 * @Description: 
-->
<template>
    <div class="top-box" >
        <el-button type="primary"
            @click="oFn.showAddingDialog"
        >
            添加短文/文章/书籍
        </el-button>
        <el-button type="primary" @click="oFn.showSentenceDialog()">
            添加句子
        </el-button>
        <ul class="article-list" >
            <li v-for="(cur, idx) of aArtile" :key="cur.id" >
                <h1>
                    {{ cur.titleZh }}
                    {{ (cur.titleEn && cur.titleZh) ? '|' : '' }}
                    {{ cur.titleEn }}
                </h1>
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
                    <p class="">
                        <i v-if="oCur.fromChinese" :style="{color: 'blue'}">
                            中 |
                        </i>
                        {{ oCur.trans }}
                    </p>
                </div>
                <div class="buttons">
                    <el-button link @click="oFn.showSentenceDialog(oCur, idx)" >
                        修改
                    </el-button>
                    <el-popover :visible="oCur.visible"
                        :width="160"
                        placement="top"
                        trigger="click"
                    >
                        <p>确认删除？</p>
                        <div style="text-align: right; margin: 0">
                            <el-button size="small" link @click="oCur.visible = false">
                                取消
                            </el-button>
                            <el-button size="small"
                                type="primary"
                                @click="oFn.delSentence(oCur, idx)"
                            >
                                确认删除
                            </el-button >
                        </div>
                        <template #reference>
                            <el-button link @click="oCur.visible = true">
                                删除
                            </el-button>
                        </template>
                    </el-popover>
                    
                </div>
            </li>
        </ul>
    </div>
    <!-- 
        ↓弹出窗口（添加句子）
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
            <el-form-item label="类型">
                <el-checkbox label="中译英"
                    v-model="oSentenceForm.fromChinese"
                />
            </el-form-item>
            <el-form-item label="英文句子" prop="text">
                <el-input v-model="oSentenceForm.text" type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    maxlangth="500"
                />
            </el-form-item>
            <el-form-item label="译文" >
                <el-input v-model="oSentenceForm.trans"
                    type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    maxlangth="500"
                />
            </el-form-item>
            <el-form-item label="笔记" >
                <el-input v-model="oSentenceForm.note"
                    type="textarea" 
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    maxlangth="200"
                />
                <!-- <el-button link
                    @click="oFn.delOneTrans(idx)"
                    :disabled="oSentenceForm.aTrans.length <= 1"
                >
                    删除
                </el-button> -->
            </el-form-item>
            <el-form-item>
                <el-button @click="oFn.addMoreTrans"
                    disabled
                >
                    添加译文（暂时禁用）
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
    <!-- 
        ↓弹出窗口（添加短文）
    -->
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
            </template>
            <!--
                分界
            -->
            <template v-if="oArticleForm.appending || (oArticleForm.id > 0 === false)">
                <el-form-item label="语言">
                    <el-radio-group v-model="oArticleForm.lang">
                        <el-radio :label="cur.value"
                            v-for="(cur, key) of aLangOption" :key="key"
                        >
                            {{ cur.label }}
                        </el-radio>
                        需要严格将两个语种每行交替
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="正文" >
                    <el-input v-model="oArticleForm.article" type="textarea" 
                        :autosize="{ minRows: 8, maxRows: 15 }"
                    />
                </el-form-item>
            </template>
        </el-form>
        <!--  -->
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="oVisibleControl.articleDialog = false" >
                    取消
                </el-button>
                <el-button @click="oFn.toPreview">
                    预览
                </el-button>
                <el-button type="primary" @click="oFn.clickSave">
                    保存
                </el-button>
            </div>
        </template>
    </el-dialog>
    <!-- 
        ↓弹出窗口（添加短文）
    -->
    <el-dialog
        title="预览"
        width="800px"
        top="8vh"
        v-model="oVisibleControl.preview"
    >
        <div class="preview">
            <div class="one-line" 
                v-for="(cur, idx) of aPreview" :key="idx"
            >
                <i>{{ idx+1 }}</i>
                <p>{{ cur.text }}</p>
                <p>{{ cur.trans }}</p>
            </div>
        </div>
        <!--  -->
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary"
                    @click="oVisibleControl.preview = false"
                >
                    关闭
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
    preview: false,
});

const oSentenceFormRef = ref(null); // 表单实例
const aArtile = reactive([]);
const aLangOption = [
    { value: 'En', label: '英语' },
    { value: 'EnZh', label: '英中' },
    { value: 'ZhEn', label: '中英' },
];

const aPreview = ref([]);

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


const oSentenceFormEmpty = Object.freeze({
    id: null,
    text: '', // 英
    trans: '', // 中
    fromChinese: false, // 中译英标记
    note: '',
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