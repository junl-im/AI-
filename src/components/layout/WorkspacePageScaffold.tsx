import type { ReactNode } from 'react'
import { WorkspacePageHeader } from './WorkspacePageHeader'

interface WorkspacePageScaffoldProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  status?: ReactNode
  className?: string
  children: ReactNode
}

export function WorkspacePageScaffold({
  eyebrow,
  title,
  description,
  actions,
  status,
  className = '',
  children,
}: WorkspacePageScaffoldProps) {
  return (
    <div className={`soa-secondary-page ${className}`.trim()}>
      <WorkspacePageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
      {status ? <div className="soa-page-status">{status}</div> : null}
      <div className="soa-page-content">{children}</div>
    </div>
  )
}
