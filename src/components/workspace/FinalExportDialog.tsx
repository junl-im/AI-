import { useMemo } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import { FinalExportControls } from './FinalExportControls'

interface FinalExportDialogProps {
  open: boolean
  blocks: TimelineBlock[]
  onClose: () => void
}

export function FinalExportDialog({ open, blocks, onClose }: FinalExportDialogProps) {
  const dialogRef = useModalDialog<HTMLElement>(open, onClose)
  const summary = useMemo(() => {
    const voiceBlocks = blocks.filter((block) => block.kind === 'voice')
    return {
      total: voiceBlocks.length,
      ready: voiceBlocks.filter((block) => block.status === 'ready').length,
      pending: voiceBlocks.filter((block) => block.status !== 'ready').length,
    }
  }, [blocks])

  if (!open) return null
  return (
    <div className="soa-export-dialog-layer" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="soa-export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="soa-export-dialog-title"
        aria-describedby="soa-export-dialog-description"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="soa-export-dialog__head">
          <div>
            <span>EXPORT</span>
            <h2 id="soa-export-dialog-title">완성본 내보내기</h2>
            <p id="soa-export-dialog-description">편집이 끝났을 때 현재 타임라인을 하나의 음원과 자막으로 만듭니다.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="내보내기 닫기" data-dialog-autofocus>×</button>
        </header>
        <div className="soa-export-dialog__status" role="status">
          <strong>대사 {summary.ready}/{summary.total} 완료</strong>
          <span>{summary.pending > 0 ? `아직 ${summary.pending}개 대사가 완성되지 않았습니다.` : '모든 대사가 내보내기 준비되었습니다.'}</span>
        </div>

        <FinalExportControls blocks={blocks} />
      </section>
    </div>
  )
}
