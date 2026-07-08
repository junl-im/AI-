const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tabs = fs.readFileSync(path.join(root, 'src/ui/hyperflow-tabs.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/flow-hotfix.css'), 'utf8');
function assert(condition, message) { if (!condition) { console.error(message); process.exit(1); } }
assert(html.includes('data-ui="hyperflow-tabs"'), 'body data-ui must enable HyperFlow tab CSS');
assert(html.includes('data-flow-tab="candidates"'), 'bottom dock must include candidates tab');
assert(html.includes('data-flow-panel="candidates"'), 'candidate list must live in candidates panel');
assert(!html.includes('data-flow-tab="caption"'), 'caption tab should be removed from dock to keep 8-tab flow with candidates');
assert(tabs.includes("'candidates'"), 'tab controller must know candidates tab');
assert(!tabs.includes('scrollIntoView({ behavior'), 'tab switching must not force scroll to page top');
assert(app.includes("activateFlowTab('candidates'"), 'recommendation generation must move to candidates tab');
assert(app.includes("activateFlowTab('preview', { scroll: false })"), 'candidate selection must move to preview without scroll jump');
assert(css.includes('min-height: 38px') && css.includes('#previewBtn'), 'large action buttons must be compacted');
console.log('flow hotfix smoke passed');
