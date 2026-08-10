import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function source(path) {
  return readFile(join(root, path), 'utf8')
}

function requireText(text, token, label) {
  if (!text.includes(token)) throw new Error(`${label}: ${token}`)
}

const qualityTypes = await source('src/quality/qualityTypes.ts')
const recoveryInjection = await source('src/quality/recoveryInjection.ts')
const recoveryCard = await source('src/components/evaluation/RecoveryInjectionCard.tsx')
const soakCard = await source('src/components/evaluation/DeviceSoakRecorderCard.tsx')
const verificationSchema = await source('services/api/app/schemas/verification.py')
const verificationRoute = await source('services/api/app/api/routes/verification.py')
const evidenceBundle = await source('services/api/app/services/evidence_bundle.py')
const sessionTypes = await source('src/workspace/sessionTypes.ts')
const sessionCodec = await source('src/workspace/sessionCodec.ts')
const timeline = await source('src/components/workspace/TimelineEditor.tsx')
const home = await source('src/pages/HomePage.tsx')

for (const [token, label] of [
  ["'observed-device'", 'observed recovery evidence class missing'],
  ["'synthetic-injection'", 'synthetic recovery evidence class missing'],
  ["'not-applicable'", 'not-applicable recovery evidence class missing'],
]) requireText(qualityTypes, token, label)

requireText(recoveryInjection, "evidenceClass: 'synthetic-injection'", 'recovery injection provenance missing')
requireText(recoveryInjection, 'downloadRecoveryInjectionEvidence', 'synthetic evidence export missing')
requireText(recoveryCard, '실기기 복구 인증을 대신하지 않습니다', 'synthetic UI warning missing')
requireText(soakCard, "recoveryEvidenceClass: scenario === 'baseline' ? 'not-applicable' : 'observed-device'", 'device evidence classification missing')
requireText(verificationSchema, 'recovery_evidence_class', 'API recovery evidence schema missing')
requireText(verificationRoute, 'payload.recovery_evidence_class != \"observed-device\"', 'synthetic evidence READY guard missing')
requireText(verificationRoute, 'item.recovery_evidence_class == \"observed-device\"', 'certification provenance filter missing')
requireText(evidenceBundle, 'EVIDENCE_BUNDLE_SCHEMA_VERSION = "3"', 'evidence bundle schema v3 missing')
requireText(evidenceBundle, 'SUPPORTED_EVIDENCE_BUNDLE_SCHEMA_VERSIONS', 'legacy evidence verifier compatibility missing')

requireText(sessionTypes, 'WORKSPACE_SESSION_SCHEMA_VERSION = 3', 'workspace session schema v3 missing')
requireText(sessionTypes, 'WorkspaceBatchRetrySnapshot', 'batch retry snapshot contract missing')
requireText(sessionCodec, 'normalizeBatchRetrySnapshot', 'batch retry snapshot sanitizer missing')
requireText(sessionCodec, 'MAX_BATCH_HISTORY = 6', 'batch retry history bound missing')
requireText(timeline, 'onBatchRetrySnapshotChange', 'timeline batch snapshot persistence missing')
requireText(timeline, '클립 ID·원문·음원·오류 문자열은 저장하지 않고', 'session privacy UI explanation missing')
requireText(home, 'batchRetrySnapshot={batchRetrySnapshot}', 'workspace batch retry restore wiring missing')

console.log('Recovery evidence classification / session safety 계약 검사 통과')
