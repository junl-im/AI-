import { useEffect, useRef, useState } from 'react'
import { recordBrowserSpeech } from '../../export/recordBrowserSpeech'
import { recordedWebmToFiles } from '../../export/recordedAudioFormats'
import { buildTimelineWav } from '../../export/timelineWav'
import { wavToMp3 } from '../../export/wavToMp3'
import { loadRecordedAudio, saveRecordedAudio } from '../../storage/recordedAudioRepository'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

interface Props {
  blocks: TimelineBlock[]
  localAudioSaveWarning?: string | null
  onOpenExport: () => void
}

function startDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function GeneratedAudioSave({ blocks, localAudioSaveWarning, onOpenExport }: Props) {
  const [recording, setRecording] = useState(false)
  const [recordProgress, setRecordProgress] = useState('')
  const [recordError, setRecordError] = useState('')
  const [recordedWavUrl, setRecordedWavUrl] = useState<string | null>(null)
  const [recordedMp3Url, setRecordedMp3Url] = useState<string | null>(null)
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
    if (voices.length) {
      void loadRecordedAudio(recordingSignature).then((record) => {
        if (!active || !record || recordingSignatureRef.current !== recordingSignature) return
        recordedWavRef.current = URL.createObjectURL(record.wav)
        recordedMp3Ref.current = URL.createObjectURL(record.mp3)
        setRecordedWavUrl(recordedWavRef.current)
        setRecordedMp3Url(recordedMp3Ref.current)
        setRecordProgress('이 브라우저에 보관된 기본 성우 녹음을 복구했습니다.')
      }).catch(() => {
        if (active) setRecordError('저장된 녹음을 읽지 못했습니다. 브라우저 저장소를 확인해 주세요.')
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
  const canExportLocalWav = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-model' && block.audio.url)

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

  async function startRecording() {
    const controller = new AbortController()
    abortRef.current = controller
    setRecordError('')
    setRecordProgress('브라우저 공유 창에서 소리가 포함된 탭 또는 화면 전체와 시스템 오디오를 선택해 주세요.')
    setRecording(true)
    try {
      const blob = await recordBrowserSpeech(blocks, controller.signal, (index, total) => {
        setRecordProgress(`대사·쉼표 녹음 중 ${index}/${total}`)
      })
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
      setRecordProgress('기본 성우 녹음 완료 · 먼저 재생해 음색을 확인한 뒤 WAV 또는 MP3를 내려받으세요.')
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : '녹음에 실패했습니다.')
      setRecordProgress('')
    } finally {
      abortRef.current = null
      setRecording(false)
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
        {recording ? <button type="button" onClick={() => abortRef.current?.abort()}>녹음 취소</button> : null}
        {recordProgress ? <p role="status">{recordProgress}</p> : null}
        {recordError ? <p role="alert">{recordError}</p> : null}
        {recordedWavUrl && recordedMp3Url ? <div className="soa-generated-save__preview">
          <audio controls src={recordedWavUrl} aria-label="기본 성우 녹음 미리 듣기" />
          <a href={recordedWavUrl} download="sorion-default-voices.wav">기본 성우 WAV 다운로드</a>
          <a href={recordedMp3Url} download="sorion-default-voices.mp3">기본 성우 MP3 다운로드</a>
        </div> : null}
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
