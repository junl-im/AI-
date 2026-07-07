// AI Shorts Studio v0.7.0 - output quality helpers
'use strict';

(function exposeQualityEffects(global) {
    const DEFAULTS = Object.freeze({
        brightness: 1,
        contrast: 1.06,
        saturation: 1.12,
        vignette: 0.22,
        fadeIn: 0.4,
        fadeOut: 1.0,
        introText: '',
        outroText: '',
        introDuration: 1.2,
        outroDuration: 1.2,
        watermarkText: '',
        watermarkPosition: 'bottom-right',
        safeGuide: true
    });

    function clamp(value, min, max) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return min;
        return Math.min(max, Math.max(min, numeric));
    }

    function normalizeQualityOptions(input) {
        const raw = Object.assign({}, DEFAULTS, input || {});
        return {
            brightness: clamp(raw.brightness, 0.7, 1.3),
            contrast: clamp(raw.contrast, 0.8, 1.45),
            saturation: clamp(raw.saturation, 0.7, 1.6),
            vignette: clamp(raw.vignette, 0, 0.55),
            fadeIn: clamp(raw.fadeIn, 0, 3),
            fadeOut: clamp(raw.fadeOut, 0, 3),
            introText: String(raw.introText || '').slice(0, 60),
            outroText: String(raw.outroText || '').slice(0, 60),
            introDuration: clamp(raw.introDuration, 0, 3),
            outroDuration: clamp(raw.outroDuration, 0, 3),
            watermarkText: String(raw.watermarkText || '').slice(0, 42),
            watermarkPosition: ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(raw.watermarkPosition) ? raw.watermarkPosition : 'bottom-right',
            safeGuide: raw.safeGuide !== false
        };
    }

    function getCanvasFilter(options) {
        const quality = normalizeQualityOptions(options);
        return `brightness(${quality.brightness}) contrast(${quality.contrast}) saturate(${quality.saturation})`;
    }

    function calculateFadeVolume(relativeTime, duration, options) {
        const quality = normalizeQualityOptions(options);
        let volume = 1;
        const rel = Math.max(0, Number(relativeTime) || 0);
        const total = Math.max(0, Number(duration) || 0);
        if (quality.fadeIn > 0) volume = Math.min(volume, rel / quality.fadeIn);
        if (quality.fadeOut > 0 && total > 0) volume = Math.min(volume, Math.max(0, (total - rel) / quality.fadeOut));
        return clamp(volume, 0, 1);
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

    function drawQualityOverlay(ctx, width, height, options) {
        const quality = normalizeQualityOptions(options);
        if (quality.vignette > 0.01) {
            ctx.save();
            const gradient = ctx.createRadialGradient(width / 2, height * 0.45, width * 0.18, width / 2, height * 0.48, width * 0.76);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, `rgba(0,0,0,${quality.vignette})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }

    function drawSafeGuide(ctx, width, height, options) {
        const quality = normalizeQualityOptions(options);
        if (!quality.safeGuide) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.30)';
        ctx.lineWidth = 3;
        ctx.setLineDash([18, 16]);
        const top = height * 0.16;
        const bottom = height * 0.76;
        const side = width * 0.08;
        ctx.strokeRect(side, top, width - side * 2, bottom - top);
        ctx.setLineDash([]);
        ctx.font = '800 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.54)';
        ctx.fillText('SAFE AREA', width / 2, top - 18);
        ctx.restore();
    }

    function drawWatermark(ctx, width, height, options) {
        const quality = normalizeQualityOptions(options);
        const text = quality.watermarkText.trim();
        if (!text) return;
        ctx.save();
        ctx.font = '850 28px system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(text).width;
        const padX = 22;
        const padY = 15;
        const boxW = textWidth + padX * 2;
        const boxH = 58;
        const marginX = 54;
        const marginY = 72;
        const isRight = quality.watermarkPosition.includes('right');
        const isTop = quality.watermarkPosition.includes('top');
        const x = isRight ? width - marginX - boxW : marginX;
        const y = isTop ? marginY : height - marginY - boxH;
        ctx.fillStyle = 'rgba(2,6,23,0.50)';
        roundRect(ctx, x, y, boxW, boxH, 22);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.textAlign = 'left';
        ctx.fillText(text, x + padX, y + boxH / 2);
        ctx.restore();
    }

    function drawIntroOutro(ctx, width, height, relativeTime, duration, options) {
        const quality = normalizeQualityOptions(options);
        const rel = Math.max(0, Number(relativeTime) || 0);
        const total = Math.max(0, Number(duration) || 0);
        let text = '';
        let alpha = 0;
        if (quality.introText && quality.introDuration > 0 && rel <= quality.introDuration) {
            text = quality.introText;
            alpha = 1 - Math.max(0, rel - quality.introDuration * 0.55) / Math.max(0.01, quality.introDuration * 0.45);
        } else if (quality.outroText && quality.outroDuration > 0 && total > 0 && total - rel <= quality.outroDuration) {
            text = quality.outroText;
            alpha = 1 - Math.max(0, total - rel - quality.outroDuration * 0.55) / Math.max(0.01, quality.outroDuration * 0.45);
        }
        if (!text || alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = 'rgba(2,6,23,0.68)';
        roundRect(ctx, 72, height * 0.32, width - 144, 210, 42);
        ctx.fill();
        ctx.strokeStyle = 'rgba(34,211,238,0.42)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '1000 58px system-ui, sans-serif';
        wrapText(ctx, text, width / 2, height * 0.32 + 105, width - 220, 66, 2);
        ctx.restore();
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';
        for (const word of words.length ? words : [String(text || '')]) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        const visible = lines.slice(0, maxLines || 2);
        const startY = y - ((visible.length - 1) * lineHeight) / 2;
        visible.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight));
    }

    global.AIShortsQualityEffects = Object.freeze({
        DEFAULTS,
        normalizeQualityOptions,
        getCanvasFilter,
        calculateFadeVolume,
        drawQualityOverlay,
        drawSafeGuide,
        drawWatermark,
        drawIntroOutro
    });
})(window);
