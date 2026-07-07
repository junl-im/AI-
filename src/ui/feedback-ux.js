// AI Shorts Studio v0.8.2 - tactile feedback, categorized haptics, and toast styling
'use strict';

(function bootFeedbackUX(global) {
    const state = {
        lastVibrateAt: 0,
        lastToastText: '',
        enabled: true,
        reducedMotion: false
    };

    function canVibrate() {
        return state.enabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    }

    function patternFor(kind) {
        const map = {
            tap: 8,
            file: [10, 20, 12],
            action: [12, 26, 12],
            analyze: [16, 32, 16],
            success: [18, 38, 18],
            warn: [28, 34, 28],
            error: [42, 42, 42],
            export: [14, 24, 14, 24, 18],
            copy: [10, 18, 10],
            select: 6
        };
        return map[kind] || map.tap;
    }

    function vibrate(kind) {
        const now = Date.now();
        if (now - state.lastVibrateAt < 90) return;
        state.lastVibrateAt = now;
        if (!canVibrate()) return;
        try { navigator.vibrate(patternFor(kind)); } catch (error) { /* ignore unsupported haptics */ }
    }

    function classifyText(message) {
        const text = String(message || '');
        if (!text) return 'action';
        if (/실패|오류|못했습니다|제한|지원하지|찾지 못|위험/.test(text)) return 'error';
        if (/주의|브라우저|정책상|권장|무음/.test(text)) return 'warn';
        if (/파일|불러왔|열어/.test(text)) return 'file';
        if (/분석|계산|추천|컷/.test(text)) return 'analyze';
        if (/저장|내보내기|다운로드|PNG|WEBM|MP4/.test(text)) return 'export';
        if (/복사/.test(text)) return 'copy';
        if (/적용|완료|만들었|보정|불러왔습니다/.test(text)) return 'success';
        return 'action';
    }

    function setToastKind(toast, kind) {
        if (!toast) return;
        Array.from(toast.classList).forEach(name => {
            if (name.indexOf('toast-kind-') === 0) toast.classList.remove(name);
        });
        toast.classList.add(`toast-kind-${kind}`);
    }

    function announce(message, explicitKind) {
        const kind = explicitKind || classifyText(message);
        const toast = document.getElementById('toast');
        setToastKind(toast, kind);
        vibrate(kind);
    }

    function getActionKind(target) {
        const text = [target.id, target.getAttribute('aria-label'), target.textContent].join(' ');
        if (/file|파일|projectFile|captionFile/i.test(text)) return 'file';
        if (/analyze|분석|추천|refreshCuts|autoTrim/i.test(text)) return 'analyze';
        if (/export|download|thumbnail|내보내기|저장|썸네일/i.test(text)) return 'export';
        if (/copy|diagnostics|복사|진단/i.test(text)) return 'copy';
        if (/warning|danger|clear|비웠|삭제|초기화/i.test(text)) return 'warn';
        return target.matches('select,input,textarea,.recommendation-card') ? 'select' : 'tap';
    }

    function installPressFeedback() {
        document.addEventListener('pointerdown', event => {
            const target = event.target && event.target.closest && event.target.closest('button, label[for], a, select, input[type="checkbox"], input[type="radio"], .recommendation-card, .caption-preset, .mini-action');
            if (!target) return;
            if (target.matches('button:disabled, [aria-disabled="true"]')) return;
            target.classList.add('fx-pressable');
            const rect = target.getBoundingClientRect();
            target.style.setProperty('--fx-x', `${event.clientX - rect.left}px`);
            target.style.setProperty('--fx-y', `${event.clientY - rect.top}px`);
            target.classList.remove('fx-ripple', 'fx-haptic-pulse');
            void target.offsetWidth;
            target.classList.add('fx-ripple', 'fx-haptic-pulse');
            vibrate(getActionKind(target));
        }, { passive: true, capture: true });

        document.addEventListener('animationend', event => {
            if (event.target && event.target.classList) {
                event.target.classList.remove('fx-ripple', 'fx-haptic-pulse');
            }
        }, true);
    }

    function installToastObserver() {
        const toast = document.getElementById('toast');
        if (!toast) return;
        const observer = new MutationObserver(() => {
            const text = toast.textContent.trim();
            if (!text || text === state.lastToastText || !toast.classList.contains('toast-visible')) return;
            state.lastToastText = text;
            announce(text);
        });
        observer.observe(toast, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    function installInputFeedback() {
        document.addEventListener('change', event => {
            const target = event.target;
            if (!target || !target.matches || !target.matches('select, input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"]')) return;
            if (target.type === 'file') vibrate('file');
            else vibrate('select');
        }, true);
    }

    function init() {
        state.reducedMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
        installPressFeedback();
        installToastObserver();
        installInputFeedback();
        const signature = document.querySelector('.brand-signature-pill');
        if (signature) signature.title = 'Design by 곰같은여우';
    }

    global.AIShortsFeedbackUX = { vibrate, announce, classifyText, setToastKind };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
