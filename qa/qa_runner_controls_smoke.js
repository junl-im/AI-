#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const runner = path.join(root, 'qa/run_all_checks.js');

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

const syntax = spawnSync(process.execPath, ['--check', runner], { encoding: 'utf8' });
assert(syntax.status === 0, 'QA runner remains valid JavaScript');
const listed = spawnSync(process.execPath, [runner, '--from', '0', '--to', '3', '--shard', '2/2', '--list'], { cwd: root, encoding: 'utf8' });
assert(listed.status === 0, 'QA runner accepts bounded shard selection');
const rows = listed.stdout.split(/\r?\n/).filter(line => /^\[\d+\]/.test(line));
assert(rows.length === 2 && rows[0].startsWith('[1]') && rows[1].startsWith('[3]'), 'QA shard selection is deterministic');
const noMatch = spawnSync(process.execPath, [runner, '--match', '__definitely_missing_check__', '--list'], { cwd: root, encoding: 'utf8' });
assert(noMatch.status === 2, 'empty QA filters fail clearly instead of reporting a false pass');
const source = fs.readFileSync(runner, 'utf8');
assert(source.includes("result.error.code === 'ETIMEDOUT'") && source.includes('--timeout-ms'), 'each QA command has an explicit timeout guard');
assert(source.includes('--report') && source.includes('JSON.stringify(payload, null, 2)'), 'QA runs can emit a machine-readable handoff report');
console.log('PASS v1.6.15 bounded, shardable, reportable QA execution controls');
