// AI Shorts Studio v1.4.0 - runtime config single source
'use strict';

window.AIShortsRuntimeConfig = Object.freeze({
    APP_VERSION: 'v1.4.0',
    BUILD_KEY: '1.4.0-adaptive-mobile',
    ANALYSIS_WORKER_URL: 'src/workers/highlight-analysis.worker.js',
    EXPORT_WIDTH: 1080,
    EXPORT_HEIGHT: 1920,
    PREVIEW_FPS: 30,
    DEFAULT_CANDIDATE_COUNT: 6,
    MAX_ANALYSIS_SECONDS: 30 * 60,
    ANALYSIS_PREP_YIELD_SAMPLES: 24000,
    ANALYSIS_WORKER_STALL_MS: 45000,
    MEDIA_METADATA_WAIT_MS: 5000,
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
    RENDER_QUEUE_RETRY_LIMIT: 2,
    MAX_PROJECT_FILE_BYTES: 2 * 1024 * 1024,
    MAX_CAPTION_FILE_BYTES: 1024 * 1024,
    MAX_CAPTION_TEXT_CHARS: 1000000,
    MAX_CAPTION_CUES: 5000,
    MAX_PROJECT_TEXT_CHARS: 2500000,
    MAX_PROJECT_RECOMMENDATIONS: 24,
    MAX_PROJECT_CAPTIONS: 5000,
    MAX_PROJECT_MEDIA_SECONDS: 24 * 60 * 60
});
