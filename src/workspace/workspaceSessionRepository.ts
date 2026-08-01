import {
  completeTransaction,
  openSoriOnDatabase,
  WORKSPACE_SESSION_STORE,
} from '../storage/database'
import {
  ACTIVE_WORKSPACE_SESSION_ID,
  type WorkspaceSession,
  type WorkspaceSessionLoadResult,
  type WorkspaceSessionSaveResult,
  type WorkspaceStorageMode,
} from './sessionTypes'
import { normalizeWorkspaceSession } from './sessionCodec'

const FALLBACK_STORAGE_KEY = 'sorion-active-workspace-session'
let memorySession: WorkspaceSession | null = null

function readLocalStorage(): WorkspaceSession | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY)
    if (!raw) return null
    const session = normalizeWorkspaceSession(JSON.parse(raw))
    if (!session) window.localStorage.removeItem(FALLBACK_STORAGE_KEY)
    return session
  } catch {
    return null
  }
}

function isNewer(candidate: WorkspaceSession, current: WorkspaceSession): boolean {
  if (candidate.revision !== current.revision) return candidate.revision > current.revision
  return candidate.savedAt > current.savedAt
}

function writeLocalStorage(session: WorkspaceSession): boolean {
  try {
    const current = readLocalStorage()
    if (current && isNewer(current, session)) return true
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(session))
    return true
  } catch {
    return false
  }
}

function clearLocalStorage(): void {
  try {
    window.localStorage.removeItem(FALLBACK_STORAGE_KEY)
  } catch {
    // Safari private mode can reject storage access. Memory state is still cleared below.
  }
}

async function loadFromIndexedDb(): Promise<WorkspaceSession | null> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(WORKSPACE_SESSION_STORE, 'readwrite')
    const completed = completeTransaction(transaction)
    const store = transaction.objectStore(WORKSPACE_SESSION_STORE)
    const request = store.get(ACTIVE_WORKSPACE_SESSION_ID)
    let session: WorkspaceSession | null = null
    request.onsuccess = () => {
      session = normalizeWorkspaceSession(request.result)
      if (request.result !== undefined && !session) {
        store.delete(ACTIVE_WORKSPACE_SESSION_ID)
      }
    }
    request.onerror = () => transaction.abort()
    await completed
    return session
  } finally {
    database.close()
  }
}

async function saveToIndexedDb(session: WorkspaceSession): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(WORKSPACE_SESSION_STORE, 'readwrite')
    const completed = completeTransaction(transaction)
    const store = transaction.objectStore(WORKSPACE_SESSION_STORE)
    const request = store.get(ACTIVE_WORKSPACE_SESSION_ID)
    request.onsuccess = () => {
      const current = normalizeWorkspaceSession(request.result)
      if (!current || !isNewer(current, session)) store.put(session)
    }
    request.onerror = () => transaction.abort()
    await completed
  } finally {
    database.close()
  }
}

async function clearIndexedDb(): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(WORKSPACE_SESSION_STORE, 'readwrite')
    const completed = completeTransaction(transaction)
    transaction.objectStore(WORKSPACE_SESSION_STORE).delete(ACTIVE_WORKSPACE_SESSION_ID)
    await completed
  } finally {
    database.close()
  }
}

function chooseNewest(...sessions: Array<WorkspaceSession | null>): WorkspaceSession | null {
  return sessions.reduce<WorkspaceSession | null>((newest, session) => {
    if (!session) return newest
    if (!newest || isNewer(session, newest)) return session
    return newest
  }, null)
}

export async function loadWorkspaceSession(): Promise<WorkspaceSessionLoadResult> {
  let indexedDbSession: WorkspaceSession | null = null
  let indexedDbAvailable = false
  if (typeof indexedDB !== 'undefined') {
    try {
      indexedDbSession = await loadFromIndexedDb()
      indexedDbAvailable = true
    } catch {
      indexedDbAvailable = false
    }
  }

  const localSession = readLocalStorage()
  const session = chooseNewest(indexedDbSession, localSession, memorySession)
  let mode: WorkspaceStorageMode = indexedDbAvailable ? 'indexeddb' : 'memory'
  if (session && indexedDbAvailable && session !== indexedDbSession) {
    try {
      await saveToIndexedDb(session)
      memorySession = null
    } catch {
      mode = localSession === session ? 'localstorage' : 'memory'
    }
  } else if (!indexedDbAvailable && localSession === session) {
    mode = 'localstorage'
  }

  return { session, mode }
}

export function checkpointWorkspaceSession(
  session: WorkspaceSession,
): WorkspaceSessionSaveResult {
  if (writeLocalStorage(session)) {
    memorySession = null
    return { mode: 'localstorage', persisted: true }
  }
  if (!memorySession || memorySession.revision <= session.revision) memorySession = session
  return { mode: 'memory', persisted: false }
}

export async function saveWorkspaceSession(
  session: WorkspaceSession,
): Promise<WorkspaceSessionSaveResult> {
  if (typeof indexedDB !== 'undefined') {
    try {
      await saveToIndexedDb(session)
      memorySession = null
      return { mode: 'indexeddb', persisted: true }
    } catch {
      // Continue to the bounded localStorage fallback.
    }
  }

  if (writeLocalStorage(session)) {
    memorySession = null
    return { mode: 'localstorage', persisted: true }
  }

  if (!memorySession || memorySession.revision <= session.revision) memorySession = session
  return { mode: 'memory', persisted: false }
}

export async function clearWorkspaceSession(): Promise<void> {
  memorySession = null
  clearLocalStorage()
  if (typeof indexedDB === 'undefined') return
  try {
    await clearIndexedDb()
  } catch {
    // Clearing fallback storage is enough when IndexedDB is blocked or unavailable.
  }
}
