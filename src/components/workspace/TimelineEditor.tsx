import { useEffect, useState, type DragEvent } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { FinalExportControls } from './FinalExportControls'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'

interface TimelineEditorProps {
  blocks: TimelineBlock[]
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (sourceId: string, targetId: string) => void
  onSplit: (id: string) => void
  onUpdateText: (id: string, text: string) => void
  onRetry: (id: string) => void
  onAddVoice: () => void
  onAddPause: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onVerifyAndRegenerate?: () => void
  sttBusy?: boolean
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

interface VoiceBlockProps {
  block: TimelineVoiceBlock
  voiceIndex: number
  index: number
  total: number
  onMove: TimelineEditorProps['onMove']
  onReorder: TimelineEditorProps['onReorder']
  onSplit: TimelineEditorProps['onSplit']
  onUpdateText: TimelineEditorProps['onUpdateText']
  onRetry: TimelineEditorProps['onRetry']
  onRemove: TimelineEditorProps['onRemove']
}

function VoiceBlock({
  block,
  voiceIndex,
  index,
  total,
  onMove,
  onReorder,
  onSplit,
  onUpdateText,
  onRetry,
  onRemove,
}: VoiceBlockProps) {
  const selectAndPlay = usePlayerStore((state) => state.selectAndPlay)
  const [draft, setDraft] = useState(block.text)
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  const blockMenuId = `dubbing-block-menu-${voiceIndex + 1}`

  useEffect(() => setDraft(block.text), [block.text])

  function saveDraft() {
    const next = draft.trim()
    if (next && next !== block.text) onUpdateText(block.id, next)
    if (!next) setDraft(block.text)
  }

  const statusLabel = block.status === 'ready'
    ? '완료'
    : block.status === 'generating'
      ? `${Math.round(block.progress)}% 생성 중`
      : block.status === 'failed'
        ? '생성 실패'
        : '생성 대기'
  const sttLabel = block.sttVerification?.status === 'passed'
    ? 'STT 통과'
    : block.sttVerification?.status === 'failed'
      ? 'STT 재생성 필요'
      : block.sttVerification?.status === 'blocked'
        ? 'STT 재생성 한도'
        : block.sttVerification?.status === 'unchecked'
          ? 'STT 재검수 대기'
          : null
  const actionLabel = block.status === 'ready' && block.trackId
    ? `${voiceIndex + 1}번 대사 재생`
    : block.status === 'generating'
      ? `${voiceIndex + 1}번 대사 음성 생성 중`
      : block.status === 'queued'
        ? `${voiceIndex + 1}번 대사 음성 생성`
        : `${voiceIndex + 1}번 대사 음성 다시 생성`

  return (
    <article
      className={`soa-dubbing-block is-${block.status}`}
      draggable={block.status !== 'generating'}
      onDragStart={(event: DragEvent<HTMLElement>) => {
        event.dataTransfer.setData('text/plain', block.id)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const sourceId = event.dataTransfer.getData('text/plain')
        if (sourceId) onReorder(sourceId, block.id)
      }}
    >
      <header>
        <div className="soa-dubbing-block__voice">
          <span aria-hidden="true">{block.voiceName.slice(0, 1)}</span>
          <div><strong>{block.voiceName}</strong><small>대사 {voiceIndex + 1}</small></div>
        </div>
        <div className="soa-dubbing-block__tools">
          {block.status === 'ready' && block.trackId ? (
            <button
              type="button"
              onClick={() => selectAndPlay(block.trackId!)}
              aria-label={actionLabel}
            >
              ▶
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRetry(block.id)}
              disabled={block.status === 'generating' || draft.trim().length === 0}
              aria-label={actionLabel}
            >
              {block.status === 'generating' ? '…' : '▶'}
            </button>
          )}
          <button
            type="button"
            className="soa-dubbing-block__direct-tool"
            onClick={() => onSplit(block.id)}
            aria-label={`${voiceIndex + 1}번 대사 가위로 나누기`}
          >
            ✂
          </button>
          <button
            type="button"
            className="soa-dubbing-block__direct-tool is-danger"
            onClick={() => onRemove(block.id)}
            aria-label={`${voiceIndex + 1}번 대사 삭제`}
          >
            ⌫
          </button>
          <div className="soa-dubbing-block-menu">
            <button
              type="button"
              className="soa-dubbing-block-menu__trigger"
              aria-label={`${voiceIndex + 1}번 대사 블록 메뉴 열기`}
              aria-expanded={blockMenuOpen}
              aria-controls={blockMenuId}
              onClick={() => setBlockMenuOpen((open) => !open)}
            >
              ⋮
            </button>
            {blockMenuOpen ? (
              <div id={blockMenuId} className="soa-dubbing-block-menu__items" aria-label={`${voiceIndex + 1}번 대사 블록 메뉴`}>
                <button
                  type="button"
                  onClick={() => {
                    setBlockMenuOpen(false)
                    onSplit(block.id)
                  }}
                >
                  문장 나누기
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    setBlockMenuOpen(false)
                    onMove(block.id, -1)
                  }}
                >
                  위로 이동
                </button>
                <button
                  type="button"
                  disabled={index === total - 1}
                  onClick={() => {
                    setBlockMenuOpen(false)
                    onMove(block.id, 1)
                  }}
                >
                  아래로 이동
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    setBlockMenuOpen(false)
                    onRemove(block.id)
                  }}
                >
                  블록 삭제
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={saveDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            saveDraft()
            if (draft.trim()) onRetry(block.id)
          }
        }}
        maxLength={2_000}
        aria-label={`${voiceIndex + 1}번 대사 수정`}
        placeholder="더빙할 문장을 입력해 주세요."
      />

      <footer>
        <span className="soa-dubbing-block__status"><i aria-hidden="true" />{statusLabel}</span>
        {block.audio?.result.firstAudioMs != null ? (
          <small>첫 음성 준비 {block.audio.result.firstAudioMs}ms</small>
        ) : null}
        <time>{formatDuration(block.durationSeconds)}</time>
      </footer>
      {block.status === 'generating' ? (
        <div className="soa-dubbing-block__progress"><i style={{ width: `${Math.max(4, block.progress)}%` }} /></div>
      ) : null}
      {block.error ? <p className="soa-dubbing-block__error">{block.error}</p> : null}
      {block.sttVerification ? (
        <p className="soa-dubbing-block__error">
          {sttLabel} · CER {(block.sttVerification.characterErrorRate * 100).toFixed(1)}%
          {' · '}WER {(block.sttVerification.wordErrorRate * 100).toFixed(1)}%
          {block.sttVerification.regenerationAttempts
            ? ` · 재생성 ${block.sttVerification.regenerationAttempts}회`
            : ''}
        </p>
      ) : null}
    </article>
  )
}

export function TimelineEditor({
  blocks,
  onMove,
  onReorder,
  onSplit,
  onUpdateText,
  onRetry,
  onAddVoice,
  onAddPause,
  onRemove,
  onClear,
  onVerifyAndRegenerate = () => undefined,
  sttBusy = false,
}: TimelineEditorProps) {
  let voiceIndex = -1

  return (
    <section className="soa-timeline soa-dubbing-timeline" aria-label="음성 블록 편집">
      <header className="soa-dubbing-timeline__head">
        <div><span>TIMELINE EDITOR</span><strong>트랙 · 플레이헤드 · 클립 편집</strong></div>
        <div>
          <button
            type="button"
            onClick={onVerifyAndRegenerate}
            disabled={sttBusy || !blocks.some((block) => block.kind === 'voice' && block.status === 'ready')}
          >
            {sttBusy ? 'STT 검수 중…' : 'STT 검수 · 실패만 재생성'}
          </button>
          <button type="button" onClick={onAddPause}>쉼 추가</button>
          <button type="button" onClick={onClear} disabled={blocks.length === 0}>전체 비우기</button>
        </div>
      </header>

      <div className="soa-capcut-timeline">
        <div className="soa-capcut-ruler" aria-hidden="true">
          <span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span>
        </div>
        <div className="soa-capcut-track-row">
          <div className="soa-capcut-track-label"><strong>VOICE 1</strong><small>대사 트랙</small></div>
          <div className="soa-capcut-track-lane">
            <i className="soa-capcut-playhead" aria-hidden="true" />
            {blocks.length === 0 ? (
              <div className="soa-dubbing-timeline__empty">
                <strong>아직 음성 블록이 없습니다.</strong>
                <p>장문 내용을 제작하거나 아래 + 버튼으로 대사를 직접 추가하세요.</p>
              </div>
            ) : (
              <div className="soa-dubbing-block-list">
                {blocks.map((block, index) => {
                  if (block.kind === 'pause') {
                    return (
                      <div
                        key={block.id}
                        className="soa-dubbing-pause-block"
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', block.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault()
                          const sourceId = event.dataTransfer.getData('text/plain')
                          if (sourceId) onReorder(sourceId, block.id)
                        }}
                      >
                        <span>쉼</span><strong>{block.durationSeconds.toFixed(1)}초</strong>
                        <button type="button" onClick={() => onRemove(block.id)} aria-label="쉼 블록 삭제">×</button>
                      </div>
                    )
                  }
                  voiceIndex += 1
                  return (
                    <VoiceBlock
                      key={block.id}
                      block={block}
                      voiceIndex={voiceIndex}
                      index={index}
                      total={blocks.length}
                      onMove={onMove}
                      onReorder={onReorder}
                      onSplit={onSplit}
                      onUpdateText={onUpdateText}
                      onRetry={onRetry}
                      onRemove={onRemove}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>


      <FinalExportControls blocks={blocks} />

      <button type="button" className="soa-dubbing-add-block" onClick={onAddVoice} aria-label="새 대사 블록 추가">＋</button>
    </section>
  )
}
