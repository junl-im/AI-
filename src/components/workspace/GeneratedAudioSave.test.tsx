import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TimelineBlock, TimelineVoiceBlock } from '../../workspace/workspaceTypes'
import { GeneratedAudioSave } from './GeneratedAudioSave'

const mp3 = vi.hoisted(() => ({ wavToMp3: vi.fn() }))
vi.mock('../../export/wavToMp3', () => mp3)
const conversion = vi.hoisted(() => ({ recordedWebmToFiles: vi.fn() }))
vi.mock('../../export/recordedAudioFormats', () => conversion)
const recording = vi.hoisted(() => ({ recordBrowserSpeech: vi.fn() }))
vi.mock('../../export/recordBrowserSpeech', () => recording)
const windowsCapture = vi.hoisted(() => ({ windowsCaptureStatus: vi.fn().mockResolvedValue({ ready: false, error: '' }), captureBrowserSpeechWithWindowsLoopback: vi.fn() }))
vi.mock('../../export/windowsLoopbackCapture', () => windowsCapture)
const fullWav = vi.hoisted(() => ({ buildTimelineWav: vi.fn() }))
vi.mock('../../export/timelineWav', () => fullWav)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

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
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '전체 음성 MP3로 저장' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /음성 파일 다운로드/ })).not.toBeInTheDocument()
    expect(screen.getByText('다른 녹음 방법 보기')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Windows 보조 앱 다운로드/ })).toHaveAttribute('href',
      expect.stringContaining('downloads/SoriON-Audio-Bridge-0.11.74-win-x64.zip'))
    fireEvent.click(screen.getByText('다른 녹음 방법 보기'))
    expect(screen.getByRole('button', { name: '브라우저 오디오 공유로 저장 시도' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '시스템 소리 입력 장치 확인' })).toBeInTheDocument()
    expect(screen.getByLabelText('소리가 담긴 WebM 불러오기')).toHaveAttribute('accept', '.webm,audio/webm,video/webm')
    expect(screen.queryByRole('button', { name: /다른 음색으로 WAV 만들기/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '대본 TXT 다운로드' })).not.toBeInTheDocument()
  })

  it('Windows 보조 앱이 연결되면 기본 성우 음성을 MP3로 내려받는다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    const wav = new Blob(['RIFF'], { type: 'audio/wav' })
    windowsCapture.windowsCaptureStatus.mockResolvedValueOnce({ ready: true, error: '', outputDevice: '스피커 (테스트)' })
    windowsCapture.captureBrowserSpeechWithWindowsLoopback.mockResolvedValueOnce(wav)
    mp3.wavToMp3.mockResolvedValueOnce(new Blob(['mp3'], { type: 'audio/mpeg' }))
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:windows-wav').mockReturnValueOnce('blob:windows-mp3')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    expect(await screen.findByText(/출력: 스피커 \(테스트\)/)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Windows 보조 앱으로 원래 음색 MP3 저장' }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(windowsCapture.captureBrowserSpeechWithWindowsLoopback).toHaveBeenCalledWith([block], expect.any(AbortSignal), expect.any(Function))
    expect(mp3.wavToMp3).toHaveBeenCalledWith(wav, {
      signal: expect.any(AbortSignal), onProgress: expect.any(Function),
    })
    expect(screen.getByRole('link', { name: '기본 성우 MP3 다운로드' })).toHaveAttribute('href', 'blob:windows-mp3')
    click.mockRestore()
  })

  it('원본 음색 MP3 변환이 실패하면 녹음된 WAV를 내려받는다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    windowsCapture.windowsCaptureStatus.mockResolvedValueOnce({ ready: true, error: '' })
    windowsCapture.captureBrowserSpeechWithWindowsLoopback.mockResolvedValueOnce(new Blob(['RIFF'], { type: 'audio/wav' }))
    mp3.wavToMp3.mockRejectedValueOnce(new Error('인코더 실패'))
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:original-wav')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Windows 보조 앱으로 원래 음색 MP3 저장' }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(screen.getByRole('link', { name: '기본 성우 WAV 다운로드' })).toHaveAttribute('href', 'blob:original-wav')
    expect(screen.getByText('MP3 변환에 실패해 준비된 원본 음색 WAV 다운로드를 시작했습니다.')).toBeInTheDocument()
    click.mockRestore()
  })

  it('연결 실패 원인을 보이고 다시 확인하면 저장 버튼을 연다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    windowsCapture.windowsCaptureStatus.mockResolvedValueOnce({ ready: false, error: '보조 앱 연결 토큰이 만료되었습니다.' })
      .mockResolvedValueOnce({ ready: true, error: '' })
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    expect(await screen.findByText('보조 앱 연결 토큰이 만료되었습니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Windows 보조 앱 연결 확인' }))
    expect(await screen.findByRole('button', { name: 'Windows 보조 앱으로 원래 음색 MP3 저장' })).toBeInTheDocument()
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

  it('소리가 담긴 WebM을 가져와 WAV와 MP3 다운로드를 제공한다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    const wav = new Blob(['wav'], { type: 'audio/wav' })
    const convertedMp3 = new Blob(['mp3'], { type: 'audio/mpeg' })
    conversion.recordedWebmToFiles.mockResolvedValue({ wav, mp3: convertedMp3 })
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:imported-wav').mockReturnValueOnce('blob:imported-mp3')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} />)
    const file = new File(['audio'], 'sample.webm', { type: 'audio/webm' })
    fireEvent.change(screen.getByLabelText('소리가 담긴 WebM 불러오기'), { target: { files: [file] } })
    expect(await screen.findByRole('link', { name: '가져온 음성 WAV 다운로드' })).toHaveAttribute('href', 'blob:imported-wav')
    expect(screen.getByRole('link', { name: '가져온 음성 MP3 다운로드' })).toHaveAttribute('download', 'sorion-imported.mp3')
    expect(conversion.recordedWebmToFiles).toHaveBeenCalledWith(file)
    expect(click).toHaveBeenCalledOnce()
    click.mockRestore()
  })

  it('무음 녹음 뒤 파일 생성 엔진으로 대사를 다시 만들 수 있다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    recording.recordBrowserSpeech.mockRejectedValueOnce(new Error('녹음된 오디오가 무음입니다.'))
    fullWav.buildTimelineWav.mockResolvedValue(new Blob(['RIFF'], { type: 'audio/wav' }))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:full-wav')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const renderFileAudio = vi.fn().mockImplementation(async () => {
      rerender(<GeneratedAudioSave blocks={[{ ...block, audio: {
        ...block.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav',
      } }]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
      return { source: 'browser-model', url: 'blob:local-wav' }
    })
    const { rerender } = render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
    expect(screen.getByRole('button', { name: '파일 음성으로 생성해 WAV 저장' })).toBeInTheDocument()
    expect(screen.getByText(/기존 기기 성우와 음색이 달라집니다/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('다른 녹음 방법 보기'))
    fireEvent.click(screen.getByRole('button', { name: '브라우저 오디오 공유로 저장 시도' }))
    await waitFor(() => expect(recording.recordBrowserSpeech).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByRole('button', { name: '파일 음성으로 생성해 WAV 저장' })).toBeInTheDocument())
    expect(screen.getByText(/기존 기기 성우와 음색이 달라집니다/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '파일 음성으로 생성해 WAV 저장' }))
    await waitFor(() => expect(renderFileAudio).toHaveBeenCalledWith('v1', expect.any(AbortSignal), expect.any(Function)))
    await waitFor(() => expect(fullWav.buildTimelineWav).toHaveBeenCalled())
    expect(click).toHaveBeenCalledOnce()
    click.mockRestore()
  })

  it('무음 녹음 오류에서 음색 변경을 밝히고 MP3 직접 생성으로 이어진다', async () => {
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    recording.recordBrowserSpeech.mockRejectedValueOnce(new Error('녹음된 오디오가 무음입니다.'))
    fullWav.buildTimelineWav.mockResolvedValue(new Blob(['RIFF'], { type: 'audio/wav' }))
    mp3.wavToMp3.mockResolvedValue(new Blob(['mp3'], { type: 'audio/mpeg' }))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recovered-mp3')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const renderFileAudio = vi.fn().mockImplementation(async () => {
      rerender(<GeneratedAudioSave blocks={[{ ...block, audio: {
        ...block.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav',
      } }]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
      return { source: 'browser-model', url: 'blob:local-wav' }
    })
    const { rerender } = render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
    fireEvent.click(screen.getByText('다른 녹음 방법 보기'))
    fireEvent.click(screen.getByRole('button', { name: '브라우저 오디오 공유로 저장 시도' }))
    expect(await screen.findByRole('button', { name: '다른 음색으로 MP3 바로 만들기' })).toBeInTheDocument()
    expect(screen.getByText(/기존 기본 성우와 음색이 달라집니다/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다른 음색으로 MP3 바로 만들기' }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(mp3.wavToMp3).toHaveBeenCalled()
    click.mockRestore()
  })

  it('녹음 실패를 기다리지 않고 파일 음성 생성을 시작할 수 있다', async () => {
    recording.recordBrowserSpeech.mockClear()
    const block: TimelineBlock = { ...voice, audio: { ...voice.audio!, url: null, source: 'browser-speech', browserSpeech: {
      text: voice.text, lang: 'ko-KR', rate: 1, pitch: 1, voiceId: voice.voiceId,
    } } }
    const renderFileAudio = vi.fn().mockResolvedValue({ source: 'browser-model', url: 'blob:local-wav' })
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
    fireEvent.click(screen.getByRole('button', { name: '파일 음성으로 생성해 WAV 저장' }))
    await waitFor(() => expect(renderFileAudio).toHaveBeenCalledOnce())
    expect(recording.recordBrowserSpeech).not.toHaveBeenCalled()
  })

  it.each(['queued', 'failed'] as const)('기기 성우가 %s 상태여도 파일 음성으로 저장을 시작한다', async (status) => {
    const block: TimelineBlock = { ...voice, status, audio: null, trackId: null, error: status === 'failed' ? '성우 없음' : null }
    const prepare = vi.fn()
    const renderFileAudio = vi.fn().mockResolvedValue({ source: 'browser-model', url: 'blob:local-wav' })
    render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()}
      onPrepareFileAudio={prepare} onRenderFileAudio={renderFileAudio} />)
    fireEvent.click(screen.getByRole('button', { name: '파일 음성으로 생성해 WAV 저장' }))
    await waitFor(() => expect(renderFileAudio).toHaveBeenCalledWith('v1', expect.any(AbortSignal), expect.any(Function)))
    expect(prepare).toHaveBeenCalledOnce()
  })

  it('실패한 대사에서 MP3를 바로 선택하면 생성 완료 뒤 전체 MP3 다운로드를 시작한다', async () => {
    const block: TimelineBlock = { ...voice, status: 'failed', audio: null, trackId: null, error: '기기 성우 없음' }
    const mp3Blob = new Blob(['mp3'], { type: 'audio/mpeg' })
    fullWav.buildTimelineWav.mockResolvedValue(new Blob(['RIFF'], { type: 'audio/wav' }))
    mp3.wavToMp3.mockResolvedValue(mp3Blob)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:full-mp3')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const renderFileAudio = vi.fn().mockImplementation(async () => {
      rerender(<GeneratedAudioSave blocks={[{ ...block, status: 'ready', audio: {
        ...voice.audio!, source: 'browser-model', url: 'blob:local-wav', filename: 'local.wav',
      } }]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
      return { source: 'browser-model', url: 'blob:local-wav' }
    })
    const { rerender } = render(<GeneratedAudioSave blocks={[block]} onOpenExport={vi.fn()} onRenderFileAudio={renderFileAudio} />)
    fireEvent.click(screen.getByRole('button', { name: '파일 음성으로 생성해 MP3 저장' }))
    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(mp3.wavToMp3).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'MP3 다시 다운로드' })).toHaveAttribute('href', 'blob:full-mp3')
    click.mockRestore()
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
    expect(mp3.wavToMp3).toHaveBeenCalledWith(wav, { onProgress: expect.any(Function) })
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

  it('저장 화면에는 결과물 다운로드만 표시한다', () => {
    render(<GeneratedAudioSave blocks={[voice]} onOpenExport={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /백업|다른 음색/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '완료 대사 1 음성 파일 다운로드' })).toBeInTheDocument()
  })
})
