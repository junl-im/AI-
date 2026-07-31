import type { EngineInfo } from '../../ai/contracts'
import { StatusPill } from '../ui/StatusPill'

interface EngineStatusCardProps {
  engine: EngineInfo | null
  loading: boolean
}

export function EngineStatusCard({ engine, loading }: EngineStatusCardProps) {
  const label = loading ? '확인 중' : engine?.mode === 'ai' ? 'AI ENGINE' : engine?.mode === 'local' ? 'LOCAL TTS' : 'DEMO'
  const tone = engine?.ready && engine.mode !== 'mock' ? 'good' : 'warning'
  const capabilities = engine ? [
    engine.supportsSpeed ? '속도' : null,
    engine.supportsPitch ? '피치' : null,
    engine.supportsEmotion ? '감정' : null,
  ].filter(Boolean) : []

  return (
    <section className="mb-3 rounded-[22px] border border-soa-line bg-white/65 p-4" aria-label="현재 음성 엔진">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black tracking-[0.14em] text-soa-muted">VOICE ENGINE</span>
          <strong className="mt-1 block truncate text-sm">{loading ? '서버 엔진 확인 중' : engine?.name ?? '브라우저 데모 모드'}</strong>
        </div>
        <StatusPill label={label} tone={tone} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        {engine?.mode === 'local'
          ? '기기에 설치된 한국어 음성으로 실제 WAV를 만듭니다. AI 모델 음성은 아닙니다.'
          : engine?.mode === 'ai'
            ? '서버의 AI 음성 엔진으로 생성합니다.'
            : 'API가 없거나 Mock만 준비된 경우 기능 확인용 데모 WAV를 만듭니다.'}
      </p>
      {engine ? <div className="mt-2 flex flex-wrap gap-1.5"><span className="text-[10px] font-black text-soa-muted">지원</span>{capabilities.length ? capabilities.map((item) => <span key={item} className="rounded-full bg-[#f4f2ec] px-2 py-1 text-[9px] font-black">{item}</span>) : <span className="text-[10px] font-semibold text-soa-muted">기본 생성만</span>}</div> : null}
    </section>
  )
}
