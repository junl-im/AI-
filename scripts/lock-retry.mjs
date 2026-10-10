import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'

export function spawnCommandSync(command, args, options = {}) {
  const env = options.env || process.env
  if (command === 'npm') {
    const candidates = [
      env.npm_execpath,
      ...(process.platform === 'win32' ? [
        join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
        ...(env.PATH || env.Path || '').split(delimiter).map((entry) =>
          join(entry, 'node_modules', 'npm', 'bin', 'npm-cli.js')),
      ] : []),
    ]
    const cli = candidates.find((candidate) => candidate && existsSync(candidate))
    if (cli) return spawnSync(process.execPath, [cli, ...args], options)
  }
  return spawnSync(command, args, options)
}

const NETWORK_PATTERNS = [
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /EAI_AGAIN/i,
  /ENETUNREACH/i,
  /ENOTFOUND/i,
  /ERR_SOCKET_TIMEOUT/i,
  /network request .* failed/i,
  /network connectivity/i,
  /fetch failed/i,
  /socket hang up/i,
  /TLS handshake timeout/i,
  /operation timed out/i,
  /timed out/i,
  /\b(?:408|425|429|500|502|503|504)\b/,
]

export function isRetryableNetworkFailure(output) {
  return NETWORK_PATTERNS.some((pattern) => pattern.test(output))
}

export function retryDelayMs(attempt) {
  return [5_000, 15_000, 30_000][Math.max(0, attempt - 1)] ?? 30_000
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
  timeoutMs = 90_000,
  onAttempt,
}) {
  let lastResult = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnCommandSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      timeout: timeoutMs,
      killSignal: 'SIGTERM',
      env,
    })
    const output = [
      result.stdout,
      result.stderr,
      result.error ? `${result.error.name}: ${result.error.message}` : '',
    ].filter(Boolean).join('\n')
    const failed = (result.status ?? 1) !== 0
    const retryable = failed && isRetryableNetworkFailure(output)
    onAttempt?.({ attempt, attempts, result, output, retryable })
    lastResult = result
    if (!failed) return result
    if (!retryable || attempt === attempts) return result
    sleep(retryDelayMs(attempt))
  }
  return lastResult
}
