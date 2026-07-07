// AI Shorts Studio v0.1.0 - waveform view
'use strict';

(function exposeWaveformView(global) {
    const utils = global.AIShortsCoreUtils || {};

    function drawWaveform(canvas, bins, recommendations, selectedId) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#020617');
        bg.addColorStop(1, '#111827');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        const list = Array.isArray(bins) && bins.length ? bins : new Array(120).fill(0).map((_, i) => 0.12 + Math.sin(i * 0.41) * 0.08);
        const barWidth = width / list.length;
        const centerY = height / 2;
        for (let i = 0; i < list.length; i += 1) {
            const value = Math.max(0.02, Number(list[i]) || 0);
            const barHeight = Math.max(2, value * height * 0.82);
            const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
            gradient.addColorStop(0, '#22d3ee');
            gradient.addColorStop(0.5, '#8b5cf6');
            gradient.addColorStop(1, '#f97316');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.74;
            ctx.fillRect(i * barWidth, centerY - barHeight / 2, Math.max(1, barWidth * 0.66), barHeight);
        }
        ctx.globalAlpha = 1;
        const totalDuration = Math.max(1, Math.max.apply(null, (recommendations || []).map(item => item.end).concat([1])));
        (recommendations || []).forEach(item => {
            const x = (item.start / totalDuration) * width;
            const w = Math.max(3, ((item.end - item.start) / totalDuration) * width);
            ctx.fillStyle = item.id === selectedId ? 'rgba(34, 211, 238, 0.28)' : 'rgba(249, 115, 22, 0.16)';
            ctx.fillRect(x, 0, w, height);
            ctx.strokeStyle = item.id === selectedId ? '#22d3ee' : 'rgba(249, 115, 22, 0.62)';
            ctx.lineWidth = item.id === selectedId ? 4 : 2;
            ctx.strokeRect(x, 4, w, height - 8);
        });
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = '700 20px system-ui, sans-serif';
        ctx.fillText('AI 추천 위치', 22, 36);
    }

    function renderRecommendations(container, recommendations, selectedId, onSelect) {
        if (!container) return;
        container.classList.toggle('empty-state', !recommendations || !recommendations.length);
        while (container.firstChild) container.removeChild(container.firstChild);
        if (!recommendations || !recommendations.length) {
            const p = document.createElement('p');
            p.textContent = '파일을 분석하면 쇼츠 후보가 점수와 이유 카드로 표시됩니다.';
            container.appendChild(p);
            return;
        }
        recommendations.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'recommendation-card' + (item.id === selectedId ? ' is-selected' : '');
            button.dataset.id = item.id;
            const top = document.createElement('div');
            top.className = 'rec-card-top';
            const left = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'rec-title';
            title.textContent = item.title;
            const range = document.createElement('div');
            range.className = 'rec-range';
            range.textContent = item.rangeText || (utils.formatRange ? utils.formatRange(item.start, item.end) : `${item.start}-${item.end}`);
            left.appendChild(title);
            left.appendChild(range);
            const score = document.createElement('div');
            score.className = 'rec-score';
            score.textContent = `${item.score}점`;
            top.appendChild(left);
            top.appendChild(score);
            const reasons = document.createElement('ul');
            reasons.className = 'rec-reasons';
            (item.reasons || []).forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                reasons.appendChild(li);
            });
            button.appendChild(top);
            button.appendChild(reasons);
            button.addEventListener('click', () => onSelect && onSelect(item.id));
            container.appendChild(button);
        });
    }

    global.AIShortsWaveformView = Object.freeze({ drawWaveform, renderRecommendations });
})(window);
