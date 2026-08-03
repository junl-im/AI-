import { beforeEach, describe, expect, it } from 'vitest'
import type { GeneratedAudio } from '../tts/generationTypes'
import type { PlayerTrack } from './playerTypes'
import {
  createPlayerSessionSnapshot,
  loadPlayerSession,
  rehydratePlayerSession,
  savePlayerSession,
} from './playerSession'

function track(id: string, audio: GeneratedAudio, resumePositionSeconds = 0): PlayerTrack {
  return {
    id,
    title: id,
    audio,
    createdAt: '2026-08-03T00:00:00.000Z',
    resumePositionSeconds,
  }
}

function apiAudio(url: string): GeneratedAudio {
  return {
    url,
    filename: 'final.wav',
    source: 'api',
    durationSeconds: 10,
    rehydration: { kind: 'tts-final', jobId: 'job' },
    result: {
      jobId: 'job',
      status: 'completed',
      engineId: 'cosyvoice',
      engineMode: 'local',
      audioUrl: url,
      estimatedDurationSeconds: 10,
      message: 'ready',
      normalizedText: null,
      segmentCount: 1,
      processingMs: 100,
      fileSizeBytes: 100,
      realtimeFactor: 0.1,
    },
  }
}

beforeEach(() => window.localStorage.clear())

describe('playerSession', () => {
  it('원격 최종 음원만 저장하고 Blob·부분 음원은 제외한다', () => {
    const remote = track('remote', apiAudio('https://voice.example/audio/final.wav'), 4.2)
    const blob = track('blob', { ...apiAudio('blob:preview'), source: 'browser-demo', revokeOnRemove: true })
    const partial = track('partial', {
      ...apiAudio('https://voice.example/segment.wav'),
      partial: { index: 1, totalSegments: 2, readyAfterMs: 200 },
    })

    const snapshot = createPlayerSessionSnapshot({
      queue: [blob, partial, remote],
      currentTrackId: 'remote',
      repeatMode: 'all',
      playbackRate: 1.25,
    })

    expect(snapshot?.tracks.map((item) => item.id)).toEqual(['remote'])
    expect(snapshot?.tracks[0].resumePositionSeconds).toBe(4.2)
  })

  it('25분이 지난 재생 세션은 복원하지 않는다', () => {
    const snapshot = createPlayerSessionSnapshot({
      queue: [track('remote', apiAudio('https://voice.example/audio/final.wav'))],
      currentTrackId: 'remote',
      repeatMode: 'off',
      playbackRate: 1,
    })
    if (!snapshot) throw new Error('snapshot missing')
    savePlayerSession(snapshot)

    expect(loadPlayerSession(Date.parse(snapshot.savedAt) + 26 * 60 * 1_000)).toBeNull()
  })


  it('저장된 작업 ID로 최종 음원 주소를 재발급한다', async () => {
    const snapshot = createPlayerSessionSnapshot({
      queue: [track('remote', apiAudio('https://voice.example/expired.wav'), 3.5)],
      currentTrackId: 'remote',
      repeatMode: 'off',
      playbackRate: 1,
    })
    if (!snapshot) throw new Error('snapshot missing')

    const renewed = await rehydratePlayerSession(snapshot, async (jobId) => ({
      ...snapshot.tracks[0].audio.result,
      jobId,
      audioUrl: 'https://voice.example/renewed.wav?signature=fresh',
    }))

    expect(renewed?.tracks[0].audio.url).toContain('signature=fresh')
    expect(renewed?.tracks[0].audio.rehydration?.renewedAt).toBeTruthy()
    expect(renewed?.tracks[0].resumePositionSeconds).toBe(3.5)
  })

  it('재발급에 실패한 트랙만 복원 목록에서 제외한다', async () => {
    const good = apiAudio('https://voice.example/good.wav')
    good.rehydration = { kind: 'tts-final', jobId: 'good-job' }
    const bad = apiAudio('https://voice.example/bad.wav')
    bad.rehydration = { kind: 'tts-final', jobId: 'bad-job' }
    const snapshot = createPlayerSessionSnapshot({
      queue: [track('bad', bad), track('good', good)],
      currentTrackId: 'bad',
      repeatMode: 'all',
      playbackRate: 1.25,
    })
    if (!snapshot) throw new Error('snapshot missing')

    const renewed = await rehydratePlayerSession(snapshot, async (jobId) => {
      if (jobId === 'bad-job') throw new Error('expired')
      return { ...good.result, jobId, audioUrl: 'https://voice.example/fresh.wav' }
    })

    expect(renewed?.tracks.map((item) => item.id)).toEqual(['good'])
    expect(renewed?.currentTrackId).toBe('good')
  })

})
