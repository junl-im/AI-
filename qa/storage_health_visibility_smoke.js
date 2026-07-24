#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function assert(condition, message) {
    if (!condition) {
        console.error(`FAIL ${message}`);
        process.exit(1);
    }
    console.log(`PASS ${message}`);
}

const pkg = JSON.parse(read('package.json'));
const panel = read('src/ui/storage-health-panel.js');
const css = read('assets/css/storage-health-panel.css');
const html = read('index.html');
const summaryStart = panel.indexOf("root.innerHTML = [");
const summaryEnd = panel.indexOf("if (!mountAtPageEnd(root))");
const summaryMarkup = panel.slice(summaryStart, summaryEnd);
const advancedStart = panel.indexOf("advancedDialog.innerHTML = [");
const advancedEnd = panel.indexOf("document.body.appendChild(advancedDialog)");
const advancedMarkup = panel.slice(advancedStart, advancedEnd);

assert(pkg.version === '1.6.9', 'user-safe diagnostics release version is v1.6.9');
assert(summaryStart >= 0 && summaryEnd > summaryStart, 'general-user summary markup is isolated from advanced markup');
assert(summaryMarkup.includes('오프라인 사용 준비 완료') || panel.includes("title: '오프라인 사용 준비 완료'"), 'general-user copy uses plain-language offline readiness');
assert(summaryMarkup.includes('storageHealthAutoRepairBtn') && summaryMarkup.includes('storageAdvancedOpenBtn'), 'general-user summary exposes only contextual repair and an explicit advanced entry');
assert(panel.includes("const appShell = document.querySelector('.app-shell')") && panel.includes('appShell.appendChild(node)'), 'storage summary mounts at the page footer instead of the startup area');
assert(panel.includes('function navigateToHealthPanel') && panel.includes('root.scrollIntoView') && panel.includes("document.dispatchEvent(new CustomEvent('ai-shorts-storage-attention'"), 'actionable storage issues navigate to the footer summary once');
assert(panel.includes('function returnToWorkspaceTop') && panel.includes("document.dispatchEvent(new CustomEvent('ai-shorts-storage-recovery-complete'") && panel.includes('global.scrollTo({ top: 0'), 'successful automatic recovery returns from the footer to the page top exactly through a dedicated completion path');
assert(!summaryMarkup.includes('namespace') && !summaryMarkup.includes('signature') && !summaryMarkup.includes('셸 표본') && !summaryMarkup.includes('분석 캐시 전체 정리'), 'technical cache and shell controls are absent from the normal page summary');
assert(advancedStart >= 0 && advancedEnd > advancedStart, 'advanced diagnostics markup is built in a separate modal');
assert(advancedMarkup.includes('analysisCacheNamespaceSelect') && advancedMarkup.includes('analysisCacheSignatureSelect') && advancedMarkup.includes('storageIntegrityAuditBtn'), 'technical controls remain available inside advanced diagnostics');
assert(panel.includes("advancedDialog.hidden = true") && panel.includes("advancedDialog.setAttribute('aria-hidden', 'true')"), 'advanced diagnostics are hidden by default');
assert(panel.includes("['storageAdvancedOpenBtn', 'click', openAdvancedDiagnostics]") && panel.includes("refresh({ force: true, source: 'advanced-open', includeDiagnostics: true })"), 'advanced diagnostics load only after an explicit user action');
assert(panel.includes("refresh({ force: true, source: 'install', includeDiagnostics: false })"), 'initial shell hydration skips detailed analysis-cache inspection');
assert(panel.includes("const includeDiagnostics = Boolean(opts.includeDiagnostics || advancedDialog && !advancedDialog.hidden)"), 'heavy cache inspection is gated by advanced visibility');
assert(panel.includes('storageHealthAutoRepairBtn') && panel.includes('autoRepair.hidden = !model.action'), 'automatic repair appears only when the health model has an actionable issue');
assert((panel.match(/confirmDestructive\(\{/g) || []).length >= 7, 'destructive storage and cache actions use a second confirmation step');
assert(panel.includes('현재 프로젝트의 원본 파일과 편집 내용은 삭제되지 않습니다.'), 'confirmation dialog explicitly protects current project expectations');
assert(panel.includes('storageConfirmImpact') && panel.includes('renderConfirmationImpact') && panel.includes('storage.previewCleanup'), 'automatic cleanup confirmation previews the affected storage scope before mutation');
assert(css.includes('.storage-diagnostics-modal[hidden]') && css.includes('display: none'), 'hidden diagnostics do not occupy the visual layout');
assert(css.includes('min-height: 100dvh') && css.includes('.storage-diagnostics-panel'), 'mobile advanced diagnostics use a dedicated full-screen surface');
assert(css.includes('width: min(1480px, calc(100% - 32px))') && css.includes('.storage-health-panel[data-attention="true"]'), 'footer summary aligns to the workspace and highlights issue-driven navigation');
assert(!html.includes('<script defer src="src/ai/ai-job-coordinator.js') && !html.includes('<script defer src="src/ai/local-ai-provider-registry.js') && !html.includes('<script defer src="src/ui/local-ai-studio.js'), 'Local AI remains staged instead of returning to blocking startup');
console.log('PASS closed-loop storage recovery, cleanup impact preview, advanced diagnostics gate, confirmation safety, and lazy inspection guardrails');
