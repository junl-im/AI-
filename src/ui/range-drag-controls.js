// AI Shorts Studio v1.1.9 - event-driven draggable waveform range controls
'use strict';

(function bootRangeDragControls(global) {
    const store = global.AIShortsAppState || {};
    const state = store.state || {};
    const utils = global.AIShortsCoreUtils || {};
    const els = {};
    let dragMode = '';
    let dragStartX = 0;
    let dragStartRange = null;
    let renderRaf = 0;
    let lastSignature = '';

    function byId(id) { return document.getElementById(id); }

    function collect() {
        els.overlay = byId('rangeDragOverlay');
        els.canvas = byId('waveformCanvas');
        els.startInput = byId('rangeStartInput');
        els.endInput = byId('rangeEndInput');
        els.applyBtn = byId('applyRangeBtn');
        els.snapBtn = byId('snapRangeBtn');
    }

    function selected() {
        const list = Array.isArray(state.recommendations) ? state.recommendations : [];
        return list.find(item => item && item.id === state.selectedRecommendationId) || null;
    }

    function totalDuration(item) {
        const metaDuration = Number(state.fileMeta && state.fileMeta.duration) || 0;
        const recMax = Math.max.apply(null, (state.recommendations || []).map(rec => Number(rec.end) || 0).concat([0]));
        return Math.max(1, metaDuration || recMax || Number(item && item.end) || 1);
    }

    function setInputs(start, end) {
        if (els.startInput) els.startInput.value = Number(start || 0).toFixed(1);
        if (els.endInput) els.endInput.value = Number(end || 0).toFixed(1);
    }

    function applyRange() {
        if (els.applyBtn && !els.applyBtn.disabled) els.applyBtn.click();
    }

    function currentSignature(item, total) {
        if (!item) return 'empty';
        const width = Math.round((els.overlay && els.overlay.getBoundingClientRect().width) || 0);
        return [item.id, Number(item.start).toFixed(3), Number(item.end).toFixed(3), Number(total).toFixed(3), width].join('|');
    }

    function render(force) {
        if (!els.overlay || dragMode) return;
        const item = selected();
        const enabled = Boolean(item);
        if (els.snapBtn) els.snapBtn.disabled = !enabled;
        const total = enabled ? totalDuration(item) : 1;
        const signature = currentSignature(item, total);
        if (!force && signature === lastSignature) return;
        lastSignature = signature;

        if (!enabled) {
            if (els.overlay.childElementCount) els.overlay.replaceChildren();
            return;
        }

        const startPct = Math.max(0, Math.min(100, (Number(item.start) / total) * 100));
        const endPct = Math.max(startPct + 0.5, Math.min(100, (Number(item.end) / total) * 100));
        const selection = document.createElement('div');
        selection.className = 'drag-selection';
        selection.style.left = startPct + '%';
        selection.style.width = Math.max(2.8, endPct - startPct) + '%';
        selection.dataset.dragMode = 'move';

        const startHandle = document.createElement('span');
        startHandle.className = 'drag-handle drag-handle-start';
        startHandle.dataset.dragMode = 'start';
        startHandle.setAttribute('aria-label', '시작점 조절');
        const endHandle = document.createElement('span');
        endHandle.className = 'drag-handle drag-handle-end';
        endHandle.dataset.dragMode = 'end';
        endHandle.setAttribute('aria-label', '끝점 조절');
        const bubble = document.createElement('span');
        bubble.className = 'drag-time-bubble';
        bubble.textContent = utils.formatRange ? utils.formatRange(item.start, item.end) : `${Number(item.start).toFixed(1)} ~ ${Number(item.end).toFixed(1)}`;

        selection.appendChild(startHandle);
        selection.appendChild(endHandle);
        selection.appendChild(bubble);
        els.overlay.replaceChildren(selection);
    }

    function scheduleRender(force) {
        if (force) lastSignature = '';
        if (renderRaf) return;
        const schedule = global.requestAnimationFrame || (callback => global.setTimeout(callback, 16));
        renderRaf = schedule(() => {
            renderRaf = 0;
            render(Boolean(force));
        });
    }

    function pointToTime(clientX) {
        const rect = els.overlay.getBoundingClientRect();
        const ratio = rect.width ? (clientX - rect.left) / rect.width : 0;
        return Math.max(0, Math.min(totalDuration(selected()), ratio * totalDuration(selected())));
    }

    function onPointerDown(event) {
        const target = event.target && event.target.closest('[data-drag-mode]');
        if (!target) return;
        const item = selected();
        if (!item) return;
        dragMode = target.dataset.dragMode || 'move';
        dragStartX = event.clientX;
        dragStartRange = { start: Number(item.start) || 0, end: Number(item.end) || 0 };
        event.preventDefault();
        target.setPointerCapture && target.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (!dragMode || !dragStartRange) return;
        const item = selected();
        if (!item) return;
        const total = totalDuration(item);
        const rect = els.overlay.getBoundingClientRect();
        const deltaTime = rect.width ? ((event.clientX - dragStartX) / rect.width) * total : 0;
        let start = dragStartRange.start;
        let end = dragStartRange.end;
        const minimum = 1;
        if (dragMode === 'start') {
            start = Math.max(0, Math.min(end - minimum, pointToTime(event.clientX)));
        } else if (dragMode === 'end') {
            end = Math.min(total, Math.max(start + minimum, pointToTime(event.clientX)));
        } else {
            const length = Math.max(minimum, end - start);
            start = Math.max(0, Math.min(total - length, dragStartRange.start + deltaTime));
            end = start + length;
        }
        setInputs(start, end);
        const startPct = (start / total) * 100;
        const endPct = (end / total) * 100;
        const selection = els.overlay.querySelector('.drag-selection');
        const bubble = els.overlay.querySelector('.drag-time-bubble');
        if (selection) {
            selection.style.left = startPct + '%';
            selection.style.width = Math.max(2.8, endPct - startPct) + '%';
        }
        if (bubble) bubble.textContent = utils.formatRange ? utils.formatRange(start, end) : `${start.toFixed(1)} ~ ${end.toFixed(1)}`;
    }

    function onPointerUp() {
        if (!dragMode) return;
        dragMode = '';
        dragStartRange = null;
        lastSignature = '';
        applyRange();
        global.setTimeout(() => scheduleRender(true), 60);
    }

    function snapToCurrentTime() {
        const item = selected();
        if (!item) return;
        const media = state.fileKind === 'video' ? byId('sourceVideo') : byId('sourceAudio');
        const current = Math.max(0, Number(media && media.currentTime) || Number(item.start) || 0);
        const length = Math.max(1, Number(item.end) - Number(item.start));
        const total = totalDuration(item);
        const start = Math.min(Math.max(0, current), Math.max(0, total - length));
        setInputs(start, start + length);
        applyRange();
        global.setTimeout(() => scheduleRender(true), 60);
    }

    function install() {
        collect();
        if (!els.overlay) return;
        els.overlay.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp, { passive: true });
        if (els.snapBtn) els.snapBtn.addEventListener('click', snapToCurrentTime);

        const observer = new MutationObserver(() => scheduleRender(false));
        const watched = [byId('recommendationList'), byId('selectedRangeText'), els.startInput, els.endInput].filter(Boolean);
        watched.forEach(node => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true }));
        [els.startInput, els.endInput].filter(Boolean).forEach(input => {
            input.addEventListener('change', () => scheduleRender(true), { passive: true });
        });
        document.addEventListener('ai-shorts-flow-sync', () => scheduleRender(false));
        global.addEventListener('resize', () => scheduleRender(true), { passive: true });
        if ('ResizeObserver' in global) {
            const resizeObserver = new ResizeObserver(() => scheduleRender(true));
            resizeObserver.observe(els.overlay);
        }
        render(true);
    }

    global.AIShortsRangeDragControls = Object.freeze({ render: () => scheduleRender(true) });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
})(window);
