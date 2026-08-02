import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

interface WorkspaceConversationProps {
  messages: WorkspaceMessage[]
}

export function WorkspaceConversation({ messages }: WorkspaceConversationProps) {
  const visible = messages.slice(-5)
  return (
    <section className="soa-workspace-conversation" aria-label="작업 메시지">
      <header><span>CHAT WORKSPACE</span><strong>제작 흐름</strong></header>
      <div aria-live="polite">
        {visible.map((message) => (
          <article key={message.id} className={`is-${message.role}`}>
            <span>{message.badge ?? (message.role === 'system' ? '시스템' : 'SoriON')}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
