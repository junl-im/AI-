import { spawnSync } from 'node:child_process'

const NETWORK_PATTERNS = [
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /EAI_AGAIN/i,
  /ENETUNREACH/i,
  /ENOTFOUND/i,
  /network request .* failed/i,
  /network connectivity/i,
  /fetch failed/i,
  /socket hang up/i,
  /TLS handshake timeout/i,
  /\b(?:429|502|503|504)\b/,
]

export function isRetryableNetworkFailure(output) {
  return NETWORK_PATTERNS.some((pattern) => pattern.test(output))
}

export function retryDelayMs(attempt) {
  return [5_000, 15_000, 30_000, 60_000][Math.max(0, attempt - 1)] ?? 60_000
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

export function runCommandWithRetry({
  command,
  args,
  cwd,
  env,
  attempts = 1,
  onAttempt,
}) {
  let lastResult = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      env,
    })
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
    const retryable = (result.status ?? 1) !== 0 && isRetryableNetworkFailure(output)
    onAttempt?.({ attempt, attempts, result, output, retryable })
    lastResult = result
    if ((result.status ?? 1) === 0) return result
    if (!retryable || attempt === attempts) return result
    sleep(retryDelayMs(attempt))
  }
  return lastResult
}
