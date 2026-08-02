import { isRetryableNetworkFailure, retryDelayMs } from './lock-retry.mjs'

const retryable = [
  'npm error code ETIMEDOUT',
  'npm error network request to https://registry.npmjs.org/firebase failed',
  'error: EAI_AGAIN registry.npmjs.org',
  'HTTP 503 Service Unavailable',
  'ERR_SOCKET_TIMEOUT',
  'Error: spawnSync npm ETIMEDOUT',
]
const terminal = [
  'npm error code ERESOLVE unable to resolve dependency tree',
  'ruff check failed',
  'package-lock root version mismatch',
]
const failures = []
for (const sample of retryable) {
  if (!isRetryableNetworkFailure(sample)) failures.push(`재시도 누락: ${sample}`)
}
for (const sample of terminal) {
  if (isRetryableNetworkFailure(sample)) failures.push(`잘못된 재시도 분류: ${sample}`)
}
if (retryDelayMs(1) !== 5000 || retryDelayMs(3) !== 30000) {
  failures.push('재시도 지연 정책이 5/15/30초 계약과 다릅니다.')
}
if (failures.length) {
  console.error('Lock 네트워크 재시도 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Lock 네트워크 재시도 계약 검사 통과')
