#!/usr/bin/env python3
"""Probe structural/responsive !important declarations against real Chromium computed styles."""
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'qa' / 'runtime-structure-priority-probe-v1.5.24.json'
TARGET_FILES = [
    'assets/css/pc-dock-reveal-hotfix.css',
    'assets/css/desktop-prime-layout.css',
    'assets/css/workspace-layout-controls.css',
    'assets/css/responsive-workspace.css',
]
VIEWPORTS = {
    'desktop': {'width': 1440, 'height': 1000},
    'smallLaptop': {'width': 1280, 'height': 800},
    'tablet': {'width': 900, 'height': 1000},
    'mobile': {'width': 390, 'height': 844},
}
INSTRUMENT = r'''<script>
window.__priorityProbeErrors=[];
window.addEventListener('error',e=>window.__priorityProbeErrors.push(String(e.message||e.error||'error')));
window.addEventListener('unhandledrejection',e=>window.__priorityProbeErrors.push(String(e.reason&&e.reason.message||e.reason||'rejection')));
</script>'''
FREEZE = r'''<style id="priority-probe-freeze">
*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}
</style>'''


def build_inline_html():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = re.sub(r'<meta[^>]+Content-Security-Policy[^>]*>', '', html, flags=re.I)
    html = html.replace('<head>', '<head>' + INSTRUMENT, 1)

    def inline_css(match):
        rel = match.group(1).split('?', 1)[0]
        path = ROOT / rel
        return f'<style data-source="{rel}">{path.read_text(encoding="utf-8")}</style>' if path.exists() else ''

    def inline_js(match):
        rel = match.group(1).split('?', 1)[0]
        if rel.endswith('staged-ui-loader.js'):
            return ''
        path = ROOT / rel
        content = path.read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        return f'<script data-source="{rel}">{content}</script>' if path.exists() else ''

    html = re.sub(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*/?>', inline_css, html)
    html = re.sub(r'<script[^>]+src="([^"]+)"[^>]*></script>', inline_js, html)
    staged = [
        'src/ui/ux-controls.js', 'src/ui/hyperconnect-flow.js', 'src/ui/flow-polish.js',
        'src/ui/flow-hotfix.js', 'src/ui/flow-integrity.js', 'src/ui/flow-doctor.js',
        'src/ui/flow-quality-gate.js', 'src/ui/workspace-comfort.js', 'src/ui/session-continuity.js',
        'src/ui/range-drag-controls.js', 'src/ui/handoff-coach.js', 'src/ui/save-readiness.js',
        'src/ui/render-quality-planner.js', 'src/ui/candidate-preview-pro.js',
        'src/ui/candidate-pin-board.js', 'src/ui/export-finish-center.js',
        'src/ui/studio-experience-controller.js'
    ]
    scripts = ''.join(
        '<script data-source="{0}">{1}</script>'.format(
            rel, (ROOT / rel).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
        ) for rel in staged
    )
    return html.replace('</head>', scripts + FREEZE + '</head>')


PROBE_JS = r'''async ({targets}) => {
  const interactionPattern = /:(hover|focus|focus-visible|focus-within|active|disabled|enabled|checked|visited|target)\b/;
  const excludedProps = new Set(['animation','animation-name','animation-duration','animation-delay','transition','transition-property','transition-duration','transition-delay','scroll-behavior','caret-color']);
  function splitSelectors(value){
    const out=[]; let cur=''; let depth=0; let quote='';
    for(let i=0;i<value.length;i++){
      const ch=value[i];
      if(quote){cur+=ch; if(ch===quote && value[i-1]!=='\\')quote=''; continue;}
      if(ch==='"'||ch==="'"){quote=ch;cur+=ch;continue;}
      if(ch==='('||ch==='['){depth++;cur+=ch;continue;}
      if(ch===')'||ch===']'){depth=Math.max(0,depth-1);cur+=ch;continue;}
      if(ch===','&&depth===0){if(cur.trim())out.push(cur.trim());cur='';continue;}
      cur+=ch;
    }
    if(cur.trim())out.push(cur.trim()); return out;
  }
  function mediaActive(rule){
    let p=rule.parentRule;
    while(p){
      if(p.constructor && p.constructor.name==='CSSMediaRule' && !matchMedia(p.conditionText).matches)return false;
      if(p.constructor && p.constructor.name==='CSSSupportsRule' && !CSS.supports(p.conditionText))return false;
      p=p.parentRule;
    }
    return true;
  }
  function ownerSource(sheet){return sheet.ownerNode?.dataset?.source||'';}
  function walkRules(rules, path, source, out){
    for(let i=0;i<rules.length;i++){
      const rule=rules[i]; const next=[...path,i];
      if(rule.type===CSSRule.STYLE_RULE){
        for(const prop of rule.style){
          if(rule.style.getPropertyPriority(prop)!=='important')continue;
          if(excludedProps.has(prop))continue;
          if(interactionPattern.test(rule.selectorText))continue;
          out.push({id:`${source}|${next.join('.')}|${prop}`,source,path:next,selector:rule.selectorText,prop,value:rule.style.getPropertyValue(prop).trim(),active:mediaActive(rule)});
        }
      } else if(rule.cssRules){walkRules(rule.cssRules,next,source,out);}
    }
  }
  function getRule(sheet,path){let rules=sheet.cssRules,rule=null;for(const index of path){rule=rules[index];rules=rule.cssRules||[];}return rule;}
  function targetsForSelector(selectorText){
    const entries=[];
    for(const raw of splitSelectors(selectorText)){
      let pseudo=''; let selector=raw;
      const match=selector.match(/(::before|::after)\s*$/);
      if(match){pseudo=match[1];selector=selector.slice(0,match.index).trim();}
      try{for(const el of document.querySelectorAll(selector))entries.push({el,pseudo,key:`${selector}${pseudo}`});}catch(_){return {error:true,entries:[]};}
    }
    return {error:false,entries};
  }
  function snap(entries){
    return entries.map(({el,pseudo,key})=>{
      const cs=getComputedStyle(el,pseudo||null); const styles={};
      const watch=['display','position','inset','top','right','bottom','left','width','min-width','max-width','height','min-height','max-height','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','box-sizing','overflow','overflow-x','overflow-y','grid','grid-area','grid-template','grid-template-columns','grid-template-rows','grid-template-areas','grid-column','grid-row','gap','row-gap','column-gap','align-items','align-content','align-self','justify-items','justify-content','justify-self','place-items','flex','flex-basis','flex-grow','flex-shrink','flex-direction','flex-wrap','order','font-size','font-weight','line-height','letter-spacing','white-space','text-overflow','visibility','opacity','transform','z-index'];
      for(const prop of watch)styles[prop]=cs.getPropertyValue(prop);
      const r=el.getBoundingClientRect();
      return {key,tag:el.tagName,id:el.id||'',cls:el.className&&String(el.className)||'',pseudo,styles,rect:[r.x,r.y,r.width,r.height,r.top,r.right,r.bottom,r.left]};
    });
  }
  function diff(before,after){
    if(before.length!==after.length)return {changed:true,sample:['match-count']};
    const sample=[];
    for(let i=0;i<before.length;i++){
      const a=before[i],b=after[i];
      for(let j=0;j<a.rect.length;j++){if(Math.abs(a.rect[j]-b.rect[j])>0.01){sample.push(`${a.tag}#${a.id}.rect`);break;}}
      const keys=new Set([...Object.keys(a.styles),...Object.keys(b.styles)]);
      for(const prop of keys){if(a.styles[prop]!==b.styles[prop]){sample.push(`${a.tag}#${a.id}${a.pseudo}:${prop}:${a.styles[prop]}=>${b.styles[prop]}`);if(sample.length>=6)return {changed:true,sample};}}
      if(sample.length>=6)return {changed:true,sample};
    }
    return {changed:sample.length>0,sample};
  }
  const sheets=[...document.styleSheets].filter(sheet=>targets.includes(ownerSource(sheet)));
  const candidates=[]; for(const sheet of sheets)walkRules(sheet.cssRules,[],ownerSource(sheet),candidates);
  const results=[];
  for(const candidate of candidates){
    const sheet=sheets.find(s=>ownerSource(s)===candidate.source); const rule=getRule(sheet,candidate.path);
    const selected=targetsForSelector(candidate.selector);
    if(!candidate.active||selected.error||selected.entries.length===0){results.push({...candidate,tested:false,selectorError:selected.error,matched:selected.entries.length,changed:false,sample:[]});continue;}
    const before=snap(selected.entries); const oldValue=rule.style.getPropertyValue(candidate.prop);
    rule.style.setProperty(candidate.prop,oldValue,'');
    void document.documentElement.offsetHeight;
    const after=snap(selected.entries); rule.style.setProperty(candidate.prop,oldValue,'important'); void document.documentElement.offsetHeight;
    const delta=diff(before,after);
    results.push({...candidate,tested:true,selectorError:false,matched:selected.entries.length,changed:delta.changed,sample:delta.sample});
  }
  return {results,errors:window.__priorityProbeErrors||[]};
}'''


async def set_state(page, state):
    await page.evaluate("""(state) => {
      document.body.classList.remove('performance-lite','has-media');
      if (state === 'performance-lite') document.body.classList.add('performance-lite');
      if (state === 'has-media') document.body.classList.add('has-media');
      const tab = ['file','recommend','candidates','waveform','cut','edit','export'].includes(state) ? state : (state === 'has-media' ? 'file' : null);
      if (tab && window.AIShortsFlowDirectorFinal?.setActive) AIShortsFlowDirectorFinal.setActive(tab,{force:true,source:'priority-probe'});
      if (state === 'workspace-preview' && window.AIShortsWorkspaceLayout?.setMode) AIShortsWorkspaceLayout.setMode('preview',{navigate:false});
      else if (state === 'workspace-waveform' && window.AIShortsWorkspaceLayout?.setMode) AIShortsWorkspaceLayout.setMode('waveform',{navigate:false});
      else if (window.AIShortsWorkspaceLayout?.setMode) AIShortsWorkspaceLayout.setMode('balanced',{navigate:false});
    }""", state)
    if state == 'mobile-expanded':
        await page.evaluate("""() => {
          document.body.dataset.mobileMenuMode='expanded';
          const button=document.querySelector('#mobileDockMenuToggle');
          if(button){button.setAttribute('aria-expanded','true');}
        }""")
    await page.wait_for_timeout(30)


async def main():
    aggregate = {}
    errors = []
    states_by_mode = {
        'desktop': ['default','recommend','workspace-preview','workspace-waveform','has-media'],
        'smallLaptop': ['default','recommend','has-media'],
        'tablet': ['default','recommend','has-media'],
        'mobile': ['default','recommend','mobile-expanded','has-media'],
    }
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
        for mode, viewport in VIEWPORTS.items():
            context = await browser.new_context(viewport=viewport)
            page = await context.new_page()
            await page.set_content(build_inline_html(), wait_until='load', timeout=30000)
            await page.wait_for_timeout(700)
            for state in states_by_mode[mode]:
                await set_state(page, state)
                payload = await page.evaluate(PROBE_JS, {'targets': TARGET_FILES})
                errors.extend([{'mode':mode,'state':state,'error':e} for e in payload['errors']])
                for item in payload['results']:
                    rec = aggregate.setdefault(item['id'], {
                        'id': item['id'], 'source': item['source'], 'path': item['path'], 'selector': item['selector'],
                        'prop': item['prop'], 'value': item['value'], 'tested': [], 'changed': [], 'untested': []
                    })
                    if item['tested']:
                        rec['tested'].append({'mode':mode,'state':state,'matched':item['matched']})
                        if item['changed']:
                            rec['changed'].append({'mode':mode,'state':state,'sample':item['sample']})
                    else:
                        rec['untested'].append({'mode':mode,'state':state,'active':item['active'],'matched':item['matched'],'selectorError':item['selectorError']})
            await context.close()
        await browser.close()
    candidates = list(aggregate.values())
    safe = [c for c in candidates if c['tested'] and not c['changed']]
    unsafe = [c for c in candidates if c['changed']]
    unproven = [c for c in candidates if not c['tested']]
    report = {
        'baselineVersion':'1.5.19',
        'targetVersion':'1.5.24',
        'targetFiles':TARGET_FILES,
        'viewports':VIEWPORTS,
        'candidateCount':len(candidates),
        'safeCount':len(safe),
        'unsafeCount':len(unsafe),
        'unprovenCount':len(unproven),
        'safe':safe,
        'unsafe':unsafe,
        'unproven':unproven,
        'errors':errors,
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['candidateCount','safeCount','unsafeCount','unprovenCount','errors']}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
