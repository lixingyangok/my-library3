// 
import {toRefs, reactive, computed, onMounted, getCurrentInstance, watch} from 'vue';
import {SubtitlesStr2Arr, fixTime, copyString, downloadSrt, fileToStrings, getMediaDuration, secToStr} from '@/common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {getTubePath, getDateDiff} from '@/common/js/common-fn.js';
import {fillOneFile} from '@/common/js/fs-fn.js';
import {path2handle, handle2List} from '@/common/js/fileSystemAPI.js';
import {useActionStore} from '@/store/action-store.js';

const [sqlite, dxDB] = await Promise.all([
	useSqlite(),
	useDexie(),
]);

export function mainPart(){
	const oActionStore = useActionStore();
	const sToday = window.dayjs().format('YYYY-MM-DD');
	let isMediaChanged = false; // 是否加载了一个新的媒体

	const oDom = reactive({
		oIframe: null,
		oMyWave: null, // 波
		oTextArea: null, // 输入框
		oSententList: null, // 字幕列表
		oSententWrap: null, // 字幕外套
		oTxtInput: null, // 故事文本的Input
		oSrtInput: null, // srt字幕的Input
		oLeftTxt: null, // 文本字幕的DOM容器
		oLeftTxtWrap: null, // 文本字幕的DOM容器
		oWritingLine: null,
		oTodayBar: null,
	});
	const oOperation = { // 编辑功能
		aLineArr: [], // 所有行
		oAllLine: {}, // 查出来后深拷贝存在这里，用于对比哪一行修改过
		iCurLineIdx: 0,
		aHistory: [{ sLineArr: '[]', iCurLineIdx: 0 }],
		iCurStep: 0,
		deletedSet: new Set(), // 已删除的行id.
		iWriting: -1,
		iMatchStart: 0,
		iMatchEnd: 0,
		oRightToLeft: {}, // 对照表
	};
	const oInputMethod = { // 输入法
		sTyped: '',
		aCandidate: [], // 计算所得的候选词
		aFullWords: [], // 所有词（候选词的缺省）
		aWordsList: [[], []], // 关键词，专有名词
		oKeyWord: {}, // 关键词
		oProperNoun: {}, // 专有名词
		sNewWordSearch: '', // 搜索
	};
	const visiableControl = { // 控制窗口显隐
		isShowDictionary: false,
		isShowNewWords: false,
		isShowMediaInfo: false,
		isShowFileList: false,
	};
	const oData = reactive({
		...oOperation,
		...oInputMethod,
		...visiableControl,
		isReading: false,
		sMediaSrc: store('media')?.pathFull, // 考虑废弃
		oMediaInLocal: store('media') || {},
		handleMediaIn: null, // 新版
		oMediaFile: null, // 媒体文件
		
		sHash: '',
		oMediaInfo: {}, // 库中媒体信息
		oMediaBuffer: {}, // 媒体的波形信息
		iSubtitle: 0, // 字幕状态：0=默认，-1=查不到字幕，1=有字幕
		sSearching: '', // 查字典
		iShowStart: 0,
		aSiblings: [], // 当前媒体的邻居文件
		aTxtFileList: [], // 文本类型的文件列表
		oSiblingsInfo: {}, // 当前媒体的邻居信息
		iHisMax: 30, // 最多历史记录数量
		iLineHeight: 35, // 行高xxPx
		isShowLeft: !!false,
		leftType: '', // pdf
		sReadingFile: '', // *.txt  *.pdf
		sArticle: '',
		aArticle: [],
		// iLeftTxtSize: 14, // 左侧文本字号
	});
	const oInstance = getCurrentInstance();
	const {proxy} = oInstance;
	// ▼过滤后的
	const aFilteredWords = computed(()=>{
		if (!oData.sNewWordSearch) return oData.aWordsList;
		const regExp = new RegExp(oData.sNewWordSearch, 'i');
		return oData.aWordsList.map(l01 => {
			return l01.filter(l02 => {
				return regExp.test(l02.word);
			});
		});
	});
	// ▼当前行
	const oCurLine = computed(()=>{
		const oRealOne = oData.aLineArr[ oData.iCurLineIdx ];
		const oSubstitute = { text: '' };
		return oRealOne || oSubstitute;
	});
	// ▼行ID 与行对象对照表
	const oIdD2Line = computed(()=>{
		return oData.aLineArr.reduce((oResult, oCur)=>{
			oResult[oCur.id] = oCur;
			return oResult;
		}, {});
	});
	// ▼ 抓捕字幕的正则表达式
	const reFullWords = computed(()=>{
		if (!oData.aFullWords.length) return;
		const arr = oData.aFullWords.concat().sort((aa, bb)=>{
			return bb.length - aa.length;
		});
		return new RegExp(`\\b(${arr.join('|')})`, 'gi'); // \\b
	});
	// ▼ 抓捕字幕的正则表达式
	const aMinutesAnalyze = computed(()=>{
		const {oMediaInfo, iCurLineIdx, aLineArr} = oData;
		const iLong = Math.ceil(oMediaInfo.duration/60);
		if (!aLineArr.length) return [];
		const aMinutesList = aLineArr.reduce((aResult, oCur)=>{
			const iCurMinute = Math.floor(oCur.start / 60);
			aResult[iCurMinute] ||= {allSteps: {}};
			const oThisMin = aResult[iCurMinute];
			oThisMin.finishLong ??= 0;
			oThisMin.allLong ??= 0;
			oThisMin.allLong += oCur.long;
			if (oCur.filledAt_){
				const sFilledAt = oCur.filledAt_.slice(0,10);
				oThisMin.allSteps[sFilledAt] = oCur.long + (oThisMin.allSteps[sFilledAt] || 0);
				oThisMin.finishLong += oCur.long;
			}
			return aResult;
		}, []);
		aMinutesList.forEach(cur=>{
			const {allLong, finishLong} = cur;
			let aSomeDay = Object.entries(cur.allSteps).find(aOneDay=>{
				return aOneDay[1] / allLong > 0.5;
			}) || [];
			cur.sMainDate = aSomeDay[0];
			cur.doneByToday = (sToday == aSomeDay[0]);
			cur.done = finishLong / allLong > 0.9;
		});
		// console.log('aMinutesList', aMinutesList.$dc());
		return aMinutesList;
	});
	// ▼进度提示-新版本，取代 aProcess
	const aMileStones = computed(()=>{
		const {iCurLineIdx, aLineArr} = oData;
		const {start=0} = oCurLine.value || {};
		const toNextMinute = (()=>{
			const iCurMinute = Math.floor(start / 60);
			const iNextMinute = iCurMinute + 1;
			let iFrom = aLineArr.slice(0, iCurLineIdx+2).findLastIndex(cur => {
				return cur.start <= iCurMinute * 60;
			});
			if (iFrom == -1) iFrom = 0;
			else if (iFrom > 0) iFrom += 1;
			const oFrom = aLineArr[iFrom] || {};
			let iTo = (()=>{
				// ▼若当前起始于 1.x 分钟，则寻找第一个 2.x 分钟的行
				let iResult = aLineArr.slice(iCurLineIdx).findIndex((cur, idx, wholeArr)=>{
					return cur.start >= iNextMinute * 60; 
				});
				if (iResult > 0) return (iResult-1) + iCurLineIdx;
				return aLineArr.length - 1;
			})();
			let oTo =  {};
			let aSteps = [];
			if (iTo > 0){
				oTo = aLineArr[iTo] || {};
				aSteps = aLineArr.slice(iFrom, iTo+1);
			}
			const iFull = oTo.end - oFrom.start;
			const iAt = (start - oFrom.start) / iFull * 100;
			return {
				iFull,
				aSteps,
				oFrom,
				oTo,
				iAt,
				iCurMinute,
				iNextMinute,
				goNext: `${iNextMinute}分钟`,
			};
		})();

		return toNextMinute;
	});
	// ▼ 字幕文件位置（todo 用tube管道取
	const sSubtitleSrc = (()=>{
		return '';
		const arr = oData.sMediaSrc.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据 ====================================================================================
	// ▼方法 ====================================================================================
	async function init(){
		oDom?.oMyWave?.cleanCanvas(true);
		oData.oMediaInLocal = store('media') || {};
		const {hash, pathFull} = oData.oMediaInLocal;
		if (!hash) throw '没有hash';
		const {
			file: oMediaFile,
			belong: handleMediaIn,
		} = await path2handle(pathFull);
		oData.handleMediaIn = handleMediaIn;
		console.log("媒体所在1", pathFull);
		console.log("媒体所在2", handleMediaIn);
		if (oMediaFile){
			oData.oMediaFile = oMediaFile;
			ElMessage.success('正在加载波形数据……');
		}
		const aRes = sqlite.select(`
			select * from media where hash = '${hash}' limit 1
		`);
		console.log('库中媒体信息\n', aRes[0]);
		if (!aRes?.[0]) return ElMessage.error('当前媒体未被收录');
		oData.sHash = hash;
		isMediaChanged = aRes[0].id != oData.oMediaInfo.id;
		oData.oMediaInfo = aRes[0];
		getLinesFromDB();
		await getNeighbors(); // 一定要 await 下方的方法才会正常运行
		getNewWords();
	}
	// ▼查询库中的字幕
	async function getLinesFromDB(aRes=[]){
		if (!aRes.length){
			aRes = await sqlite.tb.line.getLineByMedia(oData.oMediaInfo.id);
		}
		if (!aRes?.length) {
			if (oData.oMediaBuffer) setFirstLine();
			oData.iSubtitle = -1; // -1 表示文件不存在 
			return;
		}
		console.log('当前媒体所有行：\n', aRes);
		const aLineArr = fixTime(aRes);
		const sLineArr = JSON.stringify(aLineArr);
		oData.aHistory[0].sLineArr = sLineArr;
		oData.iSubtitle = 1;
		oData.aLineArr = aLineArr; // 正式使用的数据
		oData.oAllLine = JSON.parse(sLineArr).reduce((oResult, cur)=>{
			oResult[cur.id] = cur;
			return oResult;
		}, {});
		await oInstance.proxy.$nextTick();
		// ▼ 没有目标行就跳到0行（防止纵向滚动条没回顶部
		let {iLineNo=0, sTxtFile} = store('oRecent')[store('media')?.pathFull] || {};
		// let {iLineNo=0, sTxtFile} = store('media') || {};
		// ▼ 只有媒体变更了才重新定位行，即，因保存字幕后重新加载时不要行动
		if (isMediaChanged){
			console.log(`isMediaChanged ${isMediaChanged}, iLineNo=${iLineNo}`);
			oInstance.proxy.goLine(iLineNo);
			isMediaChanged = false; // 复位
		}
		// oData.sReadingFile || showFileAotuly(sTxtFile);
		oActionStore.getMediaRows(oData.oMediaInfo.id);
	}
	// ▼通过文本文件路径读取其中内容（音频的原文文件）
	async function showFileAotuly(sTxtFile, fileTxt){
		// if (!sTxtFile) return;
		// oData.isShowLeft = true;
		// const sTail = sTxtFile.split('.').pop().toLowerCase();
		// const isPDF = sTail == 'pdf';
		// oData.leftType = isPDF ? 'pdf' : 'txt';
		// oData.sReadingFile = sTxtFile;
		// if (isPDF) return;
		// var fileTxt = await 'fsp'.readFile(sTxtFile, 'utf8');
		const aArticle = (()=>{
			let aResult = [];
			if ('sTail' === 'srt') {
				aResult = SubtitlesStr2Arr(fileTxt);
				aResult = aResult.map(cur => cur.text.trim()); //.filter(Boolean);
			}else{
				aResult = fileTxt.split('\n');
			}
			aResult = aResult.map(cur => cur.replace(/，\s{0,2}/g, ', '));
			return aResult;
		})();
		ElMessage.success(`取得文本 ${aArticle.length} 行`);
		oData.aArticle = Object.freeze(aArticle);
	}
	// ▼ 保存1个媒体信息
	async function saveMedia(){
		const arr = store('sFilePath').split('/');
		const obj = {
			hash: oData.sHash,
			name: arr.slice(-1)[0],
			dir: arr.slice(0, -1).join('/'),
		};
		return alert('需要删除 fnInvoke');
		const oInfo = await fnInvoke('db', 'saveMediaInfo', obj);
		if (!oInfo) throw '保存未成功';
		init();
		console.log('已经保存', oInfo);
	}
	// ▼取得【srt文件】的内容
	async function getSrtFile(){
		return []; // 疑似废弃
		const res01 = await fetch(sSubtitleSrc).catch((err)=>{
			oData.iSubtitle = -1; // -1 表示文件不存在
		});
		if (!res01) return; // 查字幕文件不成功
		const sSubtitles = await res01.text();
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('文本转为数据未成功\n');
		oData.iSubtitle = 1;
		oData.aLineArr = arr;
	}
	// ▼无字幕的情况下，插入一个空行
	function setFirstLine(){
		const oFirst = figureOut(oData.oMediaBuffer, 0, 20);
		oFirst.text = '默认行';
		oData.aLineArr = [oFirst];
		oData.aHistory[0].sLineArr = JSON.stringify([oFirst]);
	}
	// ▼接收子组件波形数据
	function bufferReceiver(oMediaBuffer){
		console.log('收到了波形');
		ElMessage.success('波形已经加载');
		// TODO 偶有收到的波形不属于当前媒体文件
		oData.oMediaBuffer = oMediaBuffer;
		const {id, duration=0} = oData.oMediaInfo;
		const iDurDifference = duration && Math.abs(oMediaBuffer.duration - duration);
		if (!id){
			console.log('未能‘在加载波形之前’加载库中媒体信息');
		}else if (iDurDifference > 1){
			dealMediaTimeGaP(oData.oMediaInfo, oMediaBuffer);
		}
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		setFirstLine(); // 需要考虑，因为可能尚没查到字幕，不是没有字幕
	}
	// ▼打开字典窗口
	function toCheckDict(){
		oData.isShowDictionary = !oData.isShowDictionary;
	}
	// ▼切换单词类型
	async function changeWordType(oWord){
		// console.log("oWord", oWord.$dc());
		const res = sqlite.tb.new_word.updateOne({
			id: oWord.id,
			type: oWord.type === 1 ? 2 : 1
		});
		// if (!res) return ElMessage.error('保存未成功');
		// console.log('修改反馈', res);
		getNewWords();
	}
	// ▼删除1个单词
	async function delOneWord(oWord){
		// console.log("oWord", oWord.$dc());
		const res = sqlite.tb.new_word.deleteById(oWord.id);
		if (!res) {
			return ElMessage.error('删除单词未成功');
		}
		ElMessage.success('已删除');
		return getNewWords();
	}
	// ▼查询新词
	async function getNewWords(){
		const mediaId = [
			oData.oMediaInfo.id,
			...oData.aSiblings.map(cur => cur?.infoAtDb?.id)
		].filter(cur => cur >= 0);
		if (!mediaId?.length) return;
		const aRes = await sqlite.select(`
			select word, type, id
			from new_word
			where mediaId in (${mediaId.join(',')})
		`);
		if (!aRes) return;
		oData.aFullWords = aRes.map(cur => cur.word);
		oData.oProperNoun = {}; // 清空
		oData.oKeyWord = {}; // 清空
		oData.aWordsList = aRes.reduce((aResult, cur)=>{
			let iAimTo = 0;
			if (cur.type == 2) iAimTo = 1;
			aResult[iAimTo].push(cur);
			[oData.oKeyWord, oData.oProperNoun][iAimTo][
				cur.word.toLowerCase()
			] = true;
			return aResult;
		}, [[],[]]);
	}
	// ▼显示一批媒体信息
	async function showMediaDialog(){
		oData.isShowMediaInfo = true;
		setFolderInfo();
	}
	// ▼ 查询邻居文件列表
	async function getNeighbors(){
		const {path} = oData.oMediaInLocal;
		let {handle: oDirHandle} = await path2handle(path, 'directory');
		let aList = [];
		if (oDirHandle){
			aList = await handle2List(oDirHandle, {
				mediaOnly: true,
				path: path.replace(/\/[^/]*?$/, ''), // 去除最后一段 /xxx
			});
		}
		if (!aList?.length) return;
		for (const [idx, cur] of aList.entries()){
			await fillOneFile(cur, {
				force: true,
				record: true,
			});
			const {finishedAt, id, durationStr} = cur.infoAtDb || {};
			cur.idx_ = idx + 1;
			cur.done_ = !!finishedAt;
			cur.durationStr = durationStr;
			cur.active_ = id == oData.oMediaInfo.id;
			if (finishedAt){ // YYYY-MM-DD HH:mm:ss
				cur.finishedAt_ = dayjs(finishedAt).format('YYYY-MM-DD HH:mm');
			}
		}
		// console.log('当前媒体邻居:', aList.$dc());
		oData.aSiblings = aList;
		recordMediaTimeInfo(); // 检查是否所有的文件都有媒体信息
	}
	// ▼统计文件夹音频时长（打开邻居窗口调用）
	async function setFolderInfo(){
		console.log('打开邻居窗口');
		const {aSiblings} = oData;
		const aID = [];
		const fDurationSum = aSiblings.reduce((sum, cur) => {
			const {duration=0, id} = cur.infoAtDb || {};
			if (id) aID.push(id);
			return sum + duration;
		}, 0);
		const sAvg = fDurationSum / aSiblings.length;
		const iDoneItems = aSiblings.filter(cur=>cur.done_).length;
		const sDoneRate = (iDoneItems / aSiblings.length * 100).toFixed(2) + '%';
		const oSiblingsInfo = {
			sDurationSum: secToStr(fDurationSum),
			sAvg: secToStr(sAvg),
			fistFillTime: 1,
			fDaysAgo: 0.5,
			iDoneItems,
			sDoneRate,
		};
		const r01 = await sqlite.select(`
			SELECT
				*,
				julianday('now', 'localtime') - julianday(filledAt, 'localtime') as daysAgo
			FROM "line"
			where mediaId in (${aID.join(',')}) and filledAt is not null
			ORDER BY filledAt ASC limit 5
		`);
		if (r01[0]){
			// console.log('第1次提交', r01);
			oSiblingsInfo.fistFillTime = dayjs(r01[0].filledAt).format('YYYY-MM-DD HH:mm');
			oSiblingsInfo.fDaysAgo = getDateDiff(new Date(r01[0].filledAt) *1);
		}
		oData.oSiblingsInfo = oSiblingsInfo;
	}
	// ▼跳转到邻居
	async function visitSibling(oMedia){
		oData.iCurLineIdx = 0;
		oData.aLineArr = [{text: ''}];
		store('media', oMedia);
		await proxy.$nextTick();
		init();
	}
	// ▼切割句子
	function splitSentence(text, idx){
		if (!reFullWords.value) return [text];
		const aResult = [];
		let iLastEnd = 0;
		text.replace(reFullWords.value, (abc, sCurMach, iCurIdx) => {
			iCurIdx && aResult.push(text.slice(iLastEnd, iCurIdx));
			const sClassName = (
				oData.oKeyWord[sCurMach.toLowerCase()] ? 'red' : 'blue'
			);
			aResult.push({ sClassName, word: sCurMach });
			iLastEnd = iCurIdx + sCurMach.length;
		});
		if (!iLastEnd) return [text];
		if (iLastEnd < text.length){
			aResult.push(text.slice(iLastEnd));
		}
		return aResult;
	}
	// ▼字幕滚动
	function lineScroll(ev){
		oData.iShowStart = Math.floor(
			ev.target.scrollTop / oData.iLineHeight
		);
	}
	// ▼显示左侧
	function showLeftColumn(){
		oData.isShowLeft = !oData.isShowLeft;
	}
	// ▼复制文本所在的位置路径
	function justCopy(){
		// console.log('oMediaInfo\n', oData.oMediaInfo.$dc());
		const dir = oData.oMediaInfo.dir.replaceAll('/', '\\');
		console.log(`开始复制文件夹路径 ${dir}`);
		const bCopy = copyString(dir);
		bCopy && ElMessage.success('已复制路径');
	}
	// ▼打开PDF
	function openPDF(){
		oData.isShowLeft = true;
		oData.leftType = 'pdf';
		justCopy();
		const {document: dcmt} = document.querySelector('iframe').contentWindow;
		const btn = dcmt.querySelector('#openFile');
		btn && btn.click();
	}
	// ▼打开文本
	async function openTxt(){
		oData.isShowFileList = true;
		let aItems = await handle2List(oData.handleMediaIn);
		aItems &&= aItems.map(cur => {
			const sTail = cur.name.split('.').pop().toLowerCase();
			const aFormat = ['pdf', 'srt', 'ass', 'txt'];
			return {
				...cur,
				sTail,
				bStay: aFormat.includes(sTail),
			};
		}).filter(cur => {
			return cur.bStay;
		}).sort((aa, bb)=>{
			return aa.sTail.localeCompare(bb.sTail);
		});
		console.log('aItems\n', aItems);
		oData.aTxtFileList = aItems;
		// oDom.oTxtInput.click(); // 旧的 
	}
	// ▼ 打开 txt （在左侧显示）
	async function getArticleFile(ev){
		oData.isShowLeft = true;
		// oData.sArticle = ''; // 好像没用上
		const [oFile] = ev.target.files;
		const isSRT = oFile.path.slice(-4).toLocaleLowerCase() == '.srt';
		const fileTxt = await fileToStrings(oFile);
		if (!fileTxt) return;
		ev.target.value = '';
		// console.log('myLines', myLines);
		const aArticle = (()=>{
			let aResult = [];
			if (isSRT) {
				aResult = SubtitlesStr2Arr(fileTxt);
				aResult = aResult.map(cur => cur.text.trim()); //.filter(Boolean);
			}else{
				aResult = fileTxt.split('\n');
			}
			aResult = aResult.map(cur => cur.replace(/，\s{0,2}/g, ', '));
			return aResult
		})();
		ElMessage.success(`取得文本 ${aArticle.length} 行`);
		// oData.sArticle = fileTxt; // 好像没用上
		oData.aArticle = Object.freeze(aArticle);
	}
	// ▼ 字幕置左
	async function showLeftArticle(){
		oData.leftType = 'txt';
		oData.isShowLeft = true;
		const arr = oData.aLineArr.map(cur => {
			return cur.text.trim();
		});
		oData.aArticle = Object.freeze(arr);
	}
	// ▼ 导入 Srt 字幕
	async function importSrt(ev){
		const fileTxt = await fileToStrings(ev.target.files[0]);
		if (!fileTxt) return;
		ev.target.value = '';
		const arr = SubtitlesStr2Arr(fileTxt);
		if (!arr) return console.log('文本转为数据未成功\n');
		const sMsg = `解析到 ${arr.length} 行字幕，是否覆盖当前字幕？`;
		const isSure = await this.$confirm(sMsg, 'Warning', {
			confirmButtonText: '确认覆盖',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		oData.iCurLineIdx = 0;
		oData.aLineArr = arr;
	}
	// ▼设定某文件为已完成（将来再开发设为未完成功能？）
	async function setItFinished(oTarget){
		console.log('oTarget', oTarget.$dc());
		let {id, finishedAt} = oTarget.infoAtDb;
		finishedAt = finishedAt ? null : Date.now();
		const res = sqlite.tb.media.updateOne({
			id,
			finishedAt,
		});
		// if (!res) return;
		ElMessage.success('状态变更成功');
		await getNeighbors();
		setFolderInfo();
	}
	// ▼查询是否修改过
	function checkIfChanged(oOneLine){
		if (!oOneLine.id) return true;
		const oOldOne = oData.oAllLine[oOneLine.id];
		return ['start', 'end', 'text'].some(key => {
			return oOneLine[key] != oOldOne[key];
		});
	}
	// ▼保存字幕文件
	function saveSrt(sType){
		const {dir, name} = oData.oMediaInfo;
		// console.log(`保存 ${sType}`, dir);
		const bCopy = copyString(dir);
		if (bCopy) ElMessage.success('已复制路径');
		const aName = name.split('.');
		if (aName.length > 1) aName.pop(); // 不需要后缀
		const sName = aName.join('.');
		const theArray = oData.aLineArr.$dc();
		if (sType == 'fill') {
			theArray.forEach((cur, idx)=>{
				cur.text ||= `Line No. ${idx+1}`; 
			});
		}
		downloadSrt(theArray, sName);
	}
	// ▼访问上/下一个文件
	function visitNeighbor(iType){
		console.log('iType', iType);
		for (const [idx, cur] of oData.aSiblings.entries()){
			if (!cur.active_) continue;
			const oAim = oData.aSiblings[idx + iType];
			if (oAim) {
				return visitSibling(oAim);;
			}
			break;
		}
		ElMessage.warning('没有上/下一个');
	}
	// ▼点击文本文件后打开文件的方法（保存学习记录）
	async function chooseFile(oTarget){
		oData.isShowFileList = false; // 关闭窗口
		if (oTarget.sTail != 'txt') {
			return alert('非 txt 无法处理');
		}
		this.isShowLeft = true;
		this.leftType = 'txt';
		const oFile = await oTarget.handle.getFile();
		console.log('oTarget', 	oTarget.$dc(), oFile);
		let fnResolve;
		const oPromise = new Promise(f1 => fnResolve = f1);
		Object.assign(new FileReader(), {
			onload(event){
				const fileContent = event.target.result;
				fnResolve(fileContent);
			},
		}).readAsText(oFile);
		const text = await oPromise;
		showTxtAtLeft(text); // showFileAotuly(sFullPath);
		store.transact('oRecent', (oldData) => {
            const old = store('media') || {
                startAt: new Date() * 1, // 记录开始时间
            };
            oldData[store('media').pathFull] = {
                ...old,
				hasText: true,
            };
        });
		const createdAt = new Date();
		dxDB.text.put({
            createdAt,
            updatedAt: createdAt,
			content: text,
        }, {
			mediaId: oTarget.mediaId,
		}).then(id => {
            console.log("文本已经保存", id);
        });
	}
	// ▼通过文本文件路径读取其中内容（音频的原文文件）
	async function showTxtAtLeft(fileTxt){
		const aArticle = (()=>{
			let aResult = [];
			if ('sTail' === 'srt') {
				aResult = SubtitlesStr2Arr(fileTxt);
				aResult = aResult.map(cur => cur.text.trim()); //.filter(Boolean);
			}else{
				aResult = fileTxt.split('\n');
			}
			aResult = aResult.map(cur => cur.replace(/，\s{0,2}/g, ', '));
			return aResult;
		})();
		ElMessage.success(`取得文本 ${aArticle.length} 行`);
		oData.aArticle = Object.freeze(aArticle);
	}
	// ▼ 保存媒体时长信息 GaP
	async function dealMediaTimeGaP(oMediaInfo, oMediaBuffer){
		// console.log('dealMediaTimeGaP', oMediaInfo.$dc(), oMediaBuffer.$dc());
		const sMsg = `
			${oMediaInfo.durationStr} | ${oMediaBuffer.sDuration_}
			← 媒体时长信息与“通过波形解析的时长”不同，
			是否改为以波形结果为准？
		`.replace(/\s{2,}/g, ' ').trim();
		const isSure = await ElMessageBox.confirm(sMsg, 'Warning', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		const res = await toRecordDiration(oMediaInfo, {
			fDuration: oMediaBuffer.duration,
			sDuration: oMediaBuffer.sDuration_,
		});
		if (!res) return;
		ElMessage.success(`时长已经修改为 ${oMediaBuffer.sDuration_}`);
	}
	// 保存媒体时长信息
	async function recordMediaTimeInfo(){
		const aTarget = oData.aSiblings.filter(cur => {
			return !cur.durationStr && cur?.infoAtDb?.id;
		});
		if (!aTarget.length) return;
		const sMsg = `发现有 ${aTarget.length} 个文件没有时长信息，是否补充？`;
		const isSure = await ElMessageBox.confirm(sMsg, 'Warning', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		return alert('旧方法需要更新');
		// await new Promise(f1 = setTimeout(f1, 600));
		for await(const [idx, cur] of aTarget.entries()) {
			const {sPath, infoAtDb} = cur;
			throw '计算媒体时长方法需要修改入参';
			const oDuration = await getMediaDuration(getTubePath(sPath));
			return alert("getMediaDuration 返回值已经修改，请注意");
			await toRecordDiration(infoAtDb, oDuration);
			cur.durationStr = oDuration.sDuration;
			const sTips = `${sPath.split('/').pop()}：${oDuration.sDuration}`;
			ElMessage.success(sTips);
		}
	}
	// ▼ 更新媒体的时长信息
	async function toRecordDiration(oMediaInfo, oDuration){
		const obj = {
			id: oMediaInfo.id,
			duration: oDuration.fDuration,
			durationStr: oDuration.sDuration,
		};
		const res = sqlite.tb.media.updateOne(obj);
		// console.log(obj, '\n', res);
		return res;
	}
	const fnLib = {
		'保存波形': () => oDom?.oMyWave?.toSaveTemp(),
		'媒体入库': saveMedia,
		'导入Srt': () => oDom?.oSrtInput?.click(),
		'导出Srt': saveSrt,
		'导出Srt(补空行)': () => saveSrt('fill'),
	};
	// ▼ 处理菜单点击事件
	function handleCommand(command){
		console.log('指令：', command);
		fnLib[command]?.();
	}
	async function setAllEmpty(){
		const sMsg = `清空所有行的文本？`;
		const isSure = await ElMessageBox.confirm(sMsg, 'Warning', {
			confirmButtonText: '确认',
			cancelButtonText: '取消',
			type: 'warning',
		}).catch(()=>false);
		if (!isSure) return;
		const {aLineArr} = oData;
		aLineArr.forEach(cur=>{
			cur.text = '';
		});
	}
	watch(() => oActionStore.aMediaRows, (aNewVal)=>{
		aNewVal.forEach(cur=>{
			if (!cur.lineId) return;
			const oRow = oIdD2Line.value[cur.lineId];
			if (oRow) oRow.iSecLong = Math.round(cur.duration_um);
		});
	});
	// ============================================================================
	init();
	const oFn = {
		chooseFile,
		init,
		setAllEmpty,
		bufferReceiver,
		saveMedia,
		toCheckDict,
		changeWordType,
		delOneWord,
		getNewWords,
		getLinesFromDB,
		showMediaDialog,
		splitSentence,
		lineScroll,
		visitSibling,
		openPDF,
		showLeftColumn,
		checkIfChanged,
		getArticleFile,
		saveSrt,
		importSrt,
		setItFinished,
		visitNeighbor,
		handleCommand,
		openTxt,
		showLeftArticle,
	};
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		...oFn,
		oActionStore,
		oCurLine,
		aMileStones,
		aMinutesAnalyze,
		aFilteredWords,
    });
};

// ▼关闭停用的代码
// async function attackActions2Lines(aRows){
// 	let longest = 0;
// 	let fnToFind = findNext2Push(oData.aLineArr);
// 	aRows.forEach((oCurAction, idx)=>{
// 		const oAimRow = fnToFind(oCurAction);
// 		let iNewVal = (oAimRow.iSecLong || 0) + oCurAction.duration;
// 		oAimRow.iSecLong = iNewVal;
// 		if (iNewVal > longest) longest = iNewVal;
// 		if (oCurAction.lineId && (oCurAction.lineId != oAimRow.id)){
// 			console.log('❤️ Action ID 与目标行 ID 不同!!');
// 		}
// 	});
// 	fnToFind = null;
// 	console.log('longest', longest);
// 	// console.log('aLineArr', oData.aLineArr.$dc());
// }
// function findNext2Push(aLineArr){
// 	// let oAim = oData.aLineArr[iAim];
// 	let iAim = 0;
// 	let lineID = null;
// 	return function (oAction){
// 		// console.log('find from', iAim);
// 		let oAim = aLineArr.slice(iAim).find((oCurRow, idx) => {
// 			// const aa = (oAction.playFrom < oCurRow.end) && (oCurRow.end - oAction.playFrom) > -0.5;
// 			// const aa = (oAction.playFrom < oCurRow.end) && (oAction.playFrom - oCurRow.end < -0.5);
// 			const aa = (oAction.playFrom - oCurRow.end < -0.5);
// 			const bb = oAction.playEnd > oCurRow.start;
// 			const isThisOne = aa && bb;
// 			if (isThisOne) {
// 				// console.log(`change ${iAim}-${iAim + idx}`);
// 				iAim += idx;
// 				if (oCurRow.id != lineID){
// 					oCurRow.iSecLong = 0; // 清空
// 					lineID = oCurRow.id;
// 				}
// 			}
// 			return isThisOne;
// 		});
// 		return oAim;
// 	}
// // }