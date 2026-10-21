import { useId } from 'react'
import { createPortal } from 'react-dom'
import { useModalDialog } from '../../hooks/useModalDialog'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

export function TimelineDeleteDialog({ blocks, onCancel, onConfirm }: {
  blocks: TimelineBlock[]
  onCancel: () => void
  onConfirm: (ids: string[]) => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialog = useModalDialog<HTMLElement>(true, onCancel)
  const voices = blocks.filter((block) => block.kind === 'voice')
  const generating = voices.some((block) => block.status === 'generating')
  return createPortal(
    <div className="soa-exit-dialog" role="presentation" onMouseDown={onCancel}>
      <section ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId}
        aria-describedby={descriptionId} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <h2 id={titleId}>클립 {blocks.length}개를 삭제할까요?</h2>
        <p id={descriptionId}>대사 {voices.length}개 · 쉼 {blocks.length - voices.length}개를 타임라인에서 삭제합니다. 원본 대본과 저장된 프로젝트는 유지됩니다.</p>
        {voices[0] ? <p className="soa-project-delete-title">{voices[0].text.slice(0, 120)}{voices[0].text.length > 120 ? '…' : ''}</p> : null}
        {generating ? <p role="alert">생성이 끝난 뒤 삭제할 수 있습니다.</p> : null}
        {!blocks.length ? <p role="status">삭제할 클립이 이미 없어졌습니다.</p> : null}
        <div>
          <button type="button" onClick={onCancel} data-dialog-autofocus>취소</button>
          <button type="button" className="is-danger" disabled={generating || !blocks.length}
            onClick={() => onConfirm(blocks.map((block) => block.id))}>삭제 실행</button>
        </div>
      </section>
    </div>, document.body,
  )
}
