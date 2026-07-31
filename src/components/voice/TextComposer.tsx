import type { ChangeEvent } from 'react'

interface TextComposerProps {
  value: string
  pronunciationCorrection: boolean
  onChange: (value: string) => void
  onPronunciationCorrectionChange: (enabled: boolean) => void
  maxLength?: number
}

const examples = [
  '2026년 8월 1일 오전 10시에 새로운 서비스를 시작합니다.',
  '오늘도 당신의 목소리가 누군가에게 좋은 기억이 되길 바랍니다.',
  '신제품 출시를 기념해 지금 특별한 혜택을 만나보세요.',
]

export function TextComposer({
  value,
  pronunciationCorrection,
  onChange,
  onPronunciationCorrectionChange,
  maxLength = 500,
}: TextComposerProps) {
  return (
    <section aria-labelledby="text-composer-title" className="soa-text-composer">
      <div className="flex items-center justify-between gap-3">
        <label id="text-composer-title" htmlFor="voice-text" className="text-sm font-black tracking-[-0.03em]">
          읽을 문장
        </label>
        <span className="text-[11px] font-bold text-soa-muted" aria-live="polite">
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
      <textarea
        id="voice-text"
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={6}
        className="focus-ring soa-primary-textarea"
        placeholder="바로 여기에 변환할 문장을 입력하세요."
      />

      <label className="soa-pronunciation-toggle">
        <span className="soa-pronunciation-toggle__copy">
          <strong>숫자·날짜 자동 변환</strong>
          <small>2026년 8월 1일 → 이천이십육년 팔월 일일</small>
        </span>
        <input
          type="checkbox"
          checked={pronunciationCorrection}
          onChange={(event) => onPronunciationCorrectionChange(event.target.checked)}
        />
        <span className="soa-switch" aria-hidden="true"><i /></span>
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="예시 문장">
        {examples.map((example, index) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            className="focus-ring min-h-10 shrink-0 rounded-full border border-soa-line bg-white px-3 text-xs font-bold text-soa-muted"
          >
            예시 {index + 1}
          </button>
        ))}
      </div>
    </section>
  )
}
