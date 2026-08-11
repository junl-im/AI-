import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SpeakerVoiceAssignmentPanel } from './SpeakerVoiceAssignment'

describe('SpeakerVoiceAssignmentPanel', () => {
  it('자동 제안을 바로 적용하지 않고 사용자의 확인을 요구한다', () => {
    const onConfirm = vi.fn()
    const onAssignmentChange = vi.fn()
    render(
      <SpeakerVoiceAssignmentPanel
        speakers={['철수', '영희']}
        assignments={[
          { speaker: '철수', voiceId: 'sori-warm' },
          { speaker: '영희', voiceId: 'on-clear' },
        ]}
        confirmed={false}
        sampleBySpeaker={{ 철수: '안녕하세요.', 영희: '반가워요.' }}
        onAssignmentChange={onAssignmentChange}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: '영희 목소리' }), {
      target: { value: 'dam-calm' },
    })
    expect(onAssignmentChange).toHaveBeenCalledWith('영희', 'dam-calm')
    fireEvent.click(screen.getByRole('button', { name: '이 화자 배정으로 만들기' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
