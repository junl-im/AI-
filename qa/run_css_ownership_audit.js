#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const version = require('../package.json').version;
const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'assets', 'css');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function normalizeSpace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripComments(source) {
    return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitTopLevel(source, delimiter) {
    const parts = [];
    let start = 0;
    let round = 0;
    let square = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (quote) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '(') round += 1;
        else if (char === ')') round = Math.max(0, round - 1);
        else if (char === '[') square += 1;
        else if (char === ']') square = Math.max(0, square - 1);
        else if (char === delimiter && round === 0 && square === 0) {
            parts.push(source.slice(start, index));
            start = index + 1;
        }
    }
    parts.push(source.slice(start));
    return parts;
}

function findTopLevelColon(source) {
    let round = 0;
    let square = 0;
    let quote = '';
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (quote) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === '(') round += 1;
        else if (char === ')') round = Math.max(0, round - 1);
        else if (char === '[') square += 1;
        else if (char === ']') square = Math.max(0, square - 1);
        else if (char === ':' && round === 0 && square === 0) return index;
    }
    return -1;
}

function findBlockEnd(source, openingIndex) {
    let depth = 1;
    let quote = '';
    let escaped = false;
    for (let index = openingIndex + 1; index < source.length; index += 1) {
        const char = source[index];
        if (quote) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === '{') depth += 1;
        else if (char === '}') {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    throw new Error(`Unclosed CSS block near offset ${openingIndex}`);
}

function findPreludeEnd(source, start) {
    let round = 0;
    let square = 0;
    let quote = '';
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
        const char = source[index];
        if (quote) {
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === quote) quote = '';
            continue;
        }
        if (char === '"' || char === "'") quote = char;
        else if (char === '(') round += 1;
        else if (char === ')') round = Math.max(0, round - 1);
        else if (char === '[') square += 1;
        else if (char === ']') square = Math.max(0, square - 1);
        else if ((char === '{' || char === ';') && round === 0 && square === 0) return index;
    }
    return source.length;
}

function parseDeclarations(body) {
    const declarations = [];
    for (const rawPart of splitTopLevel(body, ';')) {
        const part = rawPart.trim();
        if (!part) continue;
        const colon = findTopLevelColon(part);
        if (colon <= 0) continue;
        const property = part.slice(0, colon).trim().toLowerCase();
        let value = normalizeSpace(part.slice(colon + 1));
        if (!property || !value) continue;
        const important = /\s*!important\s*$/i.test(value);
        if (important) value = normalizeSpace(value.replace(/\s*!important\s*$/i, ''));
        declarations.push({ property, value, important });
    }
    return declarations;
}

function shouldRecurseAtRule(prelude) {
    return /^@(media|supports|container|layer|scope|document)\b/i.test(prelude);
}

function shouldSkipAtRule(prelude) {
    return /^@(?:-\w+-)?keyframes\b/i.test(prelude)
        || /^@(font-face|page|property|counter-style)\b/i.test(prelude);
}

function parseRules(source, file, loadIndex, context, records, selectorOwners, state) {
    let cursor = 0;
    while (cursor < source.length) {
        while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
        if (cursor >= source.length) break;
        const end = findPreludeEnd(source, cursor);
        if (end >= source.length) break;
        const prelude = normalizeSpace(source.slice(cursor, end));
        const terminator = source[end];
        if (terminator === ';') {
            cursor = end + 1;
            continue;
        }
        const blockEnd = findBlockEnd(source, end);
        const body = source.slice(end + 1, blockEnd);
        cursor = blockEnd + 1;
        if (!prelude) continue;

        if (prelude.startsWith('@')) {
            if (shouldRecurseAtRule(prelude)) {
                parseRules(body, file, loadIndex, context.concat(prelude), records, selectorOwners, state);
            } else if (!shouldSkipAtRule(prelude)) {
                state.ignoredAtRules.add(prelude.split(/\s+/)[0]);
            }
            continue;
        }

        const declarations = parseDeclarations(body);
        if (!declarations.length) continue;
        state.importantCount += declarations.filter(declaration => declaration.important).length;
        const selectors = splitTopLevel(prelude, ',').map(normalizeSpace).filter(Boolean);
        const contextKey = context.length ? context.join(' > ') : 'base';
        state.ruleOrder += 1;
        for (const selector of selectors) {
            if (!selectorOwners.has(selector)) selectorOwners.set(selector, new Set());
            selectorOwners.get(selector).add(file);
            for (const declaration of declarations) {
                records.push({
                    selector,
                    context: contextKey,
                    file,
                    loadIndex,
                    ruleOrder: state.ruleOrder,
                    ...declaration
                });
            }
        }
    }
}

function propertyRiskWeight(property) {
    if (property.startsWith('--')) return 0;
    if (/^(display|position|inset|top|right|bottom|left|z-index|overflow(?:-[xy])?|width|min-width|max-width|height|min-height|max-height|grid(?:-.+)?|flex(?:-.+)?|order)$/.test(property)) return 5;
    if (/^(visibility|opacity|pointer-events|transform|translate|scale|rotate|content-visibility|contain)$/.test(property)) return 4;
    if (/^(padding(?:-.+)?|margin(?:-.+)?|background(?:-.+)?|border(?:-.+)?|box-shadow|outline(?:-.+)?|transition(?:-.+)?|animation(?:-.+)?)$/.test(property)) return 3;
    if (/^(color|font(?:-.+)?|line-height|text-align|white-space|cursor)$/.test(property)) return 2;
    return 1;
}

function propertyCategory(property) {
    if (property.startsWith('--')) return 'token';
    if (/^(display|position|inset|top|right|bottom|left|z-index|overflow(?:-[xy])?|width|min-width|max-width|height|min-height|max-height|grid(?:-.+)?|flex(?:-.+)?|order|padding(?:-.+)?|margin(?:-.+)?|contain|content-visibility)$/.test(property)) return 'layout';
    if (/^(cursor|pointer-events|user-select|touch-action|transform|translate|scale|rotate|transition(?:-.+)?|animation(?:-.+)?|opacity|visibility|scroll-behavior)$/.test(property)) return 'interaction';
    if (/^(background(?:-.+)?|border(?:-.+)?|box-shadow|outline(?:-.+)?|color|filter|backdrop-filter|-webkit-backdrop-filter|mix-blend-mode)$/.test(property)) return 'skin';
    if (/^(font(?:-.+)?|line-height|text(?:-.+)?|letter-spacing|white-space|word-break|hyphens)$/.test(property)) return 'typography';
    return 'other';
}

function chooseWinner(occurrences) {
    return [...occurrences].sort((a, b) => {
        if (a.important !== b.important) return Number(a.important) - Number(b.important);
        if (a.loadIndex !== b.loadIndex) return a.loadIndex - b.loadIndex;
        return a.ruleOrder - b.ruleOrder;
    }).at(-1);
}

const linkedFiles = Array.from(html.matchAll(/assets\/css\/([^?"']+\.css)(?:\?[^"']*)?/g), match => match[1]);
const allFiles = fs.readdirSync(cssDir).filter(name => name.endsWith('.css')).sort();
const linkedSet = new Set(linkedFiles);
const unlinkedFiles = allFiles.filter(file => !linkedSet.has(file));
const files = linkedFiles;
const records = [];
const selectorOwners = new Map();
const state = { ruleOrder: 0, importantCount: 0, ignoredAtRules: new Set() };

files.forEach((file, loadIndex) => {
    const source = stripComments(fs.readFileSync(path.join(cssDir, file), 'utf8'));
    parseRules(source, file, loadIndex, [], records, selectorOwners, state);
});

const selectorConflicts = Array.from(selectorOwners, ([selector, owners]) => ({
    selector,
    owners: Array.from(owners).sort((a, b) => files.indexOf(a) - files.indexOf(b)),
    ownerCount: owners.size
}))
    .filter(item => item.ownerCount > 1)
    .sort((a, b) => b.ownerCount - a.ownerCount || a.selector.localeCompare(b.selector));

const propertyGroups = new Map();
for (const record of records) {
    const key = `${record.context}\u0000${record.selector}\u0000${record.property}`;
    if (!propertyGroups.has(key)) propertyGroups.set(key, []);
    propertyGroups.get(key).push(record);
}

const sharedProperties = [];
for (const occurrences of propertyGroups.values()) {
    const owners = Array.from(new Set(occurrences.map(item => item.file)));
    if (owners.length < 2) continue;
    const signatures = Array.from(new Set(occurrences.map(item => `${item.important ? '!important ' : ''}${item.value}`)));
    const winner = chooseWinner(occurrences);
    const property = occurrences[0].property;
    const weight = propertyRiskWeight(property);
    const conflicting = signatures.length > 1;
    const importantCount = occurrences.filter(item => item.important).length;
    const riskScore = conflicting
        ? weight + Math.min(6, owners.length * 2) + Math.min(3, signatures.length - 1) + (importantCount ? 3 : 0)
        : 0;
    const sortedOccurrences = [...occurrences].sort((a, b) => a.loadIndex - b.loadIndex || a.ruleOrder - b.ruleOrder);
    sharedProperties.push({
        selector: occurrences[0].selector,
        context: occurrences[0].context,
        property,
        category: propertyCategory(property),
        owners,
        ownerCount: owners.length,
        distinctValueCount: signatures.length,
        conflicting,
        risk: riskScore >= 13 ? 'high' : riskScore >= 9 ? 'medium' : 'low',
        riskScore,
        winner: {
            file: winner.file,
            value: winner.value,
            important: winner.important,
            loadIndex: winner.loadIndex
        },
        occurrences: sortedOccurrences.map(item => ({
            file: item.file,
            value: item.value,
            important: item.important,
            loadIndex: item.loadIndex
        }))
    });
}

const propertyConflicts = sharedProperties
    .filter(item => item.conflicting)
    .sort((a, b) => b.riskScore - a.riskScore
        || b.ownerCount - a.ownerCount
        || a.selector.localeCompare(b.selector)
        || a.property.localeCompare(b.property));
const sameValueDuplicates = sharedProperties.filter(item => !item.conflicting);
const highRiskConflicts = propertyConflicts.filter(item => item.risk === 'high');
const shadowedDeclarationCount = propertyConflicts.reduce((total, item) => total + item.occurrences.length - 1, 0);

function countBy(items, key) {
    return items.reduce((counts, item) => {
        const value = item[key] || 'other';
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}

function ownershipSnapshot(selector, context, properties) {
    const wanted = new Set(properties);
    const matches = records.filter(item => item.selector === selector && item.context === context && wanted.has(item.property));
    const result = {};
    for (const property of properties) {
        const occurrences = matches.filter(item => item.property === property);
        if (!occurrences.length) {
            result[property] = { owners: [], winner: null, occurrences: [] };
            continue;
        }
        const winner = chooseWinner(occurrences);
        result[property] = {
            owners: Array.from(new Set(occurrences.map(item => item.file))),
            winner: { file: winner.file, value: winner.value, important: winner.important },
            occurrences: occurrences
                .sort((a, b) => a.loadIndex - b.loadIndex || a.ruleOrder - b.ruleOrder)
                .map(item => ({ file: item.file, value: item.value, important: item.important }))
        };
    }
    return result;
}

const criticalOwnership = {
    recommendationCardBase: ownershipSnapshot('.recommendation-card', 'base', [
        'background', 'border-color', 'box-shadow', 'backdrop-filter', '-webkit-backdrop-filter', 'cursor', 'transition'
    ]),
    mobileCinematicHero: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .brand-panel.cinematic-brand-panel',
        '@media (max-width: 720px)',
        ['min-height', 'padding', 'border-radius', 'background', 'box-shadow']
    ),
    desktopStudioGrid: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .studio-grid',
        '@media (min-width: 1180px)',
        ['display', 'width', 'margin', 'grid-template-columns', 'grid-template-areas', 'grid-template-rows', 'column-gap', 'row-gap']
    ),
    mobileToast: ownershipSnapshot('.toast', '@media (max-width: 720px)', ['bottom']),
    dockBase: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .bottom-dock-tab',
        'base',
        ['min-height', 'border-radius']
    ),
    mobileDockTab: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .bottom-dock-tab',
        '@media (max-width: 720px)',
        ['min-height', 'padding', 'border-radius']
    ),
    desktopDockTab: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .bottom-dock.bottom-dock-hyperflow .bottom-dock-tab',
        '@media (min-width: 1180px)',
        ['min-height', 'padding', 'border-radius']
    ),
    startPanelVisibility: ownershipSnapshot('.start-command-panel', 'base', ['display']),
    mobileStartPanel: ownershipSnapshot(
        '.start-command-panel',
        '@media (max-width: 720px)',
        ['padding', 'border', 'border-radius', 'background', 'box-shadow']
    ),
    mobileStartStep: ownershipSnapshot(
        '.start-command-panel .workflow-step',
        '@media (max-width: 720px)',
        ['min-height', 'grid-template-columns', 'column-gap', 'padding', 'border', 'border-radius', 'background']
    ),
    transportButton: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .transport-row button',
        'base',
        ['min-width', 'min-height', 'padding', 'border-radius', 'font-size']
    ),
    exportButton: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] #exportBtn',
        'base',
        ['min-width', 'min-height', 'padding', 'border-radius', 'font-size']
    ),
    exportAllButton: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] #exportAllBtn',
        'base',
        ['min-width', 'min-height', 'padding', 'border-radius', 'font-size']
    ),
    headerTopline: ownershipSnapshot(
        '.cinematic-brand-panel .brand-topline',
        'base',
        ['display', 'grid-template-columns', 'align-items', 'gap']
    ),
    mobileHeaderTopline: ownershipSnapshot(
        '.cinematic-brand-panel .brand-topline',
        '@media (max-width: 720px)',
        ['display', 'grid-template-columns', 'gap', 'min-height']
    ),
    desktopShell: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .app-shell',
        '@media (min-width: 1180px)',
        ['width', 'padding-bottom']
    ),
    mobileHeroTitle: ownershipSnapshot(
        '.cinematic-title',
        '@media (max-width: 720px)',
        ['font-size', 'line-height', 'letter-spacing']
    ),
    brandPanelSkin: ownershipSnapshot(
        '.brand-panel',
        'base',
        ['background', 'border', 'box-shadow', 'backdrop-filter']
    ),
    badgeVersionSkin: ownershipSnapshot(
        '.badge-version',
        'base',
        ['background', 'border', 'color', 'backdrop-filter']
    ),
    brandSignatureSkin: ownershipSnapshot(
        '.brand-signature-pill',
        'base',
        ['background', 'border-color', 'backdrop-filter']
    ),
    bottomDockSkin: ownershipSnapshot(
        '.bottom-dock',
        'base',
        ['background', 'border-top', 'backdrop-filter']
    ),
    primaryButtonSkin: ownershipSnapshot(
        '.btn-primary',
        'base',
        ['background', 'border', 'box-shadow', 'color']
    ),
    secondaryButtonSkin: ownershipSnapshot(
        '.btn-secondary',
        'base',
        ['background', 'border', 'box-shadow', 'color']
    ),
    controlZoneBase: ownershipSnapshot(
        '.control-zone',
        'base',
        ['background', 'padding']
    ),
    previewCardBase: ownershipSnapshot(
        '.preview-card',
        'base',
        ['background', 'padding']
    ),
    panelHeadSpacing: ownershipSnapshot(
        '.panel-head',
        'base',
        ['margin-bottom']
    ),
    uploadTileSkin: ownershipSnapshot(
        '.upload-tile',
        'base',
        ['background', 'border', 'box-shadow']
    ),
    selectSkin: ownershipSnapshot(
        'select',
        'base',
        ['background', 'border', 'box-shadow']
    ),
    textareaSkin: ownershipSnapshot(
        'textarea',
        'base',
        ['background', 'border', 'box-shadow', 'min-height']
    ),
    hyperflowStageVisibility: ownershipSnapshot(
        '.hyperflow-stage',
        'base',
        ['display']
    ),
    legacyActionDockVisibility: ownershipSnapshot(
        '.action-dock',
        'base',
        ['display']
    ),
    sourceMediaContainment: ownershipSnapshot(
        '.source-media',
        'base',
        ['display', 'width', 'max-height']
    ),
    heroNoteBase: ownershipSnapshot(
        '.hero-compact-note',
        'base',
        ['max-width', 'color']
    ),
    cinematicHeroNoteBase: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .cinematic-brand-panel .hero-compact-note',
        'base',
        ['width', 'max-width']
    ),
    desktopHeroNote: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .hero-compact-note',
        '@media (min-width: 1180px)',
        ['max-width', 'font-size']
    ),
    mobileCinematicHeroNote: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .cinematic-brand-panel .hero-compact-note',
        '@media (max-width: 720px)',
        ['max-width', 'margin-top']
    ),
    heroPanelBaseHeight: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .brand-panel.cinematic-brand-panel',
        'base',
        ['min-height']
    ),
    desktopHeroPanelHeight: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] .brand-panel.cinematic-brand-panel',
        '@media (min-width: 1180px)',
        ['min-height']
    ),
    workspaceRevealMotion: ownershipSnapshot(
        'body[data-ui="hyperflow-tabs"] [data-flow-panel].is-workspace-revealed',
        'base',
        ['animation']
    ),
    fieldRhythm: ownershipSnapshot('.field', 'base', ['gap', 'color', 'font-weight']),
    disabledButtonState: ownershipSnapshot('button:disabled', 'base', ['opacity', 'cursor']),
    disabledMiniActionState: ownershipSnapshot('.mini-action:disabled', 'base', ['opacity', 'cursor']),
    ambientOverlayState: ownershipSnapshot('body::before', 'base', ['opacity']),
    autoCutSurface: ownershipSnapshot('.auto-cut-panel', 'base', ['background', 'border']),
    cinematicBrandSurface: ownershipSnapshot('.cinematic-brand-panel', 'base', ['background', 'border', 'box-shadow']),
    consoleSurface: ownershipSnapshot('.console-panel', 'base', ['background', 'box-shadow', 'padding']),
    engineStatusSurface: ownershipSnapshot('.engine-status-card', 'base', ['background', 'box-shadow']),
    recommendationActionSkin: ownershipSnapshot('.recommend-generate-btn', 'base', ['background', 'border', 'box-shadow']),
    statusDotSkin: ownershipSnapshot('.tab-state-dot', 'base', ['background', 'box-shadow']),
    documentScrollBehavior: ownershipSnapshot('html', 'base', ['scroll-behavior'])
};

const report = {
    version,
    generatedAt: new Date().toISOString(),
    cssFiles: allFiles.length,
    linkedCssFiles: linkedFiles.length,
    activeCssFiles: linkedFiles.length,
    archivedCssFiles: unlinkedFiles,
    importantCount: state.importantCount,
    duplicateSelectorCount: selectorConflicts.length,
    highConflictSelectorCount: selectorConflicts.filter(item => item.ownerCount >= 5).length,
    sharedPropertyCount: sharedProperties.length,
    conflictingPropertyCount: propertyConflicts.length,
    highRiskConflictCount: highRiskConflicts.length,
    sameValueDuplicateCount: sameValueDuplicates.length,
    shadowedDeclarationCount,
    conflictCategoryCounts: countBy(propertyConflicts, 'category'),
    highRiskCategoryCounts: countBy(highRiskConflicts, 'category'),
    criticalOwnership,
    topConflicts: selectorConflicts.slice(0, 30),
    topPropertyConflicts: propertyConflicts.slice(0, 60),
    propertyConflicts,
    sameValueDuplicates,
    ignoredAtRules: Array.from(state.ignoredAtRules).sort()
};

const output = path.join(__dirname, `runtime-css-ownership-v${version}.json`);
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(
    `PASS CSS ownership audit: ${allFiles.length} files, ${selectorConflicts.length} shared selectors, `
    + `${propertyConflicts.length} selector-property conflicts (${highRiskConflicts.length} high risk), `
    + `${state.importantCount} !important declarations`
);
