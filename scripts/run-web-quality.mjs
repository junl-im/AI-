import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { WEB_QUALITY_PHASES, WEB_QUALITY_SCHEMA_VERSION } from './web-quality-plan.mjs'
import {
  buildDirectoryManifest,
  evidenceDigest,
  fileSha256,
  reportDigest,
  sha256,
} from './web-quality-report.mjs'

const root = process.env.SORION_WEB_QUALITY_ROOT || fileURLToPath(new URL('..', import.meta.url))
const outputIndex = process.argv.indexOf('--output')
const outputDirectory = outputIndex >= 0
  ? process.argv[outputIndex + 1]
  : join(root, '.sorion', 'web-quality')
const planOnly = process.argv.includes('--plan-only')
const reportPath = join(outputDirectory, 'report.json')
const logsDirectory = join(outputDirectory, 'logs')
await mkdir(logsDirectory, { recursive: true })

const packageJsonPath = join(root, 'package.json')
const packageLockPath = join(root, 'package-lock.json')
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

function npmVersion() {
  const result = spawnSync('npm', ['--version'], { cwd: root, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'unavailable'
}

function commandText(command) {
  return command.map((value) => /\s/.test(value) ? JSON.stringify(value) : value).join(' ')
}

const startedAt = new Date().toISOString()
const phases = []
let failed = false
let firstFailure = null

for (const phase of WEB_QUALITY_PHASES) {
  const logPath = join(logsDirectory, `${phase.id}.log`)
  if (planOnly) {
    const output = `PLAN ONLY · ${commandText(phase.command)}\n`
    await writeFile(logPath, output, 'utf8')
    phases.push({
      id: phase.id,
      label: phase.label,
      command: commandText(phase.command),
      status: 'planned',
      exitCode: null,
      durationMs: 0,
      logSha256: sha256(output),
    })
    continue
  }

  const phaseStarted = performance.now()
  const [command, ...args] = phase.command
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      ...(phase.id === 'build' && process.env.VITE_BASE_PATH
        ? { VITE_BASE_PATH: process.env.VITE_BASE_PATH }
        : {}),
    },
  })
  const durationMs = Math.max(0, Math.round(performance.now() - phaseStarted))
  const output = [
    `COMMAND · ${commandText(phase.command)}`,
    result.stdout,
    result.stderr,
    result.error?.stack,
  ].filter(Boolean).join('\n').trimEnd() + '\n'
  await writeFile(logPath, output, 'utf8')
  const exitCode = result.status ?? 1
  phases.push({
    id: phase.id,
    label: phase.label,
    command: commandText(phase.command),
    status: exitCode === 0 ? 'passed' : 'failed',
    exitCode,
    durationMs,
    logSha256: sha256(output),
  })
  if (exitCode !== 0) {
    failed = true
    firstFailure = {
      id: phase.id,
      label: phase.label,
      command: commandText(phase.command),
      exitCode,
      log: `logs/${phase.id}.log`,
      tail: output.trim().split('\n').slice(-24),
    }
    process.stderr.write(output)
    break
  }
}

if (firstFailure) {
  const failureSummary = [
    `FAILED PHASE · ${firstFailure.label} (${firstFailure.id})`,
    `COMMAND · ${firstFailure.command}`,
    `EXIT CODE · ${firstFailure.exitCode}`,
    `LOG · ${firstFailure.log}`,
    '',
    ...firstFailure.tail,
    '',
  ].join('\n')
  await writeFile(join(outputDirectory, 'failure-summary.txt'), failureSummary, 'utf8')
}

const lockExists = await readFile(packageLockPath).then(() => true).catch(() => false)
const report = {
  schemaVersion: WEB_QUALITY_SCHEMA_VERSION,
  mode: planOnly ? 'plan' : 'run',
  appVersion: packageJson.version,
  heartbeat: '6.7',
  startedAt,
  completedAt: new Date().toISOString(),
  runtime: {
    node: process.versions.node,
    npm: npmVersion(),
    platform: process.platform,
    architecture: process.arch,
  },
  source: {
    repository: process.env.GITHUB_REPOSITORY || null,
    commitSha: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
  },
  inputs: {
    packageJsonSha256: await fileSha256(packageJsonPath),
    packageLockSha256: lockExists ? await fileSha256(packageLockPath) : null,
  },
  phases,
  dist: planOnly ? [] : await buildDirectoryManifest(root, join(root, 'dist')),
  passed: planOnly ? false : !failed && phases.length === WEB_QUALITY_PHASES.length,
}
report.evidenceSha256 = evidenceDigest(report)
report.reportSha256 = reportDigest(report)
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const summaryPath = process.env.GITHUB_STEP_SUMMARY
if (summaryPath) {
  const lines = [
    '## Reproducible Web quality',
    '',
    `- Evidence SHA-256: \`${report.evidenceSha256}\``,
    `- Report SHA-256: \`${report.reportSha256}\``,
    `- package-lock SHA-256: \`${report.inputs.packageLockSha256 ?? 'missing'}\``,
    ...(firstFailure ? [
      `- Failed phase: **${firstFailure.label}** (\`${firstFailure.id}\`) · exit ${firstFailure.exitCode}`,
      `- Failure evidence: \`.sorion/web-quality/${firstFailure.log}\` + \`.sorion/web-quality/failure-summary.txt\``,
    ] : []),
    '',
    '| Phase | Result | Duration |',
    '|---|---|---:|',
    ...phases.map((phase) => `| ${phase.label} | ${phase.status} | ${phase.durationMs} ms |`),
    '',
  ]
  await writeFile(summaryPath, `${lines.join('\n')}\n`, { flag: 'a' })
}

console.log(`Web quality report · ${report.reportSha256}`)
if (!planOnly && !report.passed) process.exit(1)
