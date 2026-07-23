#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

const configSource = read('src/config/app-runtime-config.js');
const expectedVersion = `v${pkg.version}`;
ok(configSource.includes(`APP_VERSION: '${expectedVersion}'`), 'runtime config remains the application version source');

const kernelWindow = {
    window: null,
    AIShortsRuntimeConfig: { APP_VERSION: 'v9.8.7' },
    AIShortsModuleRegistry: { createRegistry: () => ({ register() {}, snapshot: () => ({}), list: () => [] }) },
    AIShortsPerformanceBudget: {},
    AIShortsAnalysisPipeline: {},
    AIShortsScoringPipeline: {},
    AIShortsModuleContracts: {},
    AIShortsAnalysisCache: {},
    AIShortsProEngineTuner: {},
    AIShortsStabilityAuditor: {}
};
kernelWindow.window = kernelWindow;
vm.runInContext(read('src/engine/engine-kernel.js'), vm.createContext({ window: kernelWindow, Object, String, Array }));
ok(kernelWindow.AIShortsEngineKernel.getHealthReport().version === '9.8.7', 'engine health metadata follows runtime config instead of a stale literal');

const checks = [
    ['src/engine/analysis-pipeline.js', 'ENGINE_VERSION', "version: ENGINE_VERSION"],
    ['src/engine/performance-budget.js', 'ENGINE_VERSION', 'cacheNamespace: `engine-v${ENGINE_VERSION}`'],
    ['src/engine/analysis-cache.js', 'ENGINE_VERSION', 'budget && budget.cacheNamespace || `engine-v${ENGINE_VERSION}`'],
    ['src/ui/export-finish-center.js', 'const config = global.AIShortsRuntimeConfig || {};', "version: config.APP_VERSION || 'dev'"],
    ['src/ui/session-continuity.js', 'const config = global.AIShortsRuntimeConfig || {};', "version: config.APP_VERSION || 'dev'"],
    ['src/ui/flow-director-final.js', 'const BUILD_VERSION', 'document.body.dataset.build = BUILD_VERSION'],
    ['src/app.js', "version: String(config.APP_VERSION || 'dev').replace(/^v/i, '')", 'version: state.engineMeta.version']
];
for (const [file, tokenA, tokenB] of checks) {
    const source = read(file);
    ok(source.includes(tokenA) && source.includes(tokenB), `${file} consumes runtime version metadata`);
}

const activeSources = checks.map(([file]) => read(file)).join('\n');
ok(!/version:\s*['"]1\.1\.3['"]/.test(activeSources), 'legacy session/export diagnostic version literals are removed');
ok(!/version:\s*['"]1\.0\.8['"]/.test(activeSources), 'legacy engine diagnostic fallback version is removed');
console.log('PASS runtime version consistency guardrails');
