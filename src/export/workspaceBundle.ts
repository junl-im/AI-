import { loadLocalAudio, localAudioSignature, saveLocalAudio } from '../storage/localAudioRepository'
import { normalizeWorkspaceSession } from '../workspace/sessionCodec'
import type { PersistedTimelineVoiceBlock, WorkspaceSession } from '../workspace/sessionTypes'
import { readPcmWav } from './timelineWav'

const MAX_BUNDLE_BYTES = 160_000_000

interface BundleAudio {
  id: string
  signature: string
  durationSeconds: number
  styleId: string
  wavBase64: string
}

function encodeBase64(bytes: Uint8Array): string {
  const chunks: string[] = []
  for (let index = 0; index < bytes.length; index += 16_384) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + 16_384)))
  }
  return btoa(chunks.join(''))
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error('백업의 WAV 인코딩이 올바르지 않습니다.')
  }
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function isWav(bytes: Uint8Array<ArrayBuffer>): boolean {
  try {
    const view = new DataView(bytes.buffer)
    if (bytes.length < 44 || view.getUint32(4, true) + 8 !== bytes.length) return false
    return readPcmWav(bytes.buffer).samples.length > 0
  } catch {
    return false
  }
}

export async function createWorkspaceBundle(session: WorkspaceSession): Promise<Blob> {
  const audio: BundleAudio[] = []
  let estimatedBytes = JSON.stringify(session).length
  for (const block of session.blocks) {
    if (block.kind !== 'voice' || block.audioSource !== 'browser-model') continue
    const record = await loadLocalAudio(block)
    if (!record) throw new Error(`‘${block.text.slice(0, 20)}’ WAV를 찾지 못했습니다. 클립을 다시 만든 뒤 백업해 주세요.`)
    estimatedBytes += Math.ceil(record.wav.size / 3) * 4
    if (estimatedBytes > MAX_BUNDLE_BYTES) throw new Error('백업 파일이 160MB를 넘습니다. WAV를 개별 다운로드해 주세요.')
    audio.push({
      id: block.id,
      signature: record.signature,
      durationSeconds: record.durationSeconds,
      styleId: record.styleId,
      wavBase64: encodeBase64(new Uint8Array(await record.wav.arrayBuffer())),
    })
  }
  const bundle = new Blob([JSON.stringify({ format: 'sorion-workspace', version: 1, session, audio })], {
    type: 'application/json',
  })
  if (bundle.size > MAX_BUNDLE_BYTES) throw new Error('백업 파일이 160MB를 넘습니다. WAV를 개별 다운로드해 주세요.')
  return bundle
}

export async function importWorkspaceBundle(file: Blob): Promise<WorkspaceSession> {
  if (file.size > MAX_BUNDLE_BYTES) throw new Error('백업 파일이 160MB를 넘습니다.')
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('백업 JSON 파일을 읽지 못했습니다.')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('소리온 작업 백업 형식이 아닙니다.')
  const bundle = parsed as Record<string, unknown>
  if (bundle.format !== 'sorion-workspace' || bundle.version !== 1 || !Array.isArray(bundle.audio)) {
    throw new Error('지원하지 않는 소리온 작업 백업 형식입니다.')
  }
  const importedSession = bundle.session && typeof bundle.session === 'object'
    ? { ...bundle.session, savedAt: new Date().toISOString() }
    : bundle.session
  const session = normalizeWorkspaceSession(importedSession)
  if (!session || bundle.audio.length > 240) throw new Error('백업의 프로젝트 정보가 올바르지 않습니다.')
  const blocks = new Map(session.blocks.filter((block): block is PersistedTimelineVoiceBlock => block.kind === 'voice')
    .map((block) => [block.id, block]))
  const records: Array<{ block: PersistedTimelineVoiceBlock; bytes: Uint8Array<ArrayBuffer>; duration: number; styleId: string }> = []
  const seen = new Set<string>()
  for (const item of bundle.audio) {
    if (!item || typeof item !== 'object') throw new Error('백업의 WAV 항목이 올바르지 않습니다.')
    const entry = item as Record<string, unknown>
    const block = blocks.get(String(entry.id))
    if (!block || seen.has(block.id) || block.audioSource !== 'browser-model'
      || entry.signature !== localAudioSignature(block)
      || typeof entry.wavBase64 !== 'string' || entry.wavBase64.length > MAX_BUNDLE_BYTES
      || typeof entry.durationSeconds !== 'number' || !Number.isFinite(entry.durationSeconds)
      || entry.durationSeconds <= 0 || entry.durationSeconds > 60 * 60
      || typeof entry.styleId !== 'string' || !/^[FM][1-5]$/.test(entry.styleId)) {
      throw new Error('백업의 WAV와 대본 정보가 일치하지 않습니다.')
    }
    const bytes = decodeBase64(entry.wavBase64)
    if (!isWav(bytes)) throw new Error('백업의 WAV 파일이 손상되었습니다.')
    records.push({ block, bytes, duration: entry.durationSeconds, styleId: entry.styleId })
    seen.add(block.id)
  }
  for (const block of blocks.values()) {
    if (block.audioSource === 'browser-model' && !seen.has(block.id)) {
      throw new Error('백업에 필요한 WAV 파일이 빠져 있습니다.')
    }
  }
  for (const record of records) {
    await saveLocalAudio(record.block, new Blob([record.bytes], { type: 'audio/wav' }), record.duration, record.styleId)
  }
  return session
}
