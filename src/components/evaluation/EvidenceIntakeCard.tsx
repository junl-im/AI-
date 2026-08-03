import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import {
  importEvidenceBundle,
  listEvidenceIntake,
  previewEvidenceIntake,
  readEvidenceFile,
  type EvidenceIntakePreview,
  type EvidenceIntakeRecord,
  type EvidenceSourceKind,
} from '../../quality/evidenceIntake'
import { StatusPill } from '../ui/StatusPill'

interface LoadedEvidence {
  file: File
  bundle: Record<string, unknown>
}

const sourceLabels: Record<EvidenceSourceKind, string> = {
  manual: '수동 파일',
  'github-actions': 'GitHub Actions',
  device: '실기기',
  cosyvoice: 'CosyVoice',
}

export function EvidenceIntakeCard() {
  const [loaded, setLoaded] = useState<LoadedEvidence | null>(null)
  const [preview, setPreview] = useState<EvidenceIntakePreview | null>(null)
  const [records, setRecords] = useState<EvidenceIntakeRecord[]>([])
  const [kind, setKind] = useState<EvidenceSourceKind>('manual')
  const [commitSha, setCommitSha] = useState('')
  const [runId, setRunId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try { setRecords(await listEvidenceIntake()) } catch { setRecords([]) }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    setPreview(null)
    try {
      const bundle = await readEvidenceFile(file)
      const reportSource = bundle.source && typeof bundle.source === 'object' && !Array.isArray(bundle.source)
        ? bundle.source as Record<string, unknown>
        : null
      const nextKind: EvidenceSourceKind = 'reportSha256' in bundle ? 'github-actions' : kind
      const nextCommitSha = typeof reportSource?.commitSha === 'string' ? reportSource.commitSha : commitSha.trim()
      const nextRunId = typeof reportSource?.runId === 'string' ? reportSource.runId : runId.trim()
      setKind(nextKind)
      setCommitSha(nextCommitSha)
      setRunId(nextRunId)
      const next = await previewEvidenceIntake(bundle, {
        name: file.name,
        kind: nextKind,
        commitSha: nextCommitSha,
        runId: nextRunId,
      })
      setLoaded({ file, bundle })
      setPreview(next)
    } catch (caught) {
      setLoaded(null)
      setMessage(caught instanceof Error ? caught.message : '증거 JSON을 읽지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport() {
    if (!loaded || !preview?.importable) return
    setBusy(true)
    setMessage(null)
    try {
      const record = await importEvidenceBundle(loaded.bundle, {
        name: loaded.file.name,
        kind,
        commitSha: commitSha.trim(),
        runId: runId.trim(),
      })
      setMessage(`등록 완료 · ${record.recordCount}건 · ${record.bundleSha256.slice(0, 12)}`)
      setLoaded(null)
      setPreview(null)
      await refresh()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : '증거 묶음을 등록하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">EVIDENCE INTAKE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">검증 증거 가져오기</h2>
        </div>
        <StatusPill label={`${records.length} bundles`} tone={records.length ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        SoriON evidence v2 또는 Heartbeat 6.6·6.7 Web quality run report를 허용합니다. 서버가 SHA-256을 다시 계산하고 동일 bundle 또는 동일 실행 내용을 차단합니다.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[10px] font-black text-soa-muted">
          출처
          <select value={kind} onChange={(event) => setKind(event.target.value as EvidenceSourceKind)} className="focus-ring mt-1 min-h-11 w-full rounded-2xl border border-soa-line bg-white px-3 text-xs font-black text-soa-ink">
            {(Object.keys(sourceLabels) as EvidenceSourceKind[]).map((value) => <option key={value} value={value}>{sourceLabels[value]}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-black text-soa-muted">
          Run ID
          <input value={runId} onChange={(event) => setRunId(event.target.value)} maxLength={120} placeholder="선택 입력" className="focus-ring mt-1 min-h-11 w-full rounded-2xl border border-soa-line bg-white px-3 text-xs font-bold text-soa-ink" />
        </label>
      </div>
      <label className="mt-2 block text-[10px] font-black text-soa-muted">
        Commit SHA
        <input value={commitSha} onChange={(event) => setCommitSha(event.target.value)} maxLength={80} placeholder="선택 입력" className="focus-ring mt-1 min-h-11 w-full rounded-2xl border border-soa-line bg-white px-3 font-mono text-xs text-soa-ink" />
      </label>
      <label className="focus-ring mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-soa-line bg-white text-xs font-black">
        {busy ? '검증 중…' : '증거 JSON 선택'}
        <input type="file" accept="application/json,.json" onChange={(event) => void handleFile(event)} disabled={busy} className="sr-only" />
      </label>
      {preview ? (
        <div className={`mt-3 rounded-2xl border p-3 text-xs ${preview.importable ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <strong>{preview.importable ? '등록 가능' : '등록 차단'}</strong>
            <StatusPill label={preview.valid ? `v${preview.schemaVersion ?? '?'}` : 'INVALID'} tone={preview.importable ? 'good' : 'warning'} />
          </div>
          <p className="mt-1 font-semibold leading-5">{preview.reason}</p>
          <p className="mt-1 font-mono text-[10px] text-soa-muted">{preview.bundleSha256?.slice(0, 24) ?? 'checksum 없음'} · {preview.recordCount} records</p>
          <button type="button" onClick={() => void handleImport()} disabled={!preview.importable || busy} className="focus-ring mt-3 min-h-10 w-full rounded-xl bg-soa-ink text-xs font-black text-white disabled:opacity-40">검증 결과 등록</button>
        </div>
      ) : null}
      {message ? <p className="mt-3 rounded-2xl bg-[#f4f2ec] p-3 text-xs font-bold leading-5">{message}</p> : null}
      {records.length ? (
        <div className="mt-3 space-y-2">
          {records.slice(0, 4).map((record) => (
            <div key={record.bundleSha256} className="rounded-2xl border border-soa-line bg-white p-3 text-xs">
              <div className="flex items-center justify-between gap-2"><strong>{record.sourceName}</strong><span className="font-mono text-[10px]">{record.bundleSha256.slice(0, 10)}</span></div>
              <p className="mt-1 text-[10px] font-bold text-soa-muted">{record.sourceKind} · {record.recordCount}건 · {new Date(record.importedAt).toLocaleString('ko-KR')}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
