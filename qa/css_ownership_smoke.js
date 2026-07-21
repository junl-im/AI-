#!/usr/bin/env node
'use strict';
const fs = require('fs');
const version = require('../package.json').version;
const report = JSON.parse(fs.readFileSync(`qa/runtime-css-ownership-v${version}.json`, 'utf8'));
if (report.version !== version || report.cssFiles !== 46) throw new Error('CSS ownership report does not match the release');
if (report.importantCount > 912) throw new Error('CSS !important count exceeded the v1.5.3 baseline');
if (!report.topConflicts.some(item => item.selector === '.recommendation-card')) throw new Error('known recommendation-card ownership conflict is missing');
if (report.highConflictSelectorCount < 1) throw new Error('high-conflict selector inventory is unexpectedly empty');
console.log('PASS v1.5.3 CSS ownership inventory and regression ceiling');
