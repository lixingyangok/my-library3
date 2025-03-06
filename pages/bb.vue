<template>
    <h1>
        bb.vue
    </h1>
    <audio src="./y-z.mp3" controls> </audio>
    <video id="video01" src="" controls width="800"></video>
    <br/>
    <button id="startButton">Start Recording</button>
    <button id="stopButton" disabled>Stop Recording</button>
    <button id="downloadButton" disabled>Download Audio</button>
    <!-- <script src="https://unpkg.com/@ffmpeg/ffmpeg@0.9.5/dist/ffmpeg.min.js"></script> -->
</template>

<script setup>

onMounted(() => {
    const js = document.createElement('script', {
        src: "https://unpkg.com/@ffmpeg/ffmpeg@0.9.5/dist/ffmpeg.min.js",
        load(){
            console.log('loaded ♦️♦️♦️♦️♦️♦️♦️♦️');
        },
    });
    document.head.appendChild(js);
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const downloadButton = document.getElementById('downloadButton');
    const video01 = document.getElementById('video01');
    let mediaRecorder;
    let recordedChunks = [];
    
    // 开始录制按钮点击事件
    startButton.addEventListener('click', async () => {
        try {
            // 请求屏幕录制权限
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
    
            // 创建 MediaRecorder 实例
            mediaRecorder = new MediaRecorder(stream);
    
            // 当有新的录制数据块时触发
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
    
            // 录制停止时触发
            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                video01.src = videoUrl;
                // // 下载按钮点击事件
                downloadButton.addEventListener('click', () => {
                    console.log('下载按钮点击事件'); 
                    // const a = document.createElement('a');
                    // a.href = url;
                    // a.download = 'screen_recording.webm';
                    // a.click();
                    // URL.revokeObjectURL(url);
                });
                downloadButton.disabled = false;
                recordedChunks = [];
            };
    
            // 开始录制
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
        } catch (error) {
            console.error('Error accessing screen recording:', error);
        }
    });
    
    // 停止录制按钮点击事件
    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });
});


</script>