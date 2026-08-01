import { BrandIcon } from './BrandIcon'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className={compact ? 'soa-brand-mark is-compact' : 'soa-brand-mark'}>
      <BrandIcon className="soa-brand-mark__icon" />
      <span className="soa-brand-mark__copy">
        <strong>SoriON AI</strong>
        <small>BY 곰같은여우</small>
      </span>
    </span>
  )
}
