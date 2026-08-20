import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import process from 'node:process'

const args = process.argv.slice(2)
function arg(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const input = arg('--input')
const requireShared = args.includes('--require-shared')
if (!input) {
  console.error('usage: node scripts/verify-neural-voice-runtime-certification.mjs --input <json> [--require-shared]')
  process.exit(2)
}

const raw = await readFile(input, 'utf8')
const digest = createHash('sha256').update(raw).digest('hex')
const payload = JSON.parse(raw)
if (payload?.schema !== 'neural-voice-runtime-bundle/1' || !Array.isArray(payload.records)) {
  throw new Error('neural runtime bundle schema/records가 올바르지 않습니다.')
}
const forbidden = ['userAgent', 'deviceName', 'rawText', 'text', 'audioUrl', 'audioBlob', 'referencePath', 'samplePath']
const serialized = JSON.stringify(payload)
for (const field of forbidden) {
  if (new RegExp(`"${field}"\\s*:`).test(serialized)) {
    throw new Error(`개인정보/원본 제외 계약 위반 필드: ${field}`)
  }
}
const hash = /^[0-9a-f]{64}$/
for (const record of payload.records) {
  if (record?.schema !== 'neural-voice-runtime-certification/1') throw new Error('record schema가 올바르지 않습니다.')
  if (record.evidenceClass !== 'observed-runtime' || record.synthetic !== false) throw new Error('observed-runtime/synthetic=false만 허용합니다.')
  if (!['desktop-browser', 'mobile-browser'].includes(record.surface)) throw new Error('runtime surface가 올바르지 않습니다.')
  for (const key of ['cacheId', 'previewCacheKey', 'textSha256', 'styleSha256', 'audioSha256', 'modelFingerprint', 'referenceFingerprint']) {
    if (!hash.test(record[key] ?? '')) throw new Error(`${record.voiceId ?? 'unknown'} ${key}가 SHA-256 형식이 아닙니다.`)
  }
  if (!record.playbackStartedAt || !record.playbackCompletedAt) throw new Error(`${record.voiceId} 재생 완료 evidence가 아닙니다.`)
}

const expected = ['sori-warm', 'on-clear', 'dam-calm', 'jun-deep', 'min-energetic']
let shared = 0
for (const voiceId of expected) {
  const desktop = payload.records.find((item) => item.voiceId === voiceId && item.surface === 'desktop-browser' && item.playbackCompletedAt)
  const mobile = payload.records.find((item) => item.voiceId === voiceId && item.surface === 'mobile-browser' && item.playbackCompletedAt)
  const matches = Boolean(
    desktop && mobile
    && desktop.cacheId === mobile.cacheId
    && desktop.audioSha256 === mobile.audioSha256
    && desktop.modelFingerprint === mobile.modelFingerprint
    && desktop.referenceFingerprint === mobile.referenceFingerprint
  )
  if (matches) shared += 1
  else if (requireShared) throw new Error(`${voiceId} PC/mobile shared neural preview 인증이 완료되지 않았습니다.`)
}
console.log(`Neural Voice runtime certification PASS · shared=${shared}/5 · sha256=${digest}`)
