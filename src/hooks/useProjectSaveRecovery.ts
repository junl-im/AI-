import { useCallback, useEffect, useRef, useState } from 'react'
import { getProject, saveProject } from '../projects/projectRepository'
import { clearPendingProjectSave, readPendingProjectSave, storePendingProjectSave } from '../projects/pendingProjectSave'
import type { VoiceProject } from '../projects/projectTypes'

export function useProjectSaveRecovery() {
  const [pendingProject, setPendingProject] = useState<VoiceProject | null>(readPendingProjectSave)
  const [durable, setDurable] = useState(() => readPendingProjectSave() !== null)
  const [retrying, setRetrying] = useState(false)
  const pendingRef = useRef<VoiceProject | null>(pendingProject)
  const retryingRef = useRef(false)

  const clear = useCallback(() => {
    pendingRef.current = null
    setPendingProject(null)
    setDurable(false)
    clearPendingProjectSave()
  }, [])

  useEffect(() => {
    const project = pendingRef.current
    if (!project) return
    let active = true
    void getProject(project.id).then((stored) => {
      if (active && stored && pendingRef.current?.id === project.id) clear()
    }).catch(() => { /* Keep the recovery copy when IndexedDB is unavailable. */ })
    return () => { active = false }
  }, [clear])

  const save = useCallback(async (project: VoiceProject): Promise<boolean> => {
    pendingRef.current = project
    try {
      await saveProject(project)
      if (pendingRef.current === project) clear()
      return true
    } catch {
      if (pendingRef.current === project) {
        setDurable(storePendingProjectSave(project))
        setPendingProject(project)
      }
      return false
    }
  }, [clear])

  const retry = useCallback(async (): Promise<boolean> => {
    const project = pendingRef.current
    if (!project || retryingRef.current) return false
    retryingRef.current = true
    setRetrying(true)
    try {
      return await save(project)
    } finally {
      retryingRef.current = false
      setRetrying(false)
    }
  }, [save])

  return { pendingProject, durable, retrying, save, retry, clear }
}
