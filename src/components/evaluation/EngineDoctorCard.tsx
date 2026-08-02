import type { ChangeEvent } from 'react'
import type { ConnectionLayer, ConnectivityStatus } from '../../settings/connectivityTypes'
import type { SetupStepStatus } from '../../settings/setupTypes'
import { useEngineDoctor } from '../../hooks/useEngineDoctor'
import { StatusPill } from '../ui/StatusPill'

const layerLabels = {
  api: 'Voice API',
  tts: '실제 TTS',
  worker: 'CosyVoice Worker',
  gpu: '가속 장치',
} as const

function toneForStatus(status: ConnectivityStatus | SetupStepStatus | ConnectionLayer['state']) {
  if (status === 'ready') return 'good' as const
  if (status === 'warning' || status === 'checking') return 'warning' as const
  return 'neutral' as const
}

function labelForStatus(status: ConnectivityStatus | SetupStepStatus | ConnectionLayer['state']) {
  const labels: Record<string, string> = {
    ready: '준비됨',
    warning: '확인 필요',
    missing: '없음',
    offline: '연결 안 됨',
    checking: '확인 중',
    unknown: '미확인',
  }
  return labels[status] ?? status
}

export function EngineDoctorCard() {
  const doctor = useEngineDoctor()
  const presetReady = doctor.setup?.voicePresetReadyCount ?? 0
  const presetExpected = doctor.setup?.voicePresetExpectedCount ?? 3
  const overallStatus = doctor.report?.status ?? (doctor.loading ? 'warning' : 'missing')

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-soa-muted">ENGINE DOCTOR</p>
          <h2 className="mt-1 font-black tracking-[-0.035em]">엔진 연결 진단</h2>
        </div>
        <StatusPill
          label={doctor.loading ? '진단 중' : labelForStatus(overallStatus)}
          tone={toneForStatus(overallStatus)}
        />
      </div>

      {doctor.inAppBrowser ? (
        <p className="mt-4 rounded-2xl bg-[#fff0c9] p-3 text-xs font-bold leading-5 text-[#77590d]">
          {doctor.inAppBrowser.label}에서는 휴대폰의 localhost가 PC 엔진을 가리키지 않습니다.
          실제 엔진은 외부 브라우저 또는 공개 HTTPS API에서 연결하세요.
        </p>
      ) : null}

      <label className="mt-4 block text-xs font-black text-soa-muted" htmlFor="engine-api-url">
        음성 시스템 주소
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="engine-api-url"
          type="url"
          value={doctor.baseUrl}
          onChange={(event: ChangeEvent<HTMLInputElement>) => doctor.setBaseUrl(event.target.value)}
          placeholder="http://127.0.0.1:8000/api/v1"
          className="focus-ring min-h-12 min-w-0 flex-1 rounded-2xl border border-soa-line bg-white px-4 text-sm"
        />
        <button
          type="button"
          disabled={doctor.loading}
          onClick={() => void doctor.saveAndCheck()}
          className="focus-ring min-h-12 rounded-2xl bg-soa-ink px-5 text-sm font-black text-white disabled:opacity-50"
        >
          저장·진단
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={doctor.loading}
          onClick={() => void doctor.runCheck()}
          className="focus-ring min-h-10 rounded-xl border border-soa-line bg-white px-4 text-xs font-black disabled:opacity-50"
        >
          지금 다시 확인
        </button>
        <button
          type="button"
          onClick={doctor.restoreAutomatic}
          className="focus-ring min-h-10 rounded-xl border border-soa-line bg-white px-4 text-xs font-black"
        >
          자동 연결 복구
        </button>
        <button
          type="button"
          onClick={() => void doctor.copyDiagnostics()}
          className="focus-ring min-h-10 rounded-xl border border-soa-line bg-white px-4 text-xs font-black"
        >
          진단 정보 복사
        </button>
      </div>

      {doctor.message ? (
        <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-soa-muted">
          {doctor.message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(layerLabels).map(([key, label]) => {
          const layer = doctor.report?.layers[key as keyof typeof layerLabels]
          const state = layer?.state ?? 'unknown'
          return (
            <div key={key} className="rounded-2xl border border-soa-line bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs">{label}</strong>
                <StatusPill label={labelForStatus(state)} tone={toneForStatus(state)} />
              </div>
              <p className="mt-2 text-xs leading-5 text-soa-muted">
                {layer?.detail ?? '진단을 실행하면 상태를 확인합니다.'}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-soa-line bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <strong className="text-sm">CosyVoice 프리셋 음색</strong>
            <p className="mt-1 text-xs text-soa-muted">
              voice-presets 폴더의 동의받은 WAV 준비 상태
            </p>
          </div>
          <StatusPill
            label={`${presetReady}/${presetExpected}`}
            tone={presetReady === presetExpected ? 'good' : 'warning'}
          />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ece9e1]">
          <div
            className="h-full rounded-full bg-soa-ink transition-[width]"
            style={{ width: `${Math.min(100, (presetReady / Math.max(1, presetExpected)) * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-soa-muted">
          {doctor.setup?.steps.find((step) => step.id === 'voice-presets')?.detail
            ?? 'START_ENGINE.cmd 실행 후 프리셋 폴더 연결 상태를 확인합니다.'}
        </p>
      </div>

      {doctor.setup ? (
        <div className="mt-4 space-y-2">
          {doctor.setup.steps.map((step) => (
            <details key={step.id} className="rounded-2xl border border-soa-line bg-white px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black">
                <span>{step.label}</span>
                <StatusPill label={labelForStatus(step.status)} tone={toneForStatus(step.status)} />
              </summary>
              <p className="mt-2 text-xs leading-5 text-soa-muted">{step.detail}</p>
              {step.action ? <p className="mt-2 text-xs font-bold leading-5">조치: {step.action}</p> : null}
            </details>
          ))}
        </div>
      ) : null}
    </article>
  )
}
