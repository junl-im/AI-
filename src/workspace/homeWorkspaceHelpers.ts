import type { TtsSynthesisRequest } from '../ai/contracts'
import { buildAudioFilename } from '../tts/audioFile'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechPlayback,
} from '../tts/browserSpeech'
import type { GeneratedAudio } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import type { synthesizeSpeech } from '../tts/voiceApi'
import { isMyVoiceId } from '../voiceclone/voiceIdentity'

export function generatedWorkspacePreview(
  result: Awaited<ReturnType<typeof synthesizeSpeech>>,
  request: TtsSynthesisRequest,
  voiceName: string,
): GeneratedAudio {
  if (result.audioUrl) {
    return {
      url: result.audioUrl,
      filename: buildAudioFilename(request.text, voiceName, 'wav'),
      source: 'api',
      durationSeconds: result.estimatedDurationSeconds,
      ...(isMyVoiceId(request.voiceId) ? {} : { rehydration: { kind: 'tts-final' as const, jobId: result.jobId } }),
      result,
    }
  }
  if (result.engineId === BROWSER_SPEECH_ENGINE_ID) {
    return {
      url: null,
      filename: buildAudioFilename(request.text, voiceName, 'wav'),
      source: 'browser-speech',
      durationSeconds: result.estimatedDurationSeconds,
      browserSpeech: createBrowserSpeechPlayback(request),
      result,
    }
  }
  const blob = createMockWave(request.text, request.voiceId)
  return {
    url: URL.createObjectURL(blob),
    filename: buildAudioFilename(request.text, voiceName, 'wav'),
    source: 'browser-demo',
    durationSeconds: getMockWaveDuration(request.text),
    revokeOnRemove: true,
    result: {
      ...result,
      message: '샘플 미리듣기입니다. 실제 AI 음성이 아닙니다.',
      fileSizeBytes: blob.size,
    },
  }
}

export function formatWorkspaceSavedLabel(
  savedAt: string | null,
  hydrated: boolean,
  memoryOnly: boolean,
): string {
  if (!hydrated) return '작업공간 불러오는 중'
  if (!savedAt) return memoryOnly ? '이 탭에 임시 저장됨' : '자동 저장 준비됨'
  const date = new Date(savedAt)
  if (!Number.isFinite(date.getTime())) return '자동 저장됨'
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${time} ${memoryOnly ? '임시 저장됨' : '자동 저장됨'}`
}
