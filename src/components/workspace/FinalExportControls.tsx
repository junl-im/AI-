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
    <div className="mt-3 rounded-2xl border border-soa-line bg-white p-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run('wav')} disabled={busy !== null || !blocks.length} className="focus-ring min-h-10 rounded-xl bg-soa-ink px-4 text-xs font-black text-white disabled:opacity-45">
          {busy === 'wav' ? 'WAV 병합 중…' : '최종 WAV + 자막'}
        </button>
        <button type="button" onClick={() => void run('mp3')} disabled={busy !== null || !blocks.length} className="focus-ring min-h-10 rounded-xl border border-soa-line px-4 text-xs font-black disabled:opacity-45">
          {busy === 'mp3' ? 'MP3 변환 중…' : '최종 MP3 + 자막'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-bold text-soa-coral">{error}</p> : null}
      {result ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-3 text-xs font-black">
            <a href={result.audioUrl} download>음원 받기</a>
            <a href={result.srtUrl} download>SRT</a>
            <a href={result.vttUrl} download>VTT</a>
            <span>{result.durationSeconds.toFixed(1)}초</span>
          </div>
          <div className="rounded-xl bg-[#f7f5ef] p-3 text-[11px] font-bold leading-5 text-soa-muted">
            <strong className="text-soa-ink">서버 임시 보관 {result.serverRetentionMinutes}분</strong>
            <p>{new Date(result.serverExpiresAt).toLocaleString('ko-KR')} 전까지 받을 수 있습니다. 서버 장기 보관은 하지 않으며 내려받은 파일은 사용자가 직접 관리·삭제합니다.</p>
          </div>
          <button type="button" onClick={preserve} className="focus-ring min-h-10 w-full rounded-xl bg-soa-lime text-xs font-black">
            음원·SRT·VTT를 내 기기에 보존
          </button>
          {receipt ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-soa-line px-3 py-2 text-[10px] font-bold text-soa-muted">
              <span>로컬 보존 기록 · {receipt.filenames.join(' · ')}</span>
              <button type="button" onClick={forgetReceipt} className="focus-ring min-h-9 shrink-0 rounded-lg px-2 text-soa-coral">기록 삭제</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
