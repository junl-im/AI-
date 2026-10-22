import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'
import { GeneratedAudioSave } from './GeneratedAudioSave'

const mp3 = vi.hoisted(() => ({ wavToMp3: vi.fn() }))
vi.mock('../../export/wavToMp3', () => mp3)

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
    render(<GeneratedAudioSave blocks={[voice]} onOpenExport={open} />)
    expect(screen.getByRole('link', { name: '완료 대사 1 음성 파일 다운로드' }))
      .toHaveAttribute('download', 'audio.wav')
    fireEvent.click(screen.getByRole('button', { name: '전체 음성 MP3로 저장' }))
    expect(open).toHaveBeenCalledOnce()
  })

  it('기본 성우 재생 음성에는 WAV·MP3 녹음 저장을 우선 보여준다', () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    const renderLocalWav = vi.fn()
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} onRenderLocalWav={renderLocalWav} />)
    expect(screen.queryByRole('button', { name: '전체 음성 MP3로 저장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /음성 파일 다운로드/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기본 성우를 WAV·MP3로 저장' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다른 음색으로 WAV 만들기' }))
    expect(renderLocalWav).toHaveBeenCalledWith('v1', expect.any(AbortSignal), expect.any(Function))
    expect(screen.queryByRole('link', { name: '대본 TXT 다운로드' })).not.toBeInTheDocument()
  })

  it('기기 내 모델 WAV는 대사별 다운로드와 전체 파일 다운로드를 보여준다', () => {
    const block: TimelineBlock = {
      ...voice,
      audio: { ...voice.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav' },
    }
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    expect(screen.getByRole('link', { name: '완료 대사 1 음성 파일 다운로드' }))
      .toHaveAttribute('download', 'local.wav')
    expect(screen.getByRole('button', { name: '전체 WAV 다운로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 MP3 다운로드' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '대사 1 MP3 다운로드' })).toBeInTheDocument()
  })

  it('기기 내 모델 클립을 MP3로 변환하면 다운로드를 시작하고 재다운로드 링크를 남긴다', async () => {
    const block: TimelineBlock = {
      ...voice,
      audio: { ...voice.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav' },
    }
    const wav = new Blob(['wav'], { type: 'audio/wav' })
    mp3.wavToMp3.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(wav) }))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:converted-mp3')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const { rerender } = render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '대사 1 MP3 다운로드' }))
    expect(await screen.findByRole('link', { name: 'MP3 다시 다운로드' }))
      .toHaveAttribute('download', 'sorion-voice-1.mp3')
    expect(mp3.wavToMp3).toHaveBeenCalledWith(wav)
    expect(click).toHaveBeenCalledOnce()
    rerender(<GeneratedAudioSave blocks={[{ ...block, audio: { ...block.audio!, url: 'blob:new-wav' } }]} onOpenExport={vi.fn()} />)
    await waitFor(() => expect(screen.queryByRole('link', { name: 'MP3 다시 다운로드' })).not.toBeInTheDocument())
    click.mockRestore()
    vi.unstubAllGlobals()
  })

  it('아직 대사가 없어도 저장 위치와 다음 동작을 보여준다', () => {
    render(<GeneratedAudioSave blocks={[]} onOpenExport={vi.fn()} />)
    expect(screen.getByLabelText('생성한 음성 저장')).toBeInTheDocument()
    expect(screen.getByText(/먼저 대사를 입력하고/)).toBeInTheDocument()
  })

  it('작업·WAV 백업을 만들고 파일을 가져오는 사용자 동선을 연결한다', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:workspace-backup')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const exportWorkspace = vi.fn().mockResolvedValue(new Blob(['backup'], { type: 'application/json' }))
    const importWorkspace = vi.fn().mockResolvedValue(undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<GeneratedAudioSave blocks={[voice]} onOpenExport={vi.fn()}
      onExportWorkspace={exportWorkspace} onImportWorkspace={importWorkspace} />)
    fireEvent.click(screen.getByRole('button', { name: '작업·WAV 백업 만들기' }))
    expect(await screen.findByRole('link', { name: '작업 백업 다운로드' }))
      .toHaveAttribute('href', 'blob:workspace-backup')
    expect(click).toHaveBeenCalledOnce()
    const file = new File(['backup'], 'backup.sorion.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('소리온 작업 백업 파일 선택'), { target: { files: [file] } })
    await waitFor(() => expect(importWorkspace).toHaveBeenCalledWith(file))
    click.mockRestore()
  })
})
