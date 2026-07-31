import type { EngineInfo } from '../../ai/contracts'
import { StatusPill } from '../ui/StatusPill'

interface EngineStatusCardProps {
  engine: EngineInfo | null
  loading: boolean
  configured: boolean
  error: string | null
  onOpenSettings: () => void
}

export function EngineStatusCard({
  engine,
  loading,
  configured,
  error,
  onOpenSettings,
}: EngineStatusCardProps) {
  const label = loading
    ? '확인 중'
    : !configured
      ? 'API 미설정'
      : error
        ? '연결 실패'
        : engine?.mode === 'ai'
          ? 'AI ENGINE'
          : engine?.mode === 'local'
            ? 'LOCAL TTS'
            : 'DEMO'
  const tone = engine?.ready && engine.mode !== 'mock' ? 'good' : 'warning'
  const capabilities = engine
    ? [
        engine.supportsSpeed ? '속도' : null,
        engine.supportsPitch ? '피치' : null,
        engine.supportsEmotion ? '감정' : null,
      ].filter(Boolean)
    : []

  return (
    <section className="mb-3 rounded-[22px] border border-soa-line bg-white/65 p-4" aria-label="현재 음성 엔진">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black tracking-[0.14em] text-soa-muted">VOICE ENGINE</span>
          <strong className="mt-1 block truncate text-sm">
            {loading
              ? '서버 엔진 확인 중'
              : engine?.name ?? (configured ? '엔진 연결 실패' : '브라우저 데모 모드')}
          </strong>
        </div>
        <StatusPill label={label} tone={tone} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        {error
          ? error
          : engine?.mode === 'local'
            ? '기기에 설치된 한국어 음성으로 실제 WAV를 만듭니다. AI 모델 음성은 아닙니다.'
            : engine?.mode === 'ai'
              ? '서버의 AI 음성 엔진으로 생성합니다.'
              : 'API가 연결되지 않아 기능 확인용 데모 WAV만 만들 수 있습니다.'}
      </p>
      {engine ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[10px] font-black text-soa-muted">지원</span>
          {capabilities.length ? capabilities.map((item) => (
            <span key={item} className="rounded-full bg-[#f4f2ec] px-2 py-1 text-[9px] font-black">
              {item}
            </span>
          )) : <span className="text-[10px] font-semibold text-soa-muted">기본 생성만</span>}
        </div>
      ) : null}
      {!engine ? (
        <button
          type="button"
          onClick={onOpenSettings}
          className="focus-ring mt-3 min-h-10 w-full rounded-xl border border-soa-line bg-white text-xs font-black"
        >
          Voice API 연결 점검 열기
        </button>
      ) : null}
    </section>
  )
}
