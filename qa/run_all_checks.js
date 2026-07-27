#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { qaChecks: checks, version } = require('../package.json');

if (!Array.isArray(checks) || !checks.length) {
    console.error('FAIL package.json qaChecks is missing or empty');
    process.exit(1);
}

function usage() {
    console.log([
        'AI Shorts Studio QA runner',
        '',
        'Usage: node qa/run_all_checks.js [options]',
        '',
        '  --from <index>          first package.json qaChecks index (inclusive)',
        '  --to <index>            last package.json qaChecks index (inclusive)',
        '  --match <text>          run checks whose command contains text',
        '  --shard <part/total>    run one deterministic shard, for example 2/4',
        '  --timeout-ms <ms>       timeout for each check (default: 180000)',
        '  --fail-fast             stop after the first failed or timed-out check',
        '  --report <file>         write a JSON result report',
        '  --list                  list selected checks without running them',
        '  --help                  show this help'
    ].join('\n'));
}

function readValue(argv, index, name) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    return value;
}

function parseArgs(argv) {
    const options = {
        from: 0,
        to: checks.length - 1,
        match: '',
        shardPart: 1,
        shardTotal: 1,
        timeoutMs: Math.max(1000, Number(process.env.QA_CHECK_TIMEOUT_MS) || 180000),
        failFast: false,
        report: '',
        list: false,
        help: false
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--help') options.help = true;
        else if (arg === '--list') options.list = true;
        else if (arg === '--fail-fast') options.failFast = true;
        else if (arg === '--from') options.from = Number(readValue(argv, index++, arg));
        else if (arg === '--to') options.to = Number(readValue(argv, index++, arg));
        else if (arg === '--match') options.match = readValue(argv, index++, arg);
        else if (arg === '--timeout-ms') options.timeoutMs = Number(readValue(argv, index++, arg));
        else if (arg === '--report') options.report = readValue(argv, index++, arg);
        else if (arg === '--shard') {
            const shard = readValue(argv, index++, arg).match(/^(\d+)\/(\d+)$/);
            if (!shard) throw new Error('--shard must use part/total format');
            options.shardPart = Number(shard[1]);
            options.shardTotal = Number(shard[2]);
        } else throw new Error(`unknown option: ${arg}`);
    }
    if (!Number.isInteger(options.from) || options.from < 0) throw new Error('--from must be a non-negative integer');
    if (!Number.isInteger(options.to) || options.to < options.from) throw new Error('--to must be an integer greater than or equal to --from');
    if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1000) throw new Error('--timeout-ms must be at least 1000');
    if (!Number.isInteger(options.shardPart) || !Number.isInteger(options.shardTotal) || options.shardTotal < 1 || options.shardPart < 1 || options.shardPart > options.shardTotal) {
        throw new Error('--shard part must be between 1 and total');
    }
    options.to = Math.min(checks.length - 1, options.to);
    return options;
}

function selectChecks(options) {
    const needle = options.match.toLowerCase();
    const ranged = checks
        .map((command, index) => ({ command, index }))
        .filter(item => item.index >= options.from && item.index <= options.to)
        .filter(item => !needle || item.command.toLowerCase().includes(needle));
    return ranged.filter((_, position) => position % options.shardTotal === options.shardPart - 1);
}

function writeReport(filename, payload) {
    const output = path.resolve(process.cwd(), filename);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`QA report: ${output}`);
}

let options;
try {
    options = parseArgs(process.argv.slice(2));
} catch (error) {
    console.error(`FAIL ${error.message}`);
    usage();
    process.exit(2);
}

if (options.help) {
    usage();
    process.exit(0);
}

const selected = selectChecks(options);
if (!selected.length) {
    console.error('FAIL no QA checks matched the requested range/filter/shard');
    process.exit(2);
}

if (options.list) {
    selected.forEach(item => console.log(`[${item.index}] ${item.command}`));
    console.log(`Selected ${selected.length}/${checks.length} checks`);
    process.exit(0);
}

const suiteStarted = Date.now();
const results = [];
for (const item of selected) {
    const started = Date.now();
    const result = spawnSync(item.command, {
        shell: true,
        stdio: 'inherit',
        timeout: options.timeoutMs,
        env: process.env
    });
    const elapsed = Date.now() - started;
    const timedOut = Boolean(result.error && result.error.code === 'ETIMEDOUT');
    const ok = result.status === 0 && !timedOut && !result.error;
    const record = {
        index: item.index,
        command: item.command,
        ok,
        timedOut,
        status: result.status,
        signal: result.signal || '',
        elapsedMs: elapsed,
        error: result.error ? String(result.error.message || result.error) : ''
    };
    results.push(record);
    const detail = timedOut ? `timeout after ${elapsed}ms` : result.error ? record.error : `status ${result.status}`;
    console.log(`${ok ? 'PASS' : 'FAIL'} [${item.index}] ${item.command} (${elapsed}ms${ok ? '' : `, ${detail}`})`);
    if (!ok && options.failFast) break;
}

const failed = results.filter(item => !item.ok);
const payload = {
    app: 'AI Shorts Studio',
    version,
    createdAt: new Date().toISOString(),
    selectedCount: selected.length,
    executedCount: results.length,
    passedCount: results.length - failed.length,
    failedCount: failed.length,
    durationMs: Date.now() - suiteStarted,
    options: {
        from: options.from,
        to: options.to,
        match: options.match,
        shard: `${options.shardPart}/${options.shardTotal}`,
        timeoutMs: options.timeoutMs,
        failFast: options.failFast
    },
    results
};

console.log('\nAI Shorts Studio QA summary');
console.log(`  Selected: ${selected.length}/${checks.length}`);
console.log(`  Executed: ${results.length}`);
console.log(`  Passed: ${payload.passedCount}/${results.length}`);
console.log(`  Failed: ${failed.length}/${results.length}`);
console.log(`  Duration: ${(payload.durationMs / 1000).toFixed(1)}s`);
if (failed.length) {
    console.log('\nFailed checks:');
    failed.forEach(item => console.log(`  - [${item.index}] ${item.command} (${item.timedOut ? 'timeout' : `status ${item.status}`})`));
}
if (options.report) writeReport(options.report, payload);
process.exit(failed.length ? 1 : 0);
