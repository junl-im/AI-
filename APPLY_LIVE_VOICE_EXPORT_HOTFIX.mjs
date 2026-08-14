import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const here = path.dirname(new URL(import.meta.url).pathname)
const payloadRoot = path.join(here, 'payload')

function file(relative) { return path.join(root, relative) }
function payload(relative) { return path.join(payloadRoot, relative) }
function read(relative) { return fs.readFileSync(file(relative), 'utf8') }
function write(relative, value) { fs.mkdirSync(path.dirname(file(relative)), { recursive: true }); fs.writeFileSync(file(relative), value) }
function copy(relative) {
  const source = payload(relative)
  if (!fs.existsSync(source)) throw new Error(`Patch payload missing: ${relative}`)
  fs.mkdirSync(path.dirname(file(relative)), { recursive: true })
  fs.copyFileSync(source, file(relative))
  console.log(`copy ${relative}`)
}
function replaceOnce(relative, from, to, alreadyMarker) {
  const source = read(relative)
  if (alreadyMarker && source.includes(alreadyMarker)) {
    console.log(`skip ${relative} (${alreadyMarker})`)
    return
  }
  if (!source.includes(from)) throw new Error(`Patch context not found: ${relative}`)
  write(relative, source.replace(from, to))
  console.log(`patch ${relative}`)
}

const required = [
  'src/pages/HomePage.tsx',
  'src/styles/index.css',
  'src/components/workspace/FinalExportControls.tsx',
  'src/components/workspace/FinalExportDialog.test.tsx',
  'src/store/useAppStore.ts',
  'src/components/layout/BrandMasthead.tsx',
]
for (const relative of required) {
  if (!fs.existsSync(file(relative))) throw new Error(`Current project file missing: ${relative}`)
}

const controls = read('src/components/workspace/FinalExportControls.tsx')
if (!controls.includes('최종 WAV + 자막') || !controls.includes('최종 MP3 + 자막')) {
  throw new Error('FinalExportControls copy is different from the expected current UI contract.')
}

copy('src/components/workspace/FinalExportDialog.test.tsx')
copy('src/store/useAppStore.ts')
copy('src/components/layout/BrandMasthead.tsx')
copy('src/components/layout/BrandMasthead.test.tsx')
copy('src/styles/live-voice-bar.css')

replaceOnce(
  'src/pages/HomePage.tsx',
  `  const backendStatus = useAppStore((state) => state.backendStatus)\n  const showNotice = useAppStore((state) => state.showNotice)`,
  `  const backendStatus = useAppStore((state) => state.backendStatus)\n  const setLiveVoice = useAppStore((state) => state.setLiveVoice)\n  const showNotice = useAppStore((state) => state.showNotice)`,
  'const setLiveVoice = useAppStore((state) => state.setLiveVoice)',
)

replaceOnce(
  'src/pages/HomePage.tsx',
  `  const normalizeText = directiveIds.includes('numbers')\n  const multiSpeakerAnalysis = useMemo(`,
  `  const normalizeText = directiveIds.includes('numbers')\n  useEffect(() => {\n    const engine = engineCatalog.selected\n    const readiness = busy\n      ? 'generating'\n      : backendStatus === 'offline'\n        ? 'offline'\n        : engineCatalog.loading\n          ? 'checking'\n          : backendStatus === 'degraded'\n            ? 'limited'\n            : engineAvailable\n              ? 'ready'\n              : 'checking'\n    const detail = readiness === 'generating'\n      ? \`${'${selectedVoice.name}'} 목소리로 생성 중입니다.\`\n      : readiness === 'ready'\n        ? '음성 생성 준비가 끝났습니다.'\n        : readiness === 'limited'\n          ? '대체 음성 엔진으로 사용할 수 있습니다.'\n          : readiness === 'offline'\n            ? '음성 엔진 연결을 복구하고 있습니다.'\n            : '사용 가능한 음성 엔진을 확인하고 있습니다.'\n\n    setLiveVoice({\n      voiceId,\n      voiceName: selectedVoice.name,\n      voiceKind: voiceId.startsWith('myvoice:') ? 'my-voice' : 'preset',\n      engineId: engine?.id ?? null,\n      engineName: engine?.name ?? '자동 엔진',\n      readiness,\n      detail,\n    })\n  }, [backendStatus, busy, engineAvailable, engineCatalog.loading, engineCatalog.selected, selectedVoice.name, setLiveVoice, voiceId])\n  const multiSpeakerAnalysis = useMemo(`,
  'const readiness = busy',
)

replaceOnce(
  'src/styles/index.css',
  `@import "./focused-creation-surface.css";`,
  `@import "./focused-creation-surface.css";\n@import "./live-voice-bar.css";`,
  '@import "./live-voice-bar.css";',
)

console.log('\nLive Voice Bar + Final Export test hotfix applied.')
