import { useCallback, useLayoutEffect, useRef } from 'react'
import type { VoiceProject } from '../projects/projectTypes'
import { useAppStore } from '../store/useAppStore'
import { getVoicePreset } from '../tts/voicePresets'
import { normalizeVoicePitch, normalizeVoiceSpeed } from '../voice/voiceControlOptions'
import { isMyVoiceId } from '../voiceclone/voiceIdentity'
import type { WorkspaceSession } from '../workspace/sessionTypes'
import type { WorkspaceMessage } from '../workspace/workspaceTypes'

export function useWorkspaceRestoration({ workspaceResetToken, activeProject, initialMessages, restoreSession, applyDraft }: {
  workspaceResetToken: number
  activeProject: VoiceProject | null
  initialMessages: WorkspaceMessage[]
  restoreSession: (blocks: WorkspaceSession['blocks']) => string[]
  applyDraft: (session: WorkspaceSession, recoveryIds: string[]) => void
}) {
  const observedResetTokenRef = useRef(workspaceResetToken)
  const explicitWorkspaceActionRef = useRef(workspaceResetToken > 0)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  useLayoutEffect(() => {
    if (activeProject || observedResetTokenRef.current !== workspaceResetToken) explicitWorkspaceActionRef.current = true
  }, [activeProject, workspaceResetToken])
  const restoreWorkspaceSession = useCallback((session: WorkspaceSession) => {
    if (explicitWorkspaceActionRef.current || useAppStore.getState().activeProject) return
    const voiceId = isMyVoiceId(session.voiceId) ? session.voiceId : getVoicePreset(session.voiceId).id
    const normalized = {
      ...session, voiceId, projectTitle: session.projectTitle || '새 프로젝트',
      speechSpeed: normalizeVoiceSpeed(session.speechSpeed), speechPitch: normalizeVoicePitch(session.speechPitch),
      speechEmotion: session.speechEmotion !== 'neutral' ? session.speechEmotion
        : session.directiveIds.includes('commercial') ? 'commercial' as const
          : session.directiveIds.includes('bright') ? 'happy' as const : 'neutral' as const,
      directiveIds: session.directiveIds.includes('numbers') ? ['numbers' as const] : [],
      messages: session.messages.length ? session.messages : initialMessages,
    }
    applyDraft(normalized, restoreSession(session.blocks))
    if (session.workspaceEntered) enterWorkspace(session.page)
  }, [applyDraft, enterWorkspace, initialMessages, restoreSession])
  return { restoreWorkspaceSession, observedResetTokenRef }
}
