import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createWorkspaceSession,
  hasMeaningfulWorkspaceSession,
} from '../workspace/sessionCodec'
import {
  checkpointWorkspaceSession,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from '../workspace/workspaceSessionRepository'
import type {
  WorkspaceSession,
  WorkspaceSessionDraft,
  WorkspaceStorageMode,
} from '../workspace/sessionTypes'

interface WorkspaceSessionPersistenceOptions extends WorkspaceSessionDraft {
  onRestore: (session: WorkspaceSession) => void
  onPersistenceUnavailable: () => void
}

interface WorkspaceSessionPersistenceState {
  hydrated: boolean
  storageMode: WorkspaceStorageMode
  lastSavedAt: string | null
  saveNow: () => Promise<void>
}

const SAVE_DELAY_MS = 450

export function useWorkspaceSessionPersistence({
  workspaceEntered,
  page,
  projectTitle,
  voiceId,
  speechSpeed,
  speechPitch,
  speechEmotion,
  composerDraft,
  directiveIds,
  messages,
  blocks,
  batchRetrySnapshot,
  onRestore,
  onPersistenceUnavailable,
}: WorkspaceSessionPersistenceOptions): WorkspaceSessionPersistenceState {
  const [hydrated, setHydrated] = useState(false)
  const [storageMode, setStorageMode] = useState<WorkspaceStorageMode>('memory')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const revisionRef = useRef(0)
  const saveTimerRef = useRef<number | null>(null)
  const loadStartedRef = useRef(false)
  const loadPromiseRef = useRef<ReturnType<typeof loadWorkspaceSession> | null>(null)
  const persistenceWarningShownRef = useRef(false)
  const dirtyBeforeHydrationRef = useRef(false)
  const initialDraftRef = useRef<WorkspaceSessionDraft>({
    workspaceEntered,
    page,
    projectTitle,
    voiceId,
    speechSpeed,
    speechPitch,
    speechEmotion,
    composerDraft,
    directiveIds,
    messages,
    blocks,
    batchRetrySnapshot,
  })
  const latestDraftRef = useRef<WorkspaceSessionDraft>({
    workspaceEntered,
    page,
    projectTitle,
    voiceId,
    speechSpeed,
    speechPitch,
    speechEmotion,
    composerDraft,
    directiveIds,
    messages,
    blocks,
    batchRetrySnapshot,
  })

  latestDraftRef.current = {
    workspaceEntered,
    page,
    projectTitle,
    voiceId,
    speechSpeed,
    speechPitch,
    speechEmotion,
    composerDraft,
    directiveIds,
    messages,
    blocks,
    batchRetrySnapshot,
  }

  useEffect(() => {
    if (hydrated) return
    const initial = initialDraftRef.current
    if (
      initial.workspaceEntered !== workspaceEntered
      || initial.page !== page
      || initial.projectTitle !== projectTitle
      || initial.voiceId !== voiceId
      || initial.speechSpeed !== speechSpeed
      || initial.speechPitch !== speechPitch
      || initial.speechEmotion !== speechEmotion
      || initial.composerDraft !== composerDraft
      || initial.directiveIds !== directiveIds
      || initial.messages !== messages
      || initial.blocks !== blocks
      || initial.batchRetrySnapshot !== batchRetrySnapshot
    ) dirtyBeforeHydrationRef.current = true
  }, [
    batchRetrySnapshot, blocks, composerDraft, directiveIds, hydrated, messages, page, projectTitle,
    speechEmotion, speechPitch, speechSpeed, voiceId, workspaceEntered,
  ])

  useEffect(() => {
    loadStartedRef.current = true
    loadPromiseRef.current ??= loadWorkspaceSession()
    let active = true
    void loadPromiseRef.current.then(({ session, mode }) => {
      if (!active) return
      setStorageMode(mode)
      if (session) {
        revisionRef.current = session.revision
        setLastSavedAt(session.savedAt)
        if (
          !dirtyBeforeHydrationRef.current
          && hasMeaningfulWorkspaceSession(session)
        ) onRestore(session)
      }
      setHydrated(true)
    }).catch(() => {
      if (!active) return
      setStorageMode('memory')
      setHydrated(true)
      if (!persistenceWarningShownRef.current) {
        persistenceWarningShownRef.current = true
        onPersistenceUnavailable()
      }
    })
    return () => {
      active = false
    }
  }, [onPersistenceUnavailable, onRestore])

  const persistCurrentDraft = useCallback(async (checkpoint: boolean) => {
    if (!loadStartedRef.current) return
    revisionRef.current += 1
    const session = createWorkspaceSession(latestDraftRef.current, revisionRef.current)
    if (checkpoint) {
      const checkpointResult = checkpointWorkspaceSession(session)
      setStorageMode(checkpointResult.mode)
      if (!checkpointResult.persisted && !persistenceWarningShownRef.current) {
        persistenceWarningShownRef.current = true
        onPersistenceUnavailable()
      }
    }
    const result = await saveWorkspaceSession(session)
    setStorageMode(result.mode)
    if (result.persisted) setLastSavedAt(session.savedAt)
    if (!result.persisted && !persistenceWarningShownRef.current) {
      persistenceWarningShownRef.current = true
      onPersistenceUnavailable()
    }
  }, [onPersistenceUnavailable])

  const saveNow = useCallback(
    () => persistCurrentDraft(false),
    [persistCurrentDraft],
  )

  useEffect(() => {
    if (!hydrated) return
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      void saveNow()
    }, SAVE_DELAY_MS)
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    }
  }, [
    batchRetrySnapshot,
    blocks,
    composerDraft,
    directiveIds,
    hydrated,
    messages,
    page,
    projectTitle,
    saveNow,
    speechEmotion,
    speechPitch,
    speechSpeed,
    voiceId,
    workspaceEntered,
  ])

  useEffect(() => {
    if (!hydrated) return
    const flush = () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      void persistCurrentDraft(true)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [hydrated, persistCurrentDraft])

  return { hydrated, storageMode, lastSavedAt, saveNow }
}
