import { useRef, useState } from 'react'
import type { BackendStatus } from '../../store/useAppStore'

interface DubbingStudioHeaderProps {
  title: string
  savedLabel: string
  backendStatus: BackendStatus
  engineLabel: string
  downloadHref: string | null
  downloadName: string
  onTitleChange: (value: string) => void
  onOpenClone: () => void
  onOpenQuality: () => void
  onOpenProjects: () => void
  onOpenSettings: () => void
  onClear: () => void
}

function engineStatusLabel(status: BackendStatus, engineLabel: string): string {
  if (status === 'online') return 'AI 음성 엔진 준비'
  if (status === 'degraded' && engineLabel.includes('브라우저')) return '브라우저 음성 준비'
  if (status === 'degraded') return '대체 음성 모드'
  if (status === 'checking') return '음성 시스템 확인 중'
  return '음성 서버 자동 재연결 중'
}

export function DubbingStudioHeader({
  title,
  savedLabel,
  backendStatus,
  engineLabel,
  downloadHref,
  downloadName,
  onTitleChange,
  onOpenClone,
  onOpenQuality,
  onOpenProjects,
  onOpenSettings,
  onClear,
}: DubbingStudioHeaderProps) {
  const titleRef = useRef<HTMLInputElement | null>(null)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

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
          <small>{engineStatusLabel(backendStatus, engineLabel)} · {engineLabel}</small>
        </div>

        <div className="soa-dubbing-toolbar__actions" aria-label="프로젝트 동작">
          <button
            type="button"
            className={`soa-dubbing-engine-button is-${backendStatus}`}
            onClick={onOpenQuality}
            aria-label={`${engineStatusLabel(backendStatus, engineLabel)}. 품질 연구소 열기`}
          >
            <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
          </button>
          {downloadHref ? (
            <a href={downloadHref} download={downloadName} aria-label="현재 음성 다운로드">⇩</a>
          ) : (
            <button type="button" disabled aria-label="현재 음성은 파일 다운로드를 지원하지 않음">⇩</button>
          )}
          <div className="soa-dubbing-more">
            <button
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
            className="soa-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-work-title"
            aria-describedby="clear-work-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <strong id="clear-work-title">현재 작업을 비울까요?</strong>
            <p id="clear-work-description">원고와 생성된 음성 블록이 새 프로젝트 상태로 초기화됩니다.</p>
            <div>
              <button type="button" onClick={() => setClearConfirmOpen(false)}>계속 편집</button>
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
