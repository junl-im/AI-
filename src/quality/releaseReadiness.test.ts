import { describe, expect, it } from 'vitest'
import {
  buildReleaseReadinessSummary,
  evaluateReleaseReadinessValue,
  type ReleaseReadinessKind,
  type ReleaseReadinessSlot,
} from './releaseReadiness'

const version = '0.11.29'
const sha = 'a'.repeat(64)

function webReport() {
  return {
    schemaVersion: 1,
    mode: 'run',
    appVersion: version,
    passed: true,
    reportSha256: sha,
    evidenceSha256: sha,
    source: { commitSha: 'b'.repeat(40), runId: '1234' },
    phases: [
      'lock-structure',
      'web-toolchain',
      'dependency-tree',
      'lint',
      'typecheck',
      'critical-regression',
      'test',
      'build',
    ].map((id) => ({ id, status: 'passed', exitCode: 0, logSha256: sha })),
  }
}

function field(surface: 'kakao-android' | 'kakao-ios') {
  return {
    schemaVersion: 'field-device-certification/1',
    evidenceClass: 'observed-device',
    synthetic: false,
    surface,
    inAppBrowserProvider: 'kakao',
    checks: {
      presetPreviewAttempted: true,
      presetPreviewStarted: surface === 'kakao-android',
      presetPreviewFailure: surface === 'kakao-ios' ? 'watchdog-timeout' : 'none',
      externalBrowserRequested: surface === 'kakao-ios',
      exitDialogOpened: true,
      exitStayClosed: true,
    },
    operatorConfirmed: true,
  }
}

function chromium(mode: 'desktop' | 'mobile') {
  return {
    schemaVersion: 'chromium-multi-scene/1',
    appVersion: version,
    mode,
    passed: true,
    scenes: ['workspace', 'voice-surface', 'recovery-impact'],
    recoveryFixture: { realWorkerClaimed: false },
    captures: Array.from({ length: 9 }, () => ({ passed: true, sha256: sha })),
  }
}

function myVoice() {
  return {
    schemaVersion: 'my-voice-recovery-runtime/1',
    evidenceClass: 'observed-runtime',
    synthetic: false,
    appVersion: version,
    consentVerified: true,
    profileFingerprint: sha,
    workerReady: true,
    modelReady: true,
    action: 'replace-and-regenerate',
    selectedCount: 3,
    unavailableCount: 2,
    changedCount: 2,
    historicalAudioRestored: false,
    outcome: 'completed',
    firstAudioMs: 850,
    audioDurationSeconds: 4.2,
    playbackCompleted: true,
  }
}

function slot(kind: ReleaseReadinessKind): ReleaseReadinessSlot {
  return {
    kind,
    label: kind,
    status: 'ready',
    detail: 'ready',
    sourceFile: `${kind}.json`,
    sourceSha256: sha,
    sourceAppVersion: version,
    sourceCommitSha: null,
    sourceRunId: null,
    loadedAt: '2026-08-19T00:00:00.000Z',
  }
}

describe('releaseReadiness', () => {
  it('Web quality는 현재 버전 8개 phase가 전부 PASS일 때만 ready다', () => {
    expect(evaluateReleaseReadinessValue(webReport(), 'web-quality', version).status).toBe('ready')
    expect(evaluateReleaseReadinessValue(webReport(), 'web-quality', '0.11.30').status).toBe('blocked')
  })

  it('카카오 direct와 fallback 관찰을 각각 실기기 ready로 인정한다', () => {
    expect(evaluateReleaseReadinessValue(field('kakao-android'), 'kakao-android', version).status).toBe('ready')
    expect(evaluateReleaseReadinessValue(field('kakao-ios'), 'kakao-ios', version).status).toBe('ready')
  })

  it('Chromium은 9개 scene PASS와 synthetic boundary가 필요하다', () => {
    expect(evaluateReleaseReadinessValue(chromium('desktop'), 'chromium-desktop', version).status).toBe('ready')
    const invalid = chromium('mobile')
    invalid.recoveryFixture.realWorkerClaimed = true
    expect(evaluateReleaseReadinessValue(invalid, 'chromium-mobile', version).status).toBe('blocked')
  })

  it('MY VOICE는 observed completed runtime만 ready다', () => {
    expect(evaluateReleaseReadinessValue(myVoice(), 'my-voice', version).status).toBe('ready')
    const failed = myVoice()
    failed.outcome = 'failed'
    expect(evaluateReleaseReadinessValue(failed, 'my-voice', version).status).toBe('blocked')
  })

  it('6개 증거가 모두 ready일 때만 overall certified다', () => {
    const slots: Partial<Record<ReleaseReadinessKind, ReleaseReadinessSlot>> = {
      'web-quality': slot('web-quality'),
      'kakao-android': slot('kakao-android'),
      'kakao-ios': slot('kakao-ios'),
      'chromium-desktop': slot('chromium-desktop'),
      'chromium-mobile': slot('chromium-mobile'),
      'my-voice': slot('my-voice'),
    }
    expect(buildReleaseReadinessSummary(slots, version).overall).toBe('certified')
    delete slots['my-voice']
    expect(buildReleaseReadinessSummary(slots, version).overall).toBe('pending')
  })
})
