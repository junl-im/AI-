#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

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
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const sourceFiles = [path.join(root, 'index.html'), ...walk(path.join(root, 'src')).filter(file => file.endsWith('.js'))];
const sourceText = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
function isRuntimeToken(token) {
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
function selectorIsOrphan(selector) {
    const tokens = selectorTokens(selector);
    return tokens.length > 0 && tokens.some(token => !isRuntimeToken(token));
}

const cssFiles = walk(cssDir).filter(file => file.endsWith('.css') && !archivedCss.has(path.basename(file)));
const roots = new Map(cssFiles.map(file => [file, postcss.parse(fs.readFileSync(file, 'utf8'), { from: file })]));
const changed = new Set();
const report = {
    removedSelectors: [],
    removedRules: 0,
    removedDeclarations: 0,
    removedImportantDeclarations: 0,
    removedKeyframes: [],
    removedEmptyAtRules: []
};

for (const [file, cssRoot] of roots) {
    cssRoot.walkRules(rule => {
        if (rule.parent && /keyframes$/i.test(rule.parent.name || '')) return;
        const selectors = rule.selectors || [];
        const liveSelectors = selectors.filter(selector => !selectorIsOrphan(selector));
        if (liveSelectors.length === selectors.length) return;
        const removed = selectors.filter(selector => selectorIsOrphan(selector));
        report.removedSelectors.push(...removed.map(selector => ({ file: path.relative(root, file), selector })));
        changed.add(file);
        if (!liveSelectors.length) {
            const declarations = rule.nodes.filter(node => node.type === 'decl');
            report.removedRules += 1;
            report.removedDeclarations += declarations.length;
            report.removedImportantDeclarations += declarations.filter(decl => decl.important).length;
            rule.remove();
        } else {
            rule.selectors = liveSelectors;
        }
    });
}

const keyframeNames = new Set();
const animationValues = [];
for (const cssRoot of roots.values()) {
    cssRoot.walkAtRules(atRule => { if (/keyframes$/i.test(atRule.name)) keyframeNames.add(atRule.params); });
    cssRoot.walkDecls(decl => { if (decl.prop === 'animation' || decl.prop === 'animation-name') animationValues.push(decl.value); });
}
const usedKeyframes = new Set([...keyframeNames].filter(name => {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegExp(name)}([^A-Za-z0-9_-]|$)`);
    return animationValues.some(value => pattern.test(value));
}));

for (const [file, cssRoot] of roots) {
    cssRoot.walkAtRules(atRule => {
        if (!/keyframes$/i.test(atRule.name) || usedKeyframes.has(atRule.params)) return;
        report.removedKeyframes.push({ file: path.relative(root, file), name: atRule.params });
        atRule.remove();
        changed.add(file);
    });
    cssRoot.walkAtRules(atRule => {
        if (/keyframes$/i.test(atRule.name)) return;
        const hasContent = (atRule.nodes || []).some(node => node.type !== 'comment');
        if (hasContent) return;
        report.removedEmptyAtRules.push({ file: path.relative(root, file), name: atRule.name, params: atRule.params });
        atRule.remove();
        changed.add(file);
    });
}
for (const file of changed) fs.writeFileSync(file, roots.get(file).toString(), 'utf8');

const version = require(path.join(root, 'package.json')).version;
const output = path.join(root, 'qa', `runtime-css-prune-v${version}.json`);
const removalCount = report.removedSelectors.length
    + report.removedRules
    + report.removedDeclarations
    + report.removedImportantDeclarations
    + report.removedKeyframes.length
    + report.removedEmptyAtRules.length;
let preservedExistingReport = false;
if (removalCount === 0 && fs.existsSync(output)) {
    try {
        const existing = JSON.parse(fs.readFileSync(output, 'utf8'));
        const existingCount = (existing.removedSelectors || []).length
            + Number(existing.removedRules || 0)
            + Number(existing.removedDeclarations || 0)
            + Number(existing.removedImportantDeclarations || 0)
            + (existing.removedKeyframes || []).length
            + (existing.removedEmptyAtRules || []).length;
        preservedExistingReport = existingCount > 0;
    } catch (_) {
        preservedExistingReport = false;
    }
}
if (!preservedExistingReport) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({
    removedSelectorCount: report.removedSelectors.length,
    removedRuleCount: report.removedRules,
    removedDeclarationCount: report.removedDeclarations,
    removedImportantDeclarationCount: report.removedImportantDeclarations,
    removedKeyframeCount: report.removedKeyframes.length,
    removedEmptyAtRuleCount: report.removedEmptyAtRules.length,
    preservedExistingReport
}, null, 2));
