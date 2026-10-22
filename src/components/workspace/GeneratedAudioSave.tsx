import { useEffect, useRef, useState } from 'react'
import { recordBrowserSpeech } from '../../export/recordBrowserSpeech'
import type { TimelineBlock } from '../../workspace/workspaceTypes'

interface Props {
  blocks: TimelineBlock[]
  scriptText: string
  onOpenExport: () => void
}

export function GeneratedAudioSave({ blocks, scriptText, onOpenExport }: Props) {
  const [recording, setRecording] = useState(false)
  const [recordProgress, setRecordProgress] = useState('')
  const [recordError, setRecordError] = useState('')
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const urlRef = useRef<string | null>(null)
  const sourceRef = useRef<string | null>(null)
  useEffect(() => () => {
    abortRef.current?.abort()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
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
    setRecordedUrl(null)
    setRecordProgress('')
    setRecordError('')
  }, [sourceSignature])
  const downloadable = ready.filter((block) => Boolean(block.audio?.source === 'api' && block.audio.url && !block.audio.partial))
  const canExportAll = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'api' && block.audio.url && !block.audio.partial)
  const canRecordBrowser = voices.length > 0 && ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'browser-speech' && block.audio.browserSpeech)

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
      {canExportAll ? (
        <button type="button" onClick={onOpenExport}>전체 음성 MP3로 저장</button>
      ) : canRecordBrowser ? (
        <div className="soa-generated-save__browser">
          <p>기기 내장 음성은 원본 음성 파일이 없습니다. Chrome/Edge의 <b>현재 탭 오디오 공유</b>로 재생 소리를 녹음해 WebM 파일로 저장할 수 있습니다.</p>
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
      ) : (
        <p className="soa-generated-save__limit" role="note">
          {voices.length === 0 ? '먼저 대사를 입력하고 ‘대사로 만들기’를 눌러 주세요.'
            : '전체 음성 저장은 모든 대사가 완성된 뒤 사용할 수 있습니다. 서버 음원은 MP3로, 기기 음성은 탭 오디오 녹음으로 저장합니다.'}
        </p>
      )}
      {scriptText ? <a className="soa-generated-save__script" href={`data:text/plain;charset=utf-8,${encodeURIComponent(scriptText)}`}
        download="sorion-script.txt">대본 TXT 다운로드</a> : null}
    </section>
  )
}
