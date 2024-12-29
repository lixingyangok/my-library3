<template>
    <section class="outer">
        <h2 v-if="1"> {{aDisks}} </h2>
        <ul class="path-list" v-if="0">
            <li v-for="(cur, idx) of oConfig.aRoot" :key="idx"
                :class="{active: aPath.join('/').startsWith(cur)}"
            >
                <span class="folder" @click="choseRoot(cur)">
                    {{cur}}
                </span>
                &nbsp;
                <el-button link type="primary" @click="showDialog(cur)">
                    弹出窗口
                </el-button>
            </li>
        </ul>
        <!-- ↑ 旧版 --> 
        <section class="root-choosing" >
            <button @click="chooseRoot">选择文件夹</button>
            <br/>
            <ul>
                <li v-for="cur, idx of aRoots" :key="idx" 
                    :class="{active: cur.active}"
                >
                    <em @click="setRoot(idx)">
                        {{ cur.name }}__
                        {{ cur.createdAt }}
                    </em>
                    &emsp;
                    <button @click="deletRoot(idx)">
                        移除
                    </button>
                </li>
            </ul>
        </section>
        <div class="current-path" >
            <!-- 当前1：{{aPath.join('/')}}<br/> -->
            当前位置：{{aRoutesStr.join('/')}} 
            <button @click="checkFolder"> 
                浏览
            </button>
        </div>
        <div class="legend" >
            图标含义：
            文件夹/内含媒体/媒体已入库：
            <i class="folder-mark fas fa-folder"/>
            &nbsp;<i class="folder-mark fas fa-folder has-media"/> 
            &nbsp;<i class="folder-mark fas fa-folder has-media"/><i class="fas fa-check fa-xs small-check"/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            媒体文件/已入库/已完成：
            <i class="fas fa-play-circle " />
            &nbsp;<i class="fas fa-play-circle doing" />
            &nbsp;<i class="fas fa-play-circle done" />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            文件路径/名称与数据库不符 <i style="color:red">红字</i>
        </div>
        <div>
            <button @click="updateMediaInfo">
                更新异常文件
            </button>
            <button @click="mediaManagement('')">
                媒体管理
            </button>
            <button @click="mediaManagement()">
                变换Mp3为其它格式
            </button>
        </div>
        <br/>
        <article class="directory-list">
            <ul v-for="(aColumn, i1) of aDirectory" :key="i1">
                <li class="one-item"
                    v-for="(cur, i2) of aColumn" :key="i2"
                    :class="{
                        'active': i2 == aRoutesInt[i1],
                        'name-wrong': cur.infoAtDb && !cur.bNameRight,
                    }"
                    :hash="cur.hash"
                    @click="ckickItem(i1, i2)"
                    @mouseenter="hoverIn($event, cur)"
                    @mouseleave="mediaPopperToggle(false)"
                >
                    <!-- ↓文件夹 -->
                    <template v-if="cur.kind == 'directory'">
                        <i class="fas fa-fw folder-mark fa-folder "
                            :class="{'has-media': cur.hasMedia}"
                        />
                        <!-- hasMedia 似乎多余，没必要强调是否包含媒体 -->
                        <!-- <i class="fas fa-fw fa-check fa-xs small-check"
                            v-if="oMediaHomes[cur.sPath]"
                        /> -->
                    </template>
                    <!-- ↓媒体 -->
                    <template v-else-if="cur.isMedia">
                        <i v-if="cur.hash"
                            class="fas fa-fw fa-play-circle"
                            :class="{
                                doing: cur.infoAtDb,
                                done: cur.infoAtDb?.finishedAt,
                            }"
                        />
                        <i v-else class="fa-solid fa-fw fa-circle-notch fa-spin" />
                    </template>
                    <!-- ↓其它文件 -->
                    <i v-else class="fas fa-fw fa-file-alt"/>
                    <!-- 左右分界 -->
                    <span class="item-name">
                        {{cur.name}}
                    </span>
                </li>
            </ul>
        </article>
        <!-- 👆 大列表（新版） -->
        <!-- 👇 大列表（旧） -->
        <article  v-if="0">
            <ul v-for="(aColumn, i1) of aTree" :key="i1">
                <li v-for="(cur, i2) of aColumn" :key="i2"
                    @click="ckickTree(i1, i2, cur)"
                    class="one-item"
                    :class="{
                        active: cur.sItem == aPath[i1+1],
                        'name-wrong': cur.isMedia && cur.infoAtDb && !cur.bNameRight,
                    }"
                >
                    <template v-if="cur.isDirectory">
                        <i class="folder-mark fas fa-folder "
                            :class="{'has-media': cur.hasMedia}"
                        />
                        <i class="fas fa-check fa-xs small-check"
                            v-if="oMediaHomes[cur.sPath]"
                        />
                    </template>
                    <template v-else-if="cur.isMedia">
                        <i class="fas fa-play-circle"
                            :class="{
                                doing: cur.infoAtDb,
                                done: cur.infoAtDb?.finishedAt,
                            }"
                        />
                    </template>
                    <i v-else class="fas fa-file-alt"/>
                    <!-- 左右分界 -->
                    <span class="item-name">
                        {{cur.sItem}}
                    </span> 
                </li>
            </ul>
        </article>
    </section>
    <!-- 
        ▼弹窗
        ▼弹窗
        ▼弹窗
    -->
    <!-- <el-dialog title="初始化" width="960px"
        v-model="dialogVisible"
    >
        <el-tree node-key="sPath" default-expand-all
            :data="aRoots" :expand-on-click-node="false"
        >
            <template #default="{ node, data }">
                <span class="tree-line">
                    <span class="label" :title="node.label">
                        {{ node.label }}
                    </span>
                    <span v-if="data.hasMedia" class="right-info">
                        <el-progress class="progress-bar" :show-text="false"
                            :percentage="Math.min(100, ((oMediaHomes[data.sPath] || 0) / data.hasMedia) * 100)" 
                        />
                        <span class="count" :class="{full: data.hasMedia==oMediaHomes[data.sPath]}">
                            {{`${oMediaHomes[data.sPath] || 0}/${data.hasMedia}`}}
                        </span>
                        <el-button link type="primary" @click="checkFolder(data)">
                            实施入库
                        </el-button>
                    </span>
                </span>
            </template>
        </el-tree>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="dialogVisible = false">
                    Confirm
                </el-button>
            </span>
        </template>
    </el-dialog> -->

    <!-- ▼ 2级弹窗 -->
    <!-- ▼ 文件夹的【媒体列表】 -->
    <el-dialog title="初始化" width="550px"
        v-model="bMediaDialog"
    >
        <h3> {{fucousFolder}} </h3>
        <br/>
        <ul class="media-list-in-dialog" >
            <li v-for="(cur,idx) of aFolderMedia" :key="idx"
                class="one-media"
            >
                <span class="name" :title="cur.name">
                    {{cur.name}}
                </span>
                <span class="status">
                    媒体/字幕：
                    <i :class="{'no-yet': cur.hash && !cur.infoAtDb}" >
                        {{cur.infoAtDb ? '✔' : '✘'}}
                    </i>
                    <i :class="{'no-yet': !oLineMap[cur?.infoAtDb?.id], 'no-srt': !cur.srt}">
                        {{ 
                            oLineMap[cur?.infoAtDb?.id] 
                            ? `✔${oLineMap[cur?.infoAtDb?.id]}`
                            : '✘'
                        }}
                    </i>
                </span>
            </li>
        </ul>
        <br/>
        <el-button type="primary" @click="saveOneByOne">
            入库
        </el-button>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="bMediaDialog = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="bMediaDialog = false">
                    Confirm
                </el-button>
            </span>
        </template>
    </el-dialog>

    <!-- ▼媒体详情窗口 -->
    <el-dialog title="媒体详情"
        width="950px"
        v-model="oFileChanging.isShowDialog"
        top="10vh"
    >   
        <button @click="pairMedia">
            配对
        </button>
        <el-table :data="oFileChanging.aListMatched" style="width: 100%">
            <el-table-column prop="name" label="文件名" />
            <el-table-column label="状态" width="130px">
                <template #default="scope">
                    {{
                        scope.row.infoAtDb ? '已入库' : ''
                    }}
                </template>
            </el-table-column>
            <el-table-column prop="aMatched" label="替换项" >
                <template #default="scope">
                    <p v-for="(cur, idx) of scope.row.aMatched" :key="idx" 
                        class="new-file-to-use"
                        @click="changeMediaFile(cur, scope.$index)"
                    >
                        {{ cur.name }}
                        <br/>
                        {{ scope.row.infoAtDb.durationStr }}-{{ cur.durationStr }}
                        （{{~~(cur.duration - scope.row.infoAtDb.duration)}} Time Gap）
                        {{ cur.changingMark ? ` ${cur.changingMark}` : '' }}
                    </p>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="160px">
                <template #default="scope">
                    <el-button link
                        @click="()=>(scope.row)" 
                        :disabled="!!scope.row.infoAtDb"
                    >
                        入库(假)
                    </el-button>
                    <el-button link @click="toForgetMedia(scope.row.infoAtDb, )" >
                        移除媒体
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- ↓ -->
        <div>
            <el-button type="primary" @click="save2DB" >
                保存未入库媒体
            </el-button>
        </div>
    </el-dialog>
    <!--  -->
    <el-dialog title="媒体详情"
        width="550px"
        v-model="oMediaInfo.isShow"
        top="10vh"
    >
        <section class="media-info" >
            <h5> name: {{ oMediaInfo.oMedia.name || '无，或许已被删除' }} </h5>
            <p> createdAt: {{ oMediaInfo.oMedia.createdAt }} </p>
            <p> dir: {{ oMediaInfo.oMedia.dir }} </p>
            <p> id: {{ oMediaInfo.oMedia.id }} </p>
        </section>
        <section class="new-words">
            <ul v-if="oMediaInfo.aWords.length" >  
                <li v-for="(cur, idx) of oMediaInfo.aWords" :key="idx">
                    {{ cur.word }}
                </li>
            </ul>
            <p v-else >
                暂无收录词汇
            </p>
        </section>
        <p>
            当前媒体行数量：{{ oMediaInfo.aLines.length }}
        </p>
        <ul class="media-all-line" >
            <li v-for="(cur, idx) of oMediaInfo.aLines" :key="idx" >
                {{ String(idx+1).padStart(2, '0') }}_{{ cur?.text }}
            </li>
        </ul>
        <section class="btn-group" >
            <el-button type="primary">
                占位按钮
            </el-button>
            <el-button type="danger" @click="toForgetMedia(oMediaInfo.oMedia)">
                移除媒体
            </el-button>
        </section>
    </el-dialog>

    <!-- ↓显示媒体信息的气泡 -->
    <el-popover :title="oHoveringMedia.name"
        v-if="oHoveringMedia.dom"
        :virtual-ref="oHoveringMedia.dom"
        :visible="oHoveringMedia.show"
        :width="300"
        :ref="takePopperDOM"
        virtual-triggering
        placement="right"
        trigger="hover"
    >
        <p>
            Size: {{oHoveringMedia.sizeMB}} MB
        </p>
        <p>
            MB long: 
            <span v-if="oHoveringMedia?.duration"
                class="mb-long"
                :style="{'--minute': oHoveringMedia.iMBLong}"
            >
                {{ oHoveringMedia.iMBLong }}Min {{ oHoveringMedia.sStarts }}
            </span>
        </p>
        <p>
            Duration: {{oHoveringMedia.durationStr}}
        </p>
        <p @click="copyHash(oHoveringMedia.hash)"
            class="hash-value"
            :class="{'copied': oHoveringMedia.hash === hashCopied}"
        >
            Hash: {{oHoveringMedia.hash}}
        </p>
        <br/>
        <el-button type="primary" link
            v-if="oHoveringMedia.infoAtDb"
            @click="checkDetail(oHoveringMedia)"
        >
            详情
        </el-button>
        <el-button type="primary" link
            v-if="oHoveringMedia.infoAtDb"
            @click="useAnotherMedia(oHoveringMedia)"
        >
            切换文件
        </el-button>
    </el-popover>
</template>

<script>
import oMethods01 from './js/shelf.js';
import oMethods02 from './js/folderAbout.js';


export default {
    name: "shelf",
    components: {
    },
    data(){
        if (!import.meta.client) return;
        window.oConfig = (function(){
            const aMedia = [
                '.mp4', // 视频
                '.mp3', '.ogg', '.m4a', '.acc', '.aac', '.opus', // 音频
            ];
            const aOthers = ['.srt', '.pdf'];
            const aFileType = aMedia.concat(aOthers);
            const oMedia = aMedia.reduce((oResult, sCur)=>{
                return {...oResult, [sCur]: true};
            }, {});
            const oFileType = aFileType.reduce((oResult, sCur)=>{
                return {...oResult, [sCur]: true};
            }, {});
            return {
                oMedia,
                oFileType,
                aRoot: [
                    'D:/天翼云盘同步盘/English Story',
                    'D:/天翼云盘同步盘/English dictation',
                    'D:/English',
                ],
                sTempDir: 'D:/Program Files (gree)/my-library/temp-data/',
                equipment: 'home',
            };
        })();
        // console.log("window.oConfig", window.oConfig);
        // console.log('vm.$route;\n', this.$route);
        const {aRoot=[]} = window.oConfig || {};
        const {sPath=''} = this.$route.query;
        let aPath = [aRoot[0]];
        let aAimTo = [];
        // for (const cur of aRoot){
        //     if (!sPath.startsWith(cur)) continue
        //     aPath = [cur];
        //     aAimTo = sPath.slice(cur.length + 1).split('/');
        // }
        return {
            // aTree: [],
            aFolderMedia: [],
            aDisks: document.body.disks,
            oConfig: window.oConfig,
            aPath,
            aRoute: [],
            aAimTo,
            dialogVisible: false, // 用于导入的1级窗口
            bMediaDialog: false,
            oFileChanging: {
                isShowDialog: false,
                aListMatched: [],
            },
            aMediaHomes: [],
            // ▼数据库中的数据
            oMediaHomes: {},
            oLineMap: {},
            fucousFolder: '', // 当前入库的目录
            oMediaInfo: {
                isShow: false,
                oMedia: {},
                aLines: [],
                aWords: [],
            },
            // 👇新的
            aRoots: [], // 选择过的历史记录
            aDirectory: [], // 显示文件列表
            aRoutesInt: [], // 1,3
            aLastFolder: [], // 某列列项
            hashCopied: '',
            oHoveringMedia: {},
            iHoverTimer: null,
        };
    },
    computed: {
        aRoutesStr(){
            const aResult = [...this.aRoutesInt.entries()].map(oCur => {
                const [iColumnIdx, iItemIdx] = oCur;
                return this.aDirectory[iColumnIdx]?.[iItemIdx]?.name;
            });
            return aResult;
        },
    },
    created(){
        // this.getMediaHomesArr();
        this.showRootList();
    },
    mounted(){
    },
    watch: {
        aPath: {
            deep: true,
            immediate: true,
            handler(aNewVal){ // 页面加载时会执行
                // this.getDirChildren();
            },
        },
    },
    methods: {
        ...oMethods01,
        ...oMethods02,
    },
};
</script>

<style scoped src="./style/shelf.scss" lang="scss"></style>
<style scoped src="./style/media-info.css"></style>



