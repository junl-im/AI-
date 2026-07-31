import type { GenerationPhase } from '../../tts/generationTypes'

const labels: Record<GenerationPhase, string> = {
  idle: '준비됨',
  preparing: '문장 확인 중',
  requesting: '음성 엔진 요청 중',
  rendering: '데모 WAV 준비 중',
  completed: '음성 준비 완료',
  cancelled: '생성 취소됨',
  failed: '생성 실패',
}

interface GenerationProgressProps {
  phase: GenerationPhase
  onCancel: () => void
}

export function GenerationProgress({ phase, onCancel }: GenerationProgressProps) {
  if (phase === 'idle' || phase === 'completed' || phase === 'failed') return null
  if (phase === 'cancelled') {
    return <p role="status" className="mt-4 rounded-2xl bg-[#fff5db] p-4 text-xs font-bold text-soa-muted">요청을 취소했습니다. 문장과 설정은 그대로 유지됩니다.</p>
  }

  return (
    <div role="status" className="mt-4 rounded-2xl border border-[#d8d0ff] bg-[#f0ecff] p-4">
      <div className="flex items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-soa-violet border-t-transparent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <strong className="block text-sm tracking-[-0.025em]">{labels[phase]}</strong>
          <span className="mt-0.5 block text-xs text-soa-muted">로컬 엔진은 첫 실행에 시간이 더 걸릴 수 있습니다.</span>
        </div>
        <button type="button" onClick={onCancel} className="focus-ring min-h-10 rounded-xl border border-soa-ink/15 bg-white px-3 text-xs font-black">취소</button>
      </div>
    </div>
  )
}
