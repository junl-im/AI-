import { useEffect, useRef, useState } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'

interface DubbingStudioHeaderProps {
  title: string
  savedLabel: string
  downloadHref: string | null
  downloadName: string
  onTitleChange: (value: string) => void
  onOpenClone: () => void
  onOpenQuality: () => void
  onOpenProjects: () => void
  onOpenSettings: () => void
  sidePanelsCollapsed: boolean
  onToggleSidePanels: () => void
  exportAvailable: boolean
  onOpenExport: () => void
  onClear: () => void
}

export function DubbingStudioHeader({
  title,
  savedLabel,
  downloadHref,
  downloadName,
  onTitleChange,
  onOpenClone,
  onOpenQuality,
  onOpenProjects,
  onOpenSettings,
  sidePanelsCollapsed,
  onToggleSidePanels,
  exportAvailable,
  onOpenExport,
  onClear,
}: DubbingStudioHeaderProps) {
  const titleRef = useRef<HTMLInputElement | null>(null)
  const projectMenuRef = useRef<HTMLDivElement | null>(null)
  const projectMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const clearDialogRef = useModalDialog<HTMLElement>(
    clearConfirmOpen,
    () => setClearConfirmOpen(false),
    projectMenuButtonRef,
  )

  useEffect(() => {
    if (!projectMenuOpen) return undefined

    const closeMenu = () => {
      setProjectMenuOpen(false)
      projectMenuButtonRef.current?.focus({ preventScroll: true })
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (projectMenuRef.current?.contains(event.target as Node)) return
      closeMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [projectMenuOpen])

  return (
    <header className="soa-dubbing-header">
      <div className="soa-dubbing-project-title">
        <div className="soa-dubbing-project-title__copy">
          <input
            ref={titleRef}
            value={title}
            maxLength={80}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={() => {
              if (!title.trim()) onTitleChange('새 프로젝트')
            }}
            aria-label="프로젝트 제목"
          />
          <button type="button" onClick={() => titleRef.current?.focus()} aria-label="프로젝트 제목 수정">✎</button>
          <p>{savedLabel}</p>
        </div>

        <div className="soa-dubbing-toolbar__actions" aria-label="프로젝트 동작">
          <button
            type="button"
            className="soa-dubbing-pro-toggle"
            onClick={onToggleSidePanels}
            aria-label={sidePanelsCollapsed ? '사이드 패널 열기' : '사이드 패널 숨기기'}
            aria-pressed={!sidePanelsCollapsed}
            title={sidePanelsCollapsed ? '프로젝트와 보이스 패널 열기' : '프로젝트와 보이스 패널 숨기기'}
          >
            <span aria-hidden="true">{sidePanelsCollapsed ? '▦' : '◫'}</span><b>{sidePanelsCollapsed ? '패널 열기' : '패널 숨기기'}</b>
          </button>
          <button
            type="button"
            className="soa-dubbing-export-trigger"
            onClick={onOpenExport}
            disabled={!exportAvailable}
            aria-label="완성본 내보내기"
            title={exportAvailable ? '최종 음원과 자막 내보내기' : '대사를 만든 뒤 내보낼 수 있습니다.'}
          >
            <span aria-hidden="true">⇩</span><b>내보내기</b>
          </button>
          {downloadHref ? (
            <a href={downloadHref} download={downloadName} aria-label="현재 재생 음성만 다운로드" title="현재 재생 음성만 다운로드">♪</a>
          ) : null}
          <div ref={projectMenuRef} className="soa-dubbing-more">
            <button
              ref={projectMenuButtonRef}
              type="button"
              className="soa-dubbing-more__trigger"
              aria-label="프로젝트 메뉴 열기"
              aria-expanded={projectMenuOpen}
              aria-controls="dubbing-project-menu"
              onClick={() => setProjectMenuOpen((open) => !open)}
            >
              ⋮
            </button>
            {projectMenuOpen ? (
              <div id="dubbing-project-menu" className="soa-dubbing-menu" aria-label="프로젝트 메뉴">
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false)
                    onOpenProjects()
                  }}
                >
                  프로젝트 목록
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false)
                    onOpenClone()
                  }}
                >
                  내 목소리 만들기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false)
                    onOpenQuality()
                  }}
                >
                  음성 품질 확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false)
                    onOpenSettings()
                  }}
                >
                  설정
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    setProjectMenuOpen(false)
                    setClearConfirmOpen(true)
                  }}
                >
                  현재 작업 비우기
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {clearConfirmOpen ? (
        <div className="soa-confirm-layer" role="presentation" onMouseDown={() => setClearConfirmOpen(false)}>
          <section
            ref={clearDialogRef}
            className="soa-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-work-title"
            aria-describedby="clear-work-description"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <strong id="clear-work-title">현재 작업을 비울까요?</strong>
            <p id="clear-work-description">내용과 생성된 음성 블록이 새 프로젝트 상태로 초기화됩니다.</p>
            <div>
              <button type="button" onClick={() => setClearConfirmOpen(false)} data-dialog-autofocus>계속 편집</button>
              <button
                type="button"
                className="is-danger"
                onClick={() => {
                  setClearConfirmOpen(false)
                  onClear()
                }}
              >
                작업 비우기
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  )
}
