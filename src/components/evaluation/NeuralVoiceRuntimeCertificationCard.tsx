import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  buildNeuralVoiceRuntimeBundle,
  clearNeuralVoiceRuntimeRecords,
  importNeuralVoiceRuntimeRecords,
  listNeuralVoiceRuntimeRecords,
  type NeuralVoiceRuntimeRecord,
} from '../../quality/neuralVoiceRuntimeCertification'
import { voicePresets } from '../../tts/voicePresets'
import { StatusPill } from '../ui/StatusPill'

function shortHash(value: string | null | undefined) {
  return value ? `${value.slice(0, 10)}…${value.slice(-6)}` : '-'
}

function downloadBundle(records: NeuralVoiceRuntimeRecord[]) {
  const payload = { ...buildNeuralVoiceRuntimeBundle(), records }
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'sorion-neural-voice-runtime-certification.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function NeuralVoiceRuntimeCertificationCard() {
  const [records, setRecords] = useState(() => listNeuralVoiceRuntimeRecords())
  const [notice, setNotice] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement | null>(null)

  const rows = useMemo(() => voicePresets.map((preset) => {
    const completed = records.filter((record) => (
      record.voiceId === preset.id && Boolean(record.playbackCompletedAt)
    ))
    const desktop = completed.find((record) => record.surface === 'desktop-browser') ?? null
    const mobile = completed.find((record) => record.surface === 'mobile-browser') ?? null
    const shared = Boolean(
      desktop
      && mobile
      && desktop.cacheId === mobile.cacheId
      && desktop.audioSha256 === mobile.audioSha256
      && desktop.modelFingerprint === mobile.modelFingerprint
      && desktop.referenceFingerprint === mobile.referenceFingerprint
    )
    return { preset, desktop, mobile, shared }
  }), [records])
  const sharedCount = rows.filter((row) => row.shared).length

  async function importBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const next = importNeuralVoiceRuntimeRecords(JSON.parse(await file.text()))
      setRecords([...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
      setNotice('observed-runtime evidence를 병합했습니다. synthetic evidence는 가져오지 않습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'runtime evidence를 가져오지 못했습니다.')
    }
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">NEURAL RUNTIME CERTIFICATION</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">PC·모바일 동일 neural preview 인증</h2>
        </div>
        <StatusPill
          label={`${sharedCount}/5 SHARED READY`}
          tone={sharedCount === voicePresets.length ? 'good' : 'warning'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        실제 재생 완료 이벤트만 observed-runtime으로 기록합니다. 같은 성우에서 PC와 모바일의 cache ID·audio SHA·model/reference fingerprint가 모두 같을 때만 SHARED READY입니다.
      </p>

      <div className="mt-4 grid gap-2">
        {rows.map(({ preset, desktop, mobile, shared }) => (
          <article key={preset.id} className="rounded-2xl border border-soa-line bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-black">{preset.name} <span className="font-mono text-[10px] text-soa-muted">{preset.id}</span></div>
                <div className="mt-1 text-[10px] font-bold text-soa-muted">
                  audio {shortHash(desktop?.audioSha256 ?? mobile?.audioSha256)} · model {shortHash(desktop?.modelFingerprint ?? mobile?.modelFingerprint)}
                </div>
              </div>
              <StatusPill label={shared ? 'SHARED READY' : 'PENDING'} tone={shared ? 'good' : 'warning'} />
            </div>
            <div className="mt-2 grid gap-1 text-[11px] font-semibold text-soa-muted sm:grid-cols-2">
              <div>PC · {desktop?.playbackCompletedAt ? '재생 완료' : '미수집'} {desktop ? `· ${desktop.cacheHit ? 'cache hit' : 'cache create'}` : ''}</div>
              <div>모바일 · {mobile?.playbackCompletedAt ? '재생 완료' : '미수집'} {mobile ? `· ${mobile.cacheHit ? 'cache hit' : 'cache create'}` : ''}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="soa-secondary-button" onClick={() => setRecords(listNeuralVoiceRuntimeRecords())}>새로고침</button>
        <button type="button" className="soa-secondary-button" onClick={() => downloadBundle(records)}>증거 JSON 내보내기</button>
        <button type="button" className="soa-secondary-button" onClick={() => importRef.current?.click()}>다른 기기 JSON 가져오기</button>
        <button type="button" className="soa-secondary-button" onClick={() => { clearNeuralVoiceRuntimeRecords(); setRecords([]); setNotice('로컬 runtime evidence를 초기화했습니다.') }}>초기화</button>
        <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void importBundle(event)} />
      </div>
      {notice ? <p className="mt-2 text-xs font-bold text-soa-muted">{notice}</p> : null}
    </section>
  )
}
