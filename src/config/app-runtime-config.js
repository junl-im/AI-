// AI Shorts Studio v0.3.0 - runtime config
'use strict';

window.AIShortsRuntimeConfig = Object.freeze({
    APP_VERSION: 'v0.3.0',
    BUILD_KEY: '0.3.0-uiux-polish',
    ANALYSIS_WORKER_URL: 'src/workers/highlight-analysis.worker.js',
    EXPORT_WIDTH: 1080,
    EXPORT_HEIGHT: 1920,
    PREVIEW_FPS: 30,
    DEFAULT_CANDIDATE_COUNT: 6,
    MAX_ANALYSIS_SECONDS: 20 * 60,
    MAX_VIDEO_MOTION_SAMPLES: 160,
    DEFAULT_DURATIONS: [15, 30, 45, 60, 90],
    LONG_FORM_DURATIONS: [15, 30, 45, 60, 90, 180],
    MEDIA_ACCEPT: 'audio/*,video/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.mp4,.mov,.m4v,.webm',
    EXPORT_MIME_CANDIDATES: [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
    ],
    LOCAL_STORAGE_KEY: 'ai-shorts-studio-v030-settings',
    DIAGNOSTIC_HISTORY_LIMIT: 20
});
