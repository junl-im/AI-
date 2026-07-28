#!/usr/bin/env python3
"""Chromium audit for per-page timing, in-page speaker ordering, and live energy hold diagnostics."""
from __future__ import annotations
import asyncio, datetime as dt, json
from playwright.async_api import async_playwright
from run_media_e2e import ROOT, build_inline_html

VERSION=json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['version']
OUTPUT=ROOT/'qa'/f'runtime-speaker-page-timing-v{VERSION}.json'

async def main():
    errors=[]; console_errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1180,'height':940})
        page=await context.new_page()
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.on('console',lambda message: console_errors.append(message.text) if message.type=='error' else None)
        await page.set_content(build_inline_html(),wait_until='load',timeout=30000)
        await page.evaluate("""() => {
            const point=(time,x)=>({time,x,y:.42,confidence:.93,source:'face',box:{x:x-.04,y:.32,width:.08,height:.18}});
            const energy=[.55,.78,.66,.61,.84,.58];
            const subjects=Array.from({length:6},(_,index)=>({id:`subject-${index+1}`,label:`화자 ${index+1}`,points:[point(0,.11+index*.15),point(12,.12+index*.15)]}));
            const cues=subjects.map((subject,index)=>({start:index===4?1.5:0,end:12,speaker:subject.label,subjectId:subject.id,confidence:.9-index*.02,energy:energy[index],priority:index===0?'primary':'auto',gridCrop:{}}));
            const track=AIShortsSmartReframe._test.buildTrack([point(0,.5),point(12,.5)],'hybrid',{}, {},{subjects,activeSubjectId:'auto',speakerPriority:true,speakerCues:cues,speakerLayout:{gridPaging:'manual',gridPageSeconds:3,gridManualPages:[['subject-1','subject-2','subject-3'],['subject-1','subject-4','subject-5','subject-6']],gridManualPageSeconds:[2,5],gridTransition:'fade',gridTransitionMs:320}});
            AIShortsAppState.state.settings.cropMode='smart'; AIShortsAppState.state.fileKind='video'; AIShortsAppState.state.smartReframe=track; AIShortsAppState.state.smartReframeEdits=AIShortsSmartReframe.extractEdits(track);
            const panel=document.querySelector('#speakerFaceTuningPanel'); if(panel) panel.open=true;
            Object.defineProperty(document.querySelector('#sourceVideo'),'currentTime',{value:2,writable:true,configurable:true});
            AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => document.querySelectorAll('.speaker-grid-manual-page-card').length===2",timeout=10000)
        before=await page.evaluate("""() => ({
            durations:Array.from(document.querySelectorAll('.speaker-grid-manual-page-duration input')).map(node=>Number(node.value)),
            pages:AIShortsAppState.state.smartReframe.speakerLayout.gridManualPages,
            pageSeconds:AIShortsAppState.state.smartReframe.speakerLayout.gridManualPageSeconds
        })""")
        await page.evaluate("""() => {
            const firstChip=document.querySelector('.speaker-grid-manual-page-card .speaker-grid-manual-subject-chip');
            const right=firstChip && firstChip.querySelectorAll('button')[1]; if(right) right.click();
            const inputs=document.querySelectorAll('.speaker-grid-manual-page-duration input');
            inputs[1].value='6'; inputs[1].dispatchEvent(new Event('change',{bubbles:true}));
        }""")
        await page.wait_for_function("() => AIShortsAppState.state.smartReframe.speakerLayout.gridManualPageSeconds[1]===6 && AIShortsAppState.state.smartReframe.speakerLayout.gridManualPages[0][0]==='subject-2'",timeout=10000)
        manual=await page.evaluate("""() => {
            const track=AIShortsAppState.state.smartReframe;
            const second=AIShortsSmartReframe.getFocusAt(track,2.2);
            const wrapped=AIShortsSmartReframe.getFocusAt(track,8.2);
            return {pages:track.speakerLayout.gridManualPages,durations:track.speakerLayout.gridManualPageSeconds,secondPage:second.gridPage,secondDuration:second.gridPageDuration,secondSubjects:second.gridSubjects.map(item=>item.subjectId),wrappedPage:wrapped.gridPage};
        }""")
        await page.evaluate("""() => {
            const select=document.querySelector('#speakerGridPagingSelect'); select.value='energy'; select.dispatchEvent(new Event('change',{bubbles:true}));
            const video=document.querySelector('#sourceVideo'); video.currentTime=2; AIShortsStudioApp.renderAll();
        }""")
        await page.wait_for_function("() => !document.querySelector('#speakerEnergyStatus').hidden && document.querySelectorAll('.speaker-energy-row').length>=5",timeout=10000)
        energy=await page.evaluate("""() => ({
            status:document.querySelector('#speakerEnergyHoldStatus').textContent.trim(),
            rows:Array.from(document.querySelectorAll('.speaker-energy-row')).map(row=>({text:row.textContent.trim(),selected:row.dataset.selected})),
            hidden:document.querySelector('#speakerEnergyStatus').hidden,
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
        })""")
        await context.close(); await browser.close()
    checks={
        'initialDurations':before['durations']==[2,5] and before['pageSeconds']==[2,5],
        'subjectOrderChanged':manual['pages'][0]==['subject-2','subject-1','subject-3'],
        'pageDurationChanged':manual['durations']==[2,6] and manual['secondPage']==1 and manual['secondDuration']==6,
        'durationCycleWraps':manual['wrappedPage']==0,
        'energyPanelVisible':not energy['hidden'] and len(energy['rows'])>=5,
        'holdRemainingShown':'hold' in energy['status'] and '남음' in energy['status'],
        'selectedEnergyRowsMarked':any(row['selected']=='true' for row in energy['rows']),
        'viewportContained':energy['overflow']<=1,
        'noRuntimeErrors':not errors and not console_errors,
    }
    report={'version':VERSION,'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'before':before,'manual':manual,'energy':energy,'checks':checks,'passed':all(checks.values()),'pageErrors':errors,'consoleErrors':console_errors}
    OUTPUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(OUTPUT); print(json.dumps(checks,ensure_ascii=False,indent=2))
    if not report['passed']: raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
