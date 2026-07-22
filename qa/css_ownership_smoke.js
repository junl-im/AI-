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
if (report.importantCount > 593) throw new Error('CSS !important count exceeded the ownership baseline');
if (report.conflictingPropertyCount !== 0) throw new Error('selector-property conflicts must remain at zero');
if (report.highRiskConflictCount > 0) throw new Error('high-risk CSS conflicts exceeded the ownership baseline');
if (report.shadowedDeclarationCount !== 0) throw new Error('shadowed CSS declarations must remain at zero');
if (report.highConflictSelectorCount < 1) throw new Error('high-conflict selector inventory is unexpectedly empty');

const categoryTotal = Object.values(report.conflictCategoryCounts || {}).reduce((sum, count) => sum + count, 0);
if (categoryTotal !== 0 || Object.keys(report.conflictCategoryCounts || {}).length !== 0) {
    throw new Error('zero-conflict release must not expose conflict categories');
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

const headerTopline = report.criticalOwnership?.headerTopline;
const mobileHeaderTopline = report.criticalOwnership?.mobileHeaderTopline;
const desktopShell = report.criticalOwnership?.desktopShell;
const mobileHeroTitle = report.criticalOwnership?.mobileHeroTitle;
if (!headerTopline || !mobileHeaderTopline || !desktopShell || !mobileHeroTitle) {
    throw new Error('v1.5.20 responsive ownership snapshots are missing');
}
for (const property of ['display', 'grid-template-columns', 'align-items', 'gap']) {
    assertSingleOwner(headerTopline, property, 'header-meta-rail.css');
}
for (const property of ['display', 'grid-template-columns', 'gap', 'min-height']) {
    assertSingleOwner(mobileHeaderTopline, property, 'header-meta-rail.css');
}
for (const property of ['width', 'padding-bottom']) {
    assertSingleOwner(desktopShell, property, 'ui-refinement.css');
}
for (const property of ['font-size', 'line-height', 'letter-spacing']) {
    assertSingleOwner(mobileHeroTitle, property, 'ui-refinement.css');
}


const brandPanelSkin = report.criticalOwnership?.brandPanelSkin;
const badgeVersionSkin = report.criticalOwnership?.badgeVersionSkin;
const brandSignatureSkin = report.criticalOwnership?.brandSignatureSkin;
const bottomDockSkin = report.criticalOwnership?.bottomDockSkin;
const primaryButtonSkin = report.criticalOwnership?.primaryButtonSkin;
const secondaryButtonSkin = report.criticalOwnership?.secondaryButtonSkin;
if (!brandPanelSkin || !badgeVersionSkin || !brandSignatureSkin || !bottomDockSkin || !primaryButtonSkin || !secondaryButtonSkin) {
    throw new Error('brand, dock, and button skin ownership snapshots are missing');
}
for (const property of ['background', 'border', 'box-shadow', 'backdrop-filter']) {
    assertSingleOwner(brandPanelSkin, property, 'shutter-glass-flow.css');
}
for (const property of ['background', 'border', 'color', 'backdrop-filter']) {
    assertSingleOwner(badgeVersionSkin, property, 'shutter-glass-flow.css');
}
for (const property of ['background', 'border-color', 'backdrop-filter']) {
    assertSingleOwner(brandSignatureSkin, property, 'glass-pro-ui.css');
}
for (const property of ['background', 'border-top', 'backdrop-filter']) {
    assertSingleOwner(bottomDockSkin, property, 'shutter-glass-flow.css');
}
for (const snapshot of [primaryButtonSkin, secondaryButtonSkin]) {
    for (const property of ['background', 'border', 'box-shadow', 'color']) {
        assertSingleOwner(snapshot, property, 'ui-refinement.css');
    }
}

const controlZoneBase = report.criticalOwnership?.controlZoneBase;
const previewCardBase = report.criticalOwnership?.previewCardBase;
const panelHeadSpacing = report.criticalOwnership?.panelHeadSpacing;
const uploadTileSkin = report.criticalOwnership?.uploadTileSkin;
const selectSkin = report.criticalOwnership?.selectSkin;
const textareaSkin = report.criticalOwnership?.textareaSkin;
const hyperflowStageVisibility = report.criticalOwnership?.hyperflowStageVisibility;
const legacyActionDockVisibility = report.criticalOwnership?.legacyActionDockVisibility;
const sourceMediaContainment = report.criticalOwnership?.sourceMediaContainment;
if (!controlZoneBase || !previewCardBase || !panelHeadSpacing || !uploadTileSkin || !selectSkin || !textareaSkin || !hyperflowStageVisibility || !legacyActionDockVisibility || !sourceMediaContainment) {
    throw new Error('command and control ownership snapshots are missing');
}
for (const surface of [controlZoneBase, previewCardBase]) {
    assertSingleOwner(surface, 'background', 'shutter-glass-flow.css');
    assertSingleOwner(surface, 'padding', 'foundation-polish.css');
}
assertSingleOwner(panelHeadSpacing, 'margin-bottom', 'ui-refinement.css');
for (const property of ['background', 'border', 'box-shadow']) {
    assertSingleOwner(uploadTileSkin, property, 'ui-refinement.css');
    assertSingleOwner(selectSkin, property, 'ui-refinement.css');
    assertSingleOwner(textareaSkin, property, 'ui-refinement.css');
}
assertSingleOwner(textareaSkin, 'min-height', 'ui-refinement.css');
assertSingleOwner(hyperflowStageVisibility, 'display', 'studio-experience.css');
assertSingleOwner(legacyActionDockVisibility, 'display', 'layout-dock.css');
for (const property of ['display', 'width', 'max-height']) {
    assertSingleOwner(sourceMediaContainment, property, 'layout-dock.css');
}


const mediumConflicts = report.propertyConflicts.filter(item => item.risk === 'medium' || item.risk === 'high');
if (mediumConflicts.length) throw new Error('medium/high-risk CSS conflicts reappeared');

const fieldRhythm = report.criticalOwnership?.fieldRhythm;
const disabledButtonState = report.criticalOwnership?.disabledButtonState;
const disabledMiniActionState = report.criticalOwnership?.disabledMiniActionState;
const ambientOverlayState = report.criticalOwnership?.ambientOverlayState;
const autoCutSurface = report.criticalOwnership?.autoCutSurface;
const cinematicBrandSurface = report.criticalOwnership?.cinematicBrandSurface;
const consoleSurface = report.criticalOwnership?.consoleSurface;
const engineStatusSurface = report.criticalOwnership?.engineStatusSurface;
const recommendationActionSkin = report.criticalOwnership?.recommendationActionSkin;
const statusDotSkin = report.criticalOwnership?.statusDotSkin;
if (!fieldRhythm || !disabledButtonState || !disabledMiniActionState || !ambientOverlayState || !autoCutSurface || !cinematicBrandSurface || !consoleSurface || !engineStatusSurface || !recommendationActionSkin || !statusDotSkin) {
    throw new Error('surface and state ownership snapshots are missing');
}
for (const property of ['gap', 'color', 'font-weight']) assertSingleOwner(fieldRhythm, property, 'ui-refinement.css');
assertSingleOwner(disabledButtonState, 'opacity', 'ui-refinement.css');
assertSingleOwner(disabledButtonState, 'cursor', 'theme.css');
assertSingleOwner(disabledMiniActionState, 'opacity', 'ui-refinement.css');
assertSingleOwner(disabledMiniActionState, 'cursor', 'advanced-editor.css');
assertSingleOwner(ambientOverlayState, 'opacity', 'ui-refinement.css');
for (const property of ['background', 'border']) assertSingleOwner(autoCutSurface, property, 'shutter-glass-flow.css');
for (const property of ['background', 'border', 'box-shadow']) assertSingleOwner(cinematicBrandSurface, property, 'hero-command-deck.css');
assertSingleOwner(consoleSurface, 'background', 'shutter-glass-flow.css');
assertSingleOwner(consoleSurface, 'box-shadow', 'foundation-polish.css');
assertSingleOwner(consoleSurface, 'padding', 'foundation-polish.css');
for (const property of ['background', 'box-shadow']) assertSingleOwner(engineStatusSurface, property, 'ui-refinement.css');
for (const property of ['background', 'border', 'box-shadow']) assertSingleOwner(recommendationActionSkin, property, 'ui-refinement.css');
assertSingleOwner(statusDotSkin, 'background', 'glass-pro-ui.css');
assertSingleOwner(statusDotSkin, 'box-shadow', 'ui-refinement.css');

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

console.log('PASS v1.5.20 zero-conflict CSS cascade ownership ceiling');
