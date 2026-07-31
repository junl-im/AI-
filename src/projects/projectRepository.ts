import { completeTransaction, openSoriOnDatabase, PROJECT_STORE } from '../storage/database'
import type { VoiceProject } from './projectTypes'

export async function saveProject(project: VoiceProject): Promise<void> {
  const database = await openSoriOnDatabase()
  const transaction = database.transaction(PROJECT_STORE, 'readwrite')
  transaction.objectStore(PROJECT_STORE).put(project)
  await completeTransaction(transaction)
  database.close()
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
