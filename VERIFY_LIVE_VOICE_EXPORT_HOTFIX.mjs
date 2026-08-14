import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const checks = [
  ['src/components/workspace/FinalExportDialog.test.tsx', '최종 WAV + 자막'],
  ['src/components/workspace/FinalExportDialog.test.tsx', '최종 MP3 + 자막'],
  ['src/components/workspace/FinalExportControls.tsx', '최종 WAV + 자막'],
  ['src/components/layout/BrandMasthead.tsx', 'LIVE VOICE'],
  ['src/components/layout/BrandMasthead.tsx', '텍스트를 음성으로'],
  ['src/store/useAppStore.ts', 'LiveVoiceSnapshot'],
  ['src/store/useAppStore.ts', 'setLiveVoice'],
  ['src/pages/HomePage.tsx', 'const setLiveVoice = useAppStore'],
  ['src/pages/HomePage.tsx', "? 'generating'"],
  ['src/styles/index.css', '@import "./live-voice-bar.css";'],
  ['src/styles/live-voice-bar.css', '.soa-live-engine'],
  ['src/styles/live-voice-bar.css', '.soa-live-voice-open'],
]
let passed = 0
for (const [relative, token] of checks) {
  const target = path.join(root, relative)
  const source = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
  if (!source.includes(token)) {
    console.error(`FAIL ${relative}: ${token}`)
    process.exitCode = 1
  } else {
    passed += 1
    console.log(`PASS ${relative}: ${token}`)
  }
}
if (process.exitCode) process.exit(process.exitCode)
const rules = spawnSync(process.execPath, ['scripts/check-project-rules.mjs'], { cwd: root, encoding: 'utf8' })
process.stdout.write(rules.stdout)
process.stderr.write(rules.stderr)
if (rules.status !== 0) process.exit(rules.status ?? 1)
console.log(`Hotfix verification passed · ${passed}/${checks.length} contracts + project rules`)
