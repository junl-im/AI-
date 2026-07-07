// AI Shorts Studio v0.8.0 - waveform cut marker overlay
'use strict';

(function exposeCutMarkerOverlay(global) {
    const utils = global.AIShortsCoreUtils || {};

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.min(max, Math.max(min, number));
    }

    function clear(container) {
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);
    }

    function typeLabel(type) {
        if (type === 'beat') return '비트';
        if (type === 'motion') return '장면';
        if (type === 'silence-exit') return '무음끝';
        return '컷';
    }

    function typeClass(type) {
        if (type === 'beat' || type === 'motion' || type === 'silence-exit') return type;
        return 'other';
    }

    function timeText(time) {
        if (utils.formatTime) return utils.formatTime(time);
        const minutes = Math.floor(Number(time || 0) / 60);
        const seconds = Math.floor(Number(time || 0) % 60);
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function normalizedTimeline(cuts, duration) {
        const maxDuration = Math.max(1, Number(duration) || Number(cuts && cuts.duration) || 1);
        const list = cuts && Array.isArray(cuts.timeline) ? cuts.timeline : [];
        return list
            .filter(point => Number.isFinite(Number(point.time)))
            .map(point => Object.assign({}, point, {
                time: clamp(Number(point.time), 0, maxDuration),
                score: clamp(Number(point.score) || 0, 0, 1),
                left: clamp((Number(point.time) / maxDuration) * 100, 0, 100)
            }))
            .sort((a, b) => a.time - b.time || (b.score || 0) - (a.score || 0));
    }

    function renderSelection(container, selected, duration) {
        if (!selected || !Number.isFinite(Number(selected.start)) || !Number.isFinite(Number(selected.end))) return;
        const maxDuration = Math.max(1, Number(duration) || Number(selected.end) || 1);
        const start = clamp((Number(selected.start) / maxDuration) * 100, 0, 100);
        const end = clamp((Number(selected.end) / maxDuration) * 100, 0, 100);
        const band = document.createElement('div');
        band.className = 'cut-marker-selected-band';
        band.style.left = `${Math.min(start, end)}%`;
        band.style.width = `${Math.max(0.7, Math.abs(end - start))}%`;
        container.appendChild(band);
    }

    function renderSilenceZones(container, cuts, duration) {
        const maxDuration = Math.max(1, Number(duration) || Number(cuts && cuts.duration) || 1);
        const segments = cuts && Array.isArray(cuts.silenceSegments) ? cuts.silenceSegments.slice(0, 28) : [];
        segments.forEach(segment => {
            const start = clamp((Number(segment.start) / maxDuration) * 100, 0, 100);
            const end = clamp((Number(segment.end) / maxDuration) * 100, 0, 100);
            const node = document.createElement('div');
            node.className = 'cut-marker-silence-zone';
            node.style.left = `${Math.min(start, end)}%`;
            node.style.width = `${Math.max(0.45, Math.abs(end - start))}%`;
            node.title = `무음 구간 ${timeText(segment.start)} ~ ${timeText(segment.end)}`;
            container.appendChild(node);
        });
    }

    function renderCutMarkers(container, cuts, selected, duration, options) {
        clear(container);
        if (!container) return;
        const opts = Object.assign({ limit: 44 }, options || {});
        const maxDuration = Math.max(1, Number(duration) || Number(cuts && cuts.duration) || 1);
        const points = normalizedTimeline(cuts, maxDuration).slice(0, opts.limit);
        renderSilenceZones(container, cuts, maxDuration);
        renderSelection(container, selected, maxDuration);
        if (!points.length) {
            const empty = document.createElement('span');
            empty.className = 'cut-marker is-empty-note';
            empty.textContent = '분석 후 컷 마커 표시';
            container.appendChild(empty);
            return;
        }
        const topScoreCutoff = points.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[Math.min(5, points.length - 1)].score || 0;
        points.forEach(point => {
            const type = typeClass(point.type);
            const marker = document.createElement('button');
            marker.type = 'button';
            marker.className = `cut-marker cut-marker-${type}`;
            if (selected && point.time >= Number(selected.start) && point.time <= Number(selected.end)) marker.classList.add('is-in-range');
            if ((point.score || 0) >= topScoreCutoff) marker.classList.add('is-top-score');
            marker.style.left = `${point.left}%`;
            marker.dataset.time = String(point.time);
            marker.dataset.type = point.type || 'cut';
            marker.dataset.label = `${typeLabel(point.type)} ${timeText(point.time)}`;
            marker.title = `${typeLabel(point.type)} 컷 · ${timeText(point.time)} · 점수 ${Math.round((point.score || 0) * 100)}`;
            marker.setAttribute('aria-label', marker.title);
            marker.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                if (typeof opts.onMarkerClick === 'function') opts.onMarkerClick(point);
            });
            marker.addEventListener('mouseenter', () => {
                if (typeof opts.onMarkerHover === 'function') opts.onMarkerHover(point);
            });
            marker.addEventListener('focus', () => {
                if (typeof opts.onMarkerHover === 'function') opts.onMarkerHover(point);
            });
            container.appendChild(marker);
        });
    }

    function summarizeFocusedPoint(point) {
        if (!point) return '컷 마커를 클릭하면 해당 위치로 이동합니다.';
        return `${typeLabel(point.type)} · ${timeText(point.time)} · 점수 ${Math.round((Number(point.score) || 0) * 100)}`;
    }

    global.AIShortsCutMarkerOverlay = Object.freeze({
        renderCutMarkers,
        summarizeFocusedPoint,
        typeLabel,
        timeText
    });
})(window);
