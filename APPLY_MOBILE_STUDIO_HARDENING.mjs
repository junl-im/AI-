import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function file(relative) {
  return path.join(root, relative)
}

function read(relative) {
  const target = file(relative)
  if (!fs.existsSync(target)) throw new Error(`${relative}: 파일을 찾지 못했습니다.`)
  return fs.readFileSync(target, 'utf8')
}

function write(relative, content) {
  const target = file(relative)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content)
  console.log(`update ${relative}`)
}

function replaceOnce(relative, before, after, marker) {
  let content = read(relative)
  if (marker && content.includes(marker)) {
    console.log(`skip ${relative} (${marker})`)
    return
  }
  const index = content.indexOf(before)
  if (index < 0) {
    throw new Error(`${relative}: 패치 기준점을 찾지 못했습니다. 최신 main/hotfix와 파일이 다른지 확인해 주세요.\n기준점: ${before.slice(0, 120)}`)
  }
  if (content.indexOf(before, index + before.length) >= 0) {
    throw new Error(`${relative}: 패치 기준점이 두 번 이상 발견되어 안전하게 중단했습니다.`)
  }
  content = `${content.slice(0, index)}${after}${content.slice(index + before.length)}`
  write(relative, content)
}

function appendOnce(relative, block, marker) {
  let content = read(relative)
  if (content.includes(marker)) {
    console.log(`skip ${relative} (${marker})`)
    return
  }
  if (!content.endsWith('\n')) content += '\n'
  write(relative, `${content}\n${block.trim()}\n`)
}

function assertRepo() {
  const pkg = JSON.parse(read('package.json'))
  if (pkg.name !== 'sorion-ai') throw new Error(`예상하지 못한 프로젝트입니다: ${pkg.name ?? 'unknown'}`)
  console.log(`SoriON ${pkg.version} · mobile integration/performance hardening`)
}

assertRepo()

// 1) Mobile soft-keyboard stability: rAF-throttle visualViewport events and account for viewport offset.
replaceOnce(
  'src/components/workspace/LongformComposer.tsx',
  `  const editorRef = useRef<HTMLTextAreaElement>(null)\n  const fileInputRef = useRef<HTMLInputElement>(null)\n  const alignEditorToMobileTop = useCallback((behavior: ScrollBehavior = 'smooth') => {\n    const editor = editorRef.current\n    if (!editor || window.innerWidth > 760) return\n    const rect = editor.getBoundingClientRect()\n    const targetTop = Math.max(0, window.scrollY + rect.top - 68)\n    if (Math.abs(rect.top - 68) < 10) return\n    window.scrollTo({ top: targetTop, behavior })\n  }, [])\n  const alignEditorAfterFocus = useCallback(() => {\n    window.requestAnimationFrame?.(() => alignEditorToMobileTop('smooth'))\n    window.setTimeout(() => alignEditorToMobileTop('auto'), 220)\n  }, [alignEditorToMobileTop])`,
  `  const editorRef = useRef<HTMLTextAreaElement>(null)\n  const fileInputRef = useRef<HTMLInputElement>(null)\n  const viewportRealignFrameRef = useRef<number | null>(null)\n  const alignEditorToMobileTop = useCallback((behavior: ScrollBehavior = 'smooth') => {\n    const editor = editorRef.current\n    if (!editor || window.innerWidth > 760) return\n    const viewportOffsetTop = window.visualViewport?.offsetTop ?? 0\n    const desiredTop = 68 + viewportOffsetTop\n    const rect = editor.getBoundingClientRect()\n    const targetTop = Math.max(0, window.scrollY + rect.top - desiredTop)\n    if (Math.abs(rect.top - desiredTop) < 10) return\n    window.scrollTo({ top: targetTop, behavior })\n  }, [])\n  const alignEditorAfterFocus = useCallback(() => {\n    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const smoothBehavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'\n    window.requestAnimationFrame?.(() => alignEditorToMobileTop(smoothBehavior))\n    window.setTimeout(() => alignEditorToMobileTop('auto'), 180)\n  }, [alignEditorToMobileTop])`,
  'viewportRealignFrameRef',
)

replaceOnce(
  'src/components/workspace/LongformComposer.tsx',
  `  useEffect(() => {\n    const viewport = window.visualViewport\n    if (!viewport) return undefined\n    const realign = () => {\n      if (document.activeElement === editorRef.current) alignEditorToMobileTop('auto')\n    }\n    viewport.addEventListener('resize', realign)\n    viewport.addEventListener('scroll', realign)\n    return () => {\n      viewport.removeEventListener('resize', realign)\n      viewport.removeEventListener('scroll', realign)\n    }\n  }, [alignEditorToMobileTop])`,
  `  useEffect(() => {\n    const viewport = window.visualViewport\n    if (!viewport) return undefined\n    const realign = () => {\n      if (document.activeElement !== editorRef.current || window.innerWidth > 760) return\n      if (viewportRealignFrameRef.current !== null) return\n      viewportRealignFrameRef.current = window.requestAnimationFrame(() => {\n        viewportRealignFrameRef.current = null\n        alignEditorToMobileTop('auto')\n      })\n    }\n    viewport.addEventListener('resize', realign, { passive: true })\n    viewport.addEventListener('scroll', realign, { passive: true })\n    return () => {\n      viewport.removeEventListener('resize', realign)\n      viewport.removeEventListener('scroll', realign)\n      if (viewportRealignFrameRef.current !== null) window.cancelAnimationFrame(viewportRealignFrameRef.current)\n      viewportRealignFrameRef.current = null\n    }\n  }, [alignEditorToMobileTop])`,
  "viewport.addEventListener('resize', realign, { passive: true })",
)

replaceOnce(
  'src/components/workspace/LongformComposer.tsx',
  `    function focusEditorFromTyping(event: KeyboardEvent) {\n      if (\n        disabled`,
  `    function focusEditorFromTyping(event: KeyboardEvent) {\n      const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches\n      if (window.innerWidth <= 760 && coarsePointer) return\n      if (\n        disabled`,
  "const coarsePointer = typeof window.matchMedia === 'function'",
)

// 2) Touch-native arbitrary multi-selection in TimelineEditor.
replaceOnce(
  'src/components/workspace/TimelineEditor.tsx',
  `          )}\n          <button\n            type="button"\n            className="soa-dubbing-block__direct-tool"`,
  `          )}\n          <button\n            type="button"\n            className="soa-dubbing-block__touch-select"\n            onClick={(event) => {\n              event.stopPropagation()\n              onSelect(block.id, 'toggle')\n            }}\n            aria-label={selected ? String(voiceIndex + 1) + '번 대사 선택 해제' : String(voiceIndex + 1) + '번 대사 다중 선택'}\n            aria-pressed={selected}\n          >\n            {selected ? '✓' : '＋'}\n          </button>\n          <button\n            type="button"\n            className="soa-dubbing-block__direct-tool"`,
  'soa-dubbing-block__touch-select',
)

replaceOnce(
  'src/components/workspace/TimelineEditor.tsx',
  `<p>트랙 클릭 위치 이동 · Ctrl/Cmd 클릭 다중 선택 · Shift 클릭 범위 선택 · Ctrl/Cmd+A 대사 전체 · R 일괄 재생성 · ? 단축키</p>`,
  `<p>트랙 클릭 위치 이동 · 모바일 ＋ 버튼 다중 선택 · Ctrl/Cmd 클릭 다중 선택 · Shift 클릭 범위 선택 · Ctrl/Cmd+A 대사 전체 · R 일괄 재생성 · ? 단축키</p>`,
  '모바일 ＋ 버튼 다중 선택',
)

replaceOnce(
  'src/components/workspace/TimelineEditor.tsx',
  `                          <span>쉼</span><strong>{block.durationSeconds.toFixed(1)}초</strong>\n                          <button type="button" onClick={(event) => { event.stopPropagation(); removeSelection(block.id) }} aria-label="쉼 블록 삭제">×</button>`,
  `                          <span>쉼</span><strong>{block.durationSeconds.toFixed(1)}초</strong>\n                          <button\n                            type="button"\n                            className="soa-dubbing-block__touch-select"\n                            onClick={(event) => { event.stopPropagation(); selectBlock(block.id, 'toggle') }}\n                            aria-label={selectedBlockIds.has(block.id) ? '쉼 블록 선택 해제' : '쉼 블록 다중 선택'}\n                            aria-pressed={selectedBlockIds.has(block.id)}\n                          >{selectedBlockIds.has(block.id) ? '✓' : '＋'}</button>\n                          <button type="button" onClick={(event) => { event.stopPropagation(); removeSelection(block.id) }} aria-label="쉼 블록 삭제">×</button>`,
  "aria-label={selectedBlockIds.has(block.id) ? '쉼 블록 선택 해제'",
)

// 3) Player dock: isolate navigation from 4-5Hz playback updates and avoid smooth-scroll jank on mobile page changes.
replaceOnce(
  'src/components/navigation/LinkedPlayerDock.tsx',
  `import {\n  useCallback,`,
  `import {\n  memo,\n  useCallback,`,
  '  memo,\n  useCallback,',
)

replaceOnce(
  'src/components/navigation/LinkedPlayerDock.tsx',
  `const rates = [0.75, 1, 1.25, 1.5, 2]\n\nfunction formatTime(value: number) {`,
  `const rates = [0.75, 1, 1.25, 1.5, 2]\ntype DockNavigationPage = (typeof primaryNavigationItems)[number]['page']\n\nconst DockNavigation = memo(function DockNavigation({\n  currentPage,\n  onNavigate,\n}: {\n  currentPage: string\n  onNavigate: (page: DockNavigationPage) => void\n}) {\n  return (\n    <nav className="soa-dock__nav" aria-label="주요 메뉴">\n      {primaryNavigationItems.map((item) => (\n        <button\n          key={item.page}\n          type="button"\n          aria-current={currentPage === item.page ? 'page' : undefined}\n          onClick={() => onNavigate(item.page)}\n          className={currentPage === item.page ? 'is-active' : ''}\n        >\n          <span aria-hidden="true">{item.icon}</span>{item.label}\n        </button>\n      ))}\n    </nav>\n  )\n})\n\nfunction formatTime(value: number) {`,
  'const DockNavigation = memo(function DockNavigation',
)

replaceOnce(
  'src/components/navigation/LinkedPlayerDock.tsx',
  `  const navigation = (\n    <nav className="soa-dock__nav" aria-label="주요 메뉴">\n      {primaryNavigationItems.map((item) => (\n        <button\n          key={item.page}\n          type="button"\n          aria-current={page === item.page ? 'page' : undefined}\n          onClick={() => {\n            enterWorkspace(item.page)\n            window.scrollTo({ top: 0, behavior: 'smooth' })\n          }}\n          className={page === item.page ? 'is-active' : ''}\n        >\n          <span aria-hidden="true">{item.icon}</span>{item.label}\n        </button>\n      ))}\n    </nav>\n  )`,
  `  const navigateFromDock = useCallback((targetPage: DockNavigationPage) => {\n    if (targetPage !== page) enterWorkspace(targetPage)\n    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))\n  }, [enterWorkspace, page])\n  const navigation = <DockNavigation currentPage={page} onNavigate={navigateFromDock} />`,
  'const navigateFromDock = useCallback',
)

// 4) Mobile CSS: safe-area protection, clearer tap targets, touch selection, bounded MY VOICE list.
appendOnce(
  'src/styles/mobile-studio-flow.css',
  `/* Mobile integration/performance hardening: safe area, tap targets, bounded voice lists. */\n@media (max-width: 760px) {\n  .soa-dubbing-player-dock button,\n  .soa-dubbing-player-dock a,\n  .soa-voice-sheet button,\n  .soa-one-flow-composer button {\n    touch-action: manipulation;\n  }\n\n  .soa-dubbing-player-dock__nav .soa-dock__nav button {\n    min-height: 48px;\n    font-size: 10px;\n  }\n\n  .soa-workspace-shell--dubbing,\n  .soa-workspace-shell--dubbing.soa-workspace-shell--has-player {\n    padding-bottom: calc(118px + env(safe-area-inset-bottom));\n  }\n\n  .soa-voice-sheet-list.is-my-voice {\n    max-height: min(36vh, 320px);\n    overflow-y: auto;\n    overscroll-behavior: contain;\n    -webkit-overflow-scrolling: touch;\n  }\n\n  .soa-dubbing-script__editor textarea {\n    scroll-margin-top: 76px;\n  }\n}\n\n@media (max-width: 430px) {\n  .soa-voice-sheet-choice { min-height: 96px; }\n  .soa-dubbing-player-dock__nav .soa-dock__nav { gap: 4px; }\n}`,
  'Mobile integration/performance hardening: safe area',
)

appendOnce(
  'src/styles/timeline-horizontal-mobile.css',
  `/* Touch-native multi-selection keeps desktop modifier-key behavior while making it reachable on phones. */\n.soa-dubbing-block__touch-select { display: none; }\n\n@media (max-width: 760px) {\n  .soa-capcut-timeline[data-timeline-axis="horizontal"] .soa-dubbing-block__touch-select,\n  .soa-capcut-timeline[data-timeline-axis="horizontal"] .soa-dubbing-pause-block .soa-dubbing-block__touch-select {\n    display: inline-grid;\n    width: 24px;\n    height: 24px;\n    place-items: center;\n    border-radius: 6px;\n    font-size: 10px;\n    touch-action: manipulation;\n  }\n\n  .soa-capcut-timeline[data-timeline-axis="horizontal"] .soa-dubbing-block__touch-select[aria-pressed="true"] {\n    box-shadow: inset 0 0 0 1px currentColor;\n  }\n}`,
  'Touch-native multi-selection keeps desktop modifier-key behavior',
)

// 5) Strengthen the existing mobile quality contract so regressions are caught in CI.
replaceOnce(
  'scripts/check-mobile-studio-flow.mjs',
  `requireTokens('src/components/navigation/LinkedPlayerDock.tsx', player, [\n  'soa-dubbing-player-dock__nav',\n  'const navigation = (',\n  'setPlaying(true)',\n  "setPlaybackError(error instanceof Error ? error.message : '음성을 재생하지 못했습니다.')",\n])`,
  `requireTokens('src/components/navigation/LinkedPlayerDock.tsx', player, [\n  'soa-dubbing-player-dock__nav',\n  'const DockNavigation = memo(function DockNavigation',\n  'const navigateFromDock = useCallback',\n  "window.scrollTo({ top: 0, behavior: 'auto' })",\n  'setPlaying(true)',\n  "setPlaybackError(error instanceof Error ? error.message : '음성을 재생하지 못했습니다.')",\n])`,
  'const DockNavigation = memo(function DockNavigation',
)

replaceOnce(
  'scripts/check-mobile-studio-flow.mjs',
  `requireTokens('src/components/workspace/LongformComposer.tsx', composer, [\n  'alignEditorToMobileTop',\n  'window.visualViewport',\n  'onFocus={alignEditorAfterFocus}',\n  'window.scrollTo({ top: targetTop, behavior })',\n])`,
  `requireTokens('src/components/workspace/LongformComposer.tsx', composer, [\n  'alignEditorToMobileTop',\n  'window.visualViewport',\n  'viewportRealignFrameRef',\n  "viewport.addEventListener('resize', realign, { passive: true })",\n  "const coarsePointer = typeof window.matchMedia === 'function'",\n  'onFocus={alignEditorAfterFocus}',\n  'window.scrollTo({ top: targetTop, behavior })',\n])`,
  'viewportRealignFrameRef',
)

replaceOnce(
  'scripts/check-mobile-studio-flow.mjs',
  `requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [\n  'getDefaultTimelineZoom',\n  'window.innerWidth <= 760 ? 1.25 : 1',\n])`,
  `requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [\n  'getDefaultTimelineZoom',\n  'window.innerWidth <= 760 ? 1.25 : 1',\n  'soa-dubbing-block__touch-select',\n  "onSelect(block.id, 'toggle')",\n  '모바일 ＋ 버튼 다중 선택',\n])`,
  'soa-dubbing-block__touch-select',
)

replaceOnce(
  'scripts/check-mobile-studio-flow.mjs',
  `requireTokens('src/styles/mobile-studio-flow.css', mobileFlowCss, [\n  '.soa-voice-context-recommendation',\n  '.soa-dubbing-player-dock__nav',\n  '@media (max-width: 760px)',\n])`,
  `requireTokens('src/styles/mobile-studio-flow.css', mobileFlowCss, [\n  '.soa-voice-context-recommendation',\n  '.soa-dubbing-player-dock__nav',\n  '@media (max-width: 760px)',\n  'padding-bottom: calc(118px + env(safe-area-inset-bottom));',\n  'touch-action: manipulation;',\n  '.soa-voice-sheet-list.is-my-voice',\n])`,
  'padding-bottom: calc(118px + env(safe-area-inset-bottom));',
)

replaceOnce(
  'scripts/check-mobile-studio-flow.mjs',
  `requireTokens('src/styles/timeline-horizontal-mobile.css', mobileCss, [\n  '@media (max-width: 1023px)',\n  'left: var(--soa-clip-offset, 0px);',\n  'width: var(--soa-clip-width, 1px);',\n  'overflow-x: auto;',\n  'touch-action: pan-x;',\n])`,
  `requireTokens('src/styles/timeline-horizontal-mobile.css', mobileCss, [\n  '@media (max-width: 1023px)',\n  'left: var(--soa-clip-offset, 0px);',\n  'width: var(--soa-clip-width, 1px);',\n  'overflow-x: auto;',\n  'touch-action: pan-x;',\n  '.soa-dubbing-block__touch-select',\n])`,
  "'.soa-dubbing-block__touch-select'",
)

// Optional integration gate: if the prior Live Voice + MY VOICE bridge is present, enforce its mobile path too.
const voiceChoicesPath = file('src/voice/voiceChoices.ts')
if (fs.existsSync(voiceChoicesPath)) {
  const checker = read('scripts/check-mobile-studio-flow.mjs')
  if (!checker.includes('MY VOICE mobile bridge')) {
    const insertion = `\nconst voiceChoices = await source('src/voice/voiceChoices.ts')\nconst homePage = await source('src/pages/HomePage.tsx')\nif (voiceChoices.includes("kind: 'my-voice'")) {\n  requireTokens('src/components/workspace/VoicePickerSheet.tsx', picker, [\n    'MY VOICE',\n    'soa-voice-sheet-myvoices',\n    'onCreateVoice',\n  ])\n  requireTokens('src/pages/HomePage.tsx', homePage, [\n    'timelineSelectionIdsRef',\n    'timeline.updateVoiceMany',\n  ])\n  requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [\n    'onSelectionChange',\n  ])\n}\n// MY VOICE mobile bridge\n`
    const anchor = `\nconst indexCss = await source('src/styles/index.css')`
    if (!checker.includes(anchor)) throw new Error('scripts/check-mobile-studio-flow.mjs: MY VOICE 검사 삽입 기준점이 없습니다.')
    write('scripts/check-mobile-studio-flow.mjs', checker.replace(anchor, `${insertion}${anchor}`))
  }
}


// 6) Reuse the dependency-free Chromium visual runner for a real 360/390/430 mobile matrix.
replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `const output = argument('--output', join(root, '.sorion', 'web-quality', 'visual-layout'))\nconst baselineDir = argument('--baseline-dir', join(root, 'visual-baselines', 'workspace'))`,
  `const mobileMode = process.argv.includes('--mobile')\nconst output = argument('--output', join(root, '.sorion', 'web-quality', mobileMode ? 'mobile-layout' : 'visual-layout'))\nconst baselineDir = argument('--baseline-dir', join(root, 'visual-baselines', mobileMode ? 'mobile-workspace' : 'workspace'))`,
  "const mobileMode = process.argv.includes('--mobile')",
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `const viewports = [1024, 1280, 1440]\nconst height = 900`,
  `const viewportSpecs = mobileMode\n  ? [\n      { width: 360, height: 800 },\n      { width: 390, height: 844 },\n      { width: 430, height: 932 },\n    ]\n  : [1024, 1280, 1440].map((width) => ({ width, height: 900 }))`,
  '{ width: 360, height: 800 }',
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `  const selectedCount = await evaluate(cdp, \`(() => {\n    const voices = [...document.querySelectorAll('article.soa-dubbing-block')]\n      .filter((item) => item.querySelector('.soa-dubbing-block__script-preview'))\n    if (voices.length < 2) return 0\n    voices[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))\n    return voices.length\n  })()\`)`,
  `  const selectedCount = await evaluate(cdp, \`(() => {\n    const voices = [...document.querySelectorAll('article.soa-dubbing-block')]\n      .filter((item) => item.querySelector('.soa-dubbing-block__script-preview'))\n    if (voices.length < 2) return 0\n    if (\${mobileMode ? 'true' : 'false'}) {\n      for (const voice of voices.slice(0, 2)) {\n        const toggle = voice.querySelector('button.soa-dubbing-block__touch-select')\n        if (!(toggle instanceof HTMLButtonElement)) return 0\n        if (toggle.getAttribute('aria-pressed') !== 'true') toggle.click()\n      }\n    } else {\n      voices[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))\n    }\n    return voices.length\n  })()\`)`,
  "voice.querySelector('button.soa-dubbing-block__touch-select')",
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `})()\`\n\nasync function sha256(path) {`,
  `})()\`\n\nconst mobileLayoutProbeExpression = \`(() => {\n  const rect = (selector) => {\n    const node = document.querySelector(selector)\n    if (!(node instanceof HTMLElement)) return null\n    const box = node.getBoundingClientRect()\n    return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom }\n  }\n  const dock = rect('.soa-dubbing-player-dock')\n  const navigation = rect('.soa-dubbing-player-dock__nav .soa-dock__nav')\n  const navButton = rect('.soa-dubbing-player-dock__nav .soa-dock__nav button')\n  const touchSelect = rect('button.soa-dubbing-block__touch-select')\n  const editor = rect('[aria-label="음성으로 만들 장문 내용"]')\n  const timeline = rect('.soa-capcut-timeline[data-timeline-axis="horizontal"]')\n  const workspace = document.querySelector('.soa-workspace-shell--dubbing')\n  const workspacePaddingBottom = workspace instanceof HTMLElement\n    ? Number.parseFloat(getComputedStyle(workspace).paddingBottom) || 0\n    : 0\n  const overflow = document.documentElement.scrollWidth - window.innerWidth\n  return {\n    viewport: { width: window.innerWidth, height: window.innerHeight },\n    overflow,\n    dock,\n    navigation,\n    navButton,\n    touchSelect,\n    editor,\n    timeline,\n    workspacePaddingBottom,\n    assertions: {\n      noHorizontalOverflow: overflow <= 1,\n      mobileNavigationVisible: Boolean(navigation && navigation.height > 0),\n      navigationTapTarget: Boolean(navButton && navButton.height >= 44),\n      touchSelectionVisible: Boolean(touchSelect && touchSelect.width >= 20 && touchSelect.height >= 20),\n      editorContained: Boolean(editor && editor.x >= -1 && editor.right <= window.innerWidth + 1),\n      timelineContained: Boolean(timeline && timeline.x >= -16 && timeline.right <= window.innerWidth + 16),\n      dockClearanceReserved: Boolean(dock && workspacePaddingBottom >= Math.max(96, dock.height - 8)),\n    },\n  }\n})()\`\n\nconst activeLayoutProbeExpression = mobileMode ? mobileLayoutProbeExpression : layoutProbeExpression\n\nasync function sha256(path) {`,
  'const mobileLayoutProbeExpression =',
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `  await cdp.send('Emulation.setDeviceMetricsOverride', {\n    width: viewports[0],\n    height,\n    deviceScaleFactor: 1,\n    mobile: false,\n  })`,
  `  const firstViewport = viewportSpecs[0]\n  await cdp.send('Emulation.setDeviceMetricsOverride', {\n    width: firstViewport.width,\n    height: firstViewport.height,\n    deviceScaleFactor: 1,\n    mobile: mobileMode,\n  })`,
  'const firstViewport = viewportSpecs[0]',
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `  for (const width of viewports) {\n    await cdp.send('Emulation.setDeviceMetricsOverride', {\n      width,\n      height,\n      deviceScaleFactor: 1,\n      mobile: false,\n    })\n    await new Promise((resolve) => setTimeout(resolve, 180))\n    const metrics = await evaluate(cdp, layoutProbeExpression)`,
  `  for (const viewport of viewportSpecs) {\n    await cdp.send('Emulation.setDeviceMetricsOverride', {\n      width: viewport.width,\n      height: viewport.height,\n      deviceScaleFactor: 1,\n      mobile: mobileMode,\n    })\n    await new Promise((resolve) => setTimeout(resolve, 180))\n    const metrics = await evaluate(cdp, activeLayoutProbeExpression)`,
  'for (const viewport of viewportSpecs)',
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `    const filename = \`workspace-\${width}x\${height}.png\``,
  `    const filename = \`\${mobileMode ? 'mobile-workspace' : 'workspace'}-\${viewport.width}x\${viewport.height}.png\``,
  "const filename = `\${mobileMode ? 'mobile-workspace' : 'workspace'}-\${viewport.width}x\${viewport.height}.png`",
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `      fixture: 'workspace-multi-select',`,
  `      fixture: mobileMode ? 'mobile-workspace-touch-multi-select' : 'workspace-multi-select',`,
  "      fixture: mobileMode ? 'mobile-workspace-touch-multi-select'",
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `    browser: browser.version,\n    fixture: 'workspace-multi-select',`,
  `    browser: browser.version,\n    fixture: mobileMode ? 'mobile-workspace-touch-multi-select' : 'workspace-multi-select',`,
  "browser: browser.version,\n    fixture: mobileMode ? 'mobile-workspace-touch-multi-select'",
)

replaceOnce(
  'scripts/run-visual-layout-regression.mjs',
  `    console.log(\`Visual layout regression 통과 · \${captures.map((item) => \`\${item.viewport.width}px\`).join(' / ')}\`)`,
  `    console.log(\`\${mobileMode ? 'Mobile' : 'Visual'} layout regression 통과 · \${captures.map((item) => \`\${item.viewport.width}x\${item.viewport.height}\`).join(' / ')}\`)`,
  "mobileMode ? 'Mobile' : 'Visual'",
)

const packageJson = JSON.parse(read('package.json'))
if (!packageJson.scripts?.['quality:mobile-layout']) {
  packageJson.scripts = {
    ...packageJson.scripts,
    'quality:mobile-layout': 'node scripts/run-visual-layout-regression.mjs --mobile',
  }
  write('package.json', `${JSON.stringify(packageJson, null, 2)}\n`)
}

console.log('\nMobile studio hardening applied.')
console.log('Verify: node VERIFY_MOBILE_STUDIO_HARDENING.mjs')
console.log('Then: npm run quality:mobile-studio')
