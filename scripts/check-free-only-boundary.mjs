import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'

const root = new URL('../', import.meta.url)
const scanRoots = [
  'services/api/app',
  'services/api/tests',
  'src',
]
const exactFiles = [
  '.env.example',
  'firebase.json',
  'README.md',
  'START_HERE.md',
  'FOUNDATION_REPORT.md',
  'docs/API.md',
  'docs/API_CONNECTIVITY.md',
  'docs/ENGINE_STRATEGY.md',
  'docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md',
  'docs/FREE_ONLY_ENGINE_POLICY.md',
  'docs/HANDOVER.md',
  'docs/NEXT_UPDATE.md',
  'docs/PRODUCTION_READINESS.md',
  'docs/RELEASE.md',
  'docs/ROADMAP.md',
  'docs/TEST.md',
  'docs/UI_GUIDE.md',
  'scripts/check-project-rules.mjs',
  'docs/VISION.md',
]
const textExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.py', '.md', '.json', '.yml', '.yaml'])
const forbidden = [
  /naver[-_ ]?clova/i,
  /google[-_ ]?chirp/i,
  /azure[-_ ]?speech/i,
  /elevenlabs/i,
  /SORION_(NAVER|GOOGLE_TTS|AZURE|ELEVENLABS)/,
  /engine_cost_policy/i,
  /allow_metered/i,
  /metered_engines/i,
  /cost_tier/i,
  /\bbalanced\b/i,
]

async function collect(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (textExtensions.has(extname(entry.name))) files.push(path)
  }
  return files
}

const files = new Set(exactFiles)
for (const directory of scanRoots) {
  for (const file of await collect(directory)) files.add(file)
}

const failures = []
for (const file of [...files].sort()) {
  const content = await readFile(new URL(file, root), 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(content)) failures.push(`${file}: ${pattern}`)
  }
}

const firebase = JSON.parse(await readFile(new URL('firebase.json', root), 'utf8'))
const topLevelKeys = Object.keys(firebase).sort()
if (topLevelKeys.join(',') !== 'hosting') {
  failures.push(`firebase.json: Spark 무료 배포는 hosting만 허용합니다 (${topLevelKeys.join(', ')})`)
}
const rewrites = firebase.hosting?.rewrites ?? []
if (rewrites.some((item) => item.function || item.run)) {
  failures.push('firebase.json: Cloud Functions/Cloud Run rewrite는 무료 전용 경계에서 금지합니다.')
}

const ttsFiles = await readdir(new URL('services/api/app/engines/tts', root))
const allowedTtsFiles = new Set([
  '__init__.py',
  'audio_utils.py',
  'cosyvoice_worker_tts.py',
  'melo_tts.py',
  'system_tts.py',
  'scripts',
])
for (const file of ttsFiles) {
  if (!allowedTtsFiles.has(file) && file !== '__pycache__') {
    failures.push(`services/api/app/engines/tts/${file}: 무료 전용 허용 목록 밖의 Adapter입니다.`)
  }
}

if (failures.length > 0) {
  console.error('Free-only boundary check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Free-only boundary check passed (${files.size} text files).`)
