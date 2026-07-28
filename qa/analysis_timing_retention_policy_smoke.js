#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app/analysis-controller.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/foundation-polish.css'), 'utf8');
function ok(condition, message) { if (!condition) throw new Error(message); console.log(`PASS ${message}`); }
function node() { return { value: '', textContent: '', hidden: true, disabled: true, dataset: {}, children: [], append(...items) { this.children.push(...items); }, appendChild(item) { this.children.push(item); return item; }, setAttribute() {} }; }
const now = Date.now();
const date = days => new Date(now - days * 86400000).toISOString();
const history = [0, 2, 12, 120].map((days, index) => ({ id: `timing-${String(index + 1).padStart(8, '0')}`, mediaKey: `media-${String(index + 1).padStart(8, '0')}`, status: 'completed', completedAt: date(days), totalMs: 20 + index, stages: [] }));
const values = new Map([
  ['history-test', JSON.stringify({ schemaVersion: 2, history })],
  ['policy-test', JSON.stringify({ schemaVersion: 1, retentionDays: 30, maxItems: 3, updatedAt: date(0) })]
]);
const storage = { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); } };
const document = { createElement: node, dispatchEvent() {} };
const window = { document, Blob, performance: { now: () => 1 }, setTimeout, clearTimeout, localStorage: storage };
vm.runInContext(source, vm.createContext({ window, document, Blob, AbortController, CustomEvent: function(){}, Object, Array, Map, Set, Math, Number, String, Date, Error, Promise, JSON, console }), { filename: 'analysis-controller.js' });
const elements = { analysisTimingPanel: node(), analysisTimingHistoryCount: node(), analysisTimingHistoryClearBtn: node(), analysisTimingHistoryEmpty: node(), analysisTimingHistoryList: node(), analysisTimingHistoryRetentionDays: node(), analysisTimingHistoryMaxItems: node(), analysisTimingHistoryPolicyStatus: node() };
const controller = window.AIShortsAnalysisController.createAnalysisController({
  state: { file: null, fileMeta: null }, storage, elements, store: { addDiagnostic() {} },
  config: { APP_VERSION: 'v1.6.24', ANALYSIS_TIMING_HISTORY_KEY: 'history-test', ANALYSIS_TIMING_HISTORY_POLICY_KEY: 'policy-test', ANALYSIS_TIMING_HISTORY_LIMIT: 12, ANALYSIS_TIMING_HISTORY_RETENTION_DAYS: 90 },
  getActiveMediaElement() { return null; }, activateFlowTab() {}, updateButtons() {}, setProgress() {}, toast() {}, ensureMotionSmartReframe() {}, getAutoCutOptions() { return {}; }, buildAutoCutTimeline() {}, createRecommendations() {}, createFallbackAudioAnalysis() { return {}; }, beginOperation() { return null; }, assertOperation() {}, finishOperation() {}, isAbortError() { return false; }
});
ok(controller.getTimingHistory().length === 3, 'stored timing history is pruned by the saved maximum item policy');
ok(controller.getTimingHistory().every(item => new Date(item.completedAt).getTime() >= now - 30 * 86400000), 'records older than the saved retention period are removed');
const initialPolicy = controller.getTimingHistoryPolicy();
ok(initialPolicy.retentionDays === 30 && initialPolicy.maxItems === 3, 'saved retention days and maximum count are restored');
const result = controller.updateTimingHistoryPolicy({ retentionDays: 5, maxItems: 2 });
ok(result.policy.retentionDays === 5 && result.policy.maxItems === 2 && controller.getTimingHistory().length === 2, 'policy updates immediately prune history by age and count');
const persisted = JSON.parse(values.get('policy-test'));
ok(persisted.retentionDays === 5 && persisted.maxItems === 2, 'retention policy persists independently from diagnostic history');
ok(elements.analysisTimingHistoryRetentionDays.value === '5' && elements.analysisTimingHistoryMaxItems.value === '2', 'retention controls stay synchronized with the active policy');
ok(html.includes('id="analysisTimingHistoryRetentionDays"') && html.includes('id="analysisTimingHistoryMaxItems"') && html.includes('id="analysisTimingHistoryPolicySaveBtn"'), 'analysis history panel exposes bounded retention settings');
ok(app.includes('updateTimingHistoryPolicy') && app.includes('analysisTimingHistoryPolicySaveBtn'), 'app wiring saves retention changes through the controller owner');
ok(css.includes('.analysis-history-retention') && css.includes('grid-template-columns'), 'retention settings have responsive visual ownership');
console.log('PASS v1.6.24 analysis timing retention policy contract');
