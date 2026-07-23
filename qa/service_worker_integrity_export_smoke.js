#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const registration = fs.readFileSync(path.join(root, 'src/boot/service-worker-registration.js'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/ui/storage-health-panel.js'), 'utf8');
if (!registration.includes('exportIntegrityDiagnostics') || !registration.includes("exportType: 'service-worker-integrity-diagnostics'")) throw new Error('service worker registration owner must export integrity diagnostics JSON');
if (!registration.includes('auditHistory') || !registration.includes('assetBackoff') || !registration.includes('rollbackPreserved')) throw new Error('integrity diagnostics must include audit history, backoff state, and rollback preservation');
if (!registration.includes("type: 'service-worker-online-integrity-resume'") || !registration.includes('scheduleIntegrityAudit(1000)')) throw new Error('online recovery must promptly resume deferred integrity audits');
if (!panel.includes('storageIntegrityDiagnosticsBtn') || !panel.includes('셸 감사 진단')) throw new Error('storage health panel must expose integrity diagnostics export');
console.log('PASS service worker audit diagnostics export and online-resume controls');
