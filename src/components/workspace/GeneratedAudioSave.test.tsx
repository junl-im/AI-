import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'
import { GeneratedAudioSave } from './GeneratedAudioSave'

const voice: TimelineVoiceBlock = {
  id: 'v1', kind: 'voice', text: '안녕하세요.', voiceId: 'sori-warm', voiceName: '혜린',
  emotion: 'neutral', speed: 1, pitch: 0, normalizeText: true, jobId: 'job-1',
  durationSeconds: 2, status: 'ready', progress: 100,
  audio: {
    source: 'api', url: 'https://example.test/audio.wav', filename: 'audio.wav',
    durationSeconds: 2, result: {
      jobId: 'job-1', status: 'completed', engineId: 'system', engineMode: 'local',
      audioUrl: 'https://example.test/audio.wav', estimatedDurationSeconds: 2,
      message: 'ready', normalizedText: null, segmentCount: 1, processingMs: 1,
      fileSizeBytes: 10, realtimeFactor: 0.1,
    },
  },
  trackId: 'track-1', error: null, revision: 1,
}

describe('GeneratedAudioSave', () => {
  it('완료된 서버 음성은 파일과 전체 MP3 저장 동선을 보여준다', () => {
    const open = vi.fn()
    render(<GeneratedAudioSave blocks={[voice]} scriptText={voice.text} onOpenExport={open} />)
    expect(screen.getByRole('link', { name: '완료 대사 1 음성 파일 다운로드' }))
      .toHaveAttribute('download', 'audio.wav')
    fireEvent.click(screen.getByRole('button', { name: '전체 음성 MP3로 저장' }))
    expect(open).toHaveBeenCalledOnce()
  })

  it('브라우저 재생 음성은 탭 오디오 녹음과 대본 저장을 보여준다', () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    const renderLocalWav = vi.fn()
    render(<GeneratedAudioSave blocks={[block]} scriptText={voice.text} onOpenExport={vi.fn()} onRenderLocalWav={renderLocalWav} />)
    expect(screen.queryByRole('button', { name: '전체 음성 MP3로 저장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /음성 파일 다운로드/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기기 음성 녹음해 다운로드' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '대사 WAV 파일 만들기' }))
    expect(renderLocalWav).toHaveBeenCalledWith('v1', expect.any(AbortSignal), expect.any(Function))
    expect(screen.getByRole('link', { name: '대본 TXT 다운로드' })).toHaveAttribute('download', 'sorion-script.txt')
  })

  it('기기 내 모델 WAV는 대사별 다운로드와 전체 WAV 생성을 보여준다', () => {
    const block: TimelineBlock = {
      ...voice,
      audio: { ...voice.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav' },
    }
    render(<GeneratedAudioSave blocks={[block]} scriptText={voice.text} onOpenExport={vi.fn()} />)
    expect(screen.getByRole('link', { name: '완료 대사 1 음성 파일 다운로드' }))
      .toHaveAttribute('download', 'local.wav')
    expect(screen.getByRole('button', { name: '전체 대사 WAV 만들기' })).toBeInTheDocument()
  })

  it('아직 대사가 없어도 저장 위치와 다음 동작을 보여준다', () => {
    render(<GeneratedAudioSave blocks={[]} scriptText="" onOpenExport={vi.fn()} />)
    expect(screen.getByLabelText('생성한 음성 저장')).toBeInTheDocument()
    expect(screen.getByText(/먼저 대사를 입력하고/)).toBeInTheDocument()
  })
})
