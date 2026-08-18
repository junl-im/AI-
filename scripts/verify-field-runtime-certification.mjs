import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
function arg(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? resolve(process.argv[index + 1]) : null
}
function fail(message) {
  console.error(`Field/runtime certification 검증 실패 · ${message}`)
  process.exit(1)
}

const android = arg('--android')
const ios = arg('--ios')
const myVoice = arg('--my-voice')
const desktopScenes = arg('--desktop-scenes')
const mobileScenes = arg('--mobile-scenes')
const requireAll = process.argv.includes('--require-all')
if (!android || !ios) fail('--android <file>과 --ios <file>이 필요합니다.')

function run(script, args) {
  const result = spawnSync(process.execPath, [resolve(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) fail([result.stdout, result.stderr].filter(Boolean).join('\n').trim())
  return result.stdout.trim()
}

const androidResult = run('verify-field-device-certification.mjs', ['--input', android, '--require-ready'])
const iosResult = run('verify-field-device-certification.mjs', ['--input', ios, '--require-ready'])

async function verifySceneManifest(path, expectedMode) {
  if (!path) return { present: false, passed: false, digest: null, captures: 0 }
  let raw
  try { raw = await readFile(path, 'utf8') }
  catch { fail(`Chromium ${expectedMode} manifest를 읽을 수 없습니다: ${path}`) }
  let value
  try { value = JSON.parse(raw) }
  catch { fail(`Chromium ${expectedMode} manifest가 JSON이 아닙니다.`) }
  if (value.schemaVersion !== 'chromium-multi-scene/1' || value.mode !== expectedMode || value.passed !== true) fail(`Chromium ${expectedMode} manifest가 PASS 상태가 아닙니다.`)
  if (!Array.isArray(value.scenes) || value.scenes.join(',') !== 'workspace,voice-surface,recovery-impact') fail(`Chromium ${expectedMode} scene 계약이 다릅니다.`)
  if (!Array.isArray(value.captures) || value.captures.length !== 9 || value.captures.some((item) => item.passed !== true || !/^[a-f0-9]{64}$/i.test(item.sha256 ?? ''))) fail(`Chromium ${expectedMode}는 9개 PASS capture + SHA-256이 필요합니다.`)
  if (value.recoveryFixture?.realWorkerClaimed !== false) fail(`Chromium ${expectedMode} fixture가 실제 Worker 성공을 주장하면 안 됩니다.`)
  return { present: true, passed: true, digest: createHash('sha256').update(raw).digest('hex'), captures: value.captures.length }
}

const desktop = await verifySceneManifest(desktopScenes, 'desktop')
const mobile = await verifySceneManifest(mobileScenes, 'mobile')
if (requireAll && (!desktop.passed || !mobile.passed)) fail('--require-all에서는 desktop/mobile Chromium multi-scene manifest가 모두 필요합니다.')

let myVoiceStatus = 'pending'
let myVoiceResult = ''
if (myVoice) {
  myVoiceResult = run('verify-my-voice-recovery-runtime-evidence.mjs', ['--input', myVoice, '--require-success'])
  myVoiceStatus = 'ready'
} else if (requireAll) {
  fail('--require-all에서는 --my-voice <file> observed runtime 증거가 필요합니다.')
}

const status = myVoiceStatus === 'ready' && desktop.passed && mobile.passed ? 'certified' : 'field-ready-runtime-pending'
console.log([
  `Field/runtime certification 검증 통과 · status=${status}`,
  androidResult,
  iosResult,
  desktop.present ? `Chromium desktop · captures=${desktop.captures} · sha256=${desktop.digest}` : 'Chromium desktop · pending',
  mobile.present ? `Chromium mobile · captures=${mobile.captures} · sha256=${mobile.digest}` : 'Chromium mobile · pending',
  myVoiceResult || 'MY VOICE observed runtime · pending',
].join('\n'))
