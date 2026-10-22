import type { TimelineVoiceBlock } from '../workspace/workspaceTypes'
import { completeTransaction, LOCAL_AUDIO_STORE, openSoriOnDatabase } from './database'

export interface LocalAudioRecord {
  id: string
  signature: string
  wav: Blob
  durationSeconds: number
  styleId: string
  savedAt: string
}

type AudioIdentity = Pick<TimelineVoiceBlock, 'id' | 'revision' | 'text' | 'voiceId' | 'speed' | 'pitch' | 'emotion'>

export function localAudioSignature(block: AudioIdentity): string {
  return JSON.stringify([
    block.id, block.revision, block.text, block.voiceId, block.speed, block.pitch, block.emotion,
  ])
}

export async function saveLocalAudio(
  block: AudioIdentity,
  wav: Blob,
  durationSeconds: number,
  styleId: string,
): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(LOCAL_AUDIO_STORE, 'readwrite')
    transaction.objectStore(LOCAL_AUDIO_STORE).put({
      id: block.id,
      signature: localAudioSignature(block),
      wav,
      durationSeconds,
      styleId,
      savedAt: new Date().toISOString(),
    } satisfies LocalAudioRecord)
    await completeTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function loadLocalAudio(block: AudioIdentity): Promise<LocalAudioRecord | null> {
  const database = await openSoriOnDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(LOCAL_AUDIO_STORE, 'readonly')
        .objectStore(LOCAL_AUDIO_STORE).get(block.id)
      request.onsuccess = () => {
        const record = request.result as LocalAudioRecord | undefined
        resolve(record?.signature === localAudioSignature(block) ? record : null)
      }
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}
