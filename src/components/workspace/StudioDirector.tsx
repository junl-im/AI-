import { useDeferredValue, useMemo } from 'react'
import { analyzeScriptForStudio } from '../../studio/scriptDirector'
import { voicePresets } from '../../tts/voicePresets'

interface Props { text: string; voiceId: string; onVoiceChange: (id: string) => void }
export function StudioDirector({ text, voiceId, onVoiceChange }: Props) {
  const deferred = useDeferredValue(text)
  const analysis = useMemo(() => analyzeScriptForStudio(deferred), [deferred])
  const recommendation = deferred.trim().length >= 20 ? analysis.recommendation : null
  const suggested = voicePresets.find((voice) => voice.id === recommendation?.voiceId)
  const selected = voicePresets.find((voice) => voice.id === voiceId)
  return (
    <section className="soa-director" aria-label="대본 도우미">
      <div className="soa-director__label"><span aria-hidden="true">✦</span><strong>대본 도우미</strong><small>현재 목소리와 추천을 구분해 보여드려요</small></div>
      {selected ? <p className="soa-director__identity"><b>현재 목소리 · {selected.name}</b><span>{selected.name}의 포인트 · </span>{selected.strengths[0]} · {selected.rhythmTags.join(' · ')}</p> : <p>내 목소리의 원래 음색과 말투를 우선합니다.</p>}
      {suggested && recommendation ? <div className="soa-director__suggestion"><p><b>{suggested.id === voiceId ? '대본과 현재 목소리 · ' : '다른 목소리 추천 · '}</b>{recommendation.reason}</p>{suggested.id !== voiceId ? <button type="button" onClick={() => onVoiceChange(suggested.id)}>{suggested.name} 선택</button> : <span>현재 목소리와 잘 맞아요</span>}</div> : <p>대본을 20자 이상 입력하면 어울리는 성우와 확인할 부분을 제안해요.</p>}
      {analysis.notes.length ? <ul>{analysis.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
    </section>
  )
}
