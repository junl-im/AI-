import type { ChangeEvent } from 'react'

interface TextComposerProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

const examples = [
  '오늘도 당신의 목소리가 누군가에게 좋은 기억이 되길 바랍니다.',
  '신제품 출시를 기념해 지금 특별한 혜택을 만나보세요.',
  '안녕하세요. 목소리의 가능성을 켜는 소리온입니다.',
]

export function TextComposer({ value, onChange, maxLength = 1000 }: TextComposerProps) {
  return (
    <section aria-labelledby="text-composer-title">
      <div className="flex items-center justify-between gap-3">
        <label id="text-composer-title" htmlFor="voice-text" className="text-sm font-black tracking-[-0.03em]">
          읽을 문장
        </label>
        <span className="text-[11px] font-bold text-soa-muted">{value.length.toLocaleString()} / {maxLength.toLocaleString()}</span>
      </div>
      <textarea
        id="voice-text"
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={7}
        className="focus-ring mt-3 w-full resize-none rounded-[24px] border border-soa-line bg-white px-4 py-4 text-[17px] font-semibold leading-7 tracking-[-0.025em] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        placeholder="목소리로 만들 문장을 입력하세요."
      />
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
