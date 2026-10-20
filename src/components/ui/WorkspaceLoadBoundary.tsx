import { Component } from 'react'
import type { PropsWithChildren } from 'react'

/** Keep a failed offline chunk request from replacing the app with a blank screen. */
export class WorkspaceLoadBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="soa-workspace-load-error" role="alert">
        <h2>편집기를 불러오지 못했습니다</h2>
        <p>인터넷 연결을 확인한 뒤 화면을 다시 불러와 주세요. 이 기기에 저장된 작업은 유지됩니다.</p>
        <button type="button" className="soa-page-action" onClick={() => window.location.reload()}>화면 다시 불러오기</button>
      </section>
    )
  }
}
