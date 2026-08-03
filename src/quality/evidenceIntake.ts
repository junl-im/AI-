import { apiRequest } from '../api/httpClient'

export type EvidenceSourceKind = 'manual' | 'github-actions' | 'device' | 'cosyvoice'

export interface EvidenceIntakeSource {
  name: string
  kind: EvidenceSourceKind
  commitSha?: string
  runId?: string
}

export interface EvidenceIntakePreview {
  valid: boolean
  importable: boolean
  duplicateBundle: boolean
  duplicateRecordCount: number
  bundleSha256: string | null
  schemaVersion: string | null
  appVersion: string | null
  recordCount: number
  reason: string
}

export interface EvidenceIntakeRecord {
  bundleSha256: string
  schemaVersion: string
  appVersion: string
  recordCount: number
  sourceName: string
  sourceKind: string
  commitSha: string
  runId: string
  importedAt: string
}

function requestBody(bundle: Record<string, unknown>, source: EvidenceIntakeSource) {
  return {
    bundle,
    source: {
      name: source.name,
      kind: source.kind,
      commit_sha: source.commitSha ?? '',
      run_id: source.runId ?? '',
    },
  }
}

function mapPreview(result: {
  valid: boolean
  importable: boolean
  duplicate_bundle: boolean
  duplicate_record_count: number
  bundle_sha256: string | null
  schema_version: string | null
  app_version: string | null
  record_count: number
  reason: string
}): EvidenceIntakePreview {
  return {
    valid: result.valid,
    importable: result.importable,
    duplicateBundle: result.duplicate_bundle,
    duplicateRecordCount: result.duplicate_record_count,
    bundleSha256: result.bundle_sha256,
    schemaVersion: result.schema_version,
    appVersion: result.app_version,
    recordCount: result.record_count,
    reason: result.reason,
  }
}

export async function readEvidenceFile(file: File): Promise<Record<string, unknown>> {
  if (file.size > 5 * 1024 * 1024) throw new Error('증거 JSON은 5MiB 이하여야 합니다.')
  const parsed: unknown = JSON.parse(await file.text())
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('증거 JSON 최상위 값은 객체여야 합니다.')
  }
  return parsed as Record<string, unknown>
}

export async function previewEvidenceIntake(
  bundle: Record<string, unknown>,
  source: EvidenceIntakeSource,
): Promise<EvidenceIntakePreview> {
  const result = await apiRequest<{
    valid: boolean
    importable: boolean
    duplicate_bundle: boolean
    duplicate_record_count: number
    bundle_sha256: string | null
    schema_version: string | null
    app_version: string | null
    record_count: number
    reason: string
  }>('/quality/evidence-intake/preview', {
    method: 'POST',
    body: JSON.stringify(requestBody(bundle, source)),
  })
  return mapPreview(result)
}

export async function importEvidenceBundle(
  bundle: Record<string, unknown>,
  source: EvidenceIntakeSource,
): Promise<EvidenceIntakeRecord> {
  const result = await apiRequest<{
    imported: boolean
    record: {
      bundle_sha256: string
      schema_version: string
      app_version: string
      record_count: number
      source_name: string
      source_kind: string
      commit_sha: string
      run_id: string
      imported_at: string
    } | null
    reason: string
  }>('/quality/evidence-intake/import', {
    method: 'POST',
    body: JSON.stringify(requestBody(bundle, source)),
  })
  if (!result.imported || !result.record) throw new Error(result.reason)
  return {
    bundleSha256: result.record.bundle_sha256,
    schemaVersion: result.record.schema_version,
    appVersion: result.record.app_version,
    recordCount: result.record.record_count,
    sourceName: result.record.source_name,
    sourceKind: result.record.source_kind,
    commitSha: result.record.commit_sha,
    runId: result.record.run_id,
    importedAt: result.record.imported_at,
  }
}

export async function listEvidenceIntake(): Promise<EvidenceIntakeRecord[]> {
  const result = await apiRequest<Array<{
    bundle_sha256: string
    schema_version: string
    app_version: string
    record_count: number
    source_name: string
    source_kind: string
    commit_sha: string
    run_id: string
    imported_at: string
  }>>('/quality/evidence-intake')
  return result.map((item) => ({
    bundleSha256: item.bundle_sha256,
    schemaVersion: item.schema_version,
    appVersion: item.app_version,
    recordCount: item.record_count,
    sourceName: item.source_name,
    sourceKind: item.source_kind,
    commitSha: item.commit_sha,
    runId: item.run_id,
    importedAt: item.imported_at,
  }))
}
