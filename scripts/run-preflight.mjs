import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const reportDirectory = join(root, '.sorion', 'ci-report')
await mkdir(reportDirectory, { recursive: true })

const checks = [
  ['retired files', 'check-stale-files.mjs'],
  ['web manifest', 'check-web-toolchain.mjs', '--manifest-only'],
  ['lock retry contract', 'check-lock-network-retry.mjs'],
  ['CI architecture', 'check-ci-failure-domains.mjs'],
  ['project rules', 'check-project-rules.mjs'],
  ['free-only boundary', 'check-free-only-boundary.mjs'],
  ['engine blueprint', 'check-engine-blueprint.mjs'],
  ['model onboarding', 'check-model-onboarding.mjs'],
  ['verification evidence', 'check-verification-evidence.mjs'],
]

function annotationValue(value) {
  return value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
    .replaceAll(':', '%3A')
    .replaceAll(',', '%2C')
}

const results = []
for (const [label, script, ...args] of checks) {
  process.stdout.write(`\n::group::Preflight · ${label}\n`)
  const result = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: process.env,
  })
  const output = [result.stdout, result.stderr, result.error?.message]
    .filter(Boolean)
    .join('\n')
    .trim()
  if (output) process.stdout.write(`${output}\n`)
  process.stdout.write('::endgroup::\n')
  const status = result.status ?? 1
  results.push({ label, script, args, status, output })
  if (status !== 0) {
    const summary = output.split(/\r?\n/).filter(Boolean).slice(-8).join(' | ') || `exit ${status}`
    process.stdout.write(`::error title=${annotationValue(`Preflight · ${label}`)}::${annotationValue(summary)}\n`)
  }
}

const failed = results.filter((result) => result.status !== 0)
const textReport = results.map((result) => [
  `=== ${result.label} · ${result.status === 0 ? 'PASS' : 'FAIL'} ===`,
  result.output,
].filter(Boolean).join('\n')).join('\n\n')
await writeFile(join(reportDirectory, 'preflight.log'), `${textReport}\n`, 'utf8')
await writeFile(join(reportDirectory, 'preflight.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  passed: failed.length === 0,
  checks: results,
}, null, 2)}\n`, 'utf8')

const summaryPath = process.env.GITHUB_STEP_SUMMARY
if (summaryPath) {
  const lines = [
    '## Repository preflight',
    '',
    '| Check | Result |',
    '|---|---|',
    ...results.map((result) => `| ${result.label} | ${result.status === 0 ? 'PASS' : 'FAIL'} |`),
    '',
  ]
  await writeFile(summaryPath, `${lines.join('\n')}\n`, { flag: 'a' })
}

if (failed.length) {
  console.error(`Repository preflight 실패 · ${failed.length}/${results.length}개 검사 실패`)
  process.exit(1)
}
console.log(`Repository preflight 통과 · ${results.length}개 검사`)
