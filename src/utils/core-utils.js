// AI Shorts Studio v0.3.0 - core utilities
'use strict';

(function exposeCoreUtils(global) {
    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
    }

    function clamp01(value) {
        return clamp(value, 0, 1);
    }

    function lerp(a, b, t) {
        return Number(a) + (Number(b) - Number(a)) * clamp01(t);
    }

    function formatTime(seconds) {
        const total = Math.max(0, Math.floor(Number(seconds) || 0));
        const min = Math.floor(total / 60);
        const sec = total % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function formatRange(start, end) {
        return `${formatTime(start)} ~ ${formatTime(end)}`;
    }

    function safeFileBaseName(name) {
        return String(name || 'shorts')
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9가-힣_-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'shorts';
    }

    function extensionFromMime(mimeType) {
        const mime = String(mimeType || '').toLowerCase();
        if (mime.includes('mp4')) return 'mp4';
        if (mime.includes('webm')) return 'webm';
        return 'webm';
    }

    function isVideoFile(file) {
        const type = String(file && file.type || '').toLowerCase();
        const name = String(file && file.name || '').toLowerCase();
        return type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv)$/i.test(name);
    }

    function isAudioFile(file) {
        const type = String(file && file.type || '').toLowerCase();
        const name = String(file && file.name || '').toLowerCase();
        return type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg|opus|aiff|aif)$/i.test(name);
    }

    function detectMediaKind(file) {
        if (isVideoFile(file)) return 'video';
        if (isAudioFile(file)) return 'audio';
        return '';
    }

    function isSupportedMediaFile(file) {
        return Boolean(detectMediaKind(file));
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function mean(values) {
        if (!Array.isArray(values) && !(values instanceof Float32Array)) return 0;
        if (!values.length) return 0;
        let sum = 0;
        for (let i = 0; i < values.length; i += 1) sum += Number(values[i]) || 0;
        return sum / values.length;
    }

    function percentile(values, pct) {
        const list = Array.from(values || []).filter(Number.isFinite).sort((a, b) => a - b);
        if (!list.length) return 0;
        const index = clamp(Math.round((list.length - 1) * pct), 0, list.length - 1);
        return list[index];
    }

    function normalizeList(values) {
        const list = Array.from(values || []).map(value => Number(value) || 0);
        if (!list.length) return [];
        const low = percentile(list, 0.08);
        const high = percentile(list, 0.96);
        const span = Math.max(1e-9, high - low);
        return list.map(value => clamp01((value - low) / span));
    }

    function createWaveformBins(channelData, binCount) {
        const source = channelData || new Float32Array(0);
        const count = Math.max(24, Math.floor(binCount || 160));
        const bins = [];
        if (!source.length) {
            for (let i = 0; i < count; i += 1) bins.push(0);
            return bins;
        }
        const samplesPerBin = Math.max(1, Math.floor(source.length / count));
        for (let bin = 0; bin < count; bin += 1) {
            const start = bin * samplesPerBin;
            const end = Math.min(source.length, start + samplesPerBin);
            let peak = 0;
            for (let i = start; i < end; i += 1) {
                const value = Math.abs(source[i] || 0);
                if (value > peak) peak = value;
            }
            bins.push(peak);
        }
        return normalizeList(bins);
    }

    function normalizeMediaRange(startValue, endValue, maxDuration, minimumDuration) {
        const ceilingValue = Number(maxDuration);
        const hasCeiling = Number.isFinite(ceilingValue) && ceilingValue > 0;
        const ceiling = hasCeiling ? ceilingValue : Infinity;
        const requestedMinimum = Math.max(0.001, Number(minimumDuration) || 0.001);
        const minimum = hasCeiling ? Math.min(requestedMinimum, ceiling) : requestedMinimum;
        let start = Number(startValue);
        if (!Number.isFinite(start)) start = 0;
        start = Math.max(0, start);
        if (hasCeiling) start = Math.min(start, Math.max(0, ceiling - minimum));
        let end = Number(endValue);
        if (!Number.isFinite(end)) end = start + minimum;
        end = Math.max(start + minimum, end);
        if (hasCeiling) end = Math.min(ceiling, end);
        if (end <= start) {
            start = hasCeiling ? Math.max(0, ceiling - minimum) : Math.max(0, start);
            end = hasCeiling ? ceiling : start + minimum;
        }
        return Object.freeze({ start, end, duration: Math.max(0, end - start) });
    }

    function createObjectUrl(file) {
        if (!file) return '';
        return URL.createObjectURL(file);
    }

    function revokeObjectUrl(url) {
        if (!url) return;
        try { URL.revokeObjectURL(url); } catch (error) { /* no-op */ }
    }

    function getMediaRecorderMime(candidates) {
        const list = Array.isArray(candidates) ? candidates : [];
        if (!global.MediaRecorder || typeof global.MediaRecorder.isTypeSupported !== 'function') return '';
        return list.find(type => global.MediaRecorder.isTypeSupported(type)) || '';
    }

    async function copyText(text) {
        const value = String(text || '');
        if (global.navigator && global.navigator.clipboard && typeof global.navigator.clipboard.writeText === 'function') {
            try {
                await global.navigator.clipboard.writeText(value);
                return true;
            } catch (error) {
                // Permission and focus policies vary by browser. Fall through to the legacy local copy path.
            }
        }
        const doc = global.document;
        if (!doc || !doc.body || typeof doc.createElement !== 'function' || typeof doc.execCommand !== 'function') return false;
        const textarea = doc.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', 'readonly');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        doc.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        let ok = false;
        try { ok = Boolean(doc.execCommand('copy')); } catch (error) { ok = false; }
        finally { textarea.remove(); }
        return ok;
    }

    global.AIShortsCoreUtils = Object.freeze({
        clamp,
        clamp01,
        lerp,
        formatTime,
        formatRange,
        safeFileBaseName,
        extensionFromMime,
        isVideoFile,
        isAudioFile,
        detectMediaKind,
        isSupportedMediaFile,
        escapeHtml,
        mean,
        percentile,
        normalizeList,
        createWaveformBins,
        normalizeMediaRange,
        createObjectUrl,
        revokeObjectUrl,
        getMediaRecorderMime,
        copyText
    });
})(window);
