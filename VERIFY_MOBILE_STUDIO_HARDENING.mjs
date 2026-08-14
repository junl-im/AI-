import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
let checks = 0

function check(relative, token) {
  checks += 1
  const target = path.join(root, relative)
  if (!fs.existsSync(target)) {
    failures.push(`${relative}: missing`)
    return
  }
  const content = fs.readFileSync(target, 'utf8')
  if (!content.includes(token)) failures.push(`${relative}: missing token ${token}`)
}

check('src/components/workspace/LongformComposer.tsx', 'viewportRealignFrameRef')
check('src/components/workspace/LongformComposer.tsx', "viewport.addEventListener('resize', realign, { passive: true })")
check('src/components/workspace/LongformComposer.tsx', "const coarsePointer = typeof window.matchMedia === 'function'")
check('src/components/navigation/LinkedPlayerDock.tsx', 'const DockNavigation = memo(function DockNavigation')
check('src/components/navigation/LinkedPlayerDock.tsx', 'const navigateFromDock = useCallback')
check('src/components/navigation/LinkedPlayerDock.tsx', "window.scrollTo({ top: 0, behavior: 'auto' })")
check('src/components/workspace/TimelineEditor.tsx', 'soa-dubbing-block__touch-select')
check('src/components/workspace/TimelineEditor.tsx', "onSelect(block.id, 'toggle')")
check('src/components/workspace/TimelineEditor.tsx', '모바일 ＋ 버튼 다중 선택')
check('src/styles/mobile-studio-flow.css', 'padding-bottom: calc(118px + env(safe-area-inset-bottom));')
check('src/styles/mobile-studio-flow.css', '.soa-voice-sheet-list.is-my-voice')
check('src/styles/timeline-horizontal-mobile.css', 'Touch-native multi-selection keeps desktop modifier-key behavior')
check('scripts/check-mobile-studio-flow.mjs', 'viewportRealignFrameRef')
check('scripts/check-mobile-studio-flow.mjs', 'soa-dubbing-block__touch-select')
check('scripts/run-visual-layout-regression.mjs', "const mobileMode = process.argv.includes('--mobile')")
check('scripts/run-visual-layout-regression.mjs', '{ width: 360, height: 800 }')
check('scripts/run-visual-layout-regression.mjs', 'mobileLayoutProbeExpression')
check('scripts/run-visual-layout-regression.mjs', 'touchSelectionVisible')
check('package.json', '"quality:mobile-layout": "node scripts/run-visual-layout-regression.mjs --mobile"')

const voiceChoices = path.join(root, 'src/voice/voiceChoices.ts')
if (fs.existsSync(voiceChoices) && fs.readFileSync(voiceChoices, 'utf8').includes("kind: 'my-voice'")) {
  check('src/components/workspace/VoicePickerSheet.tsx', 'soa-voice-sheet-myvoices')
  check('src/pages/HomePage.tsx', 'timelineSelectionIdsRef')
  check('src/pages/HomePage.tsx', 'timeline.updateVoiceMany')
  check('src/components/workspace/TimelineEditor.tsx', 'onSelectionChange')
}

if (failures.length) {
  console.error(`Mobile hardening verification FAILED (${failures.length}/${checks})`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Mobile hardening verification PASS · ${checks}/${checks}`)
