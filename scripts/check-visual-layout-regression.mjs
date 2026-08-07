import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function read(relative) {
  try {
    return await readFile(join(root, relative), 'utf8')
  } catch {
    failures.push(`${relative}: 필수 파일이 없습니다.`)
    return ''
  }
}

function requireTokens(relative, source, tokens) {
  for (const token of tokens) {
    if (!source.includes(token)) failures.push(`${relative}: 계약 누락 · ${token}`)
  }
}

const runner = await read('scripts/run-visual-layout-regression.mjs')
requireTokens('scripts/run-visual-layout-regression.mjs', runner, [
  'const viewports = [1024, 1280, 1440]',
  'Page.captureScreenshot',
  'Emulation.setDeviceMetricsOverride',
  'noHorizontalOverflow',
  'compactDockHeight',
  'transportOrder',
  'threeColumnVisible',
  'batchControlsContained',
  "fixture: 'workspace-multi-select'",
  "sha256: await sha256(screenshotPath)",
  'pixelDiff',
  "status: baselinePath ? 'available' : 'pending'",
  'maxDiffRatio',
  'channelThreshold',
  'approveBaseline',
])

const packageJson = await read('package.json')
requireTokens('package.json', packageJson, [
  '"quality:visual-layout": "node scripts/run-visual-layout-regression.mjs"',
  '"quality:visual-layout:approve": "node scripts/run-visual-layout-regression.mjs --approve"',
])

const workflow = await read('.github/workflows/ci.yml')
requireTokens('.github/workflows/ci.yml', workflow, [
  'Run Chromium visual layout regression',
  'id: visual_layout',
  'npm run quality:visual-layout',
  "steps.visual_layout.outcome == 'failure'",
])

if (failures.length) {
  console.error('Chromium visual layout regression 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Chromium visual layout regression 계약 검사 통과 · 1024/1280/1440px')
