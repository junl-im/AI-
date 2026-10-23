import { useEffect, useRef, useState } from 'react'
import { recordBrowserSpeech } from '../../export/recordBrowserSpeech'
import { recordedWebmToFiles } from '../../export/recordedAudioFormats'
import { buildTimelineWav } from '../../export/timelineWav'
import { wavToMp3 } from '../../export/wavToMp3'
import { loadRecordedAudio, saveRecordedAudio } from '../../storage/recordedAudioRepository'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import type { GeneratedAudio } from '../../tts/generationTypes'

interface Props {
  blocks: TimelineBlock[]
  localAudioSaveWarning?: string | null
  onOpenExport: () => void
  onRenderFileAudio?: (blockId: string, signal: AbortSignal, onProgress: (message: string) => void) => Promise<GeneratedAudio>
}

function startDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function GeneratedAudioSave({ blocks, localAudioSaveWarning, onOpenExport, onRenderFileAudio }: Props) {
  const [recording, setRecording] = useState(false)
  const [renderingFileAudio, setRenderingFileAudio] = useState(false)
  const [fileAudioProgress, setFileAudioProgress] = useState('')
  const [fileAudioError, setFileAudioError] = useState('')
  const [autoDownloadFileAudio, setAutoDownloadFileAudio] = useState(false)
  const fileAudioAbortRef = useRef<AbortController | null>(null)
  const [recordProgress, setRecordProgress] = useState('')
  const [recordError, setRecordError] = useState('')
  const [recordStorageError, setRecordStorageError] = useState('')
  const [captureDevices, setCaptureDevices] = useState<MediaDeviceInfo[]>([])
  const [captureDeviceId, setCaptureDeviceId] = useState('default')
  const [captureOptionsOpen, setCaptureOptionsOpen] = useState(false)
  const [recordedWavUrl, setRecordedWavUrl] = useState<string | null>(null)
  const [recordedMp3Url, setRecordedMp3Url] = useState<string | null>(null)
  const [recordedSource, setRecordedSource] = useState<'capture' | 'import'>('capture')
  const [wavError, setWavError] = useState('')
  const [fullWavUrl, setFullWavUrl] = useState<string | null>(null)
  const [fullMp3Url, setFullMp3Url] = useState<string | null>(null)
  const [fullWavBusy, setFullWavBusy] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState('')
  const [clipMp3BusyId, setClipMp3BusyId] = useState<string | null>(null)
  const [clipMp3Urls, setClipMp3Urls] = useState<Record<string, string>>({})
  const clipMp3Refs = useRef<Record<string, string>>({})
  const fullWavRef = useRef<string | null>(null)
  const fullMp3Ref = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recordedWavRef = useRef<string | null>(null)
  const recordedMp3Ref = useRef<string | null>(null)
  const sourceRef = useRef<string | null>(null)
  const recordingSignatureRef = useRef<string | null>(null)
  useEffect(() => () => {
    abortRef.current?.abort()
    fileAudioAbortRef.current?.abort()
    if (recordedWavRef.current) URL.revokeObjectURL(recordedWavRef.current)
    if (recordedMp3Ref.current) URL.revokeObjectURL(recordedMp3Ref.current)
    if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
    if (fullMp3Ref.current) URL.revokeObjectURL(fullMp3Ref.current)
    Object.values(clipMp3Refs.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])
  const voices = blocks.filter((block) => block.kind === 'voice')
  const ready = voices.filter((block) => block.status === 'ready')
  const sourceSignature = voices.map((block) => `${block.id}:${block.revision}:${block.status}:${block.audio?.source ?? ''}:${block.audio?.url ?? ''}`).join('|')
  const recordingSignature = JSON.stringify(voices.map((block) => [
    block.id, block.revision, block.text, block.voiceId, block.speed, block.pitch,
  ]))
  useEffect(() => {
    let active = true
    recordingSignatureRef.current = recordingSignature
    if (recordedWavRef.current) URL.revokeObjectURL(recordedWavRef.current)
    if (recordedMp3Ref.current) URL.revokeObjectURL(recordedMp3Ref.current)
    recordedWavRef.current = null
    recordedMp3Ref.current = null
    setRecordedWavUrl(null)
    setRecordedMp3Url(null)
    setRecordedSource('capture')
    setRecordStorageError('')
    if (voices.length) {
      void loadRecordedAudio(recordingSignature).then((record) => {
        if (!active || !record || recordingSignatureRef.current !== recordingSignature) return
        recordedWavRef.current = URL.createObjectURL(record.wav)
        recordedMp3Ref.current = URL.createObjectURL(record.mp3)
        setRecordedWavUrl(recordedWavRef.current)
        setRecordedMp3Url(recordedMp3Ref.current)
        setRecordProgress('이 브라우저에 보관된 기본 성우 녹음을 복구했습니다.')
      }).catch(() => {
        if (active) setRecordStorageError('저장된 녹음을 읽지 못했습니다. 브라우저 저장소를 확인해 주세요.')
      })
    }
    return () => { active = false }
  }, [recordingSignature, voices.length])
  useEffect(() => {
    if (sourceRef.current === null) {
      sourceRef.current = sourceSignature
      return
    }
    if (sourceRef.current === sourceSignature) return
    sourceRef.current = sourceSignature
    abortRef.current?.abort()
    if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
    fullWavRef.current = null
    if (fullMp3Ref.current) URL.revokeObjectURL(fullMp3Ref.current)
    fullMp3Ref.current = null
    setFullWavUrl(null)
    setFullMp3Url(null)
    setDownloadStatus('')
    Object.values(clipMp3Refs.current).forEach((url) => URL.revokeObjectURL(url))
    clipMp3Refs.current = {}
    setClipMp3Urls({})
    setRecordProgress('')
    setRecordError('')
  }, [sourceSignature])
  const downloadable = ready.filter((block) => Boolean(
    (block.audio?.source === 'api' || block.audio?.source === 'browser-model')
    && block.audio.url && !block.audio.partial,
  ))
  const canExportAll = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'api' && block.audio.url && !block.audio.partial)
  const canRecordBrowser = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-speech' && block.audio.browserSpeech)
  const canRenderFileAudio = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-speech' || block.audio?.source === 'browser-model')
  const canExportLocalWav = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-model' && block.audio.url)
  useEffect(() => {
    if (!autoDownloadFileAudio || !canExportLocalWav) return
    setAutoDownloadFileAudio(false)
    void makeFullAudio('wav')
  // The action is armed only after all file-producing clips replace browser speech clips.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownloadFileAudio, canExportLocalWav])

  async function renderDownloadableVoice() {
    if (!onRenderFileAudio || renderingFileAudio) return
    const controller = new AbortController()
    fileAudioAbortRef.current = controller
    setFileAudioError('')
    setFileAudioProgress('파일 음성 엔진을 준비합니다. 첫 실행 시 약 380MB 모델 다운로드가 필요합니다.')
    setRenderingFileAudio(true)
    try {
      for (const [index, block] of voices.entries()) {
        if (controller.signal.aborted) throw new Error('파일 음성 생성이 취소되었습니다.')
        if (block.kind !== 'voice' || block.audio?.source === 'browser-model') continue
        await onRenderFileAudio(block.id, controller.signal, (message) => {
          setFileAudioProgress(`대사 ${index + 1}/${voices.length} · ${message}`)
        })
      }
      if (controller.signal.aborted) throw new Error('파일 음성 생성이 취소되었습니다.')
      setFileAudioProgress('파일 음성이 준비됐습니다. 전체 WAV 다운로드를 시작합니다.')
      setAutoDownloadFileAudio(true)
    } catch (error) {
      setFileAudioError(error instanceof Error ? error.message : '파일 음성을 만들지 못했습니다.')
      setFileAudioProgress('')
    } finally {
      if (fileAudioAbortRef.current === controller) fileAudioAbortRef.current = null
      setRenderingFileAudio(false)
    }
  }

  async function makeFullAudio(format: 'wav' | 'mp3') {
    setFullWavBusy(true)
    setWavError('')
    try {
      const blob = await buildTimelineWav(blocks)
      if (format === 'wav') {
        if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
        const url = URL.createObjectURL(blob)
        fullWavRef.current = url
        setFullWavUrl(url)
        startDownload(url, 'sorion-full.wav')
      } else {
        const mp3 = await wavToMp3(blob)
        if (fullMp3Ref.current) URL.revokeObjectURL(fullMp3Ref.current)
        const url = URL.createObjectURL(mp3)
        fullMp3Ref.current = url
        setFullMp3Url(url)
        startDownload(url, 'sorion-full.mp3')
      }
      setDownloadStatus(`${format.toUpperCase()} 다운로드를 시작했습니다. 저장 창이 열리지 않았다면 아래 다운로드 링크를 눌러 주세요.`)
    } catch (error) {
      setWavError(error instanceof Error ? error.message : '전체 음성 파일을 만들지 못했습니다.')
    } finally {
      setFullWavBusy(false)
    }
  }

  async function downloadClipMp3(block: TimelineBlock) {
    if (block.kind !== 'voice' || block.audio?.source !== 'browser-model' || !block.audio.url) return
    const signature = sourceSignature
    setClipMp3BusyId(block.id)
    setWavError('')
    try {
      const response = await fetch(block.audio.url)
      if (!response.ok) throw new Error('클립 WAV를 읽지 못했습니다. 다시 생성해 주세요.')
      const mp3 = await wavToMp3(await response.blob())
      if (sourceRef.current !== signature) return
      const url = URL.createObjectURL(mp3)
      if (clipMp3Refs.current[block.id]) URL.revokeObjectURL(clipMp3Refs.current[block.id])
      clipMp3Refs.current[block.id] = url
      setClipMp3Urls({ ...clipMp3Refs.current })
      startDownload(url, `sorion-voice-${voices.indexOf(block) + 1}.mp3`)
      setDownloadStatus(`대사 ${voices.indexOf(block) + 1} MP3 다운로드를 시작했습니다. 저장되지 않았다면 다시 다운로드 링크를 눌러 주세요.`)
    } catch (error) {
      setWavError(error instanceof Error ? error.message : '클립 MP3를 만들지 못했습니다.')
    } finally {
      setClipMp3BusyId(null)
    }
  }

  async function listCaptureDevices() {
    setRecordError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      const devices = await navigator.mediaDevices.enumerateDevices()
      setCaptureDevices(devices.filter((device) => device.kind === 'audioinput'))
      setCaptureOptionsOpen(true)
    } catch {
      setRecordError('소리 입력 장치에 접근하지 못했습니다. 브라우저 마이크 권한과 Windows 입력 장치 설정을 확인해 주세요.')
    }
  }

  async function startRecording(inputDeviceId?: string) {
    const controller = new AbortController()
    abortRef.current = controller
    setRecordError('')
    setRecordProgress(inputDeviceId ? '선택한 소리 입력 장치에서 성우 재생 소리를 녹음합니다.'
      : '브라우저 공유 창에서 소리가 포함된 탭 또는 화면 전체와 시스템 오디오를 선택해 주세요.')
    setRecording(true)
    try {
      const blob = await recordBrowserSpeech(blocks, controller.signal, (index, total) => {
        setRecordProgress(`대사·쉼표 녹음 중 ${index}/${total}`)
      }, inputDeviceId)
      if (controller.signal.aborted) throw new Error('녹음이 취소되었습니다.')
      setRecordProgress('녹음한 기본 성우 음성을 WAV·MP3로 변환 중…')
      const { wav, mp3 } = await recordedWebmToFiles(blob)
      if (controller.signal.aborted) throw new Error('녹음이 취소되었습니다.')
      try {
        await saveRecordedAudio(recordingSignature, wav, mp3)
      } catch {
        setRecordError('WAV·MP3 파일은 준비됐지만 브라우저 저장 공간에 보관하지 못했습니다. 지금 다운로드해 주세요.')
      }
      if (recordedWavRef.current) URL.revokeObjectURL(recordedWavRef.current)
      if (recordedMp3Ref.current) URL.revokeObjectURL(recordedMp3Ref.current)
      recordedWavRef.current = URL.createObjectURL(wav)
      recordedMp3Ref.current = URL.createObjectURL(mp3)
      setRecordedWavUrl(recordedWavRef.current)
      setRecordedMp3Url(recordedMp3Ref.current)
      setRecordedSource('capture')
      startDownload(recordedWavRef.current, 'sorion-default-voices.wav')
      setRecordProgress('기본 성우 WAV 다운로드를 시작했습니다. 저장되지 않았다면 아래 링크를 누르고, MP3도 선택해 받으세요.')
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : '녹음에 실패했습니다.')
      setRecordProgress('')
    } finally {
      abortRef.current = null
      setRecording(false)
    }
  }

  async function importWebm(file: File) {
    const signature = recordingSignature
    setRecordError('')
    setRecordProgress('선택한 WebM의 소리를 WAV·MP3로 변환 중…')
    try {
      if (file.size > 250 * 1024 * 1024) throw new Error('WebM 파일이 250MB를 넘습니다. 녹음을 나누어 가져와 주세요.')
      const { wav, mp3 } = await recordedWebmToFiles(file)
      if (recordingSignatureRef.current !== signature) return
      if (recordedWavRef.current) URL.revokeObjectURL(recordedWavRef.current)
      if (recordedMp3Ref.current) URL.revokeObjectURL(recordedMp3Ref.current)
      recordedWavRef.current = URL.createObjectURL(wav)
      recordedMp3Ref.current = URL.createObjectURL(mp3)
      setRecordedWavUrl(recordedWavRef.current)
      setRecordedMp3Url(recordedMp3Ref.current)
      setRecordedSource('import')
      startDownload(recordedWavRef.current, 'sorion-imported.wav')
      setRecordProgress('WebM에서 변환한 WAV 다운로드를 시작했습니다. 저장되지 않았다면 아래 링크를 누르고 MP3도 선택해 받으세요.')
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'WebM 파일을 변환하지 못했습니다.')
      setRecordProgress('')
    }
  }

  return (
    <section id="soa-generated-save" className="soa-generated-save" aria-label="생성한 음성 저장" tabIndex={-1}>
      <div className="soa-generated-save__heading">
        <strong>생성한 음성 저장하기</strong>
        <span>완료 {ready.length}/{voices.length}개 대사</span>
      </div>
      <p>완성된 음성 파일을 WAV 또는 MP3로 내려받으세요. 파일은 이 기기에 직접 저장됩니다.</p>
      {localAudioSaveWarning ? <p role="alert">{localAudioSaveWarning}</p> : null}
      {downloadable.length ? (
        <div className="soa-generated-save__clips">
          {downloadable.map((block) => (
            <div key={block.id}>
              <a href={block.audio!.url!} download={block.audio!.filename}
                aria-label={`완료 대사 ${voices.indexOf(block) + 1} 음성 파일 다운로드`}>
                ↓ {downloadable.length === 1 ? '음성 파일 다운로드' : `대사 ${voices.indexOf(block) + 1} 파일 다운로드`}
              </a>
              {block.audio?.source === 'browser-model' ? <button type="button" disabled={clipMp3BusyId !== null}
                onClick={() => void downloadClipMp3(block)}>
                {clipMp3BusyId === block.id ? 'MP3 변환 중…' : `대사 ${voices.indexOf(block) + 1} MP3 다운로드`}
              </button> : null}
              {clipMp3Urls[block.id] ? <a href={clipMp3Urls[block.id]}
                download={`sorion-voice-${voices.indexOf(block) + 1}.mp3`}>MP3 다시 다운로드</a> : null}
            </div>
          ))}
        </div>
      ) : null}
      {canExportLocalWav ? <div className="soa-generated-save__full-wav">
        <button type="button" disabled={fullWavBusy} onClick={() => void makeFullAudio('wav')}>
          {fullWavBusy ? '음성 파일 만드는 중…' : '전체 WAV 다운로드'}
        </button>
        {fullWavUrl ? <a href={fullWavUrl} download="sorion-full.wav">WAV 다시 다운로드</a> : null}
        <button type="button" disabled={fullWavBusy} onClick={() => void makeFullAudio('mp3')}>
          {fullWavBusy ? '음성 파일 만드는 중…' : '전체 MP3 다운로드'}
        </button>
        {fullMp3Url ? <a href={fullMp3Url} download="sorion-full.mp3">MP3 다시 다운로드</a> : null}
        {downloadStatus ? <p role="status">{downloadStatus}</p> : null}
      </div> : null}
      {canRecordBrowser || recordedWavUrl ? <div className="soa-generated-save__browser">
        <strong>기본 성우 음색 그대로 저장</strong>
        {canRecordBrowser ? <p>기기 성우가 대사를 다시 읽는 소리를 녹음해 WAV·MP3로 변환합니다. Chrome/Edge에서 현재 탭 또는 화면 전체의 오디오 공유가 필요합니다. PC에 따라 기기 성우 소리가 공유 오디오에 포함되지 않을 수 있습니다.</p> : null}
        {canRecordBrowser ? <button type="button" disabled={recording} onClick={() => void startRecording()}>
          {recording ? '기본 성우 녹음·변환 중…' : '기본 성우를 WAV·MP3로 저장'}
        </button> : null}
        {canRecordBrowser ? <div className="soa-generated-save__fallback">
          <p>화면 공유 녹음이 무음이면 Windows의 ‘스테레오 믹스’나 가상 루프백 입력 장치를 선택해 다시 녹음할 수 있습니다. 스피커 소리를 마이크로 받는 경우 주변 소음도 녹음됩니다.</p>
          <button type="button" disabled={recording} onClick={() => void listCaptureDevices()}>소리 입력 장치 선택</button>
          {captureOptionsOpen ? <>
            <select aria-label="녹음할 소리 입력 장치" value={captureDeviceId} onChange={(event) => setCaptureDeviceId(event.target.value)}>
              <option value="default">Windows 기본 입력 장치</option>
              {captureDevices.filter((device) => device.deviceId && device.deviceId !== 'default').map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label || '이름 없는 소리 입력 장치'}</option>
              ))}
            </select>
            <button type="button" disabled={recording} onClick={() => void startRecording(captureDeviceId)}>선택한 장치로 녹음·변환</button>
          </> : null}
          <label>소리가 담긴 WebM 파일이 있다면 불러와 WAV·MP3로 변환
            <input type="file" accept=".webm,audio/webm,video/webm" aria-label="소리가 담긴 WebM 불러오기"
              onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void importWebm(file); event.currentTarget.value = '' }} />
          </label>
        </div> : null}
        {recording ? <button type="button" onClick={() => abortRef.current?.abort()}>녹음 취소</button> : null}
        {recordProgress ? <p role="status">{recordProgress}</p> : null}
        {recordError ? <p role="alert">{recordError}</p> : null}
        {recordStorageError ? <p role="alert">{recordStorageError}</p> : null}
        {recordedWavUrl && recordedMp3Url ? <div className="soa-generated-save__preview">
          <audio controls src={recordedWavUrl} aria-label={recordedSource === 'import' ? '가져온 WebM 변환 미리 듣기' : '기본 성우 녹음 미리 듣기'} />
          <a href={recordedWavUrl} download={recordedSource === 'import' ? 'sorion-imported.wav' : 'sorion-default-voices.wav'}>{recordedSource === 'import' ? '가져온 음성 WAV 다운로드' : '기본 성우 WAV 다운로드'}</a>
          <a href={recordedMp3Url} download={recordedSource === 'import' ? 'sorion-imported.mp3' : 'sorion-default-voices.mp3'}>{recordedSource === 'import' ? '가져온 음성 MP3 다운로드' : '기본 성우 MP3 다운로드'}</a>
        </div> : null}
      </div> : null}
      {onRenderFileAudio && canRenderFileAudio && (recordError || fileAudioError || renderingFileAudio) ? <div className="soa-generated-save__file-recovery">
        <p>기본 성우 녹음이 무음이면 파일을 직접 만드는 한국어 음성으로 다시 생성할 수 있습니다. 기존 성우와 음색이 달라집니다. 첫 실행에는 약 380MB 모델 다운로드가 필요합니다.</p>
        <button type="button" disabled={renderingFileAudio} onClick={() => void renderDownloadableVoice()}>
          {renderingFileAudio ? '파일 음성 생성 중…' : '파일 음성으로 다시 생성해 WAV 저장'}
        </button>
        {renderingFileAudio ? <button type="button" onClick={() => fileAudioAbortRef.current?.abort()}>파일 음성 생성 취소</button> : null}
        {fileAudioProgress ? <p role="status">{fileAudioProgress}</p> : null}
        {fileAudioError ? <p role="alert">{fileAudioError}</p> : null}
      </div> : null}
      {wavError ? <p role="alert">{wavError}</p> : null}
      {canExportAll ? (
        <button type="button" onClick={onOpenExport}>전체 음성 MP3로 저장</button>
      ) : canRecordBrowser || canExportLocalWav ? null : (
        <p className="soa-generated-save__limit" role="note">
          {voices.length === 0 ? '먼저 대사를 입력하고 ‘대사로 만들기’를 눌러 주세요.'
            : '전체 음성 저장은 대사를 모두 서버 음원 또는 기기 내 WAV로 완성한 뒤 사용할 수 있습니다. 완성된 클립은 위에서 개별 다운로드할 수 있습니다.'}
        </p>
      )}
    </section>
  )
}
