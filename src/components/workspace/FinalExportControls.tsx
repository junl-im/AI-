import { useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { createFinalExport, type FinalExportResult } from '../../export/finalExportApi'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

export function FinalExportControls({ blocks }: { blocks: TimelineBlock[] }) {
  const [busy, setBusy] = useState<'wav' | 'mp3' | null>(null)
  const [result, setResult] = useState<FinalExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(format: 'wav' | 'mp3') {
    setBusy(format)
    setError(null)
    try {
      setResult(await createFinalExport(blocks, format))
    } catch (caught) {
      setError(caught instanceof ApiError ? `${caught.code} · ${caught.message}` : 'Export에 실패했습니다.')
    } finally {
      setBusy(null)
    }
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
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-black">
          <a href={result.audioUrl} download>음원 받기</a>
          <a href={result.srtUrl} download>SRT</a>
          <a href={result.vttUrl} download>VTT</a>
          <span>{result.durationSeconds.toFixed(1)}초</span>
        </div>
      ) : null}
    </div>
  )
}
