import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalDialog } from '../../hooks/useModalDialog'
import { deleteProject } from '../../projects/projectRepository'
import type { VoiceProject } from '../../projects/projectTypes'

export function ProjectDeleteButton({ project, onDeleted }: {
  project: VoiceProject
  onDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const pending = useRef(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const close = () => { if (!pending.current) setOpen(false) }
  const dialog = useModalDialog<HTMLElement>(open, close, trigger)
  const remove = async () => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError(false)
    try {
      await deleteProject(project.id)
      setOpen(false)
      onDeleted(project.id)
    } catch {
      setError(true)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return <>
    <button ref={trigger} type="button" className="soa-project-delete focus-ring"
      aria-label={`${project.title} 프로젝트 삭제`} title="프로젝트 삭제"
      onClick={() => { setError(false); setOpen(true) }}>삭제</button>
    {open && createPortal(
      <div className="soa-exit-dialog" role="presentation" onMouseDown={close}>
        <section ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId}
          aria-describedby={descriptionId} aria-busy={busy} tabIndex={-1}
          onMouseDown={(event) => event.stopPropagation()}>
          <h2 id={titleId}>프로젝트를 삭제할까요?</h2>
          <p className="soa-project-delete-title">{project.title}</p>
          <p id={descriptionId}>이 기기에 저장된 프로젝트만 삭제하며 되돌릴 수 없습니다. 현재 편집 내용, 다운로드한 파일과 서버 음성은 유지됩니다.</p>
          {error && <p role="alert">삭제하지 못했습니다. 저장소 상태를 확인하고 다시 시도해 주세요.</p>}
          <div>
            <button type="button" disabled={busy} onClick={close} data-dialog-autofocus>취소</button>
            <button type="button" disabled={busy} className="is-danger" onClick={() => void remove()}>
              {busy ? '삭제 중…' : '삭제하기'}
            </button>
          </div>
        </section>
      </div>, document.body)}
  </>
}
