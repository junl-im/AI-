import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8')
}

function requireText(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: 필수 수정이 없습니다: ${needle}`)
  }
}

function rejectText(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: 금지된 이전 패턴이 남아 있습니다: ${needle}`)
  }
}

const pythonContracts = [
  ['services/api/app/services/writer_lease.py', 'Iterator'],
  ['services/api/app/services/interprocess_lock.py', 'Iterator'],
  ['services/api/app/services/setup_diagnostics.py', 'Mapping'],
  ['services/api/app/services/voice_preset_evidence.py', 'Mapping'],
  ['services/api/app/services/voice_preset_approval.py', 'Iterator, Mapping'],
  ['services/api/app/services/voice_review_trust.py', 'Mapping'],
  ['services/api/app/engines/tts/cosyvoice_worker_tts.py', 'Mapping'],
]

for (const [path, names] of pythonContracts) {
  const text = await read(path)
  requireText(text, `from collections.abc import ${names}`, `${path} collections.abc`)
  rejectText(text, `from typing import ${names}`, `${path} typing import`)
}

const trust = await read('services/api/app/services/voice_review_trust.py')
requireText(trust, ') -> VoiceReviewTrustStore:', '미래 annotation 직접 참조')
rejectText(trust, ') -> "VoiceReviewTrustStore":', 'quoted annotation')

const lock = await read('services/api/app/services/interprocess_lock.py')
requireText(lock, 'except (BlockingIOError, OSError) as error:', '잠금 예외 원인 보존')
requireText(lock, ') from error', 'B904 exception chaining')

const home = await read('src/pages/HomePage.tsx')
requireText(home, 'engine={engineCatalog.selected}', '모바일 음성 설정 엔진 전달')

const approval = await read('services/api/app/services/voice_preset_approval.py')
const trustImportIndex = approval.indexOf(
  'from app.services.voice_review_trust import VoiceReviewTrustStore',
)
const writerImportIndex = approval.indexOf('from app.services.writer_lease import (')
if (trustImportIndex < 0 || writerImportIndex < 0 || trustImportIndex > writerImportIndex) {
  throw new Error(
    'voice_preset_approval.py import 정렬: voice_review_trust 다음에 writer_lease가 와야 합니다.',
  )
}

const engineDoctorTest = await read('src/hooks/useEngineDoctor.test.ts')
requireText(
  engineDoctorTest,
  '} as unknown as Awaited<ReturnType<typeof runApiConnectivityAudit>>)',
  '의도적 부분 fixture 캐스팅',
)

console.log('Quality gate compatibility 통과 · Ruff 현대화와 Web 타입 계약 확인')
