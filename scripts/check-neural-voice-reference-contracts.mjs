import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function read(relative) {
  try { return await readFile(join(root, relative), 'utf8') }
  catch { failures.push(`${relative}: 필수 파일이 없습니다.`); return '' }
}

function requireTokens(relative, source, tokens) {
  for (const token of tokens) if (!source.includes(token)) failures.push(`${relative}: 계약 누락 · ${token}`)
}

const schema = await read('services/api/app/schemas/voice_preset_evidence.py')
requireTokens('services/api/app/schemas/voice_preset_evidence.py', schema, [
  'Literal[1, 2, 3, 4]',
  'class VoiceNeuralPreviewRecord',
  'model_fingerprint',
  'reference_fingerprint',
  'neural_preview: VoiceNeuralPreviewRecord',
])

const setup = await read('services/api/app/services/setup_diagnostics.py')
requireTokens('services/api/app/services/setup_diagnostics.py', setup, [
  'neural_preview_ready = bool(',
  'evidence.schema_version or 0) >= 4',
  'evidence.neural_preview_engine_id == "cosyvoice3"',
  'preview_cache_key = hashlib.sha256(',
])

const reference = await read('src/quality/neuralVoiceReference.ts')
requireTokens('src/quality/neuralVoiceReference.ts', reference, [
  "NEURAL_PREVIEW_ENGINE_ID = 'cosyvoice3'",
  'NEURAL_REFERENCE_SCHEMA_VERSION = 4',
  'getCachedNeuralPresetPreview',
  'refreshNeuralPresetPreviewCatalog',
  'buildNeuralReferenceManifestTemplate',
  "allowed_uses: ['tts-inference']",
])

const home = await read('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'getCachedNeuralPresetPreview',
  'refreshNeuralPresetPreviewCatalog',
  'neuralPromoted',
  'presetPreviewEngineId',
  "badge: '기기 음성'",
  "'NEURAL VOICE'",
])

const card = await read('src/components/evaluation/NeuralVoiceReferenceCard.tsx')
requireTokens('src/components/evaluation/NeuralVoiceReferenceCard.tsx', card, [
  'NEURAL VOICE REFERENCE',
  '성우 reference intake · 미리듣기 승격',
  'NEURAL READY',
  'v4 manifest 템플릿',
  'SORION_COSYVOICE_PRESET_DIRECTORY',
])

const page = await read('src/pages/QualityPage.tsx')
requireTokens('src/pages/QualityPage.tsx', page, [
  'NeuralVoiceReferenceCard',
  '<NeuralVoiceReferenceCard />',
])

const tests = await read('services/api/tests/test_setup.py')
requireTokens('services/api/tests/test_setup.py', tests, [
  'test_voice_preset_v4_neural_preview_requires_matching_reference_and_model_fingerprint',
  'test_voice_preset_v3_stays_usable_without_neural_preview_promotion',
])

if (failures.length) {
  console.error('Neural Voice reference/promotion 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Neural Voice reference/promotion 계약 검사 통과 · v4 provenance + safe fallback')
