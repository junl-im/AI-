#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'assets', 'css');
const archivedCss = new Set(['cinematic-hero.css']);
const dynamicClassPrefixes = ['auto-cut-', 'cut-marker-', 'render-queue-', 'toast-kind-', 'is-'];

function walk(entry) {
    const stat = fs.statSync(entry);
    if (stat.isFile()) return [entry];
    return fs.readdirSync(entry, { withFileTypes: true }).flatMap(item => {
        const full = path.join(entry, item.name);
        return item.isDirectory() ? walk(full) : [full];
    });
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

const sourceFiles = [path.join(root, 'index.html'), ...walk(path.join(root, 'src')).filter(file => file.endsWith('.js'))];
const sourceText = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const cssFiles = walk(cssDir).filter(file => file.endsWith('.css') && !archivedCss.has(path.basename(file)));

function tokenIsLive(token) {
    const exact = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(token)}([^A-Za-z0-9_-]|$)`);
    if (exact.test(sourceText)) return true;
    return dynamicClassPrefixes.some(prefix => token.startsWith(prefix) && sourceText.includes(prefix));
}

function selectorTokens(selector) {
    return [
        ...[...selector.matchAll(/#([A-Za-z_][\w-]*)/g)].map(match => match[1]),
        ...[...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(match => match[1])
    ];
}

const roots = cssFiles.map(file => ({ file, root: postcss.parse(fs.readFileSync(file, 'utf8'), { from: file }) }));
const keyframes = new Map();
const animationValues = [];
const orphanSelectors = [];
const emptyAtRules = [];

for (const { file, root: cssRoot } of roots) {
    cssRoot.walkRules(rule => {
        if (rule.parent && /keyframes$/i.test(rule.parent.name || '')) return;
        for (const selector of rule.selectors || []) {
            const tokens = selectorTokens(selector);
            if (tokens.length && tokens.some(token => !tokenIsLive(token))) {
                orphanSelectors.push(`${path.relative(root, file)}:${rule.source.start.line} ${selector}`);
            }
        }
    });
    cssRoot.walkAtRules(atRule => {
        if (/keyframes$/i.test(atRule.name)) keyframes.set(atRule.params, `${path.relative(root, file)}:${atRule.source.start.line}`);
        else if (!(atRule.nodes || []).some(node => node.type !== 'comment')) emptyAtRules.push(`${path.relative(root, file)}:${atRule.source.start.line} @${atRule.name} ${atRule.params}`);
    });
    cssRoot.walkDecls(decl => {
        if (decl.prop === 'animation' || decl.prop === 'animation-name') animationValues.push(decl.value);
    });
}

const unusedKeyframes = [...keyframes.entries()].filter(([name]) => {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(name)}([^A-Za-z0-9_-]|$)`);
    return !animationValues.some(value => pattern.test(value));
});
const reportPath = path.join(root, 'qa', 'runtime-css-prune-v1.5.19.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

assert(pkg.version === '1.6.9', 'orphan CSS cleanup release version is v1.6.9');
assert(orphanSelectors.length === 0, `active CSS has no source-orphan selectors (${orphanSelectors.slice(0, 3).join(' | ')})`);
assert(unusedKeyframes.length === 0, `active CSS has no unreferenced keyframes (${unusedKeyframes.slice(0, 3).map(item => item.join(' ')).join(' | ')})`);
assert(emptyAtRules.length === 0, `active CSS has no empty at-rules (${emptyAtRules.slice(0, 3).join(' | ')})`);
assert(report.removedSelectors.length === 9, '9 retired duplicate mobile-action selectors are recorded');
assert(report.removedRules === 7 && report.removedDeclarations === 35, '7 rules and 35 declarations are recorded as retired');
assert(report.removedImportantDeclarations === 1, 'one retired !important declaration is recorded');
assert(report.removedKeyframes.length === 0, 'no active keyframe removal was required');
assert(report.removedEmptyAtRules.length === 0, 'no empty responsive at-rule remains');
assert(fs.existsSync(path.join(root, 'tools', 'prune-orphan-css.js')), 'reproducible orphan CSS pruning tool is included');
console.log('PASS v1.6.9 unified-import CSS pruning and source-reachable guardrails');
