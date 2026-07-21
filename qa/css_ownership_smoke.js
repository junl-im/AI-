#!/usr/bin/env node
'use strict';

const fs = require('fs');
const version = require('../package.json').version;
const report = JSON.parse(fs.readFileSync(`qa/runtime-css-ownership-v${version}.json`, 'utf8'));

function assertSingleOwner(snapshot, property, expectedFile) {
    const entry = snapshot[property];
    if (!entry || entry.owners.length !== 1 || entry.owners[0] !== expectedFile) {
        throw new Error(`${property} ownership must belong only to ${expectedFile}`);
    }
    if (!entry.winner || entry.winner.file !== expectedFile) {
        throw new Error(`${property} cascade winner must be ${expectedFile}`);
    }
}

if (report.version !== version || report.cssFiles !== 46 || report.activeCssFiles !== 45) {
    throw new Error('CSS ownership report does not match the release');
}
if (JSON.stringify(report.archivedCssFiles) !== JSON.stringify(['cinematic-hero.css'])) {
    throw new Error('CSS archive inventory changed unexpectedly');
}
if (!Array.isArray(report.propertyConflicts) || report.propertyConflicts.length !== report.conflictingPropertyCount) {
    throw new Error('full selector-property conflict inventory is missing');
}
if (report.importantCount > 904) throw new Error('CSS !important count exceeded the ownership baseline');
if (report.conflictingPropertyCount > 334) throw new Error('selector-property conflicts exceeded the ownership baseline');
if (report.highRiskConflictCount > 81) throw new Error('high-risk CSS conflicts exceeded the ownership baseline');
if (report.shadowedDeclarationCount > 422) throw new Error('shadowed CSS declarations exceeded the ownership baseline');
if (report.highConflictSelectorCount < 1) throw new Error('high-conflict selector inventory is unexpectedly empty');

const categoryTotal = Object.values(report.conflictCategoryCounts || {}).reduce((sum, count) => sum + count, 0);
if (categoryTotal !== report.conflictingPropertyCount) throw new Error('CSS conflict category totals are inconsistent');
for (const category of ['layout', 'skin', 'typography', 'interaction']) {
    if (!Object.hasOwn(report.conflictCategoryCounts, category)) {
        throw new Error(`CSS conflict category missing: ${category}`);
    }
}

const recommendation = report.criticalOwnership?.recommendationCardBase;
if (!recommendation) throw new Error('recommendation-card ownership snapshot is missing');
assertSingleOwner(recommendation, 'background', 'ui-refinement.css');
assertSingleOwner(recommendation, 'border-color', 'ui-refinement.css');
assertSingleOwner(recommendation, 'box-shadow', 'ui-refinement.css');
assertSingleOwner(recommendation, 'backdrop-filter', 'glass-pro-ui.css');
assertSingleOwner(recommendation, '-webkit-backdrop-filter', 'glass-pro-ui.css');
assertSingleOwner(recommendation, 'cursor', 'ux.css');
assertSingleOwner(recommendation, 'transition', 'ux.css');

const mobileHero = report.criticalOwnership?.mobileCinematicHero;
if (!mobileHero) throw new Error('mobile cinematic hero ownership snapshot is missing');
for (const property of ['min-height', 'padding', 'border-radius', 'background', 'box-shadow']) {
    assertSingleOwner(mobileHero, property, 'ui-refinement.css');
}

const desktopGrid = report.criticalOwnership?.desktopStudioGrid;
if (!desktopGrid) throw new Error('desktop studio grid ownership snapshot is missing');
for (const property of ['display', 'width', 'margin']) {
    assertSingleOwner(desktopGrid, property, 'desktop-prime-layout.css');
}
for (const property of ['grid-template-columns', 'grid-template-areas', 'grid-template-rows', 'column-gap', 'row-gap']) {
    assertSingleOwner(desktopGrid, property, 'workspace-layout-controls.css');
}

const mobileToast = report.criticalOwnership?.mobileToast;
if (!mobileToast) throw new Error('mobile toast ownership snapshot is missing');
assertSingleOwner(mobileToast, 'bottom', 'mobile-menu-guide.css');

const dockBase = report.criticalOwnership?.dockBase;
const mobileDock = report.criticalOwnership?.mobileDockTab;
const desktopDock = report.criticalOwnership?.desktopDockTab;
if (!dockBase || !mobileDock || !desktopDock) throw new Error('dock ownership snapshots are missing');
for (const property of ['min-height', 'border-radius']) assertSingleOwner(dockBase, property, 'ui-refinement.css');
for (const property of ['min-height', 'padding', 'border-radius']) assertSingleOwner(mobileDock, property, 'ui-refinement.css');
for (const property of ['min-height', 'padding', 'border-radius']) assertSingleOwner(desktopDock, property, 'foundation-polish.css');

const startVisibility = report.criticalOwnership?.startPanelVisibility;
const mobileStart = report.criticalOwnership?.mobileStartPanel;
const mobileStep = report.criticalOwnership?.mobileStartStep;
if (!startVisibility || !mobileStart || !mobileStep) throw new Error('start command ownership snapshots are missing');
assertSingleOwner(startVisibility, 'display', 'desktop-prime-layout.css');
for (const property of ['padding', 'border', 'border-radius', 'background', 'box-shadow']) {
    assertSingleOwner(mobileStart, property, 'ui-refinement.css');
}
for (const property of ['min-height', 'grid-template-columns', 'column-gap', 'padding', 'border', 'border-radius', 'background']) {
    assertSingleOwner(mobileStep, property, 'ui-refinement.css');
}

for (const key of ['transportButton', 'exportButton', 'exportAllButton']) {
    const snapshot = report.criticalOwnership?.[key];
    if (!snapshot) throw new Error(`${key} ownership snapshot is missing`);
    for (const property of ['min-width', 'min-height', 'padding', 'border-radius', 'font-size']) {
        assertSingleOwner(snapshot, property, 'flow-doctor.css');
    }
}

const forbiddenConflicts = report.propertyConflicts.filter(item => (
    item.selector === '.recommendation-card'
    && item.context === 'base'
    && ['background', 'border-color', 'box-shadow'].includes(item.property)
) || (
    item.selector === 'body[data-ui="hyperflow-tabs"] .brand-panel.cinematic-brand-panel'
    && item.context === '@media (max-width: 720px)'
    && ['min-height', 'padding', 'border-radius'].includes(item.property)
) || (
    item.selector === 'body[data-ui="hyperflow-tabs"] .studio-grid'
    && item.context === '@media (min-width: 1180px)'
    && ['display', 'width', 'margin', 'grid-template-columns', 'grid-template-areas', 'grid-template-rows', 'column-gap', 'row-gap'].includes(item.property)
));
if (forbiddenConflicts.length) throw new Error('consolidated CSS ownership conflicts reappeared');

console.log('PASS v1.5.7 responsive density CSS ownership and consolidated cascade ceilings');
