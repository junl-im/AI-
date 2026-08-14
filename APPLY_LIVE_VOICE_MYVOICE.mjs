import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const bundleRoot = path.dirname(new URL(import.meta.url).pathname)

function assertRepo() {
  const packageFile = path.join(root, 'package.json')
  if (!fs.existsSync(packageFile)) {
    throw new Error('package.json을 찾지 못했습니다. SoriON 저장소 루트에서 실행해 주세요.')
  }
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'))
  if (pkg.name !== 'sorion-ai') throw new Error(`예상하지 못한 프로젝트입니다: ${pkg.name ?? 'unknown'}`)
  if (pkg.version !== '0.11.15') {
    const markerFile = path.join(root, 'src', 'components', 'layout', 'BrandMasthead.tsx')
    const already = fs.existsSync(markerFile) && fs.readFileSync(markerFile, 'utf8').includes('LIVE VOICE')
    if (!already) {
      throw new Error(`이 통합 패치는 현재 GitHub main 0.11.15 기준입니다. 현재 버전: ${pkg.version}`)
    }
  }
}

function assertCurrentBaseline() {
  const liveVoiceFile = path.join(root, 'src', 'components', 'layout', 'BrandMasthead.tsx')
  const already = fs.existsSync(liveVoiceFile) && fs.readFileSync(liveVoiceFile, 'utf8').includes('LIVE VOICE')
  if (already || process.env.SORION_ALLOW_LEGACY_SIM === '1') return

  const checks = [
    ['src/pages/HomePage.tsx', 'FinalExportDialog'],
    ['src/components/workspace/TimelineEditor.tsx', 'TimelineLinkedPlayer'],
    ['src/components/workspace/DesktopVoiceDrawer.tsx', 'soa-studio-panel-toggle is-collapsed'],
  ]
  const missing = checks.filter(([relative, marker]) => {
    const file = path.join(root, relative)
    return !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes(marker)
  })
  if (missing.length > 0) {
    throw new Error(
      `현재 GitHub main 0.11.15 기준 파일과 다릅니다: ${missing.map(([file, marker]) => `${file} (${marker})`).join(', ')}\n` +
      '최신 main/hotfix를 먼저 반영한 뒤 다시 실행해 주세요. 오래된 전체 ZIP 위에 적용하지 마세요.',
    )
  }
}

function alreadyFullyApplied() {
  const checks = [
    ['src/components/layout/BrandMasthead.tsx', 'LIVE VOICE'],
    ['src/pages/HomePage.tsx', 'synthesizeVoiceCloneProfile'],
    ['src/components/workspace/TimelineEditor.tsx', 'TimelineVoiceSelect'],
    ['src/components/workspace/VoiceLibrary.tsx', 'MY VOICE'],
  ]
  return checks.every(([relative, marker]) => {
    const file = path.join(root, relative)
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(marker)
  })
}

function copyPhase(phase) {
  const sourceRoot = path.join(bundleRoot, 'payload', phase)
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const source = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(source)
        continue
      }
      const relative = path.relative(sourceRoot, source)
      const destination = path.join(root, relative)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.copyFileSync(source, destination)
      console.log(`copy ${relative}`)
    }
  }
  walk(sourceRoot)
}

assertRepo()
assertCurrentBaseline()
if (alreadyFullyApplied()) {
  console.log('SoriON Live Voice + MY VOICE integrated patch is already applied.')
  console.log('Run: node VERIFY_LIVE_VOICE_MYVOICE.mjs')
  process.exit(0)
}
console.log('SoriON Live Voice + MY VOICE integrated patch')
console.log('target: current GitHub main 0.11.15\n')

copyPhase('phase1')
await import(pathToFileURL(path.join(bundleRoot, 'apply-sorion-linkage-myvoice.mjs')).href)
copyPhase('phase2')
await import(pathToFileURL(path.join(bundleRoot, 'apply-live-voice-myvoice.mjs')).href)

console.log('\nPatch complete. Run: node VERIFY_LIVE_VOICE_MYVOICE.mjs')
