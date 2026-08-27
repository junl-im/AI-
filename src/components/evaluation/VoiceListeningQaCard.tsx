import { useMemo, useState } from 'react'
import { voicePresets } from '../../tts/voicePresets'
import {
  summarizeVoiceListeningQa,
  voiceListeningDimensionLabels,
  voiceListeningScenarios,
  type VoiceListeningDimension,
  type VoiceListeningScores,
} from '../../quality/voiceListeningQa'
import { exportVoiceListeningQa, listVoiceListeningQa, saveVoiceListeningQa } from '../../quality/voiceListeningQaRepository'
import { StatusPill } from '../ui/StatusPill'

const dimensions = Object.keys(voiceListeningDimensionLabels) as VoiceListeningDimension[]
const initialScores: VoiceListeningScores = {
  softness: 4,
  naturalPace: 4,
  distinctiveness: 4,
  articulation: 4,
  breathing: 4,
  lowFatigue: 4,
}

export function VoiceListeningQaCard() {
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [scenarioId, setScenarioId] = useState(voiceListeningScenarios[0].id)
  const [scores, setScores] = useState<VoiceListeningScores>(initialScores)
  const [note, setNote] = useState('')
  const [entries, setEntries] = useState(() => listVoiceListeningQa())
  const summaries = useMemo(() => summarizeVoiceListeningQa(entries), [entries])
  const scenario = voiceListeningScenarios.find((item) => item.id === scenarioId) ?? voiceListeningScenarios[0]
  const readyCount = summaries.filter((item) => item.ready).length

  function loadSelection(nextVoiceId: string, nextScenarioId: typeof scenarioId) {
    const existing = entries.find((item) => item.voiceId === nextVoiceId && item.scenarioId === nextScenarioId)
    setScores(existing?.scores ?? initialScores)
    setNote(existing?.note ?? '')
  }

  function save() {
    saveVoiceListeningQa({ voiceId, scenarioId, scores, note })
    setEntries(listVoiceListeningQa())
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">VOICE LISTENING QA</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">성우 청취 QA · 현실 속도·피로도 인증</h2>
        </div>
        <StatusPill label={`${readyCount}/5 LISTENING READY`} tone={readyCount === 5 ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        동일 성우를 일상·설명·장문·다큐·숏폼 5개 상황에서 따로 듣습니다. 평균만 높아도 통과하지 않으며, 장문 피로도 4점 이상과 모든 품질 항목 3점 이상이 필수입니다.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <label className="block text-xs font-black">성우
            <select value={voiceId} onChange={(event) => { const next = event.target.value; setVoiceId(next); loadSelection(next, scenarioId) }} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3">
              {voicePresets.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} · {voice.personaLabel}</option>)}
            </select>
          </label>
          <label className="block text-xs font-black">청취 상황
            <select value={scenarioId} onChange={(event) => { const next = event.target.value as typeof scenarioId; setScenarioId(next); loadSelection(voiceId, next) }} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3">
              {voiceListeningScenarios.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <div className="rounded-2xl bg-[#f7f5ef] p-3 text-[11px] font-bold leading-5 text-soa-muted">
            <strong className="text-xs text-soa-ink">고정 QA 문장</strong>
            <p className="mt-1">{scenario.sampleText}</p>
            <p className="mt-2 text-[10px]">{scenario.purpose}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {dimensions.map((dimension) => (
            <label key={dimension} className="rounded-2xl border border-soa-line bg-white p-3 text-xs font-black">
              <div className="flex items-center justify-between"><span>{voiceListeningDimensionLabels[dimension]}</span><strong>{scores[dimension]}/5</strong></div>
              <input type="range" min="1" max="5" step="1" value={scores[dimension]} onChange={(event) => setScores((current) => ({ ...current, [dimension]: Number(event.target.value) }))} className="mt-3 w-full" />
            </label>
          ))}
        </div>
      </div>

      <label className="mt-3 block text-xs font-black">청취 메모
        <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="mt-1 min-h-20 w-full rounded-xl border border-soa-line bg-white p-3" placeholder="예: 문장 끝이 조금 급함, 장문에서 숨이 짧게 느껴짐" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={save} className="min-h-10 rounded-xl bg-soa-lime px-4 text-xs font-black">현재 청취 평가 저장</button>
        <button type="button" onClick={() => exportVoiceListeningQa(entries)} disabled={!entries.length} className="min-h-10 rounded-xl border border-soa-line px-4 text-xs font-black disabled:opacity-40">QA JSON 내보내기</button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {summaries.map((summary) => (
          <article key={summary.voiceId} className="rounded-2xl border border-soa-line bg-white p-3">
            <div className="flex items-center justify-between gap-2"><strong className="text-sm">{summary.voiceName}</strong><StatusPill label={summary.ready ? 'READY' : `${summary.scenarioCount}/5`} tone={summary.ready ? 'good' : 'warning'} /></div>
            <p className="mt-2 text-[10px] font-bold text-soa-muted">평균 {summary.averageScore ? summary.averageScore.toFixed(2) : '-'} · 최저 {summary.minimumScore || '-'} · 장문피로 {summary.longformFatigueScore ?? '-'}</p>
            {summary.issues.slice(0, 2).map((issue) => <p key={issue} className="mt-1 text-[10px] font-bold text-amber-700">· {issue}</p>)}
          </article>
        ))}
      </div>
    </section>
  )
}
