import { describe, expect, it } from 'vitest'
import { summarizeVoiceListeningQa, voiceListeningScenarios, type VoiceListeningQaEntry } from './voiceListeningQa'

function entry(voiceId: string, scenarioId: VoiceListeningQaEntry['scenarioId'], score = 4): VoiceListeningQaEntry {
  return {
    id: `${voiceId}:${scenarioId}`,
    schemaVersion: 'sorion.voice-listening-qa.v1',
    voiceId,
    scenarioId,
    scores: { softness: score, naturalPace: score, distinctiveness: score, articulation: score, breathing: score, lowFatigue: score },
    note: '',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  }
}

describe('voice listening QA', () => {
  it('does not certify a high average when one scenario has unnatural pace', () => {
    const entries = voiceListeningScenarios.map((scenario) => entry('sori-warm', scenario.id, 5))
    entries[0].scores.naturalPace = 3
    expect(summarizeVoiceListeningQa(entries)[0].ready).toBe(false)
  })
  it('uses the latest rating once per valid scenario and ignores unknown scenarios', () => {
    const entries = voiceListeningScenarios.map((scenario) => entry('sori-warm', scenario.id, 4))
    const latest = { ...entry('sori-warm', 'longform', 2), updatedAt: '2026-10-12T00:00:00Z' }
    entries.push(latest, { ...entry('sori-warm', 'conversation', 5), scenarioId: 'unknown' as never })
    const summary = summarizeVoiceListeningQa(entries)[0]
    expect(summary.scenarioCount).toBe(5)
    expect(summary.longformFatigueScore).toBe(2)
    expect(summary.ready).toBe(false)
  })

  it('requires all five scenarios and healthy longform fatigue', () => {
    const entries = voiceListeningScenarios.map((scenario) => entry('sori-warm', scenario.id, 4))
    const summary = summarizeVoiceListeningQa(entries).find((item) => item.voiceId === 'sori-warm')!
    expect(summary.ready).toBe(true)
    expect(summary.scenarioCount).toBe(5)
  })

  it('fails when one dimension falls below three', () => {
    const entries = voiceListeningScenarios.map((scenario) => entry('sori-warm', scenario.id, 4))
    entries[0].scores.naturalPace = 2
    const summary = summarizeVoiceListeningQa(entries).find((item) => item.voiceId === 'sori-warm')!
    expect(summary.ready).toBe(false)
    expect(summary.issues).toContain('2점 이하 품질 항목 존재')
  })
})
