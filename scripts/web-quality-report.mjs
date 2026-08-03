import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function sha256(value) {
  const payload = Buffer.isBuffer(value) ? value : Buffer.from(String(value))
  return createHash('sha256').update(payload).digest('hex')
}

export function reportDigest(report) {
  const { reportSha256: _ignored, ...unsigned } = report
  return sha256(canonicalJson(unsigned))
}

export function evidenceDigest(report) {
  const phases = (report.phases ?? []).map(({ durationMs: _duration, ...phase }) => phase)
  return sha256(canonicalJson({
    schemaVersion: report.schemaVersion,
    mode: report.mode,
    appVersion: report.appVersion,
    heartbeat: report.heartbeat,
    runtime: report.runtime,
    source: { repository: report.source?.repository ?? null, commitSha: report.source?.commitSha ?? null },
    inputs: report.inputs,
    phases,
    dist: report.dist,
    passed: report.passed,
  }))
}

export async function fileSha256(path) {
  return sha256(await readFile(path))
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const results = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) results.push(...await walk(path))
    else if (entry.isFile()) results.push(path)
  }
  return results
}

export async function buildDirectoryManifest(root, directory) {
  try {
    if (!(await stat(directory)).isDirectory()) return []
  } catch {
    return []
  }
  const files = await walk(directory)
  return Promise.all(files.map(async (path) => ({
    path: relative(root, path).split(sep).join('/'),
    bytes: (await stat(path)).size,
    sha256: await fileSha256(path),
  })))
}
