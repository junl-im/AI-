#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'assets', 'css');
const reportPath = path.join(root, 'qa', `runtime-css-ownership-v${pkg.version}.json`);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

function normalizeSpace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function contextFor(rule) {
    const contexts = [];
    let parent = rule.parent;
    while (parent) {
        if (parent.type === 'atrule' && /^(media|supports|container|layer|scope|document)$/i.test(parent.name)) {
            contexts.push(normalizeSpace(`@${parent.name}${parent.params ? ` ${parent.params}` : ''}`));
        }
        parent = parent.parent;
    }
    return contexts.reverse().join(' > ') || 'base';
}

const removalsByFile = new Map();
for (const duplicate of report.sameValueDuplicates || []) {
    const winnerFile = duplicate.winner.file;
    for (const occurrence of duplicate.occurrences) {
        if (occurrence.file === winnerFile) continue;
        if (!removalsByFile.has(occurrence.file)) removalsByFile.set(occurrence.file, new Map());
        const fileMap = removalsByFile.get(occurrence.file);
        const key = `${duplicate.context}\u0000${duplicate.selector}`;
        if (!fileMap.has(key)) fileMap.set(key, []);
        fileMap.get(key).push({
            property: duplicate.property.toLowerCase(),
            value: normalizeSpace(occurrence.value),
            important: Boolean(occurrence.important)
        });
    }
}

let removedDeclarations = 0;
let splitRules = 0;
const changedFiles = [];

for (const [file, fileMap] of removalsByFile) {
    const filePath = path.join(cssDir, file);
    const source = fs.readFileSync(filePath, 'utf8');
    const rootNode = postcss.parse(source, { from: filePath });
    let changed = false;

    rootNode.walkRules(rule => {
        const context = contextFor(rule);
        const selectorGroups = new Map();
        for (const selector of rule.selectors) {
            const key = `${context}\u0000${normalizeSpace(selector)}`;
            const removals = fileMap.get(key) || [];
            const signature = removals
                .map(item => `${item.property}\u0001${item.important ? 1 : 0}\u0001${item.value}`)
                .sort()
                .join('\u0002');
            if (!selectorGroups.has(signature)) selectorGroups.set(signature, { selectors: [], removals });
            selectorGroups.get(signature).selectors.push(selector);
        }

        const activeGroups = Array.from(selectorGroups.values()).filter(group => group.removals.length);
        if (!activeGroups.length) return;

        const clones = [];
        for (const group of selectorGroups.values()) {
            const clone = rule.clone({ selectors: group.selectors });
            if (group.removals.length) {
                clone.walkDecls(decl => {
                    const property = decl.prop.toLowerCase();
                    const value = normalizeSpace(decl.value);
                    const important = Boolean(decl.important);
                    if (group.removals.some(item => item.property === property && item.value === value && item.important === important)) {
                        decl.remove();
                        removedDeclarations += 1;
                        changed = true;
                    }
                });
            }
            const hasDeclarations = clone.nodes && clone.nodes.some(node => node.type === 'decl');
            const hasOtherNodes = clone.nodes && clone.nodes.some(node => node.type !== 'decl' && node.type !== 'comment');
            if (hasDeclarations || hasOtherNodes) clones.push(clone);
        }

        if (selectorGroups.size > 1) splitRules += 1;
        if (clones.length) rule.replaceWith(...clones);
        else rule.remove();
    });

    if (changed) {
        fs.writeFileSync(filePath, rootNode.toString());
        changedFiles.push(file);
    }
}

console.log(`PASS consolidated ${removedDeclarations} same-value declarations across ${changedFiles.length} CSS files (${splitRules} grouped rules split)`);
for (const file of changedFiles) console.log(`  - ${file}`);
