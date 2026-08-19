import { useMemo, useState, type ChangeEvent } from 'react'
import {
  buildReleaseReadinessSummary,
  downloadReleaseReadinessSummary,
  inspectReleaseReadinessFile,
  type ReleaseReadinessKind,
  type ReleaseReadinessSlot,
  type ReleaseReadinessSlotStatus,
} from '../../quality/releaseReadiness'
import { currentBuildInfo } from '../../update/buildInfo'
import { StatusPill } from '../ui/StatusPill'

interface SlotDefinition {
  kind: ReleaseReadinessKind
  title: string
  hint: string
}

const slotDefinitions: SlotDefinition[] = [
  {
    kind: 'web-quality',
    title: 'GitHub Actions',
    hint: '.sorion/web-quality/report.json',
  },
  {
    kind: 'kakao-android',
    title: 'Kakao Android',
    hint: 'field-device-certification/1',
  },
  {
    kind: 'kakao-ios',
    title: 'Kakao iOS',
    hint: 'field-device-certification/1',
  },
  {
    kind: 'chromium-desktop',
    title: 'Chromium Desktop',
    hint: 'multi-scene desktop manifest',
  },
  {
    kind: 'chromium-mobile',
    title: 'Chromium Mobile',
    hint: 'multi-scene mobile manifest',
  },
  {
    kind: 'my-voice',
    title: 'MY VOICE Runtime',
    hint: 'observed-runtime evidence',
  },
]

function statusTone(status: ReleaseReadinessSlotStatus | 'certified') {
  if (status === 'ready' || status === 'certified') return 'good' as const
  if (status === 'blocked') return 'danger' as const
  return 'warning' as const
}

function statusLabel(status: ReleaseReadinessSlotStatus) {
  if (status === 'ready') return 'READY'
  if (status === 'blocked') return 'BLOCKED'
  return 'PENDING'
}

export function ReleaseReadinessCard() {
  const [slots, setSlots] = useState<Partial<Record<ReleaseReadinessKind, ReleaseReadinessSlot>>>({})
  const [messages, setMessages] = useState<Partial<Record<ReleaseReadinessKind, string>>>({})
  const [busyKind, setBusyKind] = useState<ReleaseReadinessKind | null>(null)
  const summary = useMemo(
    () => buildReleaseReadinessSummary(slots, currentBuildInfo.appVersion),
    [slots],
  )

  async function handleFile(kind: ReleaseReadinessKind, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusyKind(kind)
    setMessages((current) => ({ ...current, [kind]: undefined }))
    try {
      const slot = await inspectReleaseReadinessFile(file, kind, currentBuildInfo.appVersion)
      setSlots((current) => ({ ...current, [kind]: slot }))
    } catch (caught) {
      setSlots((current) => {
        const next = { ...current }
        delete next[kind]
        return next
      })
      setMessages((current) => ({
        ...current,
        [kind]: caught instanceof Error ? caught.message : '인증 증거를 읽지 못했습니다.',
      }))
    } finally {
      setBusyKind(null)
    }
  }

  function reset() {
    setSlots({})
    setMessages({})
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">RELEASE READINESS</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">출시 인증 상태</h2>
        </div>
        <StatusPill
          label={summary.overall === 'certified' ? 'CERTIFIED' : 'PENDING'}
          tone={summary.overall === 'certified' ? 'good' : 'warning'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        실제 증거 JSON의 schema·버전·checksum 필드를 검사합니다. 일부 항목만 READY여도 전체를 성공으로 합치지 않습니다.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-black sm:grid-cols-4">
        <StatusPill label={`CI ${statusLabel(summary.groups.githubActions)}`} tone={statusTone(summary.groups.githubActions)} />
        <StatusPill label={`DEVICE ${statusLabel(summary.groups.fieldDevices)}`} tone={statusTone(summary.groups.fieldDevices)} />
        <StatusPill label={`CHROMIUM ${statusLabel(summary.groups.chromium)}`} tone={statusTone(summary.groups.chromium)} />
        <StatusPill label={`MY VOICE ${statusLabel(summary.groups.myVoice)}`} tone={statusTone(summary.groups.myVoice)} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {slotDefinitions.map((definition) => {
          const slot = slots[definition.kind]
          const message = messages[definition.kind]
          const status = slot?.status ?? 'pending'
          return (
            <div key={definition.kind} className="rounded-2xl border border-soa-line bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="block text-xs">{definition.title}</strong>
                  <span className="mt-0.5 block text-[9px] font-bold text-soa-muted">{definition.hint}</span>
                </div>
                <StatusPill label={statusLabel(status)} tone={statusTone(status)} />
              </div>
              {slot ? (
                <div className="mt-2 text-[9px] font-semibold leading-4 text-soa-muted">
                  <p>{slot.detail}</p>
                  <p className="mt-1 font-mono">SHA {slot.sourceSha256.slice(0, 16)}…</p>
                  {slot.sourceRunId ? <p>Run {slot.sourceRunId}</p> : null}
                </div>
              ) : null}
              {message ? (
                <p className="mt-2 rounded-xl bg-rose-50 p-2 text-[9px] font-bold leading-4 text-rose-700">{message}</p>
              ) : null}
              <label className="focus-ring mt-3 flex min-h-9 cursor-pointer items-center justify-center rounded-xl border border-soa-line bg-[#f8f7f3] text-[10px] font-black">
                {busyKind === definition.kind ? '검증 중…' : slot ? '다시 선택' : 'JSON 선택'}
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={busyKind !== null}
                  onChange={(event) => void handleFile(definition.kind, event)}
                  className="sr-only"
                />
              </label>
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-[#f4f2ec] p-3 text-[10px] font-bold leading-5 text-soa-muted">
        현재 앱 v{currentBuildInfo.appVersion} · 필수 증거 {6 - summary.missing.length}/6 ·
        raw MY VOICE sample/profile ID는 readiness manifest에 포함하지 않습니다.
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={reset}
          className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black"
        >
          상태 초기화
        </button>
        <button
          type="button"
          onClick={() => downloadReleaseReadinessSummary(summary)}
          disabled={Object.keys(slots).length === 0}
          className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white disabled:opacity-40"
        >
          readiness JSON 저장
        </button>
      </div>
    </section>
  )
}
