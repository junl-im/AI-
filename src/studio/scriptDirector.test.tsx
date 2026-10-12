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
  it('keeps blank drafts quiet and flags long sentences', () => {
    expect(analyzeScriptForStudio('  ')).toMatchObject({ recommendation: null, notes: [] })
    expect(analyzeScriptForStudio('긴 문장입니다 '.repeat(25)).notes[0]).toContain('긴 문장 1개')
  })
})
