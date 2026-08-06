import type { GenerationPhase } from '../../tts/generationTypes'
import type { SpeechJobProgress } from '../../tts/voiceApi'

const labels: Record<GenerationPhase, string> = {
  idle: '준비됨',
  preparing: '문장 확인 중',
  requesting: '음성 준비 요청 중',
  rendering: '데모 WAV 준비 중',
  completed: '음성 준비 완료',
  cancelled: '생성 취소됨',
  failed: '생성 실패',
}

interface GenerationProgressProps {
  phase: GenerationPhase
  progress: SpeechJobProgress | null
  onCancel: () => void
}

export function GenerationProgress({ phase, progress, onCancel }: GenerationProgressProps) {
  if (phase === 'idle' || phase === 'completed' || phase === 'failed') return null
  if (phase === 'cancelled') {
    return <p role="status" className="mt-4 rounded-2xl bg-[#fff5db] p-4 text-xs font-bold text-soa-muted">요청을 취소했습니다. 문장과 설정은 그대로 유지됩니다.</p>
  }

  const value = progress?.progress ?? (phase === 'preparing' ? 4 : phase === 'rendering' ? 92 : 10)
  const segment = progress && progress.totalSegments > 1
    ? `${progress.currentSegment}/${progress.totalSegments} 구간`
    : null

  return (
    <div role="status" className="mt-4 rounded-2xl border border-[#d8d0ff] bg-[#f0ecff] p-4">
      <div className="flex items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-soa-violet border-t-transparent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <strong className="block text-sm tracking-[-0.025em]">{progress?.message ?? labels[phase]}</strong>
          <span className="mt-0.5 block text-xs text-soa-muted">{segment ?? '첫 실행에는 준비 시간이 조금 더 걸릴 수 있습니다.'}</span>
        </div>
        <span className="text-xs font-black text-soa-violet">{value}%</span>
        <button type="button" onClick={onCancel} className="focus-ring min-h-10 rounded-xl border border-soa-ink/15 bg-white px-3 text-xs font-black">취소</button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" aria-hidden="true">
        <div className="h-full rounded-full bg-soa-violet transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
