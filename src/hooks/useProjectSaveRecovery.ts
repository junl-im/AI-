import { useCallback, useRef, useState } from 'react'
import { saveProject } from '../projects/projectRepository'
import type { VoiceProject } from '../projects/projectTypes'

export function useProjectSaveRecovery() {
  const [pendingProject, setPendingProject] = useState<VoiceProject | null>(null)
  const [retrying, setRetrying] = useState(false)
  const pendingRef = useRef<VoiceProject | null>(null)
  const retryingRef = useRef(false)

  const clear = useCallback(() => {
    pendingRef.current = null
    setPendingProject(null)
  }, [])

  const save = useCallback(async (project: VoiceProject): Promise<boolean> => {
    pendingRef.current = project
    try {
      await saveProject(project)
      if (pendingRef.current === project) clear()
      return true
    } catch {
      if (pendingRef.current === project) setPendingProject(project)
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

  return { pendingProject, retrying, save, retry, clear }
}
