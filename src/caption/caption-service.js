// AI Shorts Studio v0.2.0 - local caption parser and cue helper
'use strict';

(function exposeCaptionService(global) {
    const utils = global.AIShortsCoreUtils || {};

    function normalizeNewlines(text) {
        return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }

    function parseTimecode(value) {
        const raw = String(value || '').trim().replace(',', '.');
        const parts = raw.split(':');
        if (parts.length < 2 || parts.length > 3) return NaN;
        const sec = Number(parts.pop());
        const min = Number(parts.pop());
        const hour = parts.length ? Number(parts.pop()) : 0;
        if (![hour, min, sec].every(Number.isFinite)) return NaN;
        return hour * 3600 + min * 60 + sec;
    }

    function formatTimecode(seconds) {
        const total = Math.max(0, Number(seconds) || 0);
        const hour = Math.floor(total / 3600);
        const min = Math.floor((total % 3600) / 60);
        const sec = Math.floor(total % 60);
        const ms = Math.round((total - Math.floor(total)) * 1000);
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }

    function sanitizeLine(line) {
        return String(line || '')
            .replace(/<[^>]+>/g, '')
            .replace(/\{\\[^}]+\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function parseCaptionText(text) {
        const source = normalizeNewlines(text);
        if (!source) return [];
        const blocks = source
            .replace(/^WEBVTT[^\n]*(\n|$)/i, '')
            .split(/\n{2,}/)
            .map(block => block.trim())
            .filter(Boolean);
        const cues = [];
        blocks.forEach((block, index) => {
            const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
            if (!lines.length) return;
            let timingIndex = lines.findIndex(line => line.includes('-->'));
            if (timingIndex < 0 && lines.length > 1 && /^\d+$/.test(lines[0]) && lines[1].includes('-->')) timingIndex = 1;
            if (timingIndex < 0) return;
            const timing = lines[timingIndex].split('-->');
            if (timing.length < 2) return;
            const start = parseTimecode(timing[0]);
            const end = parseTimecode(String(timing[1] || '').trim().split(/\s+/)[0]);
            if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
            const caption = lines.slice(timingIndex + 1).map(sanitizeLine).filter(Boolean).join('\n');
            if (!caption) return;
            cues.push({
                id: `cap-${index + 1}-${Math.round(start * 1000)}`,
                start,
                end,
                text: caption.slice(0, 260)
            });
        });
        return cues.sort((a, b) => a.start - b.start || a.end - b.end);
    }

    function createQuickCaptions(text, selectedRange, wordsPerCue) {
        const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return [];
        const words = cleaned.split(' ').filter(Boolean);
        const range = selectedRange || { start: 0, end: Math.max(4, words.length * 0.35) };
        const start = Number(range.start) || 0;
        const end = Math.max(start + 2, Number(range.end) || start + 8);
        const group = Math.max(3, Math.floor(wordsPerCue || 6));
        const chunks = [];
        for (let i = 0; i < words.length; i += group) chunks.push(words.slice(i, i + group).join(' '));
        const slot = (end - start) / Math.max(1, chunks.length);
        return chunks.map((chunk, index) => ({
            id: `cap-quick-${index + 1}`,
            start: start + slot * index,
            end: start + slot * (index + 1),
            text: chunk.slice(0, 260)
        }));
    }

    function getActiveCue(cues, time, offset) {
        const t = (Number(time) || 0) + (Number(offset) || 0);
        return (Array.isArray(cues) ? cues : []).find(cue => t >= Number(cue.start) && t <= Number(cue.end)) || null;
    }

    function serializeCaptions(cues) {
        return (Array.isArray(cues) ? cues : []).map((cue, index) => {
            return `${index + 1}\n${formatTimecode(cue.start)} --> ${formatTimecode(cue.end)}\n${cue.text || ''}`;
        }).join('\n\n');
    }

    function summarize(cues) {
        const list = Array.isArray(cues) ? cues : [];
        if (!list.length) return '자막 없음';
        const first = list[0];
        const last = list[list.length - 1];
        const rangeText = utils.formatRange ? utils.formatRange(first.start, last.end) : `${first.start}-${last.end}`;
        return `${list.length}개 자막 · ${rangeText}`;
    }

    global.AIShortsCaptionService = Object.freeze({
        parseTimecode,
        formatTimecode,
        parseCaptionText,
        createQuickCaptions,
        getActiveCue,
        serializeCaptions,
        summarize
    });
})(window);
