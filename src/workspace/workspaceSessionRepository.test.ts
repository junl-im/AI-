import { beforeEach, describe, expect, it } from 'vitest'
import { createWorkspaceSession } from './sessionCodec'
import {
  checkpointWorkspaceSession,
  clearWorkspaceSession,
  loadWorkspaceSession,
  saveWorkspaceSession,
} from './workspaceSessionRepository'

function makeSession(revision: number, draft: string) {
  return createWorkspaceSession({
    workspaceEntered: true,
    page: 'home',
    projectTitle: '새 프로젝트',
    voiceId: 'sori-warm',
    speechSpeed: 1,
    speechPitch: 0,
    speechEmotion: 'neutral',
    composerDraft: draft,
    directiveIds: ['numbers'],
    messages: [],
    blocks: [],
  }, revision)
}

describe('workspace session repository fallback', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await clearWorkspaceSession()
  })

  it('restores a saved session when IndexedDB is unavailable', async () => {
    const original = globalThis.indexedDB
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    })
    try {
      const saved = await saveWorkspaceSession(makeSession(1, '모바일 초안'))
      const loaded = await loadWorkspaceSession()
      expect(saved).toEqual({ mode: 'localstorage', persisted: true })
      expect(loaded.session?.composerDraft).toBe('모바일 초안')
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: original,
      })
    }
  })

  it('writes a synchronous pagehide checkpoint before async IndexedDB work', async () => {
    const original = globalThis.indexedDB
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    })
    try {
      const checkpoint = checkpointWorkspaceSession(makeSession(8, '종료 직전 초안'))
      const loaded = await loadWorkspaceSession()
      expect(checkpoint).toEqual({ mode: 'localstorage', persisted: true })
      expect(loaded.session?.composerDraft).toBe('종료 직전 초안')
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: original,
      })
    }
  })

  it('clears fallback state when a new workspace is requested', async () => {
    const original = globalThis.indexedDB
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    })
    try {
      await saveWorkspaceSession(makeSession(5, '지워야 할 초안'))
      await clearWorkspaceSession()
      const loaded = await loadWorkspaceSession()
      expect(loaded.session).toBeNull()
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: original,
      })
    }
  })

  it('does not let an older async save replace a newer revision', async () => {
    const original = globalThis.indexedDB
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    })
    try {
      await saveWorkspaceSession(makeSession(3, '최신 초안'))
      await saveWorkspaceSession(makeSession(2, '오래된 초안'))
      const loaded = await loadWorkspaceSession()
      expect(loaded.session?.revision).toBe(3)
      expect(loaded.session?.composerDraft).toBe('최신 초안')
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        value: original,
      })
    }
  })
})
