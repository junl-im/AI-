import type { ReactNode } from 'react'

interface WorkspacePageHeaderProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions,
}: WorkspacePageHeaderProps) {
  return (
    <header className="soa-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="soa-page-header__actions">{actions}</div> : null}
    </header>
  )
}
