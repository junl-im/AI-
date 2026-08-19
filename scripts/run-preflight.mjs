import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const reportDirectory = join(root, '.sorion', 'ci-report')
await mkdir(reportDirectory, { recursive: true })

const checks = [
  ['product version sync', 'check-version-sync.mjs'],
  ['retired files', 'check-stale-files.mjs'],
  ['npm lock integrity', 'check-lockfiles.mjs', '--component', 'npm'],
  ['web manifest', 'check-web-toolchain.mjs', '--manifest-only'],
  ['PWA assets', 'check-pwa-assets.mjs'],
  ['runtime update / performance guard', 'check-runtime-update-guard.mjs'],
  ['seamless engine runtime', 'check-seamless-engine-runtime.mjs'],
  ['engine resilience / half-open recovery', 'check-engine-resilience.mjs'],
  ['batch recovery / adaptive engine routing', 'check-batch-recovery-adaptive-routing.mjs'],
  ['editor command UX / engine observation', 'check-editor-command-engine-observation.mjs'],
  ['editing history / speaker memory / engine routing trace', 'check-edit-history-speaker-routing.mjs'],
  ['one-flow dubbing UX', 'check-one-flow-dubbing-ux.mjs'],
  ['multi-speaker assist / resume generation', 'check-multi-speaker-resume.mjs'],
  ['recovery evidence classification / session safety', 'check-recovery-evidence-session-safety.mjs'],
  ['always-on preset / PC layout', 'check-always-on-preset-pc-layout.mjs'],
  ['approval modularization / operator baseline', 'check-approval-modularization-operator-baseline.mjs'],
  ['recovery soak / managed lock', 'check-recovery-soak-managed-lock.mjs'],
  ['recovery evidence / voice inventory', 'check-recovery-evidence-voice-inventory.mjs'],
  ['studio playback / timeline UX', 'check-studio-playback-timeline-ux.mjs'],
  ['timeline voice recovery / quick navigation', 'check-timeline-voice-recovery-navigation.mjs'],
  ['recovery batch / editor responsibility split', 'check-recovery-batch-editor-split.mjs'],
  ['PC horizontal timeline editor', 'check-horizontal-timeline-editor.mjs'],
  ['mobile studio flow / playback link', 'check-mobile-studio-flow.mjs'],
  ['Chromium visual layout regression', 'check-visual-layout-regression.mjs'],
  ['Chromium multi-scene evidence', 'check-chromium-multi-scene-evidence.mjs'],
  ['field device / runtime certification', 'check-field-runtime-certification.mjs'],
  ['release readiness / certification intake', 'check-release-readiness.mjs'],
  ['trust key rotation / evidence renewal', 'check-trust-key-renewal.mjs'],
  ['benchmark baseline / privacy audit', 'check-benchmark-privacy-audit.mjs'],
  ['long-run reliability / writer safety', 'check-long-run-writer-safety.mjs'],
  ['playback control flow', 'check-playback-control-flow.mjs'],
  ['quality gate compatibility', 'check-quality-gate-compatibility.mjs'],
  ['Firebase web config', 'check-firebase-config.mjs'],
  ['lock retry contract', 'check-lock-network-retry.mjs'],
  ['CI architecture', 'check-ci-failure-domains.mjs'],
  ['reproducible Web quality', 'check-reproducible-web-quality.mjs'],
  ['project rules', 'check-project-rules.mjs'],
  ['free-only boundary', 'check-free-only-boundary.mjs'],
  ['engine blueprint', 'check-engine-blueprint.mjs'],
  ['model onboarding', 'check-model-onboarding.mjs'],
  ['partial audio / bridge', 'check-partial-audio-bridge.mjs'],
  ['ordered segment / device evidence', 'check-ordered-segment-playback.mjs'],
  ['seam metrics / session restore', 'check-seam-metrics-session.mjs'],
  ['signed audio / device certification', 'check-signed-audio-certification.mjs'],
  ['device soak / audio archive policy', 'check-device-soak-archive.mjs'],
  ['voice presets', 'check-voice-preset-contracts.mjs'],
  ['voice preset evidence', 'check-voice-preset-evidence.mjs'],
  ['voice review sync / telemetry', 'check-voice-review-sync.mjs'],
  ['signed review approval / benchmark dashboard', 'check-signed-review-benchmark.mjs'],
  ['voice review operator gate / CI unblock', 'check-voice-review-operator-gate.mjs'],
  ['verification evidence', 'check-verification-evidence.mjs'],
  ['evidence intake / local bundle', 'check-evidence-intake-bundle.mjs'],
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
  const scriptPath = join(root, 'scripts', script)
  let result
  if (!existsSync(scriptPath)) {
    result = {
      status: 1,
      stdout: '',
      stderr: `필수 preflight 스크립트가 없습니다: scripts/${script}\n패치 기준 버전이 맞는지 확인하고 누적 패치를 적용하세요.`,
      error: undefined,
    }
  } else {
    result = spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      env: process.env,
    })
  }
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
