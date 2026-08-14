import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { BrandMasthead } from './BrandMasthead'

describe('BrandMasthead', () => {
  beforeEach(() => {
    useAppStore.setState({
      page: 'home',
      workspaceEntered: false,
      liveVoice: {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        voiceKind: 'preset',
        engineId: 'cosyvoice3-worker',
        engineName: 'CosyVoice 3',
        readiness: 'ready',
        detail: '음성 생성 준비가 끝났습니다.',
      },
    })
  })

  it('공식 아이콘과 제품·제작자 이름을 보여준다', () => {
    const view = render(<BrandMasthead />)

    expect(screen.getByLabelText('곰같은여우 SoriON AI')).toHaveTextContent('SoriON AI')
    expect(screen.getAllByText('곰같은여우').length).toBeGreaterThan(0)
    const brandButton = screen.getByRole('button', { name: 'SoriON AI 첫 페이지' })
    expect(brandButton).toBeInTheDocument()
    expect(view.container.querySelector('img[src$="sorion-logo.png"]')).toBeInTheDocument()
  })

  it('현재 장문 중심 소개 문구를 순환한다', () => {
    render(<BrandMasthead />)

    const introduction = within(screen.getByLabelText('SoriON 소개 문장'))
    expect(introduction.getByText('장문 내용을 문장별 음성으로 빠르게.')).toBeInTheDocument()
    expect(introduction.getByText('한국어의 감정과 호흡을 더 자연스럽게.')).toBeInTheDocument()
    expect(introduction.getByText('생성부터 내 목소리와 편집까지 한 작업공간에서.')).toBeInTheDocument()
  })

  it('현재 선택된 목소리와 엔진 준비 상태를 라이브 바에 보여준다', () => {
    useAppStore.setState({
      liveVoice: {
        voiceId: 'myvoice:mine-1',
        voiceName: '내 메인 보이스',
        voiceKind: 'my-voice',
        engineId: 'cosyvoice3-worker',
        engineName: 'CosyVoice 3',
        readiness: 'generating',
        detail: '내 목소리로 생성 중입니다.',
      },
    })
    render(<BrandMasthead />)

    expect(screen.getByLabelText('현재 목소리 내 메인 보이스, CosyVoice 3, LIVE')).toBeInTheDocument()
    expect(screen.getByText('MY VOICE')).toBeInTheDocument()
    expect(screen.getByText('내 메인 보이스')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('라이브 바에서 텍스트 음성 작업공간으로 바로 들어간다', () => {
    render(<BrandMasthead />)

    fireEvent.click(screen.getByRole('button', { name: /텍스트를 음성으로/ }))

    expect(useAppStore.getState().workspaceEntered).toBe(true)
    expect(useAppStore.getState().page).toBe('home')
  })

  it('브랜드 영역을 누르면 첫 페이지 상태를 유지한다', () => {
    useAppStore.setState({ page: 'quality', workspaceEntered: true })
    render(<BrandMasthead />)

    fireEvent.click(screen.getByRole('button', { name: 'SoriON AI 첫 페이지' }))

    expect(useAppStore.getState().workspaceEntered).toBe(false)
    expect(useAppStore.getState().page).toBe('home')
  })
})
