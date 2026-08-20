import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { BrandMasthead } from './BrandMasthead'

describe('BrandMasthead', () => {
  beforeEach(() => {
    useAppStore.setState({
      page: 'home',
      workspaceEntered: false,
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

  it('우측 상단은 기능 없이 SoriON 시그니처 그래픽만 보여준다', () => {
    render(<BrandMasthead />)

    const visual = screen.getByLabelText('SoriON 음성 브랜드 비주얼')
    expect(within(visual).getByText(/목소리에/)).toBeInTheDocument()
    expect(within(visual).getByText(/감정을 입히다/)).toBeInTheDocument()
    expect(within(visual).queryByRole('button')).not.toBeInTheDocument()
    expect(within(visual).queryByText('CURRENT VOICE')).not.toBeInTheDocument()
  })

  it('브랜드 영역을 누르면 첫 페이지 상태를 유지한다', () => {
    useAppStore.setState({ page: 'quality', workspaceEntered: true })
    render(<BrandMasthead />)

    fireEvent.click(screen.getByRole('button', { name: 'SoriON AI 첫 페이지' }))

    expect(useAppStore.getState().workspaceEntered).toBe(false)
    expect(useAppStore.getState().page).toBe('home')
  })
})
