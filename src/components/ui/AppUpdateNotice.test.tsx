import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { AppUpdateNotice } from './AppUpdateNotice'
import { AppUpdateStatusCard } from '../evaluation/AppUpdateStatusCard'
import { useAppUpdateStore } from '../../update/appUpdate'
import { currentBuildInfo } from '../../update/buildInfo'
beforeEach(() => useAppUpdateStore.setState({ status: 'error', dismissedBuildId: null, message: '현재 작업은 유지됩니다.', remote: { ...currentBuildInfo, buildId: 'new-build', appVersion: '999.0.0' } }))
it('exposes recovery in both the notice and settings after a failed apply', () => {
  render(<><AppUpdateNotice /><AppUpdateStatusCard /></>)
  expect(screen.getByRole('alert')).toHaveTextContent('현재 작업은 유지됩니다.')
  expect(screen.getByRole('button', { name: '다시 적용' })).toBeEnabled()
  expect(screen.getByRole('button', { name: '새 버전 적용' })).toBeEnabled()
})
it('does not advertise a new update when checking the current build failed', () => {
  useAppUpdateStore.setState({ remote: currentBuildInfo })
  render(<><AppUpdateNotice /><AppUpdateStatusCard /></>)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '새 버전 적용' })).toBeDisabled()
})
it('prevents another apply or dismiss while applying', () => {
  useAppUpdateStore.setState({ status: 'applying' })
  render(<AppUpdateNotice />)
  expect(screen.getByRole('button', { name: '적용 준비 중…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: '업데이트 알림 닫기' })).toBeDisabled()
})
