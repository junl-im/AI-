interface StatusPillProps {
  label: string
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
}

const tones = {
  neutral: 'bg-[#ece9e1] text-soa-muted',
  good: 'bg-[#dff8d8] text-[#24551d]',
  warning: 'bg-[#fff0c9] text-[#77590d]',
  danger: 'bg-[#fee2e2] text-[#991b1b]',
}

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{label}</span>
}
