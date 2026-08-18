import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildVoiceChoices } from '../../voice/voiceChoices'
import { DesktopVoiceDrawer } from './DesktopVoiceDrawer'

const voices = buildVoiceChoices([])

describe('DesktopVoiceDrawer', () => {
  it('라이브러리 재생 버튼은 다른 목소리를 먼저 선택한 뒤 미리듣는다', () => {
    const onVoiceChange = vi.fn()
    const onPreview = vi.fn()
    render(
      <DesktopVoiceDrawer
        voiceId="sori-warm"
        voiceChoices={voices}
        previewingId={null}
        activePreviewId={null}
        previewPlaying={false}
        speed={1}
        pitch={0}
        emotion="neutral"
        normalizeText
        onVoiceChange={onVoiceChange}
        onPreview={onPreview}
        onSpeedChange={vi.fn()}
        onPitchChange={vi.fn()}
        onEmotionChange={vi.fn()}
        onNormalizeTextChange={vi.fn()}
        onCreateVoice={vi.fn()}
        collapsed={false}
        onToggleCollapsed={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '보이스 라이브러리 도윤 목소리 미리듣기' }))

    expect(onVoiceChange).toHaveBeenCalledWith('on-clear')
    expect(onPreview).toHaveBeenCalledWith('on-clear')
  })
})
