'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/shutter-glass-flow.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'src/ui/flow-director-final.js'), 'utf8');
function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}
assert(html.includes('assets/css/shutter-glass-flow.css'), 'shutter glass css is linked');
assert(html.includes('src/ui/flow-director-final.js'), 'final flow director script is linked');
assert(css.includes('.social-shutter-strip'), 'social shutter strip styles exist');
assert(css.includes('body[data-ui="hyperflow-tabs"] [data-flow-panel]:not(.is-flow-active)'), 'inactive panels are hidden by final css');
assert(css.includes('animation-name: none !important'), 'panel animations are suppressed');
assert(js.includes('AIShortsFlowDirectorFinal'), 'final director global is exported');
assert(js.includes('global.AIShortsMotionStability'), 'motion stability is unified');
assert(js.includes('YouTube') && js.includes('Reels') && js.includes('TikTok'), 'social platform shutter labels are present');
assert(js.includes('setActiveFlowTab'), 'hyperflow tab api is patched');
console.log('PASS shutter_flow_director_smoke');
