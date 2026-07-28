// AI Shorts Studio v1.6.20 - draggable crop-keyframe timeline, clipboard, and range application
'use strict';

(function exposeCropKeyframeTimeline(global) {
    const doc = global.document;
    if (!doc) return;

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.max(min, Math.min(max, number));
    }

    function copyKeyframe(input) {
        const value = input || {};
        return Object.freeze({
            time: Math.max(0, Number(value.time) || 0),
            x: clamp(value.x, 0, 1),
            y: clamp(value.y, 0, 1),
            zoom: clamp(value.zoom == null ? 1.08 : value.zoom, 1, 1.35)
        });
    }

    function nearestKeyframe(keyframes, time, tolerance) {
        const list = Array.isArray(keyframes) ? keyframes : [];
        const target = Math.max(0, Number(time) || 0);
        const radius = tolerance == null ? Infinity : Math.max(0, Number(tolerance) || 0);
        let nearest = null;
        let distance = Infinity;
        list.forEach(item => {
            const next = Math.abs((Number(item.time) || 0) - target);
            if (next < distance) { nearest = item; distance = next; }
        });
        return nearest && distance <= radius ? nearest : null;
    }

    function createController(options) {
        const opts = options || {};
        const elements = opts.elements || {};
        const panel = elements.panel;
        const trackElement = elements.track;
        const markerLayer = elements.markerLayer;
        const sceneLayer = elements.sceneLayer;
        const playhead = elements.playhead;
        const status = elements.status;
        const count = elements.count;
        const copyButton = elements.copyButton;
        const pasteButton = elements.pasteButton;
        const rangeButton = elements.rangeButton;
        const deleteButton = elements.deleteButton;
        let selectedTime = null;
        let clipboard = null;
        let drag = null;
        let destroyed = false;

        function getTrack() { return typeof opts.getTrack === 'function' ? opts.getTrack() : null; }
        function getTime() { return Math.max(0, Number(typeof opts.getTime === 'function' ? opts.getTime() : 0) || 0); }
        function getDuration() {
            const track = getTrack();
            const lastKey = track && track.keyframes && track.keyframes.length ? Number(track.keyframes[track.keyframes.length - 1].time) || 0 : 0;
            const lastPoint = track && track.points && track.points.length ? Number(track.points[track.points.length - 1].time) || 0 : 0;
            return Math.max(0.1, Number(typeof opts.getDuration === 'function' ? opts.getDuration() : 0) || 0, lastKey, lastPoint);
        }
        function notify(message, kind) { if (typeof opts.notify === 'function') opts.notify(message, kind); }
        function percentage(time) { return clamp((Number(time) || 0) / getDuration() * 100, 0, 100); }
        function formatTime(value) {
            const total = Math.max(0, Number(value) || 0);
            const minutes = Math.floor(total / 60);
            const seconds = total - minutes * 60;
            return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
        }
        function setSelected(time, seek) {
            selectedTime = Number.isFinite(Number(time)) ? Math.max(0, Number(time)) : null;
            if (seek && selectedTime != null && typeof opts.seek === 'function') opts.seek(selectedTime);
        }
        function selectedKeyframe() {
            const track = getTrack();
            if (!track || !Array.isArray(track.keyframes) || !track.keyframes.length) return null;
            return nearestKeyframe(track.keyframes, selectedTime == null ? getTime() : selectedTime, 0.12);
        }
        function snapTime(raw) {
            const duration = getDuration();
            let value = clamp(raw, 0, duration);
            const cuts = (getTrack() && getTrack().sceneCuts) || [];
            const cut = nearestKeyframe(cuts.map(time => ({ time })), value, Math.max(0.08, duration * 0.004));
            if (cut) value = cut.time;
            else value = Math.round(value * 20) / 20;
            return clamp(value, 0, duration);
        }
        function timeFromClientX(clientX) {
            const rect = trackElement.getBoundingClientRect();
            return snapTime(((clientX - rect.left) / Math.max(1, rect.width)) * getDuration());
        }
        function updateButtons() {
            const ready = Boolean(getTrack());
            const selected = selectedKeyframe();
            const range = typeof opts.getRange === 'function' ? opts.getRange() : null;
            if (copyButton) copyButton.disabled = !ready || !selected;
            if (pasteButton) pasteButton.disabled = !ready || !clipboard;
            if (rangeButton) rangeButton.disabled = !ready || !clipboard || !range || !(Number(range.end) > Number(range.start));
            if (deleteButton) deleteButton.disabled = !ready || !selected;
        }
        function updateStatus() {
            const track = getTrack();
            const keyframes = track && Array.isArray(track.keyframes) ? track.keyframes : [];
            const selected = selectedKeyframe();
            if (count) count.textContent = `${keyframes.length}개`;
            if (!status) return;
            if (!track) status.textContent = '피사체 추적 후 타임라인을 사용할 수 있습니다.';
            else if (drag) status.textContent = `${formatTime(drag.previewTime)}로 이동 중 · 놓으면 저장`;
            else if (selected) status.textContent = `${formatTime(selected.time)} 선택 · ${Math.round(selected.x * 100)}%, ${Math.round(selected.y * 100)}% · ${Math.round(selected.zoom * 100)}%`;
            else if (clipboard) status.textContent = `복사한 크롭 준비 · 재생 위치 또는 선택 구간에 붙여넣기`;
            else status.textContent = '키프레임을 선택하거나 마커를 드래그해 시간을 조정하세요.';
        }
        function renderScenes() {
            if (!sceneLayer) return;
            sceneLayer.textContent = '';
            const track = getTrack();
            (track && track.sceneCuts || []).forEach(time => {
                const tick = doc.createElement('span');
                tick.className = 'crop-keyframe-scene-cut';
                tick.style.left = `${percentage(time)}%`;
                tick.title = `장면 전환 ${formatTime(time)}`;
                sceneLayer.appendChild(tick);
            });
        }
        function markerLabel(item, index) {
            return `크롭 키프레임 ${index + 1}, ${formatTime(item.time)}, 가로 ${Math.round(item.x * 100)}%, 세로 ${Math.round(item.y * 100)}%, 확대 ${Math.round(item.zoom * 100)}%`;
        }
        function renderMarkers() {
            if (!markerLayer) return;
            markerLayer.textContent = '';
            const track = getTrack();
            const keyframes = track && Array.isArray(track.keyframes) ? track.keyframes : [];
            keyframes.forEach((item, index) => {
                const marker = doc.createElement('button');
                marker.type = 'button';
                marker.className = 'crop-keyframe-marker';
                marker.style.left = `${percentage(item.time)}%`;
                marker.dataset.time = String(item.time);
                marker.dataset.selected = selectedTime != null && Math.abs(selectedTime - item.time) <= 0.08 ? 'true' : 'false';
                marker.setAttribute('aria-label', markerLabel(item, index));
                marker.title = `${formatTime(item.time)} · 드래그해 이동`;
                marker.addEventListener('click', event => {
                    if (drag) return;
                    event.stopPropagation();
                    setSelected(item.time, true);
                    sync();
                });
                marker.addEventListener('pointerdown', event => {
                    if (event.button > 0) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setSelected(item.time, true);
                    drag = { pointerId: event.pointerId, fromTime: item.time, previewTime: item.time, marker };
                    try { marker.setPointerCapture(event.pointerId); } catch (_) { /* ignored */ }
                    updateStatus();
                });
                marker.addEventListener('pointermove', event => {
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    event.preventDefault();
                    drag.previewTime = timeFromClientX(event.clientX);
                    marker.style.left = `${percentage(drag.previewTime)}%`;
                    selectedTime = drag.previewTime;
                    updateStatus();
                    updatePlayhead();
                });
                const finish = event => {
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    event.preventDefault();
                    const operation = drag;
                    drag = null;
                    try { marker.releasePointerCapture(event.pointerId); } catch (_) { /* ignored */ }
                    if (typeof opts.move === 'function') opts.move(operation.fromTime, operation.previewTime);
                    selectedTime = operation.previewTime;
                    sync();
                };
                marker.addEventListener('pointerup', finish);
                marker.addEventListener('pointercancel', () => { drag = null; sync(); });
                marker.addEventListener('keydown', event => {
                    if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        if (typeof opts.remove === 'function') opts.remove(item.time);
                        selectedTime = null;
                        sync();
                        return;
                    }
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                    event.preventDefault();
                    const step = event.shiftKey ? 1 : 0.1;
                    const next = snapTime(item.time + (event.key === 'ArrowLeft' ? -step : step));
                    if (typeof opts.move === 'function') opts.move(item.time, next);
                    selectedTime = next;
                    sync();
                });
                markerLayer.appendChild(marker);
            });
        }
        function updatePlayhead() {
            if (!playhead) return;
            const time = selectedTime == null ? getTime() : selectedTime;
            playhead.style.left = `${percentage(time)}%`;
            playhead.title = `현재 ${formatTime(time)}`;
        }
        function sync() {
            if (destroyed) return;
            const track = getTrack();
            if (panel) panel.hidden = !track;
            if (selectedTime != null && !nearestKeyframe(track && track.keyframes, selectedTime, 0.15) && !drag) selectedTime = null;
            renderScenes();
            renderMarkers();
            updatePlayhead();
            updateButtons();
            updateStatus();
        }
        function copySelected() {
            const selected = selectedKeyframe();
            if (!selected) { notify('복사할 크롭 키프레임을 먼저 선택하세요.', 'warning'); return; }
            clipboard = copyKeyframe(selected);
            notify(`${formatTime(selected.time)} 크롭 키프레임을 복사했습니다.`, 'action');
            sync();
        }
        function pasteAtPlayhead() {
            if (!clipboard || typeof opts.paste !== 'function') return;
            const time = getTime();
            opts.paste(clipboard, time);
            selectedTime = time;
            notify(`${formatTime(time)} 위치에 복사한 크롭을 붙여넣었습니다.`, 'success');
            sync();
        }
        function applyToRange() {
            if (!clipboard || typeof opts.applyRange !== 'function') return;
            const range = typeof opts.getRange === 'function' ? opts.getRange() : null;
            if (!range || !(Number(range.end) > Number(range.start))) { notify('먼저 적용할 영상 구간을 선택하세요.', 'warning'); return; }
            const track = getTrack();
            const replaced = (track && track.keyframes || []).filter(item => item.time >= Number(range.start) && item.time <= Number(range.end)).length;
            if (replaced && typeof global.confirm === 'function' && !global.confirm(`선택 구간의 기존 키프레임 ${replaced}개를 정리하고 복사한 크롭을 적용할까요?`)) return;
            opts.applyRange(clipboard, Number(range.start), Number(range.end));
            selectedTime = Number(range.start);
            notify(`${formatTime(range.start)}–${formatTime(range.end)} 구간에 크롭을 일괄 적용했습니다.`, 'success');
            sync();
        }
        function deleteSelected() {
            const selected = selectedKeyframe();
            if (!selected || typeof opts.remove !== 'function') return;
            opts.remove(selected.time);
            notify(`${formatTime(selected.time)} 키프레임을 삭제했습니다.`, 'action');
            selectedTime = null;
            sync();
        }
        function onTrackClick(event) {
            if (!trackElement || event.target !== trackElement && !event.target.classList.contains('crop-keyframe-track-surface')) return;
            const time = timeFromClientX(event.clientX);
            setSelected(time, true);
            sync();
        }

        if (trackElement) trackElement.addEventListener('click', onTrackClick);
        if (copyButton) copyButton.addEventListener('click', copySelected);
        if (pasteButton) pasteButton.addEventListener('click', pasteAtPlayhead);
        if (rangeButton) rangeButton.addEventListener('click', applyToRange);
        if (deleteButton) deleteButton.addEventListener('click', deleteSelected);
        sync();
        return Object.freeze({
            sync,
            select(time, seek) { setSelected(time, seek); sync(); },
            getClipboard: () => clipboard,
            destroy() {
                destroyed = true;
                if (trackElement) trackElement.removeEventListener('click', onTrackClick);
                if (copyButton) copyButton.removeEventListener('click', copySelected);
                if (pasteButton) pasteButton.removeEventListener('click', pasteAtPlayhead);
                if (rangeButton) rangeButton.removeEventListener('click', applyToRange);
                if (deleteButton) deleteButton.removeEventListener('click', deleteSelected);
            }
        });
    }

    global.AIShortsCropKeyframeTimeline = Object.freeze({ createController, _test: Object.freeze({ clamp, copyKeyframe, nearestKeyframe }) });
    doc.dispatchEvent(new CustomEvent('ai-shorts-crop-keyframe-timeline-ready'));
})(window);
