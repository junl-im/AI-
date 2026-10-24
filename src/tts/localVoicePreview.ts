import type { GeneratedAudio } from './generationTypes'
import { buildAudioFilename } from './audioFile'
import { synthesizeSupertonicWav } from './supertonicWav'
import { createRandomId } from '../utils/randomId'

export async function synthesizeByeolPreview(
  text: string,
  speed: number,
  signal: AbortSignal,
  onProgress: (message: string) => void,
): Promise<GeneratedAudio> {
  const generated = await synthesizeSupertonicWav({
    text, voiceId: 'byeol-oracle', voiceName: '별하', speed,
  }, signal, onProgress)
  const url = URL.createObjectURL(generated.blob)
  return {
    url,
    filename: buildAudioFilename(text, '별하', 'wav'),
    source: 'browser-model',
    durationSeconds: generated.durationSeconds,
    revokeOnRemove: true,
    result: {
      jobId: `preview-${createRandomId()}`,
      status: 'completed',
      engineId: 'supertonic-local',
      engineMode: 'browser',
      audioUrl: url,
      estimatedDurationSeconds: generated.durationSeconds,
      message: '별하 F1 음색의 실제 WAV 미리듣기입니다.',
      normalizedText: text,
      segmentCount: 1,
      processingMs: null,
      fileSizeBytes: generated.blob.size,
      realtimeFactor: null,
    },
  }
}
