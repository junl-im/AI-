#!/usr/bin/env node
'use strict';
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
function fail(msg) { console.error('FAIL hyperconnect_flow_smoke:', msg); process.exit(1); }
function count(substr) { return (html.match(new RegExp(substr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length; }
if (!html.includes('data-ui="hyperflow-tabs"')) fail('body must use hyperflow-tabs UI mode');
if (html.includes('id="flowRecommendBtn"')) fail('top duplicate recommendation button must be removed');
if (count('id="analyzeBtn"') !== 1) fail('there must be exactly one recommendation generate button');
if (!html.includes('[📂 파일]') && !html.includes('data-flow-tab="file"')) fail('bottom tab dock missing file tab');
if (!html.includes('data-flow-tab="candidates"')) fail('bottom tab dock missing candidates tab');
if (!html.includes('data-flow-tab="export"')) fail('bottom tab dock missing export tab');
if (!html.includes('v1.5.25</button>')) fail('version badge missing simple v1.5.25');
if (!html.includes('class="signature-label">DESIGNED BY</span><strong>곰같은여우</strong>')) fail('designer signature missing');
const hyper = fs.readFileSync('src/ui/hyperflow-tabs.js', 'utf8') + fs.readFileSync('src/ui/flow-polish.js', 'utf8');
if (!hyper.includes('추천 생성은 추천 탭 안의 단일 버튼') && !html.includes('추천 탭 안에 하나만')) fail('single recommendation guidance missing');
const waveform = fs.readFileSync('src/ui/waveform-view.js', 'utf8');
if (!waveform.includes('rec-select-cta')) fail('recommendation card selection CTA missing');
console.log('PASS hyperconnect_flow_smoke');
