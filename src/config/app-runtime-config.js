// AI Shorts Studio v1.3.2 - runtime config single source
'use strict';

window.AIShortsRuntimeConfig = Object.freeze({
    APP_VERSION: 'v1.3.2',
    BUILD_KEY: '1.3.2-media-e2e',
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
    LOCAL_STORAGE_KEY: 'ai-shorts-studio-v109-settings',
    DIAGNOSTIC_HISTORY_LIMIT: 20,
    RENDER_QUEUE_LIMIT: 12,
    RENDER_QUEUE_RETRY_LIMIT: 2
});
