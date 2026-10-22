import { completeTransaction, openSoriOnDatabase, PROJECT_STORE } from '../storage/database'
import type { VoiceProject } from './projectTypes'

export async function saveProject(project: VoiceProject): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    transaction.objectStore(PROJECT_STORE).put(project)
    await completeTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getProject(id: string): Promise<VoiceProject | null> {
  const database = await openSoriOnDatabase()
  try {
    return await new Promise<VoiceProject | null>((resolve, reject) => {
      const request = database.transaction(PROJECT_STORE, 'readonly').objectStore(PROJECT_STORE).get(id)
      request.onsuccess = () => resolve((request.result as VoiceProject | undefined) ?? null)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export async function listProjects(): Promise<VoiceProject[]> {
  const database = await openSoriOnDatabase()
  const projects = await new Promise<VoiceProject[]>((resolve, reject) => {
    const request = database.transaction(PROJECT_STORE, 'readonly').objectStore(PROJECT_STORE).getAll()
    request.onsuccess = () => resolve(request.result as VoiceProject[])
    request.onerror = () => reject(request.error)
  })
  database.close()
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Removes the local saved entry; downloaded files and server audio are retained. */
export async function deleteProject(id: string): Promise<void> {
  const database = await openSoriOnDatabase()
  try {
    const transaction = database.transaction(PROJECT_STORE, 'readwrite')
    transaction.objectStore(PROJECT_STORE).delete(id)
    await completeTransaction(transaction)
  } finally {
    database.close()
  }
}
