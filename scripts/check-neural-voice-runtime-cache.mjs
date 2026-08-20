import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function requireText(relativePath, needles) {
  const text = await readFile(join(root, relativePath), 'utf8')
  for (const needle of needles) {
    if (!text.includes(needle)) {
      throw new Error(`${relativePath}에 필수 계약이 없습니다: ${needle}`)
    }
  }
}

const neuralPreviewCacheSource = await readFile(join(root, 'services/api/app/services/neural_preview_cache.py'), 'utf8')
if (/\.encode\([\"']utf-8[\"']\)/.test(neuralPreviewCacheSource)) {
  throw new Error('neural_preview_cache.py에 Ruff UP012 대상 explicit UTF-8 encode가 남아 있습니다.')
}

await requireText('services/api/app/services/neural_preview_cache.py', [
  'neural-preview-cache/1',
  'preview_cache_key',
  'text_sha256',
  'style_sha256',
  'audio_sha256',
  'sha256_file',
])
await requireText('services/api/app/api/routes/tts.py', [
  '@router.post("/neural-preview"',
  'expected_preview_cache_key',
  'model_digest',
  'diagnostic.model_fingerprint',
  'result.engine_id != "cosyvoice3"',
  'fallback_used',
  '@router.get("/neural-preview/cache/{cache_id}.wav")',
])
await requireText('src/tts/neuralPreviewApi.ts', [
  "'/tts/neural-preview'",
  'expected_preview_cache_key',
  'audioSha256',
  'runtimeCertified',
])
await requireText('src/pages/HomePage.tsx', [
  'synthesizeNeuralPreview',
  'neuralPreview.cacheKey',
  '공유 cache 재사용',
])
await requireText('src/quality/neuralVoiceRuntimeCertification.ts', [
  'neural-voice-runtime-certification/1',
  "evidenceClass: 'observed-runtime'",
  'synthetic: false',
  'playbackCompletedAt',
  'audioSha256',
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  'recordNeuralVoicePlaybackStarted',
  'recordNeuralVoicePlaybackCompleted',
])
await requireText('src/components/evaluation/NeuralVoiceRuntimeCertificationCard.tsx', [
  'PC·모바일 동일 neural preview 인증',
  'SHARED READY',
  'audioSha256',
  'modelFingerprint',
  'referenceFingerprint',
])
await requireText('services/api/tests/test_neural_preview_cache.py', [
  'test_neural_preview_cache_reuses_verified_audio_and_rejects_tamper',
  'test_neural_preview_cache_cleanup_removes_expired_pair',
])
await requireText('scripts/verify-neural-voice-runtime-certification.mjs', [
  'neural-voice-runtime-bundle/1',
  '--require-shared',
  'shared=${shared}/5',
  'observed-runtime',
])
await requireText('src/quality/neuralVoiceRuntimeCertification.test.ts', [
  'records observed playback start and completion',
  'rejects synthetic or malformed imported runtime evidence',
])

console.log('Neural Voice runtime certification / shared preview cache contract 통과')
