import { useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { createFinalExport, type FinalExportResult } from '../../export/finalExportApi'
import {
  loadExportArchiveReceipts,
  preserveExportByDownload,
  removeExportArchiveReceipt,
  type ExportArchiveReceipt,
} from '../../export/exportArchive'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

export function FinalExportControls({ blocks }: { blocks: TimelineBlock[] }) {
  const [busy, setBusy] = useState<'wav' | 'mp3' | null>(null)
  const [result, setResult] = useState<FinalExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ExportArchiveReceipt | null>(() => loadExportArchiveReceipts()[0] ?? null)

  async function run(format: 'wav' | 'mp3') {
    setBusy(format)
    setError(null)
    try {
      setResult(await createFinalExport(blocks, format))
      setReceipt(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? `${caught.code} · ${caught.message}` : 'Export에 실패했습니다.')
    } finally {
      setBusy(null)
    }
  }

  function preserve() {
    if (!result) return
    setReceipt(preserveExportByDownload(result))
  }

  function forgetReceipt() {
    if (!receipt) return
    removeExportArchiveReceipt(receipt.id)
    setReceipt(null)
  }

  return (
    <div className="soa-final-export-controls">
      <div className="soa-final-export-controls__actions">
        <button type="button" onClick={() => void run('wav')} disabled={busy !== null || !blocks.length} className="is-primary">
          {busy === 'wav' ? 'WAV 병합 중…' : 'WAV + 자막'}
        </button>
        <button type="button" onClick={() => void run('mp3')} disabled={busy !== null || !blocks.length}>
          {busy === 'mp3' ? 'MP3 변환 중…' : 'MP3 + 자막'}
        </button>
      </div>
      <p className="soa-final-export-controls__hint">WAV/MP3와 SRT·VTT 자막을 한 번에 만듭니다.</p>
      {error ? <p className="soa-final-export-controls__error">{error}</p> : null}
      {result ? (
        <div className="soa-final-export-result">
          <div className="soa-final-export-result__downloads">
            <a href={result.audioUrl} download>음원 받기</a>
            <a href={result.srtUrl} download>SRT</a>
            <a href={result.vttUrl} download>VTT</a>
            <span>{result.durationSeconds.toFixed(1)}초</span>
          </div>
          <div className="soa-final-export-result__retention">
            <strong>서버 임시 보관 {result.serverRetentionMinutes}분</strong>
            <p>{new Date(result.serverExpiresAt).toLocaleString('ko-KR')} 전까지 받을 수 있습니다. 서버 장기 보관은 하지 않습니다.</p>
          </div>
          <button type="button" onClick={preserve} className="soa-final-export-result__preserve">
            음원·SRT·VTT를 내 기기에 보존
          </button>
          {receipt ? (
            <div className="soa-final-export-result__receipt">
              <span>로컬 보존 기록 · {receipt.filenames.join(' · ')}</span>
              <button type="button" onClick={forgetReceipt}>기록 삭제</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
