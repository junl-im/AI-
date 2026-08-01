interface ExitConfirmDialogProps {
  open: boolean
  onStay: () => void
  onExit: () => void
}

export function ExitConfirmDialog({ open, onStay, onExit }: ExitConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="soa-exit-dialog" role="presentation" onMouseDown={onStay}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="soa-exit-title"
        aria-describedby="soa-exit-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="soa-exit-dialog__icon" aria-hidden="true">↩</span>
        <h2 id="soa-exit-title">SoriON을 닫을까요?</h2>
        <p id="soa-exit-description">
          작업 내용은 자동 저장됩니다. 뒤로가기를 한 번 더 누르면 바로 종료됩니다.
        </p>
        <div>
          <button type="button" onClick={onStay} autoFocus>계속 만들기</button>
          <button type="button" className="is-danger" onClick={onExit}>종료</button>
        </div>
      </section>
    </div>
  )
}
