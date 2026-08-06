import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getApiConnectionContext,
  normalizeApiBaseUrl,
  requestAutomaticApiReconnect,
  resetApiBaseUrl,
  saveApiBaseUrl,
} from '../api/httpClient'
import { detectInAppBrowser } from '../browser/inAppBrowser'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import type { ApiConnectivityReport } from '../settings/connectivityTypes'
import { getSetupStatus } from '../settings/setupApi'
import type { SetupStatus } from '../settings/setupTypes'

interface EngineDoctorDiagnostics {
  checkedAt: string
  browser: string
  inAppBrowser: string | null
  apiBaseUrl: string
  connectivity: {
    status: ApiConnectivityReport['status'] | null
    latencyMs: number | null
    publicHttpsReady: boolean | null
    publicApiOrigin: string | null
    layers: ApiConnectivityReport['layers'] | null
    checks: Array<{ id: string; status: string }>
  }
  setup: {
    ready: boolean | null
    realEngineCount: number | null
    voicePresetReadyCount: number | null
    voicePresetAudioReadyCount: number | null
    voicePresetManifestReadyCount: number | null
    voicePresetExpectedCount: number | null
    voicePresetDuplicateGroupCount: number | null
    voicePresets: Array<{
      voiceId: string
      status: string
      audioUsable: boolean
      manifestStatus: string
      consentStatus: string
      humanReviewStatus: string
      checksumMatches: boolean | null
      duplicateVoiceIds: string[]
      reviewChecksumMatches: boolean | null
      approvalId: string | null
      signatureMode: string
      signingKeyId: string | null
      signatureStatus: string
      consentDaysRemaining: number | null
      rightsDaysRemaining: number | null
    }>
    voiceSelections: Array<{
      engineId: string
      voiceId: string
      status: string
      selectedVoiceId: string | null
      selectedVoiceName: string | null
      selectedGender: string | null
      selectionBasis: string
    }>
    steps: Array<{ id: string; status: string; required: boolean }>
  }
}

export function useEngineDoctor() {
  const initialContext = useMemo(() => getApiConnectionContext(), [])
  const [baseUrl, setBaseUrl] = useState(initialContext.baseUrl)
  const [report, setReport] = useState<ApiConnectivityReport | null>(null)
  const [setup, setSetup] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const requestSequence = useRef(0)
  const inAppBrowser = useMemo(() => detectInAppBrowser(), [])
  const inAppBrowserLabel = inAppBrowser?.label ?? null

  const runCheckFor = useCallback(async (value: string) => {
    const requestId = requestSequence.current + 1
    requestSequence.current = requestId
    const normalized = normalizeApiBaseUrl(value)
    if (!normalized) {
      setMessage('연결 주소가 없습니다. PC에서는 START_ENGINE.cmd를 먼저 실행해 주세요.')
      setReport(null)
      setSetup(null)
      setLoading(false)
      return false
    }
    setLoading(true)
    setMessage(null)
    try {
      const [nextReport, nextSetup] = await Promise.all([
        runApiConnectivityAudit(normalized, { mode: 'deep' }),
        getSetupStatus(normalized),
      ])
      if (requestSequence.current !== requestId) return false
      setBaseUrl(normalized)
      setReport(nextReport)
      setSetup(nextSetup)
      setLastCheckedAt(new Date().toISOString())
      setMessage(nextReport.ttsReady
        ? `실제 음성 엔진을 확인했습니다. ${nextReport.latencyMs}ms`
        : 'API는 응답하지만 실제 음성 엔진 준비가 더 필요합니다.')
      return nextReport.apiReady && nextReport.ttsReady
    } catch (error) {
      if (requestSequence.current !== requestId) return false
      setReport(null)
      setSetup(null)
      setLastCheckedAt(new Date().toISOString())
      setMessage(error instanceof Error ? error.message : '엔진 진단에 실패했습니다.')
      return false
    } finally {
      if (requestSequence.current === requestId) setLoading(false)
    }
  }, [])

  const runCheck = useCallback(() => runCheckFor(baseUrl), [baseUrl, runCheckFor])

  const saveAndCheck = useCallback(async () => {
    try {
      const saved = saveApiBaseUrl(baseUrl)
      setBaseUrl(saved)
      return await runCheckFor(saved)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연결 주소를 저장하지 못했습니다.')
      return false
    }
  }, [baseUrl, runCheckFor])

  const restoreAutomatic = useCallback(() => {
    requestSequence.current += 1
    resetApiBaseUrl()
    requestAutomaticApiReconnect()
    const context = getApiConnectionContext()
    setBaseUrl(context.baseUrl)
    setReport(null)
    setSetup(null)
    setMessage('자동 연결을 다시 시작했습니다. 엔진 실행 후 다시 진단해 주세요.')
    setLoading(false)
  }, [])

  const copyDiagnostics = useCallback(async () => {
    const payload: EngineDoctorDiagnostics = {
      checkedAt: new Date().toISOString(),
      browser: typeof navigator === 'undefined' ? 'server' : navigator.userAgent,
      inAppBrowser: inAppBrowserLabel,
      apiBaseUrl: baseUrl,
      connectivity: {
        status: report?.status ?? null,
        latencyMs: report?.latencyMs ?? null,
        publicHttpsReady: report?.publicHttpsReady ?? null,
        publicApiOrigin: report?.publicApiOrigin ?? null,
        layers: report?.layers ?? null,
        checks: report?.checks.map(({ id, status }) => ({ id, status })) ?? [],
      },
      setup: {
        ready: setup?.ready ?? null,
        realEngineCount: setup?.realEngineCount ?? null,
        voicePresetReadyCount: setup?.voicePresetReadyCount ?? null,
        voicePresetAudioReadyCount: setup?.voicePresetAudioReadyCount ?? null,
        voicePresetManifestReadyCount: setup?.voicePresetManifestReadyCount ?? null,
        voicePresetExpectedCount: setup?.voicePresetExpectedCount ?? null,
        voicePresetDuplicateGroupCount: setup?.voicePresetDuplicateGroupCount ?? null,
        voicePresets: setup?.voicePresetDiagnostics.map((item) => ({
          voiceId: item.voiceId,
          status: item.status,
          audioUsable: item.audioUsable,
          manifestStatus: item.manifestStatus,
          consentStatus: item.consentStatus,
          humanReviewStatus: item.humanReviewStatus,
          checksumMatches: item.checksumMatches,
          duplicateVoiceIds: item.duplicateVoiceIds,
          reviewChecksumMatches: item.reviewChecksumMatches,
          approvalId: item.approvalId,
          signatureMode: item.signatureMode,
          signingKeyId: item.signingKeyId,
          signatureStatus: item.signatureStatus,
          consentDaysRemaining: item.consentDaysRemaining,
          rightsDaysRemaining: item.rightsDaysRemaining,
        })) ?? [],
        voiceSelections: setup?.voiceSelectionDiagnostics.map((item) => ({
          engineId: item.engineId,
          voiceId: item.voiceId,
          status: item.status,
          selectedVoiceId: item.selectedVoiceId,
          selectedVoiceName: item.selectedVoiceName,
          selectedGender: item.selectedGender,
          selectionBasis: item.selectionBasis,
        })) ?? [],
        steps: setup?.steps.map(({ id, status, required }) => ({ id, status, required })) ?? [],
      },
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setMessage('개인 음원과 로컬 경로를 제외한 진단 정보를 복사했습니다.')
      return true
    } catch {
      setMessage('진단 정보를 복사하지 못했습니다.')
      return false
    }
  }, [baseUrl, inAppBrowserLabel, report, setup])

  useEffect(() => {
    if (initialContext.baseUrl) void runCheckFor(initialContext.baseUrl)
  }, [initialContext.baseUrl, runCheckFor])

  useEffect(() => {
    const handleOnline = () => {
      const context = getApiConnectionContext()
      if (context.baseUrl) void runCheckFor(context.baseUrl)
    }
    window.addEventListener('online', handleOnline)
    return () => {
      requestSequence.current += 1
      window.removeEventListener('online', handleOnline)
    }
  }, [runCheckFor])

  return {
    baseUrl,
    setBaseUrl,
    report,
    setup,
    loading,
    message,
    lastCheckedAt,
    inAppBrowser,
    runCheck,
    saveAndCheck,
    restoreAutomatic,
    copyDiagnostics,
  }
}
