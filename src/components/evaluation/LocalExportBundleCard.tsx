import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  buildLocalExportBundle,
  downloadLocalExportBundle,
  MAX_LOCAL_BUNDLE_BYTES,
  type LocalBundleBuildProgress,
} from '../../export/localExportBundle'
import { StatusPill } from '../ui/StatusPill'

function sizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${bytes} B`
}

export function LocalExportBundleCard() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<LocalBundleBuildProgress | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files])
  const progressPercent = progress?.totalBytes
    ? Math.min(100, Math.round((progress.processedBytes / progress.totalBytes) * 100))
    : 0

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []))
    setProgress(null)
    setMessage(null)
  }

  async function handleBuild() {
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    setProgress(null)
    setMessage(null)
    try {
      const result = await buildLocalExportBundle(files, {
        signal: controller.signal,
        onProgress: setProgress,
      })
      downloadLocalExportBundle(result.blob)
      setMessage(`ZIP 생성 완료 · ${result.manifest.files.length}개 · ${sizeLabel(result.blob.size)}`)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setMessage('ZIP 생성을 취소했습니다. 선택한 원본 파일은 변경되지 않았습니다.')
      } else {
        setMessage(caught instanceof Error ? caught.message : '로컬 ZIP을 만들지 못했습니다.')
      }
    } finally {
      controllerRef.current = null
      setBusy(false)
    }
  }

  function handleCancel() {
    controllerRef.current?.abort()
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">LOCAL EXPORT BUNDLE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">음원·자막·증거 ZIP</h2>
        </div>
        <StatusPill label="BROWSER ONLY" />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        WAV·MP3·SRT·VTT·JSON을 브라우저 안에서만 묶습니다. 서버 업로드 없이 파일별 SHA-256 manifest를 ZIP 첫 파일로 넣습니다.
      </p>
      <label className="focus-ring mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-soa-line bg-white text-xs font-black">
        파일 선택 · 최대 20개 / 250MiB
        <input type="file" multiple accept=".wav,.mp3,.srt,.vtt,.json,audio/wav,audio/mpeg,application/json,text/vtt" onChange={handleFiles} disabled={busy} className="sr-only" />
      </label>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f4f2ec] p-3 text-xs font-bold">
        <span>{files.length}개 파일</span>
        <span className={totalBytes > MAX_LOCAL_BUNDLE_BYTES ? 'text-soa-coral' : 'text-soa-muted'}>{sizeLabel(totalBytes)}</span>
      </div>
      {totalBytes > 100 * 1024 * 1024 && totalBytes <= MAX_LOCAL_BUNDLE_BYTES ? (
        <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-[10px] font-bold leading-5 text-amber-900">
          100MiB가 넘는 ZIP은 모바일 브라우저 메모리를 많이 사용할 수 있습니다. 가능하면 PC에서 생성해 주세요.
        </p>
      ) : null}
      {files.length ? <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[10px] font-bold text-soa-muted">{files.slice(0, 8).map((file, index) => <li key={`${file.name}-${index}`} className="flex justify-between gap-2"><span className="truncate">{file.name}</span><span>{sizeLabel(file.size)}</span></li>)}</ul> : null}
      {busy ? (
        <div className="mt-3 rounded-2xl bg-white p-3" aria-live="polite">
          <div className="flex items-center justify-between text-[10px] font-black"><span>{progress?.currentFile ? `${progress.currentFile} 처리 중` : 'ZIP 조립 중'}</span><span>{progressPercent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e6dc]"><div className="h-full rounded-full bg-soa-lime transition-[width]" style={{ width: `${progressPercent}%` }} /></div>
          <button type="button" onClick={handleCancel} className="focus-ring mt-3 min-h-10 w-full rounded-xl border border-soa-line text-xs font-black">생성 취소</button>
        </div>
      ) : (
        <button type="button" onClick={() => void handleBuild()} disabled={!files.length || totalBytes > MAX_LOCAL_BUNDLE_BYTES} className="focus-ring mt-3 min-h-11 w-full rounded-2xl bg-soa-lime text-xs font-black disabled:opacity-40">로컬 ZIP 만들기</button>
      )}
      {message ? <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5">{message}</p> : null}
    </section>
  )
}
