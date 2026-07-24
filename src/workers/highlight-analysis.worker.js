// AI Shorts Studio v1.6.4 - worker bridge using shared adaptive audio analysis core
'use strict';

importScripts('../analysis/audio-analysis-core.js');

self.onmessage = event => {
    const message = event.data || {};
    if (message.type !== 'analyzeAudio') return;
    try {
        const core = self.AIShortsAudioAnalysisCore;
        if (!core || !core.analyzeAudio) throw new Error('공유 오디오 분석 코어를 불러오지 못했습니다.');
        const analysis = core.analyzeAudio(
            message.channelData,
            message.sampleRate,
            message.duration,
            (progress, status) => self.postMessage({ type: 'progress', progress, status })
        );
        self.postMessage({ type: 'progress', progress: 78, status: '추천 후보 계산 준비' });
        self.postMessage({ type: 'result', analysis });
    } catch (error) {
        self.postMessage({ type: 'error', message: error && error.message ? error.message : '분석 실패' });
    }
};
