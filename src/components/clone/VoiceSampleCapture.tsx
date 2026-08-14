import { useEffect, useMemo, type ChangeEvent } from 'react'

interface VoiceSampleCaptureProps {
  file: File | null
  recording: boolean
  seconds: number
  error: string | null
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onFile: (file: File) => void
}

function formatSeconds(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`
}

export function VoiceSampleCapture({
  file,
  recording,
  seconds,
  error,
  onStart,
  onStop,
  onReset,
  onFile,
}: VoiceSampleCaptureProps) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file])
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  return (
    <section className="soa-clone-card" aria-labelledby="clone-capture-title">
      <div className="soa-clone-card__head">
        <div>
          <span>STEP 01</span>
          <h2 id="clone-capture-title">10초만 자연스럽게 말해 주세요.</h2>
        </div>
        <strong className={recording ? 'is-recording' : ''}>{formatSeconds(seconds)}</strong>
      </div>
      <p>조용한 곳에서 평소 목소리로 한 문단을 읽으면 됩니다. 30초까지 녹음하면 더 안정적입니다.</p>
      <div className="soa-record-guide" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (seconds / 10) * 100)}%` }} />
        <span>10초 권장</span>
        <span>30초 고품질</span>
      </div>
      <div className="soa-capture-actions">
        <button
          type="button"
          className={recording ? 'is-stop' : 'is-record'}
          onClick={recording ? onStop : onStart}
        >
          {recording ? '■ 녹음 마치기' : '● 마이크로 녹음'}
        </button>
        <label>
          음성 파일 선택
          <input
            type="file"
            accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/webm,audio/ogg,.m4a"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const selected = event.target.files?.[0]
              if (selected) onFile(selected)
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>
      {error ? <p className="soa-clone-error">{error}</p> : null}
      {file && previewUrl ? (
        <div className="soa-sample-preview">
          <div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></div>
          <audio controls src={previewUrl} />
          <button type="button" onClick={onReset}>다시 준비하기</button>
        </div>
      ) : null}
    </section>
  )
}
