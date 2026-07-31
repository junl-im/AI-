interface GenerationErrorCardProps {
  message: string
  onRetry: () => void
}

export function GenerationErrorCard({ message, onRetry }: GenerationErrorCardProps) {
  return (
    <section role="alert" className="mt-4 rounded-[24px] border border-[#f3b7ae] bg-[#fff0ed] p-4">
      <strong className="text-sm tracking-[-0.025em]">음성을 만들지 못했습니다</strong>
      <p className="mt-1 text-xs font-semibold leading-5 text-soa-muted">{message}</p>
      <button type="button" onClick={onRetry} className="focus-ring mt-3 min-h-11 w-full rounded-2xl bg-soa-ink text-xs font-black text-white">같은 설정으로 다시 시도</button>
    </section>
  )
}
