#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {
    window: {
        AIShortsCoreUtils: {
            formatRange(start, end) { return `${start}-${end}`; }
        }
    }
};
context.global = context.window;
vm.createContext(context);
const source = fs.readFileSync(path.join(root, 'src/caption/caption-service.js'), 'utf8');
vm.runInContext(source, context, { filename: 'caption-service.js' });

const svc = context.window.AIShortsCaptionService;
if (!svc) throw new Error('caption service was not exposed');
const cues = svc.parseCaptionText('1\n00:00:01,000 --> 00:00:03,000\n첫 자막\n\n2\n00:00:03.500 --> 00:00:05.000\n둘째 자막');
if (cues.length !== 2) throw new Error(`expected 2 cues, got ${cues.length}`);
if (svc.getActiveCue(cues, 2, 0).text !== '첫 자막') throw new Error('active cue lookup failed');
if (!svc.serializeCaptions(cues).includes('00:00:01.000')) throw new Error('caption serialization failed');
const quick = svc.createQuickCaptions('빠른 자막 자동 분할 테스트입니다', { start: 10, end: 20 }, 3);
if (!quick.length || quick[0].start < 10 || quick[quick.length - 1].end > 20.001) throw new Error('quick caption generation failed');
console.log('PASS caption service smoke');
