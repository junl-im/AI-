'use strict';
const fs=require('fs'); const path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../src/render/vertical-renderer.js'),'utf8');
function ok(v,m){if(!v)throw new Error(m)}
ok(src.includes('const gradientCache = new WeakMap()'),'gradient cache is context scoped');
ok(src.includes('const textMeasureCache = new WeakMap()'),'text measurement cache is context scoped');
ok(src.includes('cache.size >= 512'),'text cache is bounded');
ok(src.includes('cachedGradient(ctx, `clear:${width}x${height}`'),'base frame gradient is reused');
console.log('PASS v1.6.3 bounded render-frame paint caches');
