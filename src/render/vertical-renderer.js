// AI Shorts Studio v1.6.1 - cancellable, range-safe vertical renderer with media-state restoration
'use strict';

(function exposeVerticalRenderer(global) {
    const config = global.AIShortsRuntimeConfig || {};
    const utils = global.AIShortsCoreUtils || {};
    const qualityEffects = global.AIShortsQualityEffects || {};
    const gradientCache = new WeakMap();
    const textMeasureCache = new WeakMap();

    function cachedGradient(ctx, key, create) {
        let cache = gradientCache.get(ctx);
        if (!cache) { cache = new Map(); gradientCache.set(ctx, cache); }
        if (cache.has(key)) return cache.get(key);
        const value = create();
        if (cache.size >= 24) cache.delete(cache.keys().next().value);
        cache.set(key, value);
        return value;
    }

    function measureTextWidth(ctx, text) {
        let cache = textMeasureCache.get(ctx);
        if (!cache) { cache = new Map(); textMeasureCache.set(ctx, cache); }
        const key = `${ctx.font || ''}|${String(text || '')}`;
        if (cache.has(key)) return cache.get(key);
        const width = ctx.measureText(text).width;
        if (cache.size >= 512) cache.delete(cache.keys().next().value);
        cache.set(key, width);
        return width;
    }

    function getCanvasContext(canvas) {
        if (!canvas) throw new Error('미리보기 캔버스가 없습니다.');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('캔버스 렌더링을 지원하지 않습니다.');
        return ctx;
    }

    function clear(ctx, width, height) {
        const gradient = cachedGradient(ctx, `clear:${width}x${height}`, () => {
            const value = ctx.createLinearGradient(0, 0, width, height);
            value.addColorStop(0, '#07111f');
            value.addColorStop(0.45, '#111827');
            value.addColorStop(1, '#2e1065');
            return value;
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawCoverImage(ctx, source, width, height, cropMode, qualityOptions) {
        const sourceWidth = source.videoWidth || source.naturalWidth || width;
        const sourceHeight = source.videoHeight || source.naturalHeight || height;
        if (!sourceWidth || !sourceHeight) return;
        const targetRatio = width / height;
        const sourceRatio = sourceWidth / sourceHeight;
        const qualityFilter = qualityEffects.getCanvasFilter ? qualityEffects.getCanvasFilter(qualityOptions) : '';
        if (cropMode === 'blur-fit') {
            ctx.save();
            ctx.filter = `blur(34px) ${qualityFilter || 'saturate(1.15) brightness(0.72)'} brightness(0.72)`;
            const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
            const bw = sourceWidth * coverScale;
            const bh = sourceHeight * coverScale;
            ctx.drawImage(source, (width - bw) / 2, (height - bh) / 2, bw, bh);
            ctx.restore();
            const containScale = Math.min(width / sourceWidth, height / sourceHeight);
            const cw = sourceWidth * containScale;
            const ch = sourceHeight * containScale;
            ctx.save();
            if (qualityFilter) ctx.filter = qualityFilter;
            ctx.drawImage(source, (width - cw) / 2, (height - ch) / 2, cw, ch);
            ctx.restore();
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
        ctx.save();
        if (qualityFilter) ctx.filter = qualityFilter;
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
        ctx.restore();
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
        const waveformGradient = cachedGradient(ctx, `waveform:${width}x${height}`, () => {
            const value = ctx.createLinearGradient(0, centerY - 290, 0, centerY + 290);
            value.addColorStop(0, '#22d3ee');
            value.addColorStop(0.5, '#a78bfa');
            value.addColorStop(1, '#f97316');
            return value;
        });
        ctx.fillStyle = waveformGradient;
        for (let i = 0; i < barCount; i += 1) {
            const sourceIndex = Math.floor((i / barCount) * Math.max(1, bins.length - 1));
            const value = bins[sourceIndex] || (0.28 + Math.sin(i * 0.9 + time * 5) * 0.18);
            const h = 30 + value * 260;
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
            if (measureTextWidth(ctx, test) > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        lines.slice(0, maxLines || 3).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    }


    function drawCaption(ctx, width, height, text, style, captionOptions) {
        let caption = String(text || '').trim();
        if (!caption) return;
        const mode = String(style || 'bold');
        const options = normalizeCaptionOptions(captionOptions);
        if (options.uppercase) caption = caption.replace(/[a-z][a-z0-9'’-]*/g, token => token.toUpperCase());
        const x = width / 2;
        const y = getCaptionY(height, options.position);
        const maxWidth = width * (mode === 'clean' ? 0.78 : 0.84);
        const fontSize = options.size;
        const lineHeight = Math.round(fontSize * 1.18);
        const weight = mode === 'clean' || options.preset === 'minimal' ? 850 : 950;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${weight} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
        const lines = splitCaptionLines(ctx, caption, maxWidth, options.autoBreak ? options.maxLines : 1);
        const boxPadX = Math.round(fontSize * 0.58);
        const boxPadY = Math.round(fontSize * 0.34);
        const boxHeight = lines.length * lineHeight + boxPadY * 2;
        const boxWidth = Math.min(width - 96, maxWidth + boxPadX * 2);
        const boxY = y - boxHeight / 2;
        const wantsBox = mode === 'box' || mode === 'clean' || options.boxOpacity > 0.05;
        if (wantsBox) {
            const darkText = options.color === '#111827';
            ctx.fillStyle = darkText ? `rgba(255, 255, 255, ${Math.max(0.46, options.boxOpacity)})` : `rgba(2, 6, 23, ${options.boxOpacity})`;
            roundRect(ctx, (width - boxWidth) / 2, boxY, boxWidth, boxHeight, Math.round(fontSize * 0.46));
            ctx.fill();
        }
        const highlightSet = buildHighlightSet(options.highlightWords);
        lines.forEach((line, index) => {
            const lineY = boxY + boxPadY + lineHeight * index + lineHeight / 2;
            drawCaptionLine(ctx, line, x, lineY, maxWidth, {
                mode,
                color: options.color,
                accent: options.accent,
                shadow: options.shadow,
                highlightSet,
                fontSize
            });
        });
        ctx.restore();
    }

    function normalizeCaptionOptions(input) {
        const options = Object.assign({
            preset: 'creator',
            position: 'lower',
            size: 58,
            color: '#ffffff',
            accent: '#facc15',
            maxLines: 2,
            boxOpacity: 0.52,
            shadow: 0.78,
            highlightWords: '',
            uppercase: false,
            autoBreak: true
        }, input || {});
        options.size = Math.max(36, Math.min(86, Number(options.size) || 58));
        options.maxLines = Math.max(1, Math.min(3, Number(options.maxLines) || 2));
        options.boxOpacity = Math.max(0, Math.min(0.9, Number(options.boxOpacity) || 0));
        options.shadow = Math.max(0, Math.min(1, Number(options.shadow) || 0));
        options.color = sanitizeColor(options.color, '#ffffff');
        options.accent = sanitizeColor(options.accent, '#facc15');
        options.uppercase = Boolean(options.uppercase);
        options.autoBreak = options.autoBreak !== false;
        return options;
    }

    function sanitizeColor(value, fallback) {
        const text = String(value || '').trim();
        return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : fallback;
    }

    function getCaptionY(height, position) {
        if (position === 'upper') return height * 0.24;
        if (position === 'middle') return height * 0.50;
        if (position === 'safe-bottom') return height * 0.62;
        return height * 0.69;
    }

    function buildHighlightSet(text) {
        return new Set(String(text || '').split(/[,\n]/).map(item => item.trim().toLowerCase()).filter(Boolean));
    }

    function normalizeToken(text) {
        return String(text || '').toLowerCase().replace(/^[^\p{L}\p{N}#]+|[^\p{L}\p{N}#]+$/gu, '');
    }

    function drawCaptionLine(ctx, line, x, y, maxWidth, options) {
        const tokens = String(line || '').split(/(\s+)/).filter(part => part.length);
        const hasHighlights = tokens.some(token => options.highlightSet.has(normalizeToken(token)));
        const shadowAlpha = Math.max(0, Math.min(1, Number(options.shadow) || 0));
        if (!hasHighlights) {
            if (shadowAlpha || options.mode === 'bold') {
                ctx.lineWidth = Math.max(4, options.fontSize * 0.20);
                ctx.strokeStyle = `rgba(0,0,0,${Math.max(0.25, shadowAlpha)})`;
                ctx.strokeText(line, x, y, maxWidth);
                if (options.mode === 'bold') {
                    ctx.lineWidth = Math.max(2, options.fontSize * 0.075);
                    ctx.strokeStyle = toRgba(options.accent, 0.72);
                    ctx.strokeText(line, x, y, maxWidth);
                }
            }
            ctx.fillStyle = options.color;
            ctx.fillText(line, x, y, maxWidth);
            return;
        }
        const widths = tokens.map(token => measureTextWidth(ctx, token));
        const totalWidth = widths.reduce((sum, value) => sum + value, 0);
        let cursor = x - totalWidth / 2;
        tokens.forEach((token, index) => {
            const tokenX = cursor + widths[index] / 2;
            const highlighted = options.highlightSet.has(normalizeToken(token));
            if (shadowAlpha || options.mode === 'bold') {
                ctx.lineWidth = Math.max(4, options.fontSize * 0.18);
                ctx.strokeStyle = `rgba(0,0,0,${Math.max(0.22, shadowAlpha)})`;
                ctx.strokeText(token, tokenX, y);
            }
            if (highlighted) {
                ctx.lineWidth = Math.max(2, options.fontSize * 0.055);
                ctx.strokeStyle = 'rgba(0,0,0,0.45)';
                ctx.strokeText(token, tokenX, y);
            }
            ctx.fillStyle = highlighted ? options.accent : options.color;
            ctx.fillText(token, tokenX, y);
            cursor += widths[index];
        });
    }

    function toRgba(hex, alpha) {
        const clean = sanitizeColor(hex, '#ffffff').slice(1);
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, Number(alpha) || 0))})`;
    }

    function splitCaptionLines(ctx, text, maxWidth, maxLines) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        const lines = [];
        let current = '';
        words.forEach(word => {
            const test = current ? current + ' ' + word : word;
            if (measureTextWidth(ctx, test) > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        });
        if (current) lines.push(current);
        if (lines.length <= maxLines) return lines;
        const limited = lines.slice(0, maxLines);
        limited[maxLines - 1] = limited[maxLines - 1].replace(/…$/, '') + '…';
        return limited;
    }

    function roundRect(ctx, x, y, width, height, radius) {
        const r = Math.max(0, Math.min(radius || 0, width / 2, height / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }

    function drawTemplateChrome(ctx, width, height, template) {
        const mode = String(template || 'neon');
        ctx.save();
        if (mode === 'clean') {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            roundRect(ctx, 54, 72, width - 108, 82, 28);
            ctx.fill();
            ctx.fillStyle = 'rgba(2, 6, 23, 0.44)';
            ctx.fillRect(0, height * 0.76, width, height * 0.24);
        } else if (mode === 'cinematic') {
            ctx.fillStyle = 'rgba(0,0,0,0.72)';
            ctx.fillRect(0, 0, width, 132);
            ctx.fillRect(0, height - 170, width, 170);
            ctx.strokeStyle = 'rgba(255,255,255,0.24)';
            ctx.lineWidth = 2;
            ctx.strokeRect(52, 166, width - 104, height - 360);
        } else if (mode === 'headline') {
            const grad = cachedGradient(ctx, `headline:${width}x${height}`, () => {
                const value = ctx.createLinearGradient(0, 0, width, 0);
                value.addColorStop(0, 'rgba(249, 115, 22, 0.88)');
                value.addColorStop(1, 'rgba(124, 58, 237, 0.88)');
                return value;
            });
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, 158);
            ctx.fillStyle = 'rgba(2, 6, 23, 0.58)';
            roundRect(ctx, 54, height - 520, width - 108, 390, 44);
            ctx.fill();
        } else {
            ctx.globalAlpha = 0.86;
            const grad = cachedGradient(ctx, `neon:${width}x${height}`, () => {
                const value = ctx.createLinearGradient(0, height * 0.18, width, height * 0.86);
                value.addColorStop(0, 'rgba(34, 211, 238, 0.14)');
                value.addColorStop(0.5, 'rgba(124, 58, 237, 0.18)');
                value.addColorStop(1, 'rgba(249, 115, 22, 0.14)');
                return value;
            });
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.76)';
            roundRect(ctx, 42, 50, width - 84, height - 100, 54);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawOverlay(ctx, width, height, options) {
        const title = String(options && options.title || '');
        const rangeText = String(options && options.rangeText || '');
        const template = String(options && options.thumbnailTemplate || 'neon');
        drawTemplateChrome(ctx, width, height, template);
        const gradient = cachedGradient(ctx, `overlay:${template}:${width}x${height}`, () => {
            const value = ctx.createLinearGradient(0, height * 0.60, 0, height);
            value.addColorStop(0, 'rgba(0,0,0,0)');
            value.addColorStop(0.48, template === 'clean' ? 'rgba(2,6,23,0.22)' : 'rgba(0,0,0,0.38)');
            value.addColorStop(1, template === 'cinematic' ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.72)');
            return value;
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.54, width, height * 0.46);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        if (template === 'headline') {
            ctx.font = '1000 42px system-ui, sans-serif';
            ctx.fillText('AI PICK SHORTS', 70, 98);
            ctx.font = '1000 72px system-ui, sans-serif';
            wrapText(ctx, title, 82, height - 420, width - 164, 82, 3);
            ctx.font = '900 34px system-ui, sans-serif';
            ctx.fillStyle = '#fed7aa';
            ctx.fillText(rangeText || 'AI 추천 구간', 82, height - 150);
        } else if (template === 'clean') {
            ctx.font = '900 32px system-ui, sans-serif';
            ctx.fillStyle = '#cffafe';
            ctx.fillText(rangeText || 'AI 추천 구간', 74, 126);
            ctx.fillStyle = '#fff';
            ctx.font = '950 56px system-ui, sans-serif';
            wrapText(ctx, title, 74, height - 272, width - 148, 64, 2);
        } else if (template === 'cinematic') {
            ctx.font = '900 32px system-ui, sans-serif';
            ctx.fillStyle = '#fef3c7';
            ctx.fillText('AI HIGHLIGHT', 72, 86);
            ctx.fillStyle = '#fff';
            ctx.font = '950 54px system-ui, sans-serif';
            wrapText(ctx, title, 74, height - 282, width - 148, 64, 2);
            ctx.font = '800 30px system-ui, sans-serif';
            ctx.fillStyle = '#e5e7eb';
            ctx.fillText(rangeText || 'AI 추천 구간', 74, height - 82);
        } else {
            ctx.font = '900 30px system-ui, sans-serif';
            ctx.fillStyle = '#67e8f9';
            ctx.fillText('AI SHORTS PICK', 74, 120);
            ctx.fillStyle = '#fff';
            ctx.font = '1000 60px system-ui, sans-serif';
            wrapText(ctx, title, 74, height - 298, width - 148, 68, 2);
            ctx.font = '850 34px system-ui, sans-serif';
            ctx.fillStyle = '#cffafe';
            ctx.fillText(rangeText || 'AI 추천 구간', 74, height - 112);
        }
        drawCaption(ctx, width, height, options && options.captionText, options && options.captionStyle, options && options.captionOptions);
    }

    function renderStill(canvas, source, options) {
        const ctx = getCanvasContext(canvas);
        const width = canvas.width || Number(config.EXPORT_WIDTH || 1080);
        const height = canvas.height || Number(config.EXPORT_HEIGHT || 1920);
        const qualityOptions = options && options.qualityOptions || null;
        if (source && (source.videoWidth || source.naturalWidth)) drawCoverImage(ctx, source, width, height, options && options.cropMode || 'center', qualityOptions);
        else drawAudioVisual(ctx, width, height, options || {});
        if (qualityEffects.drawQualityOverlay) qualityEffects.drawQualityOverlay(ctx, width, height, qualityOptions);
        drawOverlay(ctx, width, height, options || {});
        if (qualityEffects.drawWatermark) qualityEffects.drawWatermark(ctx, width, height, qualityOptions);
        if (qualityEffects.drawIntroOutro) qualityEffects.drawIntroOutro(ctx, width, height, options && options.relativeTime || 0, options && options.segmentDuration || 0, qualityOptions);
        if (qualityEffects.drawSafeGuide) qualityEffects.drawSafeGuide(ctx, width, height, qualityOptions);
    }

    function createCanvasStream(canvas, fps) {
        if (!canvas.captureStream) throw new Error('이 브라우저는 canvas captureStream을 지원하지 않습니다.');
        return canvas.captureStream(Number(fps) || Number(config.PREVIEW_FPS || 30));
    }

    function supportsMediaCapture(mediaEl) {
        return Boolean(mediaEl && (typeof mediaEl.captureStream === 'function' || typeof mediaEl.mozCaptureStream === 'function'));
    }

    function getCaptureStream(mediaEl) {
        if (!supportsMediaCapture(mediaEl)) return null;
        if (typeof mediaEl.captureStream === 'function') return mediaEl.captureStream();
        return mediaEl.mozCaptureStream();
    }

    function stopStreamTracks() {
        const stopped = new Set();
        Array.from(arguments).forEach(stream => {
            if (!stream || typeof stream.getTracks !== 'function') return;
            stream.getTracks().forEach(track => {
                if (!track || stopped.has(track)) return;
                stopped.add(track);
                try { track.stop(); } catch (error) { /* ignored */ }
            });
        });
    }

    function inspectRenderCapability(canvas, sourceMedia) {
        const reasons = [];
        const warnings = [];
        const mimeType = utils.getMediaRecorderMime ? utils.getMediaRecorderMime(config.EXPORT_MIME_CANDIDATES || []) : '';
        if (!global.MediaRecorder) reasons.push('MediaRecorder를 지원하지 않는 브라우저입니다.');
        if (!canvas || typeof canvas.captureStream !== 'function') reasons.push('Canvas captureStream을 지원하지 않는 브라우저입니다.');
        if (!sourceMedia) reasons.push('저장할 원본 미디어가 없습니다.');
        if (sourceMedia && !supportsMediaCapture(sourceMedia)) warnings.push('원본 오디오 캡처를 지원하지 않아 결과물에 소리가 포함되지 않을 수 있습니다.');
        if (!mimeType) warnings.push('브라우저가 명시적인 출력 형식을 제공하지 않아 기본 형식으로 저장합니다.');
        return Object.freeze({
            ok: reasons.length === 0,
            reasons: Object.freeze(reasons),
            warnings: Object.freeze(warnings),
            mimeType,
            hasMediaCapture: supportsMediaCapture(sourceMedia)
        });
    }

    const renderPlanCache = new Map();
    const RENDER_PLAN_LIMIT = 24;

    function prepareRenderPlan(options) {
        const input = options || {};
        const rangeKey = `${Number(input.start) || 0}:${Number(input.end) || 0}`;
        const key = [rangeKey, input.cropMode || 'center', input.captionStyle || 'bold', input.thumbnailTemplate || 'neon', JSON.stringify(input.captionOptions || {}), JSON.stringify(input.qualityOptions || {})].join('|');
        if (renderPlanCache.has(key)) {
            const cached = renderPlanCache.get(key);
            renderPlanCache.delete(key);
            renderPlanCache.set(key, cached);
            return cached;
        }
        const plan = Object.freeze({
            cropMode: input.cropMode || 'center',
            captionStyle: input.captionStyle || 'bold',
            captionOptions: Object.freeze(normalizeCaptionOptions(input.captionOptions || {})),
            qualityOptions: Object.freeze(Object.assign({}, input.qualityOptions || {})),
            thumbnailTemplate: input.thumbnailTemplate || 'neon'
        });
        renderPlanCache.set(key, plan);
        while (renderPlanCache.size > RENDER_PLAN_LIMIT) renderPlanCache.delete(renderPlanCache.keys().next().value);
        return plan;
    }

    function clearRenderPlanCache() { renderPlanCache.clear(); }
    function getRenderPlanCacheStats() { return Object.freeze({ size: renderPlanCache.size, limit: RENDER_PLAN_LIMIT }); }

    async function recordVerticalSegment(canvas, sourceMedia, options, onProgress) {
        const signal = options && options.signal || null;
        function abortError(reason) {
            const error = new Error(String(reason || '렌더링이 취소되었습니다.'));
            error.name = 'AbortError';
            return error;
        }
        if (signal && signal.aborted) throw abortError(signal.reason);
        const capability = inspectRenderCapability(canvas, sourceMedia);
        if (!capability.ok) throw new Error(capability.reasons.join(' '));
        const mimeType = capability.mimeType;
        let stream = null;
        let mediaStream = null;
        let recorder = null;
        let ctx = null;
        try {
            stream = createCanvasStream(canvas, options && options.fps || config.PREVIEW_FPS || 30);
            mediaStream = getCaptureStream(sourceMedia);
            if (mediaStream) mediaStream.getAudioTracks().forEach(track => stream.addTrack(track));
            const bitrate = Number(options && options.videoBitsPerSecond) || 0;
            const recorderOptions = mimeType ? { mimeType } : {};
            if (bitrate > 0) recorderOptions.videoBitsPerSecond = bitrate;
            recorder = new MediaRecorder(stream, Object.keys(recorderOptions).length ? recorderOptions : undefined);
            ctx = getCanvasContext(canvas);
        } catch (error) {
            stopStreamTracks(stream, mediaStream);
            throw error;
        }
        const chunks = [];
        recorder.ondataavailable = event => {
            if (event.data && event.data.size) chunks.push(event.data);
        };
        const mediaDuration = Number(sourceMedia && sourceMedia.duration);
        const hasMediaDuration = Number.isFinite(mediaDuration) && mediaDuration > 0;
        const requestedStart = Number(options && options.start);
        const requestedEnd = Number(options && options.end);
        const normalizedRange = utils.normalizeMediaRange
            ? utils.normalizeMediaRange(requestedStart, Number.isFinite(requestedEnd) ? requestedEnd : (Number.isFinite(requestedStart) ? requestedStart : 0) + 15, hasMediaDuration ? mediaDuration : Infinity, 0.05)
            : { start: Math.max(0, Number.isFinite(requestedStart) ? requestedStart : 0), end: Number.isFinite(requestedEnd) ? requestedEnd : Math.max(0, Number.isFinite(requestedStart) ? requestedStart : 0) + 15 };
        const started = Number(normalizedRange.start) || 0;
        const end = Number(normalizedRange.end) || 0;
        const duration = end - started;
        if (!Number.isFinite(duration) || duration <= 0) {
            stopStreamTracks(stream, mediaStream);
            throw new Error('렌더 구간이 올바르지 않습니다. 시작·종료 시간을 다시 확인해주세요.');
        }
        const renderPlan = prepareRenderPlan(options);
        const cropMode = renderPlan.cropMode;
        const title = options && options.title || 'AI Shorts Studio';
        const rangeText = options && options.rangeText || '';
        const waveformBins = options && options.waveformBins || [];
        const captions = Array.isArray(options && options.captions) ? options.captions : [];
        const captionOffset = Number(options && options.captionOffset) || 0;
        const captionStyle = renderPlan.captionStyle;
        const captionOptions = renderPlan.captionOptions;
        const qualityOptions = renderPlan.qualityOptions;
        const originalVolume = sourceMedia ? sourceMedia.volume : 1;
        const originalMuted = sourceMedia ? sourceMedia.muted : false;
        const originalCurrentTime = sourceMedia ? Number(sourceMedia.currentTime) || 0 : 0;
        const originalPlaybackRate = sourceMedia ? Number(sourceMedia.playbackRate) || 1 : 1;
        const originalPaused = sourceMedia ? Boolean(sourceMedia.paused) : true;
        const captionService = global.AIShortsCaptionService || {};
        let raf = 0;
        let stopped = false;
        function drawLoop() {
            const current = sourceMedia ? sourceMedia.currentTime : started;
            const relativeTime = Math.max(0, current - started);
            if (sourceMedia && qualityEffects.calculateFadeVolume) {
                sourceMedia.volume = qualityEffects.calculateFadeVolume(relativeTime, duration, qualityOptions);
            }
            if (sourceMedia && sourceMedia.videoWidth) {
                drawCoverImage(ctx, sourceMedia, canvas.width, canvas.height, cropMode, qualityOptions);
            } else {
                drawAudioVisual(ctx, canvas.width, canvas.height, { time: current, title, waveformBins });
            }
            if (qualityEffects.drawQualityOverlay) qualityEffects.drawQualityOverlay(ctx, canvas.width, canvas.height, qualityOptions);
            const activeCue = captionService.getActiveCue ? captionService.getActiveCue(captions, current, captionOffset) : null;
            drawOverlay(ctx, canvas.width, canvas.height, { title, rangeText, captionText: activeCue && activeCue.text, captionStyle, captionOptions, thumbnailTemplate: options && options.thumbnailTemplate });
            if (qualityEffects.drawWatermark) qualityEffects.drawWatermark(ctx, canvas.width, canvas.height, qualityOptions);
            if (qualityEffects.drawIntroOutro) qualityEffects.drawIntroOutro(ctx, canvas.width, canvas.height, relativeTime, duration, qualityOptions);
            if (onProgress) {
                const progress = Math.min(99, 8 + ((current - started) / duration) * 88);
                onProgress(progress, '세로 쇼츠 렌더링 중');
            }
            if (!stopped) raf = requestAnimationFrame(drawLoop);
        }
        return new Promise((resolve, reject) => {
            let intervalTimer = 0;
            let stopTimer = 0;
            let settled = false;

            function cleanup() {
                stopped = true;
                if (signal) signal.removeEventListener('abort', onAbort);
                if (raf) cancelAnimationFrame(raf);
                if (intervalTimer) clearInterval(intervalTimer);
                if (stopTimer) clearTimeout(stopTimer);
                raf = 0;
                intervalTimer = 0;
                stopTimer = 0;
                stopStreamTracks(stream, mediaStream);
                if (sourceMedia) {
                    try { sourceMedia.pause(); } catch (error) { /* ignored */ }
                    try {
                        const ceiling = Number(sourceMedia.duration);
                        const restoredTime = Number.isFinite(ceiling) && ceiling > 0 ? Math.min(Math.max(0, originalCurrentTime), Math.max(0, ceiling - 0.01)) : Math.max(0, originalCurrentTime);
                        sourceMedia.currentTime = restoredTime;
                    } catch (error) { /* ignored */ }
                    try { sourceMedia.playbackRate = originalPlaybackRate; } catch (error) { /* ignored */ }
                    sourceMedia.volume = originalVolume;
                    sourceMedia.muted = originalMuted;
                    if (!originalPaused && !(signal && signal.aborted)) {
                        try {
                            const resume = sourceMedia.play();
                            if (resume && typeof resume.catch === 'function') resume.catch(() => {});
                        } catch (error) { /* ignored */ }
                    }
                }
            }

            function onAbort() {
                if (sourceMedia) sourceMedia.pause();
                try { if (recorder.state !== 'inactive') recorder.stop(); } catch (error) { /* ignored */ }
                fail(abortError(signal && signal.reason));
            }

            function fail(error) {
                if (settled) return;
                settled = true;
                cleanup();
                reject(error instanceof Error ? error : new Error(String(error || '녹화 오류')));
            }

            if (signal) signal.addEventListener('abort', onAbort, { once: true });
            recorder.onerror = event => {
                fail(new Error(event.error && event.error.message || '녹화 오류'));
            };
            recorder.onstop = () => {
                if (settled) return;
                settled = true;
                cleanup();
                const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
                resolve({ blob, mimeType: blob.type || recorder.mimeType || mimeType || 'video/webm' });
            };
            async function startRecording() {
                try {
                    if (signal && signal.aborted) throw abortError(signal.reason);
                    if (sourceMedia) {
                        sourceMedia.pause();
                        sourceMedia.currentTime = started;
                        sourceMedia.muted = false;
                        try {
                            await sourceMedia.play();
                        } catch (error) {
                            throw new Error('원본 미디어 재생을 시작할 수 없어 렌더를 중단했습니다: ' + (error && error.message || '재생 실패'));
                        }
                    }
                    if (signal && signal.aborted) throw abortError(signal.reason);
                    recorder.start(1000);
                    drawLoop();
                    intervalTimer = setInterval(() => {
                        if (!sourceMedia) return;
                        if (sourceMedia.currentTime >= end || sourceMedia.ended) {
                            clearInterval(intervalTimer);
                            intervalTimer = 0;
                            sourceMedia.pause();
                            if (recorder.state !== 'inactive') recorder.stop();
                        }
                    }, 100);
                    stopTimer = setTimeout(() => {
                        stopTimer = 0;
                        if (sourceMedia) sourceMedia.pause();
                        if (recorder.state !== 'inactive') recorder.stop();
                    }, Math.ceil(duration * 1000) + 1400);
                } catch (error) {
                    fail(error);
                }
            }
            startRecording();
        });
    }

    global.AIShortsVerticalRenderer = Object.freeze({
        drawCoverImage,
        drawAudioVisual,
        drawCaption,
        drawOverlay,
        renderStill,
        createCanvasStream,
        inspectRenderCapability,
        recordVerticalSegment,
        prepareRenderPlan,
        clearRenderPlanCache,
        getRenderPlanCacheStats
    });
})(window);
