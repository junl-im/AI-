interface BrandIconProps {
  className?: string
  decorative?: boolean
}

export function BrandIcon({ className = '', decorative = true }: BrandIconProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}sorion-logo.png`}
      className={className}
      alt={decorative ? '' : 'SoriON AI'}
      aria-hidden={decorative ? 'true' : undefined}
      draggable={false}
    />
  )
}
