// AI Shorts Studio v0.1.0 - vertical preview/export renderer
'use strict';

(function exposeVerticalRenderer(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};

    function getCanvasContext(canvas) {
        if (!canvas) throw new Error('미리보기 캔버스가 없습니다.');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('캔버스 렌더링을 지원하지 않습니다.');
        return ctx;
    }

    function clear(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#07111f');
        gradient.addColorStop(0.45, '#111827');
        gradient.addColorStop(1, '#2e1065');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawCoverImage(ctx, source, width, height, cropMode) {
        const sourceWidth = source.videoWidth || source.naturalWidth || width;
        const sourceHeight = source.videoHeight || source.naturalHeight || height;
        if (!sourceWidth || !sourceHeight) return;
        const targetRatio = width / height;
        const sourceRatio = sourceWidth / sourceHeight;
        if (cropMode === 'blur-fit') {
            ctx.save();
            ctx.filter = 'blur(34px) saturate(1.15) brightness(0.72)';
            const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
            const bw = sourceWidth * coverScale;
            const bh = sourceHeight * coverScale;
            ctx.drawImage(source, (width - bw) / 2, (height - bh) / 2, bw, bh);
            ctx.restore();
            const containScale = Math.min(width / sourceWidth, height / sourceHeight);
            const cw = sourceWidth * containScale;
            const ch = sourceHeight * containScale;
            ctx.drawImage(source, (width - cw) / 2, (height - ch) / 2, cw, ch);
            return;
        }
        let sx = 0;
        let sy = 0;
        let sw = sourceWidth;
        let sh = sourceHeight;
        if (sourceRatio > targetRatio) {
            sw = sourceHeight * targetRatio;
            sx = (sourceWidth - sw) / 2;
        } else {
            sh = sourceWidth / targetRatio;
            if (cropMode === 'top') sy = 0;
            else if (cropMode === 'bottom') sy = sourceHeight - sh;
            else sy = (sourceHeight - sh) / 2;
        }
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
    }

    function drawAudioVisual(ctx, width, height, options) {
        const time = Number(options && options.time) || 0;
        const title = String(options && options.title || 'AI Shorts Studio');
        const bins = Array.isArray(options && options.waveformBins) ? options.waveformBins : [];
        clear(ctx, width, height);
        ctx.save();
        ctx.globalAlpha = 0.36;
        for (let i = 0; i < 9; i += 1) {
            const radius = 180 + i * 72 + Math.sin(time * 1.8 + i) * 20;
            ctx.strokeStyle = i % 2 ? '#22d3ee' : '#8b5cf6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(width / 2, height * 0.42, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        const barCount = Math.min(72, Math.max(28, bins.length || 36));
        const barWidth = width * 0.68 / barCount;
        const startX = (width - barWidth * barCount) / 2;
        const centerY = height * 0.55;
        for (let i = 0; i < barCount; i += 1) {
            const sourceIndex = Math.floor((i / barCount) * Math.max(1, bins.length - 1));
            const value = bins[sourceIndex] || (0.28 + Math.sin(i * 0.9 + time * 5) * 0.18);
            const h = 30 + value * 260;
            const gradient = ctx.createLinearGradient(0, centerY - h, 0, centerY + h);
            gradient.addColorStop(0, '#22d3ee');
            gradient.addColorStop(0.5, '#a78bfa');
            gradient.addColorStop(1, '#f97316');
            ctx.fillStyle = gradient;
            ctx.fillRect(startX + i * barWidth, centerY - h / 2, Math.max(3, barWidth * 0.62), h);
        }
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '900 74px system-ui, sans-serif';
        wrapText(ctx, title, width / 2, height * 0.22, width * 0.78, 84, 3);
        ctx.font = '700 34px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.fillText('AI 추천 하이라이트', width / 2, height * 0.75);
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';
        for (const word of words.length ? words : [String(text || '')]) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        lines.slice(0, maxLines || 3).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    }

    function drawOverlay(ctx, width, height, options) {
        const title = String(options && options.title || '');
        const rangeText = String(options && options.rangeText || '');
        const gradient = ctx.createLinearGradient(0, height * 0.66, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.48, 'rgba(0,0,0,0.38)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.58, width, height * 0.42);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '900 58px system-ui, sans-serif';
        wrapText(ctx, title, 74, height - 285, width - 148, 66, 2);
        ctx.font = '800 34px system-ui, sans-serif';
        ctx.fillStyle = '#cffafe';
        ctx.fillText(rangeText || 'AI 추천 구간', 74, height - 112);
    }

    function renderStill(canvas, source, options) {
        const ctx = getCanvasContext(canvas);
        const width = canvas.width || Number(config.EXPORT_WIDTH || 1080);
        const height = canvas.height || Number(config.EXPORT_HEIGHT || 1920);
        if (source && (source.videoWidth || source.naturalWidth)) drawCoverImage(ctx, source, width, height, options && options.cropMode || 'center');
        else drawAudioVisual(ctx, width, height, options || {});
        drawOverlay(ctx, width, height, options || {});
    }

    function createCanvasStream(canvas, fps) {
        if (!canvas.captureStream) throw new Error('이 브라우저는 canvas captureStream을 지원하지 않습니다.');
        return canvas.captureStream(Number(fps) || Number(config.PREVIEW_FPS || 30));
    }

    function getCaptureStream(mediaEl) {
        if (!mediaEl) return null;
        if (typeof mediaEl.captureStream === 'function') return mediaEl.captureStream();
        if (typeof mediaEl.mozCaptureStream === 'function') return mediaEl.mozCaptureStream();
        return null;
    }

    async function recordVerticalSegment(canvas, sourceMedia, options, onProgress) {
        const mimeType = utils.getMediaRecorderMime ? utils.getMediaRecorderMime(config.EXPORT_MIME_CANDIDATES || []) : '';
        if (!global.MediaRecorder) throw new Error('이 브라우저는 MediaRecorder 내보내기를 지원하지 않습니다.');
        const stream = createCanvasStream(canvas, options && options.fps || config.PREVIEW_FPS || 30);
        const mediaStream = getCaptureStream(sourceMedia);
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach(track => stream.addTrack(track));
        }
        const recorderOptions = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, recorderOptions);
        const chunks = [];
        recorder.ondataavailable = event => {
            if (event.data && event.data.size) chunks.push(event.data);
        };
        const started = Number(options && options.start) || 0;
        const end = Number(options && options.end) || Math.min((sourceMedia && sourceMedia.duration) || 0, started + 15);
        const duration = Math.max(1, end - started);
        const cropMode = options && options.cropMode || 'center';
        const title = options && options.title || 'AI Shorts Studio';
        const rangeText = options && options.rangeText || '';
        const waveformBins = options && options.waveformBins || [];
        let raf = 0;
        let stopped = false;
        const ctx = getCanvasContext(canvas);
        function drawLoop() {
            const current = sourceMedia ? sourceMedia.currentTime : started;
            if (sourceMedia && sourceMedia.videoWidth) {
                drawCoverImage(ctx, sourceMedia, canvas.width, canvas.height, cropMode);
            } else {
                drawAudioVisual(ctx, canvas.width, canvas.height, { time: current, title, waveformBins });
            }
            drawOverlay(ctx, canvas.width, canvas.height, { title, rangeText });
            if (onProgress) {
                const progress = Math.min(99, 8 + ((current - started) / duration) * 88);
                onProgress(progress, '세로 쇼츠 렌더링 중');
            }
            if (!stopped) raf = requestAnimationFrame(drawLoop);
        }
        return new Promise((resolve, reject) => {
            recorder.onerror = event => {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                reject(new Error(event.error && event.error.message || '녹화 오류'));
            };
            recorder.onstop = () => {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                stream.getTracks().forEach(track => track.stop());
                const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
                resolve({ blob, mimeType: blob.type || recorder.mimeType || mimeType || 'video/webm' });
            };
            try {
                if (sourceMedia) {
                    sourceMedia.currentTime = started;
                    sourceMedia.muted = false;
                    sourceMedia.play().catch(() => {});
                }
                recorder.start(1000);
                drawLoop();
                const timer = setInterval(() => {
                    if (!sourceMedia) return;
                    if (sourceMedia.currentTime >= end || sourceMedia.ended) {
                        clearInterval(timer);
                        sourceMedia.pause();
                        if (recorder.state !== 'inactive') recorder.stop();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(timer);
                    if (sourceMedia) sourceMedia.pause();
                    if (recorder.state !== 'inactive') recorder.stop();
                }, Math.ceil(duration * 1000) + 1400);
            } catch (error) {
                stopped = true;
                if (raf) cancelAnimationFrame(raf);
                reject(error);
            }
        });
    }

    global.AIShortsVerticalRenderer = Object.freeze({
        drawCoverImage,
        drawAudioVisual,
        drawOverlay,
        renderStill,
        createCanvasStream,
        recordVerticalSegment
    });
})(window);
