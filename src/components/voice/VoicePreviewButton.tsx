interface VoicePreviewButtonProps {
  voiceId: string
  voiceName: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  onPreview: (voiceId: string) => void
  className?: string
}

export function VoicePreviewButton({
  voiceId,
  voiceName,
  previewingId,
  activePreviewId,
  previewPlaying,
  onPreview,
  className,
}: VoicePreviewButtonProps) {
  const loading = previewingId === voiceId
  const active = activePreviewId === voiceId
  const playing = active && previewPlaying
  const disabled = previewingId !== null && !loading
  const label = loading
    ? `${voiceName} 미리듣기 준비 취소`
    : playing
      ? `${voiceName} 미리듣기 일시정지`
      : active
        ? `${voiceName} 미리듣기 계속 재생`
        : `${voiceName} 목소리 미리듣기`

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={label}
      aria-busy={loading}
      aria-pressed={playing}
      data-preview-state={loading ? 'loading' : playing ? 'playing' : active ? 'paused' : 'idle'}
      onClick={() => onPreview(voiceId)}
    >
      {loading ? '■' : playing ? 'Ⅱ' : '▶'}
    </button>
  )
}
