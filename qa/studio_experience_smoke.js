'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/studio-experience.css'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'src/ui/studio-experience-controller.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const checks = [
    ['workspace intro toggle exists', /id="studioFocusToggle"/.test(html)],
    ['next action button exists', /id="hyperflowNextBtn"/.test(html)],
    ['journey progress is accessible', /role="progressbar"[^>]+aria-valuenow="0"/.test(html)],
    ['analysis cancel action exists', /id="analysisCancelBtn"/.test(html)],
    ['experience stylesheet loads last', html.indexOf('studio-experience.css') > html.indexOf('mobile-menu-guide.css')],
    ['experience controller is staged', fs.readFileSync(path.join(root, 'src/boot/staged-ui-loader.js'), 'utf8').includes('src/ui/studio-experience-controller.js')],
    ['workspace mode collapses introduction', css.includes('body[data-studio-focus="workspace"] .flow-overview-panel')],
    ['next action resolves retry state', controller.includes("key: 'retry-analysis'")],
    ['next action resolves cancellation state', controller.includes("key: 'cancel-analysis'")],
    ['app exposes external analysis request', app.includes("'ai-shorts-analysis-request'")],
    ['app cancels through operation owner', app.includes("operationCoordinator.cancel && operationCoordinator.cancel('analysis'")],
    ['experience CSS is available offline and staged JS uses runtime caching', sw.includes('assets/css/studio-experience.css') && sw.includes('async function cacheFirst')]
];

for (const [name, ok] of checks) {
    if (!ok) throw new Error(name);
    console.log('PASS ' + name);
}
console.log('PASS v1.5.14 workspace-first UI/UX and cancellable analysis guardrails');
