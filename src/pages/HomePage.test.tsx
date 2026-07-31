import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('renders the mobile voice creation path in Korean', () => {
    const view = render(<HomePage />)
    const screen = within(view.container)

    expect(screen.getByRole('heading', { name: /문장 하나면/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '읽을 문장' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '한국어 음성 프리셋' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '음성 생성 시작' })).toBeInTheDocument()
  })
})
