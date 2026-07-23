#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/engine/analysis-cache.js'), 'utf8');
const window = { structuredClone: global.structuredClone, AIShortsRuntimeConfig: { APP_VERSION: 'v-test' } };
vm.runInNewContext(source, { window, ArrayBuffer, Date, Object, Map, Math, Number, String, Uint8Array, DataView, WeakMap, Set });

const cache = window.AIShortsAnalysisCache.createAnalysisCache(3, { maxAgeMs: 60000 });
cache.set('a', { value: 1 });
cache.set('b', { value: 2 });
cache.set('c', { value: 3 });
if (!cache.get('a') || cache.get('missing')) throw new Error('cache hit and miss accounting precondition failed');
const pruned = cache.prune({ maxItems: 1 });
if (pruned.size !== 1 || pruned.manualPruned !== 2) throw new Error('manual cache pruning must report removed entries');
if (pruned.hits !== 1 || pruned.misses !== 1 || pruned.hitRate !== 50) throw new Error('cache diagnostics must expose hit, miss, and hit-rate values');
if (!pruned.adaptiveFingerprinting || !pruned.fingerprint || typeof pruned.fingerprint.averageMs !== 'number') throw new Error('cache stats must embed adaptive fingerprint diagnostics');
cache.clear();
if (cache.stats().size !== 0) throw new Error('cache clear must remove every analysis entry');
console.log('PASS analysis cache pruning and diagnostics contract');
