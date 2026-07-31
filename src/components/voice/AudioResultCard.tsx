import { formatBytes, formatMilliseconds } from '../../quality/formatMetrics'
import { downloadAudioFile } from '../../tts/audioFile'
import type { GeneratedAudio } from '../../tts/generationTypes'
import { SegmentResultList } from './SegmentResultList'
import { StatusPill } from '../ui/StatusPill'

interface AudioResultCardProps {
  audio: GeneratedAudio
  sourceText: string
  onRetry: () => void
  onReset: () => void
}

function resultLabel(audio: GeneratedAudio) {
  if (audio.source === 'browser-demo' || audio.result.engineMode === 'mock') return 'DEMO WAV'
  if (audio.result.engineMode === 'local') return 'LOCAL TTS'
  return 'AI AUDIO'
}

export function AudioResultCard({ audio, sourceText, onRetry, onReset }: AudioResultCardProps) {
  const isDemo = audio.source === 'browser-demo' || audio.result.engineMode === 'mock'
  const spokenText = audio.result.normalizedText || sourceText

  return (
    <section className="mt-4 rounded-[28px] border border-soa-line bg-soa-lime p-5" aria-labelledby="audio-result-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.16em] text-soa-muted">VOICE READY</span>
          <h2 id="audio-result-title" className="mt-1 text-xl font-black tracking-[-0.05em]">음성이 준비됐어요</h2>
        </div>
        <StatusPill label={resultLabel(audio)} tone={isDemo ? 'warning' : 'good'} />
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-soa-muted">{audio.result.message}</p>
      <SegmentResultList text={spokenText} reportedCount={audio.result.segmentCount} />

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-soa-muted">
        <span className="rounded-xl bg-white/45 p-2">엔진 {audio.result.engineId}</span>
        <span className="rounded-xl bg-white/45 p-2">음원 {audio.durationSeconds.toFixed(1)}초</span>
        <span className="rounded-xl bg-white/45 p-2">생성 {formatMilliseconds(audio.result.processingMs)}</span>
        <span className="rounded-xl bg-white/45 p-2">크기 {formatBytes(audio.result.fileSizeBytes)}</span>
        <span className="rounded-xl bg-white/45 p-2">구간 {audio.result.segmentCount}개</span>
        <span className="rounded-xl bg-white/45 p-2">RTF {audio.result.realtimeFactor ?? '-'}</span>
      </div>

      <button
        type="button"
        onClick={() => downloadAudioFile(audio.url, audio.filename)}
        className="focus-ring mt-4 min-h-[52px] w-full rounded-2xl bg-soa-ink px-5 font-black text-white"
      >
        WAV 다운로드
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={onRetry} className="focus-ring min-h-11 rounded-2xl border border-soa-ink/15 bg-white/70 text-xs font-black">다시 생성</button>
        <button type="button" onClick={onReset} className="focus-ring min-h-11 rounded-2xl border border-soa-ink/15 bg-white/70 text-xs font-black">결과 닫기</button>
      </div>
    </section>
  )
}
