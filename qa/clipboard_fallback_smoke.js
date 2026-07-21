#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/utils/core-utils.js'), 'utf8');

function ok(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function createHarness({ clipboardResult = 'resolve', execResult = true } = {}) {
    let execCalls = 0;
    let removed = false;
    const textarea = {
        value: '',
        style: {},
        setAttribute() {},
        focus() {},
        select() {},
        remove() { removed = true; }
    };
    const document = {
        body: { appendChild() {} },
        createElement(tag) {
            if (tag !== 'textarea') throw new Error(`unexpected element: ${tag}`);
            return textarea;
        },
        execCommand(command) {
            execCalls += 1;
            if (command !== 'copy') throw new Error(`unexpected command: ${command}`);
            return execResult;
        }
    };
    const navigator = {
        clipboard: {
            writeText(value) {
                if (clipboardResult === 'reject') return Promise.reject(new Error('permission denied'));
                return Promise.resolve(value);
            }
        }
    };
    const window = { window: null, document, navigator };
    window.window = window;
    vm.runInContext(source, vm.createContext({ window, document, navigator, URL, Float32Array, Object, Array, Math, Number, String, Boolean, Promise }));
    return { api: window.AIShortsCoreUtils, getExecCalls: () => execCalls, wasRemoved: () => removed, textarea };
}

(async () => {
    const direct = createHarness({ clipboardResult: 'resolve' });
    ok(await direct.api.copyText('direct copy') === true, 'clipboard API success is returned immediately');
    ok(direct.getExecCalls() === 0, 'legacy copy path is skipped after clipboard success');

    const fallback = createHarness({ clipboardResult: 'reject', execResult: true });
    ok(await fallback.api.copyText('fallback copy') === true, 'clipboard rejection falls back to local execCommand copy');
    ok(fallback.getExecCalls() === 1, 'fallback copy executes exactly once');
    ok(fallback.wasRemoved(), 'temporary fallback textarea is always removed');
    ok(fallback.textarea.value === 'fallback copy', 'fallback preserves the requested text');

    const failed = createHarness({ clipboardResult: 'reject', execResult: false });
    ok(await failed.api.copyText('cannot copy') === false, 'copy reports failure when both browser paths fail');

const appSource = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const sentinelSource = fs.readFileSync(path.join(root, 'src/boot/update-sentinel.js'), 'utf8');
ok(appSource.includes("const copied = await utils.copyText") && appSource.includes("caption-copy-error"), 'title and hashtag copy verifies the actual clipboard result');
ok(sentinelSource.includes("const copied = await copyText") && sentinelSource.includes("return false;"), 'update diagnostics copy reports permission failures instead of false success');
    console.log('PASS resilient clipboard fallback guardrails');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
