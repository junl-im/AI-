import type { RefObject } from 'react'
import type { VoiceChoice } from '../../voice/voiceChoices'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

export interface TimelineVoiceRecoveryState {
  unavailable: boolean
  missingProfile: boolean
  choiceName: string
  replacementVoiceId: string
  replacementChoices: VoiceChoice[]
  running: boolean
}

interface TimelineQuickEditorProps {
  selectedBlock: TimelineBlock
  selectedVoiceBlock: TimelineVoiceBlock | null
  quickEditorRef: RefObject<HTMLTextAreaElement | null>
  quickDraft: string
  quickDraftDirty: boolean
  quickDraftTrimmed: string
  playbackActive: boolean
  canNavigatePrevious: boolean
  canNavigateNext: boolean
  canMovePausePrevious: boolean
  canMovePauseNext: boolean
  recovery: TimelineVoiceRecoveryState | null
  onDraftChange: (value: string) => void
  onSave: () => boolean
  onPreviewOrGenerate: () => void
  onRegenerate: () => void
  onSplit: () => void
  onRemove: () => void
  onMovePause: (direction: -1 | 1) => void
  onNavigateVoice: (direction: -1 | 1) => void
  onRecoveryVoiceChange: (voiceId: string) => void
  onRecoverVoice: (regenerate: boolean) => void
}

export function TimelineQuickEditor({
  selectedBlock,
  selectedVoiceBlock,
  quickEditorRef,
  quickDraft,
  quickDraftDirty,
  quickDraftTrimmed,
  playbackActive,
  canNavigatePrevious,
  canNavigateNext,
  canMovePausePrevious,
  canMovePauseNext,
  recovery,
  onDraftChange,
  onSave,
  onPreviewOrGenerate,
  onRegenerate,
  onSplit,
  onRemove,
  onMovePause,
  onNavigateVoice,
  onRecoveryVoiceChange,
  onRecoverVoice,
}: TimelineQuickEditorProps) {
  const voiceUnavailable = Boolean(recovery?.unavailable)
  const existingAudioPreserved = Boolean(
    selectedVoiceBlock?.status === 'ready' && selectedVoiceBlock.trackId,
  )

  return (
    <section className={`soa-timeline-quick-editor ${voiceUnavailable ? 'has-voice-recovery' : ''}`} aria-label="선택 클립 빠른 편집">
      <div className="soa-timeline-quick-editor__meta">
        <span>선택 클립</span>
        <strong>{selectedVoiceBlock ? `${selectedVoiceBlock.voiceName} · ${formatDuration(selectedVoiceBlock.durationSeconds)}` : `쉼 · ${formatDuration(selectedBlock.durationSeconds)}`}</strong>
        {selectedVoiceBlock ? (
          <small>
            {voiceUnavailable ? '목소리 복구 필요 · ' : ''}
            {quickDraftDirty ? '수정됨 · 저장 필요' : '저장됨'} · {quickDraft.length}/2000자
          </small>
        ) : <small>타임라인 간격 블록</small>}
      </div>

      {selectedVoiceBlock ? (
        <>
          <div className="soa-timeline-quick-editor__body">
            <div className="soa-timeline-quick-editor__nav" aria-label="대사 빠른 이동">
              <button type="button" disabled={!canNavigatePrevious} onClick={() => onNavigateVoice(-1)} aria-label="이전 대사로 이동">← 이전 대사</button>
              <button type="button" disabled={!canNavigateNext} onClick={() => onNavigateVoice(1)} aria-label="다음 대사로 이동">다음 대사 →</button>
              <small>Alt+↑ / Alt+↓</small>
            </div>
            <textarea
              ref={quickEditorRef}
              value={quickDraft}
              onChange={(event) => onDraftChange(event.target.value)}
              onBlur={onSave}
              onKeyDown={(event) => {
                if (event.altKey && event.key === 'ArrowUp' && canNavigatePrevious) {
                  event.preventDefault()
                  onNavigateVoice(-1)
                  return
                }
                if (event.altKey && event.key === 'ArrowDown' && canNavigateNext) {
                  event.preventDefault()
                  onNavigateVoice(1)
                  return
                }
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  if (onSave() && !voiceUnavailable) onRegenerate()
                }
              }}
              maxLength={2_000}
              aria-label="선택 대사 빠른 수정"
              placeholder="선택한 대사를 바로 수정하세요."
            />
          </div>

          {recovery?.unavailable ? (
            <div className="soa-timeline-voice-recovery" role="status" aria-label="사용 불가 목소리 복구">
              <div>
                <strong>사용 불가 목소리 · {recovery.choiceName}</strong>
                <span>{recovery.missingProfile ? '저장된 MY VOICE 프로필을 찾지 못했습니다.' : 'MY VOICE 프로필은 있지만 현재 생성 엔진에서 사용할 수 없습니다.'}</span>
                <small>
                  {existingAudioPreserved
                    ? '현재 완성 음원은 그대로 유지됩니다. 아래 교체를 적용하기 전까지 재생할 수 있습니다.'
                    : '대체 목소리를 지정해야 이 대사를 다시 생성할 수 있습니다.'}
                </small>
                {existingAudioPreserved ? <small className="is-warning">교체를 적용하면 기존 완성 음원은 제거되고 새 목소리 기준으로 전환됩니다.</small> : null}
              </div>
              <label>
                <span>대체 목소리</span>
                <select
                  aria-label="사용 불가 목소리 대체 선택"
                  value={recovery.replacementVoiceId}
                  disabled={recovery.running || recovery.replacementChoices.length === 0}
                  onChange={(event) => onRecoveryVoiceChange(event.target.value)}
                >
                  {recovery.replacementChoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>{voice.kind === 'my-voice' ? `MY · ${voice.name}` : voice.name}</option>
                  ))}
                </select>
              </label>
              <div>
                <button type="button" disabled={recovery.running || !recovery.replacementVoiceId} onClick={() => onRecoverVoice(false)}>교체만 적용</button>
                <button type="button" className="is-primary" disabled={recovery.running || !recovery.replacementVoiceId} onClick={() => onRecoverVoice(true)}>
                  {recovery.running ? '복구 중…' : '교체 후 재생성'}
                </button>
              </div>
            </div>
          ) : null}

          <div className="soa-timeline-quick-editor__actions">
            <button
              type="button"
              className="is-primary"
              onClick={onPreviewOrGenerate}
              disabled={selectedVoiceBlock.status === 'generating' || !quickDraftTrimmed || (voiceUnavailable && !existingAudioPreserved)}
            >
              {selectedVoiceBlock.status === 'ready' && selectedVoiceBlock.trackId
                ? playbackActive ? '일시정지' : '미리듣기'
                : voiceUnavailable ? '목소리 복구 필요'
                  : selectedVoiceBlock.status === 'generating' ? '생성 중…' : '음성 생성'}
            </button>
            <button type="button" onClick={onSave} disabled={!quickDraftDirty}>저장</button>
            <button type="button" onClick={onRegenerate} disabled={voiceUnavailable || selectedVoiceBlock.status === 'generating' || !quickDraftTrimmed}>재생성</button>
            <button type="button" onClick={onSplit}>나누기</button>
            <button type="button" className="is-danger" onClick={onRemove}>삭제</button>
          </div>
        </>
      ) : (
        <div className="soa-timeline-quick-editor__actions is-pause">
          <button type="button" disabled={!canMovePausePrevious} onClick={() => onMovePause(-1)}>앞으로</button>
          <button type="button" disabled={!canMovePauseNext} onClick={() => onMovePause(1)}>뒤로</button>
          <button type="button" className="is-danger" onClick={onRemove}>쉼 삭제</button>
        </div>
      )}
    </section>
  )
}
