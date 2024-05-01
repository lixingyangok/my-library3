import { reactive, getCurrentInstance, watch, computed, } from 'vue';
import { fileToBuffer, getPeaks, getChannelArr, } from '@/common/js/pure-fn.js';
import { getTubePath } from '@/common/js/common-fn.js';
import TheAction from '@/common/js/action.js';
// import {useBarInfo} from '@/store/happy-bar.js';
// const oBarInfo = useBarInfo();
const oActionFn = new TheAction('playing');


export default function(){
    const oInstance = getCurrentInstance();
    const {props, proxy} = oInstance;
    let aPeaksData = []; // 波形数据
    const oDom = reactive({ // 从上到下，从外到内
        oMyWaveBar: null, // 最外层
        oCanvasDom: null, // canvas画布
        oViewport: null, // 视口
        oLongBar: null, // 视口内的横长条
        oAudio: null,
        oPointer: null,
        mediaSrc: null,
    });
    const {iWaveHeight = 0.4} = store('oRecent')?.[store('media')?.pathFull] || {};
    const oData = reactive({
        oMediaBuffer: {}, // 媒体buffer，疑似需要向上提交以便显示时长等信息
        playing: false,
        iPerSecPx: 100,
        fPerSecPx: 100,
		iHeight: iWaveHeight,
        iScrollLeft: 0,
        drawing: false,
        sWaveBarClassName: '',
        scrollTimer: 0, // 滚动条动画计时
        scrollAniRequest: 0, // 滚动条动画 ID
    });
    const iFinalDuration = computed(() => {
        return (
            oData.oMediaBuffer.duration || 
            props.mediaDuration || 0
        )
    });
    const oCurLine = computed(()=>{
        return props.aLineArr[
            props.iCurLineIdx
        ];
    });
    // ▼滚轮动了
    function wheelOnWave(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.returnValue = false;
        const {altKey, ctrlKey, shiftKey, wheelDeltaY, deltaY} = ev;
        if (0) console.log(shiftKey, deltaY);
        if (ctrlKey) {
            zoomWave(ev);
        } else if (altKey) {
            changeWaveHeigh(wheelDeltaY);
        } else {
            scrollToFn(wheelDeltaY);
        }
    }
    // ▼滚动条动后调用（手动滚动和程序设定滚动条位置都将触发此方法执行） 
    // ↓
    function waveWrapScroll() {
        const {oMediaBuffer, iPerSecPx, fPerSecPx: fPerSecPxOld} = oData;
        const {offsetWidth, scrollLeft} = oDom.oViewport;
        // console.log("waveWrapScroll() iScrollLeft =", scrollLeft);
        const {aPeaks, fPerSecPx} = getPeaks(
            oMediaBuffer, iPerSecPx, scrollLeft, offsetWidth
        );
        aPeaksData = aPeaks;
        oData.fPerSecPx = fPerSecPx || fPerSecPxOld;
        oData.iScrollLeft = Math.max(0, scrollLeft); // 把新位置记下来
        toDraw();
    }
    function toPause(){
        oDom?.oAudio?.pause(); // 本职工作放在首行
        if (oData.playing) {
            const {currentTime} = oDom.oAudio;
            setTimeout(() => {
                // iDuration 是不准确的，因为多次播放只会取到最后一次播放的时间长度
                const iDuration = oActionFn.saveRecord(currentTime);
                // oBarInfo.setStatus(false, iDuration);
            });
        }
        cancelAnimationFrame(oData.playing);
        oData.playing = false;
    }
    // ▲外部方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    // ▼私有方法 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    async function initFn(oMediaFile){
        oDom.mediaSrc = URL.createObjectURL(oMediaFile);
        oData.oMediaBuffer = {}; // 清空旧的
        // oDom.oViewport.scrollTo(0, 0); // 横向滚动条归位
        const oTemp = (store('aTemp') || []).find(cur=>{
            return cur.mediaPath == sPath;
        });
        console.log('有缓存吗 =', !!oTemp);
        let oMediaBuffer;
        if (oTemp) {
            oMediaBuffer = await getTempData(oTemp);
        }else{
            // fileToBuffer(oMediaFile).then(res=>{
            //     console.log("res", res);    
            // })
            oMediaBuffer = await fileToBuffer(oMediaFile);
        }
        if (!oMediaBuffer) {
            const sTips = `读取媒体 buffer 未成功: ${sPath.split('/').pop()}`;
            console.log(sTips);
            return ElMessage.error(sTips);
        }
        oData.oMediaBuffer = oMediaBuffer;
        setCanvasWidthAndDraw();
        moveToFirstLine();
        oInstance.emit('pipe', oData.oMediaBuffer); // 向上传递数据
    }
    // ▼加载【缓存】数据（可能没有实际启用）
    async function getTempData(oTemp){
        const {sTempPath} = oTemp;
        const aChannelData_ = await fetch(sTempPath).then(res => {
            return getChannelArr(res.blob());
        });
        return { ...oTemp, aChannelData_ };
    }
    // ▼加载【媒体】数据
    async function getAudioData(sPath, oFile){
        let err;
        if (oFile){
            return await fileToBuffer(oFile);
        }
        const oMediaBuffer = await fetch(sPath).then(res => {
            return res.blob();
        }).then(res=>{
            return fileToBuffer(res);
        }).catch(res=>{
            err = res;
            console.log('读取媒体buffer未成功\n', res);
        });
        if (!oMediaBuffer || err) {
            return console.log('媒体地址\n', sPath);
        }
        // console.log('解析耗时：', oMediaBuffer.fElapsedSec);
        return oMediaBuffer;
    }
    // ▼使Dom滚动条横向滚动
	function scrollToFn(deltaY) {
		const iOneStepLong = 150; // 步长
        const {oViewport, oLongBar} = oDom;
		const iMax = oLongBar.offsetWidth - oViewport.offsetWidth;
		let newVal = (() => {
			let oldVal = oViewport.scrollLeft;
			if (deltaY >= 0) return oldVal - iOneStepLong;
			else return oldVal + iOneStepLong;
		})();
		if (newVal < 0) newVal = 0;
		if (newVal > iMax) newVal = iMax;
		oData.iScrollLeft = newVal;
		oViewport.scrollTo(newVal, 0);
	}
    // ▼按收到的数据 => 绘制
    function toDraw() {
        cleanCanvas();
        const { iHeight } = oData; // 波形高
        const {oCanvasDom} = oDom
        const fCanvasWidth = aPeaksData.length / 2;
        const halfHeight = oCanvasDom.height / 2;
        const Context = oCanvasDom.getContext('2d');
        let idx = 0;
        // Context.fillStyle = '#64ff64'; // 100, 255, 100
        Context.fillStyle = '#55c655';
        while (idx < fCanvasWidth) {
            const cur1 = aPeaksData[idx * 2] * iHeight | 0; // 下退转整形
            const cur2 = aPeaksData[idx * 2 + 1] * iHeight | 0;
            // ▼参数依次为：x, y, with, height
            Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
            idx++;
        }
        oData.drawing = false;
    }
    // ▼设宽并绘制
    function setCanvasWidthAndDraw(){
        const {length} = Object.keys(oData.oMediaBuffer);
        const {oViewport, oCanvasDom} = oDom;
        if (!length || !oViewport) return;
        const {scrollLeft, offsetWidth} = oViewport;
		oCanvasDom.width = offsetWidth;
		const {aPeaks, fPerSecPx} = getPeaks(
            oData.oMediaBuffer, oData.iPerSecPx, scrollLeft, offsetWidth,
        );
        aPeaksData = aPeaks;
		oData.fPerSecPx = fPerSecPx;
        toDraw();
	}
    // ▼清空画布
	function cleanCanvas(deep) {
        if (deep) oData.oMediaBuffer = {};
		const Context = oDom.oCanvasDom.getContext('2d');
		Context.clearRect(0, 0, 5_000, 200);
        // console.log('画面已被清空');
	}
    // ↓ 开始播放
	function toPlay(iType=0, oEv={}) {
        cancelAnimationFrame(oData.playing);
        oDom.oAudio ||= document.getElementById('media-player');
        const {currentTime} = oDom.oAudio;
		const playFrom = (() => {
            const { start, end } = oCurLine.value;
            if (iType === true) return start + (end - start) * 0.4; // 从中间播放
            if (iType > 0) return currentTime + 3; // 快进x秒
            if (iType < 0) return Math.max(start, currentTime - 3); // 快退x秒
            return start;
        })();
        oActionFn.initRecord({ // 只管启动，程序会按需保存
            currentTime,
            playFrom,
            ongoing: !!oData.playing,
            mediaId: props.oMediaInfo.id,
            lineId: oCurLine.value.id || null, // 断句期间可能没有 ID 
            isSpaceDown: oEv.keyCode === 32, // 记录是否由空格触发
        });
        oDom.oPointer.left = `${playFrom * oData.fPerSecPx}px`;
		oDom.oAudio.currentTime = playFrom;
		oDom.oAudio.play();
		oDom.oAudio.ontimeupdate = (ev)=>{
            if (ev.target.currentTime < oCurLine.value.end) return;
            ev.target.pause();
            cancelAnimationFrame(oData.playing);
        }; 
        oData.playing = requestAnimationFrame(toMovePointer);
	}
    // ▼移动光标，
    function toMovePointer(){
        if (!oDom.oAudio || !oCurLine.value) return toPause(); // 似乎不会至此
        const { currentTime: cTime } = oDom.oAudio;
        const {end} = oCurLine.value;
        if ((cTime < end) && oData.playing) {
            oDom.oPointer.style.left = cTime * oData.fPerSecPx + 'px';
            return requestAnimationFrame(toMovePointer);
        }
        toPause();
    }
    // ▼保存波形缓存 blob
    async function toSaveTemp(){
        const {oMediaBuffer} = oData;
        const {mediaPath} = oInstance.props;
        const oDate = new Date();
        const sDate = [oDate.getFullYear(), (oDate.getMonth()+1+'').padStart(2,0), (oDate.getDate()+'').padStart(2,0)].join('-');
        const sTempName = `${mediaPath.split('/').pop()}●${sDate}.blob`;
        const sSaveTo = oConfig.sTempDir + sTempName;
        alert('fnInvoke 调用');
        const err = await fnInvoke("fileSaver", {
            sSaveTo,
            aChannelData_: oMediaBuffer.aChannelData_,
        })
        if (err) return console.log('保存文件失败：\n', err);
        const oNewTempInfo = { // 先存上，回头用
            ...oMediaBuffer,
            aChannelData_: [],
            mediaPath, // 配对的依据（将来改为 xxhash)
            sTempName,
            sTempPath: getTubePath(sSaveTo),
            // 将来补上：当前横纵缩放的程度，当前行号
        };
        toUpdateTempInfo(oNewTempInfo);
        const sTips = `已成功保存于：${sSaveTo}`;
        console.log(sTips);
        this.$message.success(sTips);
	}
    // ▼更新 localStorage
    function toUpdateTempInfo(oNewOne){
        console.log('oNewOne', oNewOne.$dc());
        const aTemp = ls('aTemp') || [];
        const iTarget = aTemp.findIndex((cur, idx)=>{
            const bExist = cur.mediaPath == oNewOne.mediaPath;
            if (bExist) aTemp[idx] = oNewOne; // 更新
            return bExist;
        });
        if (iTarget === -1){
            aTemp.push(oNewOne);
            (aTemp.length > 100) && aTemp.shift();
        }
        ls('aTemp', aTemp);
    }
    // ▼横向缩放波形
    async function zoomWave(ev){
        // ▼ 防抖（很重要）
        if (oData.drawing) return console.log('有效防抖'); 
		const {iPerSecPx: perSecPxOld, oMediaBuffer} = oData;
		let {deltaY, clientX} = ev; 
        if (clientX >= 0 == false) { // 用键盘缩放时 clientX 为空
            const {width, left} = oDom.oCanvasDom.getBoundingClientRect();
            clientX = left + width / 2;
        }
        // ▼ 每秒最小/大宽度（px），缩放步幅
		const [min, max, iStep] = [30, 250, 10];
        // ▼ 小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? (perSecPxOld <= min) : (perSecPxOld >= max)){
			return oData.drawing = false;
		}
		const iPerSecPx = (() => { //新★每秒宽度
			const result = perSecPxOld + iStep * (deltaY <= 0 ? 1 : -1);
			if (result < min) return min;
			else if (result > max) return max;
			return result;
		})();
		const fPerSecPx = (()=>{ // 新★每秒宽度（精确）
			const sampleSize = (oMediaBuffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
			return oMediaBuffer.length / sampleSize / oMediaBuffer.duration; 
		})();
		const {offsetLeft} = oDom.oViewport.parentElement;
        const iNewLeftPx = getPointSec(clientX) * fPerSecPx - (clientX - offsetLeft);
        oData.drawing = true;
        oData.iPerSecPx = iPerSecPx;
        oData.fPerSecPx = iPerSecPx;
		oDom.oPointer.style.left = `${oDom.oAudio.currentTime * fPerSecPx}px`;
        await proxy.$nextTick(); // 重要！等待总宽变长再滚动
        // ▼在此触发了缩放（没有滚动条时触发不成功，将通过 watch 监听 iPerSecPx 的变化触发后续动作
		oDom.oViewport.scrollLeft = iNewLeftPx; 
		if (iNewLeftPx <= 0) { // 滚动条位于左侧原点时收缩波形会触发
			waveWrapScroll();
		}
	}
    // ▼得到鼠标位置的的秒数
	function getPointSec(clientX) {
		const {scrollLeft, parentElement: {offsetLeft}} = oDom.oViewport;
		const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标距左边缘的px长度
		const iNowSec = iLeftPx / oData.fPerSecPx; //当前指向时间（秒）
		return iNowSec;
	}
    // 改变波形高度
	function changeWaveHeigh(deltaY) {
        // ↓波形最低，最高，
		const [min, max, iStep] = [0.1, 5, 0.15]; 
		let { iHeight } = oData;
		if (deltaY >= 0) iHeight += iStep;
		else iHeight -= iStep;
		if (iHeight < min) iHeight = min;
		if (iHeight > max) iHeight = max;
		oData.iHeight = iHeight.toFixed(2) * 1;
        store.transact('oRecent', (oldData) => {
            const old = store('media') || {};
            oldData[old.pathFull] = {
                ...old,
                iWaveHeight: iHeight, // 可能取不到值
            };
        });
		toDraw();
	}
    // ▼跳行后定位波形位置
	function goOneLine(oLine){
        if (!oDom.oViewport || !oLine) return;
		const {offsetWidth} = oDom.oViewport;
		const {fPerSecPx} = oData;
		const {start, long} = oLine;
		const iLeft = (() => { // 计算波形框定位的位置
			const startPx = fPerSecPx * start;
			const restPx = offsetWidth - long * fPerSecPx;
			if (restPx <= 0) return startPx - 100; //100表示起点距离左边100
			return startPx - restPx / 2;
		})();
		rollTheWave(iLeft);
	}
    // ▼定位滚动条
    function rollTheWave(iNewLeft){
        // cancelAnimationFrame(oData.scrollAniRequest); 
        clearInterval(oData.scrollAniRequest);
        const runID = Date.now(); 
        oData.scrollTimer = runID; 
        const {oViewport, oLongBar} = oDom;
		const iOldVal = oViewport['scrollLeft'];
		if (~~iOldVal === ~~iNewLeft) return;
        iNewLeft = Math.max(0, iNewLeft);
        iNewLeft = Math.min(iNewLeft, oLongBar.offsetWidth - oViewport.offsetWidth);
		// if ('不要动画') return (oViewport['scrollLeft'] = iNewLeft);
        // const iDistance = ~~Math.abs(iNewLeft - iOldVal); // ←计划：应实现近快远慢
        // ↓ 走完全程耗时, 帧率 
		const [iTakeTime, iTimes] = [300, Math.round(1000/20)];
        // ↓ 步长 px，正负值同时定义了行进方向 
		const iOneStep = ~~((iNewLeft - iOldVal) / (iTakeTime / iTimes));
        fnSetter();
        function fnSetter(){
            // if (oData.scrollTimer != runID) return; 
            let iAimTo = oViewport['scrollLeft'] + iOneStep;
            const needStop = iNewLeft > iOldVal ? (iAimTo >= iNewLeft) : (iAimTo <= iNewLeft);
            oViewport['scrollLeft'] = needStop ? iNewLeft: iAimTo;
            needStop && clearInterval(oData.scrollAniRequest);
            // needStop || requestAnimationFrame(fnSetter);
        }
		// oData.scrollAniRequest = requestAnimationFrame(fnSetter); 
        oData.scrollAniRequest = setInterval(fnSetter, iTimes);
	}
    function moveToFirstLine(){
        const canGo = iFinalDuration.value && props.aLineArr.length;
        if (!canGo) return;
        setTimeout(()=>{
            // console.log('oDom.oLongBar -', oDom.oLongBar.offsetWidth);
            goOneLine(oCurLine.value);
        }, 200);
    }
    // ▼处理左键点击和拖动
    function mouseDownFn(ev){
        if (ev.button !== 0) return; // 只处理左键事件
        oInstance.emit(
            'setTimeTube', 'start', getPointSec(ev.clientX),
        );
    }
    // ▼处理右键点击事件
    function clickOnWave(ev){
        if (ev.button !== 2) return; // 只处理右键
        oInstance.emit(
            'setTimeTube', 'end', getPointSec(ev.clientX),
        );
        ev.preventDefault();
		ev.stopPropagation();
        return false;
    }
    // =================================================================================================================
    watch(() => oData.iPerSecPx, (iNew)=>{
        waveWrapScroll();
    });
    watch(() => oDom.oMyWaveBar, (oNew)=>{
        if (!oNew) return;
        setTimeout(()=>{
            oData.sWaveBarClassName = 'waist100';
        }, 200);
    });
    // 旧版本监听 oDom.oViewport 但有时滚动条会触发监听，就改为了监听 oDom.oMyWaveBar 结果还是照旧
    watch(() => oDom.oViewport, (oNew)=>{
        if (!oNew) return;
        // console.log('触发监听：', oDom.oViewport);
        const myObserver = new ResizeObserver(entryArr => {
            setCanvasWidthAndDraw();
            const {width} = entryArr[0].contentRect;
            // if (1) console.log('宽度变成了：', width);
        });
        myObserver.observe(oNew);
    });
    watch(() => props.iCurLineIdx, (iNew, iOld)=>{
        if (iNew == iOld) return;
        if (!props.aLineArr?.length) return;
        goOneLine(oCurLine.value);
    });
    // watch(() => props.mediaPath, (sNew, sOld)=>{
    //     if (sNew == sOld) return;
    //     toPause(); // 切换到新之前先关停旧的
    //     initFn(sNew);
    // }, {immediate: true});
    watch(() => props.oMediaFile, (sNew, sOld)=>{
        if (sNew == sOld) return;
        toPause(); // 切换到新之前先关停旧的
        initFn(sNew);
    }, {immediate: true});
    watch(() => props.aLineArr, async (aNew, aOld)=>{
        const condition = aNew?.length && !aOld?.length;
        if (!condition) return;
        // console.log('aNew?.length', aNew?.length);
        moveToFirstLine();
    }, {immediate: true});
    // ▼生命周期 ==================================================================
    // onMounted(() => {
    //     console.log('波形加载了');
    // });
    const oFn = {
        mouseDownFn,
        clickOnWave,
        wheelOnWave,
        waveWrapScroll,
        toPlay,
        toSaveTemp,
        zoomWave,
        changeWaveHeigh,
        goOneLine,
        cleanCanvas,
        toPause,
        initFn,
    };
    return { oDom, oData, oFn, iFinalDuration };
}

export function getKeyDownFnMap(This, sType){
    const aFullFn = [
        {key: 'alt + ,', name: '波形横向缩放', fn: ()=>This.zoomWave({deltaY: 1})},
        {key: 'alt + .', name: '波形横向缩放', fn: ()=>This.zoomWave({deltaY: -1})},
        {key: 'alt + shift + ,', name: '波形纵向缩放', fn: ()=>This.changeWaveHeigh(-1)},
        {key: 'alt + shift + .', name: '波形纵向缩放', fn: ()=>This.changeWaveHeigh(1)},
    ];
    // ▼将来用于前端显示给用户
    // if(0) return [withNothing, withCtrl, withAlt];
    if (sType==='obj') {
        return aFullFn.reduce((oResult, cur)=>{
            oResult[cur.key] = cur.fn;
            return oResult;
        }, {});
    }
    return aFullFn;
}



