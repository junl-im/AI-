import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StudioDirector } from '../components/workspace/StudioDirector'
import { analyzeScriptForStudio } from './scriptDirector'

describe('script direction', () => {
  it('suggests without changing a voice until explicitly selected', () => {
    const select = vi.fn()
    render(<StudioDirector text="설정 방법은 3단계입니다. API 연결을 확인하세요." voiceId="sori-warm" onVoiceChange={select} />)
    expect(select).not.toHaveBeenCalled()
    expect(screen.getByText(/숫자·영문·괄호가 있어요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '도윤 선택' }))
    expect(select).toHaveBeenCalledWith('on-clear')
  })
  it('현재 성우와 다른 추천을 분명히 구분하고 짧은 초안에는 추천을 띄우지 않는다', () => {
    const { rerender } = render(<StudioDirector text="안녕" voiceId="jun-deep" onVoiceChange={vi.fn()} />)
    expect(screen.getByText('현재 목소리 · 준호')).toBeInTheDocument()
    expect(screen.queryByText(/혜린 · 따뜻한 대화/)).not.toBeInTheDocument()
    rerender(<StudioDirector text="오늘 여러분과 함께 재미있는 이야기를 소개해 드리겠습니다." voiceId="jun-deep" onVoiceChange={vi.fn()} />)
    expect(screen.getByText(/다른 목소리 추천/)).toBeInTheDocument()
    expect(screen.getByText('현재 목소리 · 준호')).toBeInTheDocument()
  })
  it('keeps blank drafts quiet and flags long sentences', () => {
    expect(analyzeScriptForStudio('  ')).toMatchObject({ recommendation: null, notes: [] })
    expect(analyzeScriptForStudio('긴 문장입니다 '.repeat(25)).notes[0]).toContain('긴 문장 1개')
  })
})
