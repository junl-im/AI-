export const DATABASE_NAME = 'sorion-ai'
export const DATABASE_VERSION = 3
export const PROJECT_STORE = 'projects'
export const QUALITY_REVIEW_STORE = 'qualityReviews'
export const VOICE_PROFILE_STORE = 'voiceProfiles'

export function openSoriOnDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        database.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(QUALITY_REVIEW_STORE)) {
        const store = database.createObjectStore(QUALITY_REVIEW_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
        store.createIndex('engineId', 'engineId')
      }
      if (!database.objectStoreNames.contains(VOICE_PROFILE_STORE)) {
        const store = database.createObjectStore(VOICE_PROFILE_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
        store.createIndex('status', 'status')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
