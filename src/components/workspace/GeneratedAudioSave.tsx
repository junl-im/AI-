import type { TimelineBlock } from '../../workspace/workspaceTypes'

interface Props {
  blocks: TimelineBlock[]
  scriptText: string
  onOpenExport: () => void
}

export function GeneratedAudioSave({ blocks, scriptText, onOpenExport }: Props) {
  const voices = blocks.filter((block) => block.kind === 'voice')
  const ready = voices.filter((block) => block.status === 'ready')
  if (ready.length === 0) return null
  const downloadable = ready.filter((block) => Boolean(block.audio?.source === 'api' && block.audio.url && !block.audio.partial))
  const canExportAll = ready.length === voices.length
    && ready.every((block) => block.audio?.source === 'api' && block.audio.url && !block.audio.partial)

  return (
    <section className="soa-generated-save" aria-label="생성한 음성 저장">
      <div className="soa-generated-save__heading">
        <strong>생성한 음성 저장하기</strong>
        <span>완료 {ready.length}/{voices.length}개 대사</span>
      </div>
      <p>음성 파일은 이 기기에 직접 내려받아 보관하세요. 프로젝트 자동 저장은 이 브라우저에서만 유지됩니다.</p>
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
      ) : (
        <p className="soa-generated-save__limit" role="note">
          {ready.some((block) => block.audio?.source === 'browser-speech')
            ? '기기 내장 브라우저 음성은 재생용이며 WAV/MP3 파일이 생성되지 않습니다. 음성 파일 저장은 실제 음성 서버에서 만든 결과만 가능합니다.'
            : '전체 MP3는 모든 대사가 서버 음원으로 완성된 뒤 저장할 수 있습니다.'}
        </p>
      )}
      <a className="soa-generated-save__script" href={`data:text/plain;charset=utf-8,${encodeURIComponent(scriptText)}`}
        download="sorion-script.txt">대본 TXT 다운로드</a>
    </section>
  )
}
