// AI Shorts Studio v1.6.9 - direct preview crop gestures and keyframe path editing
'use strict';

(function exposeDirectCropEditor(global) {
    const doc = global.document;
    if (!doc) return;

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.max(min, Math.min(max, number));
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function copyDraft(input, fallback) {
        const base = fallback || { time: 0, x: 0.5, y: 0.46, zoom: 1.08 };
        const value = input || {};
        return {
            time: Math.max(0, Number.isFinite(Number(value.time)) ? Number(value.time) : base.time),
            x: clamp(value.x, 0, 1),
            y: clamp(value.y, 0, 1),
            zoom: clamp(value.zoom == null ? base.zoom : value.zoom, 1, 1.35)
        };
    }

    function createController(options) {
        const opts = options || {};
        const elements = opts.elements || {};
        const canvas = elements.canvas;
        const frame = elements.frame;
        const overlay = elements.overlay;
        const panel = elements.panel;
        const toggleButton = elements.toggleButton;
        const saveButton = elements.saveButton;
        const undoButton = elements.undoButton;
        const status = elements.status;
        const detail = elements.detail;
        const pathSvg = elements.pathSvg;
        const pathLine = elements.pathLine;
        const pathDots = elements.pathDots;
        const currentDot = elements.currentDot;
        const hint = elements.hint;
        const pointers = new Map();
        let active = false;
        let gesture = null;
        let wheelTimer = 0;
        let previousDraft = null;
        let destroyed = false;

        function getTrack() { return typeof opts.getTrack === 'function' ? opts.getTrack() : null; }
        function getTime() { return typeof opts.getTime === 'function' ? Math.max(0, Number(opts.getTime()) || 0) : 0; }
        function getDraft() { return copyDraft(typeof opts.getDraft === 'function' ? opts.getDraft() : null, { time: getTime(), x: 0.5, y: 0.46, zoom: 1.08 }); }
        function isReady() { return Boolean(typeof opts.isReady === 'function' ? opts.isReady() : getTrack()); }
        function notify(message, kind) { if (typeof opts.notify === 'function') opts.notify(message, kind); }
        function render() { if (typeof opts.render === 'function') opts.render(); }

        function setDraft(next, source) {
            const value = copyDraft(Object.assign({}, next, { time: getTime() }), getDraft());
            if (typeof opts.setDraft === 'function') opts.setDraft(value, source || 'direct');
            updatePath(value);
            render();
            return value;
        }

        function commit(source, quiet) {
            if (!isReady()) return false;
            if (typeof opts.commit === 'function') opts.commit(source || 'direct', Boolean(quiet));
            sync();
            return true;
        }

        function setActive(next, reason) {
            const ready = isReady();
            active = Boolean(next && ready);
            if (!active) {
                const pointerIds = Array.from(pointers.keys());
                gesture = null;
                if (canvas && canvas.releasePointerCapture) {
                    pointerIds.forEach(id => { try { canvas.releasePointerCapture(id); } catch (_) { /* ignored */ } });
                }
                pointers.clear();
            }
            if (overlay) overlay.dataset.active = active ? 'true' : 'false';
            if (frame) frame.dataset.directCrop = active ? 'true' : 'false';
            if (toggleButton) {
                toggleButton.setAttribute('aria-pressed', active ? 'true' : 'false');
                toggleButton.textContent = active ? '직접 편집 종료' : '화면에서 직접 편집';
                toggleButton.disabled = !ready;
            }
            if (hint) hint.textContent = active ? '화면을 드래그하고 휠·핀치로 확대하세요. 조작이 끝나면 현재 위치에 자동 저장됩니다.' : '직접 편집을 켜면 미리보기 화면에서 크롭을 움직일 수 있습니다.';
            if (status) status.textContent = !ready ? '추적 후 사용 가능' : active ? '직접 편집 중' : '대기';
            if (reason === 'user') notify(active ? '미리보기 직접 크롭 편집을 시작했습니다.' : '직접 크롭 편집을 종료했습니다.', 'action');
            return active;
        }

        function getCropScale(draft) {
            const video = typeof opts.getMedia === 'function' ? opts.getMedia() : null;
            const engine = global.AIShortsSmartReframe || {};
            const sourceWidth = Number(video && video.videoWidth) || 1920;
            const sourceHeight = Number(video && video.videoHeight) || 1080;
            const targetWidth = Number(canvas && canvas.width) || 1080;
            const targetHeight = Number(canvas && canvas.height) || 1920;
            if (engine.resolveCropRect) {
                const rect = engine.resolveCropRect(sourceWidth, sourceHeight, targetWidth, targetHeight, Object.assign({ source: 'manual', confidence: 1 }, draft), typeof opts.getReframeOptions === 'function' ? opts.getReframeOptions() : {});
                return { x: rect.sw / sourceWidth, y: rect.sh / sourceHeight };
            }
            return { x: 0.32 / Math.max(1, draft.zoom), y: 1 / Math.max(1, draft.zoom) };
        }

        function beginGesture() {
            const draft = getDraft();
            previousDraft = copyDraft(draft);
            const list = Array.from(pointers.values());
            gesture = {
                startDraft: draft,
                startPointers: list.map(item => ({ id: item.id, x: item.x, y: item.y })),
                startDistance: list.length > 1 ? distance(list[0], list[1]) : 0
            };
            if (typeof opts.pause === 'function') opts.pause();
            syncButtons();
        }

        function pointerPoint(event) {
            const rect = canvas.getBoundingClientRect();
            return { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top, width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
        }

        function onPointerDown(event) {
            if (!active || !isReady() || event.button > 0) return;
            event.preventDefault();
            const point = pointerPoint(event);
            pointers.set(event.pointerId, point);
            try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* ignored */ }
            beginGesture();
        }

        function onPointerMove(event) {
            if (!active || !gesture || !pointers.has(event.pointerId)) return;
            event.preventDefault();
            pointers.set(event.pointerId, pointerPoint(event));
            const current = Array.from(pointers.values());
            const start = gesture.startPointers;
            let next = copyDraft(gesture.startDraft);
            if (current.length > 1 && start.length > 1) {
                const currentDistance = Math.max(1, distance(current[0], current[1]));
                const scale = currentDistance / Math.max(1, gesture.startDistance);
                next.zoom = clamp(gesture.startDraft.zoom * scale, 1, 1.35);
                const currentCenter = { x: (current[0].x + current[1].x) / 2, y: (current[0].y + current[1].y) / 2 };
                const startCenter = { x: (start[0].x + start[1].x) / 2, y: (start[0].y + start[1].y) / 2 };
                const cropScale = getCropScale(next);
                next.x = clamp(gesture.startDraft.x - ((currentCenter.x - startCenter.x) / current[0].width) * cropScale.x, 0, 1);
                next.y = clamp(gesture.startDraft.y - ((currentCenter.y - startCenter.y) / current[0].height) * cropScale.y, 0, 1);
            } else {
                const point = current[0];
                const origin = start[0] || point;
                const cropScale = getCropScale(next);
                next.x = clamp(gesture.startDraft.x - ((point.x - origin.x) / point.width) * cropScale.x, 0, 1);
                next.y = clamp(gesture.startDraft.y - ((point.y - origin.y) / point.height) * cropScale.y, 0, 1);
            }
            setDraft(next, 'pointer');
        }

        function endPointer(event) {
            if (!pointers.has(event.pointerId)) return;
            event.preventDefault();
            pointers.delete(event.pointerId);
            try { canvas.releasePointerCapture(event.pointerId); } catch (_) { /* ignored */ }
            if (pointers.size) {
                beginGesture();
                return;
            }
            if (gesture) commit('gesture', true);
            gesture = null;
            syncButtons();
        }

        function onWheel(event) {
            if (!active || !isReady()) return;
            event.preventDefault();
            if (typeof opts.pause === 'function') opts.pause();
            const draft = getDraft();
            if (!previousDraft) previousDraft = copyDraft(draft);
            const step = event.deltaY < 0 ? 0.015 : -0.015;
            setDraft(Object.assign({}, draft, { zoom: clamp(draft.zoom + step, 1, 1.35) }), 'wheel');
            global.clearTimeout(wheelTimer);
            wheelTimer = global.setTimeout(() => { commit('wheel', true); wheelTimer = 0; }, 320);
            syncButtons();
        }

        function onDocumentKeyDown(event) {
            if (!active || event.key !== 'Escape') return;
            event.preventDefault();
            setActive(false, 'user');
        }

        function onKeyDown(event) {
            if (!active || !isReady()) return;
            const key = event.key;
            if (key === 'Escape') { event.preventDefault(); setActive(false, 'user'); return; }
            if (key === 'Enter') { event.preventDefault(); commit('keyboard', false); return; }
            const draft = getDraft();
            const move = event.shiftKey ? 0.02 : 0.006;
            let next = null;
            if (key === 'ArrowLeft') next = Object.assign({}, draft, { x: clamp(draft.x - move, 0, 1) });
            else if (key === 'ArrowRight') next = Object.assign({}, draft, { x: clamp(draft.x + move, 0, 1) });
            else if (key === 'ArrowUp') next = Object.assign({}, draft, { y: clamp(draft.y - move, 0, 1) });
            else if (key === 'ArrowDown') next = Object.assign({}, draft, { y: clamp(draft.y + move, 0, 1) });
            else if (key === '+' || key === '=') next = Object.assign({}, draft, { zoom: clamp(draft.zoom + 0.01, 1, 1.35) });
            else if (key === '-' || key === '_') next = Object.assign({}, draft, { zoom: clamp(draft.zoom - 0.01, 1, 1.35) });
            if (!next) return;
            event.preventDefault();
            if (!previousDraft) previousDraft = copyDraft(draft);
            setDraft(next, 'keyboard');
            global.clearTimeout(wheelTimer);
            wheelTimer = global.setTimeout(() => { commit('keyboard', true); wheelTimer = 0; }, 260);
            syncButtons();
        }

        function undo() {
            if (!previousDraft || !isReady()) return;
            setDraft(previousDraft, 'undo');
            previousDraft = null;
            commit('undo', false);
            notify('직전 직접 크롭 조정을 되돌렸습니다.', 'action');
            syncButtons();
        }

        function syncButtons() {
            const ready = isReady();
            if (saveButton) saveButton.disabled = !ready;
            if (undoButton) undoButton.disabled = !ready || !previousDraft;
        }

        function updatePath(current) {
            const track = getTrack();
            const keyframes = Array.isArray(track && track.keyframes) ? track.keyframes : [];
            const points = keyframes.map(item => `${(clamp(item.x, 0, 1) * 100).toFixed(2)},${(clamp(item.y, 0, 1) * 100).toFixed(2)}`).join(' ');
            if (pathLine) pathLine.setAttribute('points', points);
            if (pathDots) {
                while (pathDots.firstChild) pathDots.removeChild(pathDots.firstChild);
                keyframes.forEach((item, index) => {
                    const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', (clamp(item.x, 0, 1) * 100).toFixed(2));
                    circle.setAttribute('cy', (clamp(item.y, 0, 1) * 100).toFixed(2));
                    circle.setAttribute('r', '2.3');
                    circle.dataset.index = String(index);
                    pathDots.appendChild(circle);
                });
            }
            const draft = current || getDraft();
            if (currentDot) {
                currentDot.setAttribute('cx', (clamp(draft.x, 0, 1) * 100).toFixed(2));
                currentDot.setAttribute('cy', (clamp(draft.y, 0, 1) * 100).toFixed(2));
            }
            if (detail) detail.textContent = keyframes.length ? `크롭 경로 ${keyframes.length}개 · 현재 ${Math.round(draft.x * 100)}%, ${Math.round(draft.y * 100)}% · ${Math.round(draft.zoom * 100)}%` : `현재 ${Math.round(draft.x * 100)}%, ${Math.round(draft.y * 100)}% · ${Math.round(draft.zoom * 100)}%`;
            if (pathSvg) pathSvg.dataset.empty = keyframes.length ? 'false' : 'true';
        }

        function sync() {
            if (destroyed) return;
            const ready = isReady();
            if (panel) panel.hidden = !ready;
            if (!ready && active) setActive(false);
            if (toggleButton) toggleButton.disabled = !ready;
            syncButtons();
            updatePath();
            if (status) status.textContent = !ready ? '추적 후 사용 가능' : active ? '직접 편집 중' : '대기';
        }

        doc.addEventListener('keydown', onDocumentKeyDown);
        if (toggleButton) toggleButton.addEventListener('click', () => setActive(!active, 'user'));
        if (saveButton) saveButton.addEventListener('click', () => { previousDraft = previousDraft || copyDraft(getDraft()); commit('button', false); syncButtons(); });
        if (undoButton) undoButton.addEventListener('click', undo);
        if (canvas) {
            canvas.addEventListener('pointerdown', onPointerDown);
            canvas.addEventListener('pointermove', onPointerMove);
            canvas.addEventListener('pointerup', endPointer);
            canvas.addEventListener('pointercancel', endPointer);
            canvas.addEventListener('wheel', onWheel, { passive: false });
            canvas.addEventListener('keydown', onKeyDown);
        }

        sync();
        return Object.freeze({
            sync,
            setActive,
            isActive: () => active,
            destroy() {
                destroyed = true;
                global.clearTimeout(wheelTimer);
                doc.removeEventListener('keydown', onDocumentKeyDown);
                if (canvas) {
                    canvas.removeEventListener('pointerdown', onPointerDown);
                    canvas.removeEventListener('pointermove', onPointerMove);
                    canvas.removeEventListener('pointerup', endPointer);
                    canvas.removeEventListener('pointercancel', endPointer);
                    canvas.removeEventListener('wheel', onWheel);
                    canvas.removeEventListener('keydown', onKeyDown);
                }
            }
        });
    }

    global.AIShortsDirectCropEditor = Object.freeze({ createController, _test: Object.freeze({ clamp, copyDraft, distance }) });
    doc.dispatchEvent(new CustomEvent('ai-shorts-direct-crop-module-ready'));
})(window);
