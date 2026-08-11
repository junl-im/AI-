import { splitTextForUi } from '../tts/segmentText'
import type { VoicePreset } from '../tts/voicePresets'
import type { TimelineGenerationOptions } from './timelineBlocks'

export interface DetectedSpeakerLine {
  speaker: string
  text: string
}

export interface MultiSpeakerAnalysis {
  eligible: boolean
  speakers: string[]
  lines: DetectedSpeakerLine[]
  unmatchedLines: string[]
  sampleBySpeaker: Record<string, string>
}

export interface SpeakerVoiceAssignment {
  speaker: string
  voiceId: string
}

export interface SpeakerTimelineSegment {
  speaker: string
  text: string
  options: TimelineGenerationOptions
}

const SPEAKER_LINE_PATTERN = /^\s*([^:\n：]{1,40})\s*[:：]\s*(\S[\s\S]*)$/
const TIMECODE_PATTERN = /^\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s*(?:-->|→)/

function normalizeSpeakerName(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function analyzeMultiSpeakerScript(value: string): MultiSpeakerAnalysis {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const detected: DetectedSpeakerLine[] = []
  const unmatchedLines: string[] = []

  for (const line of lines) {
    const match = line.match(SPEAKER_LINE_PATTERN)
    if (!match || TIMECODE_PATTERN.test(line)) {
      unmatchedLines.push(line)
      continue
    }
    const speaker = normalizeSpeakerName(match[1])
    const text = match[2].trim()
    if (!speaker || !text || speaker.length > 40 || /^https?$/i.test(speaker) || /^\d+$/.test(speaker)) {
      unmatchedLines.push(line)
      continue
    }
    detected.push({ speaker, text })
  }

  const speakers = [...new Set(detected.map((line) => line.speaker))]
  const sampleBySpeaker = Object.fromEntries(speakers.map((speaker) => {
    const sample = detected.find((line) => line.speaker === speaker)?.text ?? ''
    return [speaker, splitTextForUi(sample)[0] ?? sample]
  }))
  return {
    eligible: speakers.length >= 2 && detected.length >= 2 && unmatchedLines.length === 0,
    speakers,
    lines: detected,
    unmatchedLines,
    sampleBySpeaker,
  }
}

export function suggestSpeakerVoiceAssignments(
  speakers: string[],
  defaultVoiceId: string,
  presets: VoicePreset[],
): SpeakerVoiceAssignment[] {
  if (!speakers.length || !presets.length) return []
  const defaultIndex = Math.max(0, presets.findIndex((preset) => preset.id === defaultVoiceId))
  return speakers.map((speaker, index) => ({
    speaker,
    voiceId: presets[(defaultIndex + index) % presets.length]?.id ?? defaultVoiceId,
  }))
}

export function buildMultiSpeakerTimelineSegments(
  analysis: MultiSpeakerAnalysis,
  assignments: SpeakerVoiceAssignment[],
  baseOptions: TimelineGenerationOptions,
  presets: VoicePreset[],
): SpeakerTimelineSegment[] {
  if (!analysis.eligible) return []
  const assignmentMap = new Map(assignments.map((item) => [item.speaker, item.voiceId]))
  const presetMap = new Map(presets.map((preset) => [preset.id, preset]))

  return analysis.lines.flatMap((line) => {
    const assignedVoiceId = assignmentMap.get(line.speaker)
    const voice = assignedVoiceId ? presetMap.get(assignedVoiceId) : undefined
    if (!voice) return []
    return splitTextForUi(line.text).map((text) => ({
      speaker: line.speaker,
      text,
      options: {
        ...baseOptions,
        voiceId: voice.id,
        voiceName: voice.name,
      },
    }))
  })
}
