export const DATABASE_NAME = 'sorion-ai'
export const DATABASE_VERSION = 4
export const PROJECT_STORE = 'projects'
export const QUALITY_REVIEW_STORE = 'qualityReviews'
export const VOICE_PROFILE_STORE = 'voiceProfiles'
export const WORKSPACE_SESSION_STORE = 'workspaceSessions'

export function openSoriOnDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    let upgradeBlocked = false
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
      if (!database.objectStoreNames.contains(WORKSPACE_SESSION_STORE)) {
        database.createObjectStore(WORKSPACE_SESSION_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      if (upgradeBlocked) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => {
      upgradeBlocked = true
      reject(new Error('IndexedDB 업그레이드가 차단되었습니다.'))
    }
  })
}

export function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
