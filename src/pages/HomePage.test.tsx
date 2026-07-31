import { fireEvent, render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('입력창과 한국어 발음 보정, 동적 생성 CTA를 바로 노출한다', () => {
    const view = render(<HomePage />)
    const screen = within(view.container)
    const textbox = screen.getByRole('textbox', { name: '읽을 문장' })

    expect(screen.getByRole('heading', { name: /문장 하나면/ })).toBeInTheDocument()
    expect(textbox).toHaveAttribute('maxlength', '500')
    expect(textbox).toHaveAttribute('placeholder', '바로 여기에 변환할 문장을 입력하세요.')
    expect(screen.getByText('0 / 500')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /숫자·날짜 자동 변환/ })).toBeChecked()
    expect(screen.getByRole('radiogroup', { name: '한국어 음성 프리셋' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '변환할 문장을 입력하세요' })).toBeDisabled()

    fireEvent.change(textbox, { target: { value: '안녕하세요.' } })

    expect(screen.getByText('6 / 500')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'WAV로 생성하기 (약 3초)' })).toBeEnabled()
  })
})
