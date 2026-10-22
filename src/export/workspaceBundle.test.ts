import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorkspaceSession } from '../workspace/sessionCodec'
import { audioBufferToWav } from './recordedAudioFormats'
import { createWorkspaceBundle, importWorkspaceBundle } from './workspaceBundle'

const repository = vi.hoisted(() => ({ loadLocalAudio: vi.fn(), saveLocalAudio: vi.fn() }))
vi.mock('../storage/localAudioRepository', () => ({
  ...repository,
  localAudioSignature: (block: { id: string; revision: number; text: string; voiceId: string; speed: number; pitch: number; emotion: string }) =>
    JSON.stringify([block.id, block.revision, block.text, block.voiceId, block.speed, block.pitch, block.emotion]),
}))

class ReadableBlob extends Blob {
  arrayBuffer(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }

  text(): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}

function session() {
  return createWorkspaceSession({
    workspaceEntered: true, page: 'home', projectTitle: '옮길 대본',
    voiceId: 'sori-warm', speechSpeed: 1, speechPitch: 0, speechEmotion: 'neutral',
    composerDraft: '안녕하세요.', directiveIds: ['numbers'], messages: [],
    blocks: [{
      id: 'voice-1', kind: 'voice', text: '안녕하세요.', voiceId: 'sori-warm', voiceName: '혜린',
      emotion: 'neutral', speed: 1, pitch: 0, normalizeText: true, jobId: null,
      durationSeconds: 1, status: 'ready', progress: 100, trackId: 'track-1', error: null,
      revision: 1, audio: {
        source: 'browser-model', url: 'blob:voice', filename: 'voice.wav', durationSeconds: 1,
        result: {
          jobId: 'local-voice-1', status: 'completed', engineId: 'supertonic-local', engineMode: 'browser',
          audioUrl: 'blob:voice', estimatedDurationSeconds: 1, message: '', normalizedText: null,
          segmentCount: 1, processingMs: null, fileSizeBytes: 44, realtimeFactor: null,
        },
      },
    }],
  }, 1)
}

describe('workspace bundle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Blob', ReadableBlob)
  })

  it('moves a local WAV and script together without ephemeral Blob URLs', async () => {
    const wav = audioBufferToWav({
      length: 2, numberOfChannels: 1, sampleRate: 24_000,
      getChannelData: () => new Float32Array([0.5, -0.5]),
    })
    repository.loadLocalAudio.mockResolvedValue({
      id: 'voice-1', signature: JSON.stringify(['voice-1', 1, '안녕하세요.', 'sori-warm', 1, 0, 'neutral']),
      wav, durationSeconds: 1, styleId: 'F2',
    })
    const bundle = await createWorkspaceBundle(session())
    expect(await bundle.text()).not.toContain('blob:voice')
    const restored = await importWorkspaceBundle(bundle)
    expect(restored.composerDraft).toBe('안녕하세요.')
    expect(restored.blocks[0]).toMatchObject({ id: 'voice-1', audioSource: 'browser-model' })
    expect(repository.saveLocalAudio).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'voice-1' }), expect.any(Blob), 1, 'F2',
    )
  })

  it('rejects a backup with a missing WAV', async () => {
    const incomplete = new Blob([JSON.stringify({
      format: 'sorion-workspace', version: 1, session: session(), audio: [],
    })], { type: 'application/json' })
    await expect(importWorkspaceBundle(incomplete)).rejects.toThrow('빠져 있습니다')
  })
})
