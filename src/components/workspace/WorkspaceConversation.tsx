import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

interface WorkspaceConversationProps {
  messages: WorkspaceMessage[]
}

export function WorkspaceConversation({ messages }: WorkspaceConversationProps) {
  const visible = messages.slice(-5)
  const latest = visible.at(-1)
  return (
    <details className="soa-workspace-conversation" role="region" aria-label="작업 메시지">
      <summary>
        <span>제작 기록</span>
        <strong>{latest?.badge ?? '준비'} · {visible.length}개</strong>
      </summary>
      <div aria-live="polite">
        {visible.map((message) => (
          <article key={message.id} className={`is-${message.role}`}>
            <span>{message.badge ?? (message.role === 'system' ? '시스템' : 'SoriON')}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
    </details>
  )
}
