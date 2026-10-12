import { useDeferredValue, useMemo } from 'react'
import { analyzeScriptForStudio } from '../../studio/scriptDirector'
import { voicePresets } from '../../tts/voicePresets'

interface Props { text: string; voiceId: string; onVoiceChange: (id: string) => void }
export function StudioDirector({ text, voiceId, onVoiceChange }: Props) {
  const deferred = useDeferredValue(text)
  const analysis = useMemo(() => analyzeScriptForStudio(deferred), [deferred])
  const recommendation = analysis.recommendation
  const suggested = voicePresets.find((voice) => voice.id === recommendation?.voiceId)
  const selected = voicePresets.find((voice) => voice.id === voiceId)
  return (
    <section className="soa-director" aria-label="대본 도우미">
      <div className="soa-director__label"><span aria-hidden="true">✦</span><strong>대본 도우미</strong><small>대본 특성에 따른 제안</small></div>
      {selected ? <p className="soa-director__identity"><b>{selected.name}의 포인트</b>{selected.strengths[0]} · {selected.rhythmTags.join(' · ')}</p> : <p>내 목소리의 원래 음색과 말투를 우선합니다.</p>}
      {suggested && recommendation ? <div className="soa-director__suggestion"><p>{recommendation.reason}</p>{suggested.id !== voiceId ? <button type="button" onClick={() => onVoiceChange(suggested.id)}>{suggested.name} 선택</button> : <span>현재 목소리와 잘 맞아요</span>}</div> : <p>대본을 넣으면 어울리는 성우와 먼저 확인할 부분을 제안해요.</p>}
      {analysis.notes.length ? <ul>{analysis.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
    </section>
  )
}
