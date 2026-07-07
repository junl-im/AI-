// AI Shorts Studio v0.3.0 - timeline list view
'use strict';

(function exposeTimelineView(global) {
    const utils = global.AIShortsCoreUtils || {};

    function renderTimeline(container, recommendations, selectedId) {
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);
        if (!recommendations || !recommendations.length) return;
        const totalDuration = Math.max(1, Math.max.apply(null, recommendations.map(item => item.end).concat([1])));
        recommendations.slice(0, 6).forEach(item => {
            const row = document.createElement('div');
            row.className = 'timeline-row';
            const label = document.createElement('span');
            label.textContent = `#${item.rank}`;
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            const seg = document.createElement('div');
            seg.className = 'timeline-segment';
            seg.style.left = `${Math.max(0, (item.start / totalDuration) * 100)}%`;
            seg.style.width = `${Math.max(1, ((item.end - item.start) / totalDuration) * 100)}%`;
            seg.style.opacity = item.id === selectedId ? '1' : '0.55';
            bar.appendChild(seg);
            const score = document.createElement('span');
            score.textContent = `${item.score}`;
            row.title = item.rangeText || (utils.formatRange ? utils.formatRange(item.start, item.end) : '');
            row.appendChild(label);
            row.appendChild(bar);
            row.appendChild(score);
            container.appendChild(row);
        });
    }

    global.AIShortsTimelineView = Object.freeze({ renderTimeline });
})(window);
