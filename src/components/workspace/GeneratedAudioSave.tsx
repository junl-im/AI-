import { useEffect, useRef, useState } from 'react'
import { recordBrowserSpeech } from '../../export/recordBrowserSpeech'
import { buildTimelineWav } from '../../export/timelineWav'
import type { GeneratedAudio } from '../../tts/generationTypes'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

interface Props {
  blocks: TimelineBlock[]
  scriptText: string
  onOpenExport: () => void
  onRenderLocalWav?: (blockId: string, signal: AbortSignal, onProgress: (message: string) => void) => Promise<GeneratedAudio>
}

export function GeneratedAudioSave({ blocks, scriptText, onOpenExport, onRenderLocalWav }: Props) {
  const [recording, setRecording] = useState(false)
  const [recordProgress, setRecordProgress] = useState('')
  const [recordError, setRecordError] = useState('')
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [renderingWav, setRenderingWav] = useState(false)
  const [wavProgress, setWavProgress] = useState('')
  const [wavError, setWavError] = useState('')
  const [fullWavUrl, setFullWavUrl] = useState<string | null>(null)
  const [fullWavBusy, setFullWavBusy] = useState(false)
  const fullWavRef = useRef<string | null>(null)
  const wavAbortRef = useRef<AbortController | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const urlRef = useRef<string | null>(null)
  const sourceRef = useRef<string | null>(null)
  useEffect(() => () => {
    abortRef.current?.abort()
    wavAbortRef.current?.abort()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
  }, [])
  const voices = blocks.filter((block) => block.kind === 'voice')
  const ready = voices.filter((block) => block.status === 'ready')
  const sourceSignature = voices.map((block) => `${block.id}:${block.revision}:${block.status}:${block.audio?.source ?? ''}`).join('|')
  useEffect(() => {
    if (sourceRef.current === null) {
      sourceRef.current = sourceSignature
      return
    }
    if (sourceRef.current === sourceSignature) return
    sourceRef.current = sourceSignature
    abortRef.current?.abort()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
    if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
    fullWavRef.current = null
    setFullWavUrl(null)
    setRecordedUrl(null)
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
  const renderTargets = voices.filter((block) => block.status !== 'generating'
    && block.audio?.source !== 'api' && block.audio?.source !== 'browser-model')
  const canRenderLocalWav = Boolean(onRenderLocalWav && renderTargets.length > 0
    && voices.every((block) => block.status !== 'generating'))
  const canExportLocalWav = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-model' && block.audio.url)

  async function makeFullWav() {
    setFullWavBusy(true)
    setWavError('')
    try {
      const blob = await buildTimelineWav(blocks)
      if (fullWavRef.current) URL.revokeObjectURL(fullWavRef.current)
      const url = URL.createObjectURL(blob)
      fullWavRef.current = url
      setFullWavUrl(url)
    } catch (error) {
      setWavError(error instanceof Error ? error.message : '전체 WAV를 만들지 못했습니다.')
    } finally {
      setFullWavBusy(false)
    }
  }

  async function makeLocalWav() {
    if (!onRenderLocalWav) return
    const controller = new AbortController()
    wavAbortRef.current = controller
    setRenderingWav(true)
    setWavError('')
    try {
      for (const [index, block] of renderTargets.entries()) {
        if (controller.signal.aborted) throw new DOMException('취소됨', 'AbortError')
        setWavProgress(`WAV 파일 ${index + 1}/${renderTargets.length} 준비 중`)
        await onRenderLocalWav(block.id, controller.signal, setWavProgress)
      }
      setWavProgress('WAV 파일 생성 완료 · 아래의 대사별 다운로드를 이용해 주세요.')
    } catch (error) {
      setWavError(error instanceof Error ? error.message : 'WAV 생성에 실패했습니다.')
    } finally {
      wavAbortRef.current = null
      setRenderingWav(false)
    }
  }

  async function startRecording() {
    const controller = new AbortController()
    abortRef.current = controller
    setRecordError('')
    setRecordProgress('현재 탭과 탭 오디오 공유를 선택해 주세요.')
    setRecording(true)
    try {
      const blob = await recordBrowserSpeech(blocks, controller.signal, (index, total) => {
        setRecordProgress(`대사·쉼표 녹음 중 ${index}/${total}`)
      })
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setRecordedUrl(url)
      setRecordProgress('녹음 완료 · 아래에서 재생 확인 후 다운로드하세요.')
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
      <p>음성 파일은 이 PC에 직접 내려받아 보관하세요. 프로젝트 자동 저장은 이 브라우저에서만 유지됩니다.</p>
      {downloadable.length ? (
        <div className="soa-generated-save__clips">
          {downloadable.map((block) => (
            <a key={block.id} href={block.audio!.url!} download={block.audio!.filename}
              aria-label={`완료 대사 ${voices.indexOf(block) + 1} 음성 파일 다운로드`}>
              ↓ {downloadable.length === 1 ? '음성 파일 다운로드' : `대사 ${voices.indexOf(block) + 1} 파일 다운로드`}
            </a>
          ))}
        </div>
      ) : null}
      {canExportLocalWav ? <div className="soa-generated-save__full-wav">
        <button type="button" disabled={fullWavBusy} onClick={() => void makeFullWav()}>
          {fullWavBusy ? '전체 WAV 합치는 중…' : '전체 대사 WAV 만들기'}
        </button>
        {fullWavUrl ? <a href={fullWavUrl} download="sorion-full.wav">전체 WAV 다운로드</a> : null}
      </div> : null}
      {canRenderLocalWav || renderingWav || wavError || wavProgress ? (
        <div className="soa-generated-save__local-wav">
          {canRenderLocalWav ? <p>파일로 저장하고 타임라인 중간부터 재생하려면 기기 내 한국어 모델로 WAV를 만드세요. 기기 음성 설치가 없어도 사용할 수 있습니다. 첫 실행 시 약 380MB를 다운로드하며, 기존 성우 음색과는 다른 근사 스타일입니다.</p> : null}
          {canRenderLocalWav ? <button type="button" disabled={renderingWav} onClick={() => void makeLocalWav()}>
            {renderingWav ? 'WAV 생성 중…' : '대사 WAV 파일 만들기'}
          </button> : null}
          {renderingWav ? <button type="button" onClick={() => wavAbortRef.current?.abort()}>WAV 생성 취소</button> : null}
          {wavProgress ? <p role="status">{wavProgress}</p> : null}
          {wavError ? <p role="alert">{wavError}</p> : null}
        </div>
      ) : null}
      {canExportAll ? (
        <button type="button" onClick={onOpenExport}>전체 음성 MP3로 저장</button>
      ) : canRecordBrowser ? (
        <div className="soa-generated-save__browser">
          <p>현재 기기 내장 음성은 중간 위치 이동용 파일이 없습니다. 위 WAV 생성 또는 Chrome/Edge의 <b>현재 탭 오디오 공유</b>로 재생 소리를 녹음해 WebM으로 저장할 수 있습니다.</p>
          <button type="button" disabled={recording} onClick={() => void startRecording()}>
            {recording ? '녹음 중…' : '기기 음성 녹음해 다운로드'}
          </button>
          {recording ? <button type="button" onClick={() => abortRef.current?.abort()}>녹음 취소</button> : null}
          {recordProgress ? <p role="status">{recordProgress}</p> : null}
          {recordError ? <p role="alert">{recordError}</p> : null}
          {recordedUrl ? <div className="soa-generated-save__preview">
            <audio controls src={recordedUrl} aria-label="녹음된 음성 미리 듣기" />
            <a href={recordedUrl} download="sorion-browser-voice.webm">녹음 음성 WebM 다운로드</a>
          </div> : null}
        </div>
      ) : canExportLocalWav ? null : (
        <p className="soa-generated-save__limit" role="note">
          {voices.length === 0 ? '먼저 대사를 입력하고 ‘대사로 만들기’를 눌러 주세요.'
            : '전체 음성 저장은 대사를 모두 서버 음원 또는 기기 내 WAV로 완성한 뒤 사용할 수 있습니다. 완성된 클립은 위에서 개별 다운로드할 수 있습니다.'}
        </p>
      )}
      {scriptText ? <a className="soa-generated-save__script" href={`data:text/plain;charset=utf-8,${encodeURIComponent(scriptText)}`}
        download="sorion-script.txt">대본 TXT 다운로드</a> : null}
    </section>
  )
}
