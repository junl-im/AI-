import { completeTransaction, openSoriOnDatabase, RECORDED_AUDIO_STORE } from './database'

const RECORD_ID = 'latest-default-voice-recording'

interface RecordedAudioRecord {
  id: typeof RECORD_ID
  signature: string
  wav: Blob
  mp3: Blob
  savedAt: string
}

export async function saveRecordedAudio(signature: string, wav: Blob, mp3: Blob): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(RECORDED_AUDIO_STORE, 'readwrite')
    transaction.objectStore(RECORDED_AUDIO_STORE).put({
      id: RECORD_ID, signature, wav, mp3, savedAt: new Date().toISOString(),
    } satisfies RecordedAudioRecord)
    await completeTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function loadRecordedAudio(signature: string): Promise<RecordedAudioRecord | null> {
  const database = await openSoriOnDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(RECORDED_AUDIO_STORE, 'readonly')
        .objectStore(RECORDED_AUDIO_STORE).get(RECORD_ID)
      request.onsuccess = () => {
        const record = request.result as RecordedAudioRecord | undefined
        resolve(record?.signature === signature ? record : null)
      }
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}
