import type { BackendStatus } from '../../store/useAppStore'
import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

interface ConversationPanelProps {
  messages: WorkspaceMessage[]
  backendStatus: BackendStatus
  backendMessage: string
}

function connectionTitle(status: BackendStatus): string {
  if (status === 'checking') return '음성 시스템 준비 중'
  if (status === 'degraded') return '기본 음성으로 준비됨'
  return '음성 시스템 준비 중'
}

export function ConversationPanel({
  messages,
  backendStatus,
  backendMessage,
}: ConversationPanelProps) {
  const connected = backendStatus === 'online'

  return (
    <section className="soa-conversation" aria-label="음성 생성 대화">
      <div className="soa-conversation__intro">
        <span>SoriON CHAT</span>
        <h1>무엇을 목소리로 만들까요?</h1>
        <p>문장을 쓰거나 “30초 밝은 브이로그 대본”처럼 자연스럽게 요청하세요.</p>
      </div>

      {!connected ? (
        <div className={`soa-system-message is-${backendStatus}`} role="status">
          <span aria-hidden="true">●</span>
          <span>
            <strong>{connectionTitle(backendStatus)}</strong>
            <small>{backendMessage}</small>
          </span>
        </div>
      ) : (
        <div className="soa-system-message is-online" role="status">
          <span aria-hidden="true">●</span>
          <span>
            <strong>실제 음성 엔진 준비됨</strong>
            <small>{backendMessage}</small>
          </span>
        </div>
      )}

      <div className="soa-message-list" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`soa-message is-${message.role}`}>
            {message.badge ? <span className="soa-message__badge">{message.badge}</span> : null}
            <p>{message.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
