import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

interface VoiceSampleCaptureProps {
  file: File | null
  recording: boolean
  seconds: number
  error: string | null
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onFile: (file: File) => void
}

const sampleScripts = [
  {
    id: 'natural',
    label: '자연스러운 대화',
    text: '오늘은 날씨가 꽤 좋네요. 저는 평소처럼 천천히 이야기하고 있고, 중요한 단어는 조금 또렷하게 말해 보겠습니다. 너무 힘주지 말고 편안한 목소리로 읽어 주세요.',
  },
  {
    id: 'narration',
    label: '내레이션',
    text: '작은 변화는 어느 날 갑자기 완성되지 않습니다. 익숙한 하루 속에서 조금씩 쌓인 선택이 결국 새로운 장면을 만듭니다. 문장 끝까지 호흡을 유지하며 차분하게 읽어 주세요.',
  },
  {
    id: 'expressive',
    label: '표현력 체크',
    text: '정말 반가워요! 잠깐만요, 이 부분은 조금 더 차분하게 이야기해 볼게요. 같은 목소리 안에서도 밝음과 진지함이 자연스럽게 이어지도록 읽어 주세요.',
  },
]

function formatSeconds(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`
}

export function VoiceSampleCapture({
  file,
  recording,
  seconds,
  error,
  onStart,
  onStop,
  onReset,
  onFile,
}: VoiceSampleCaptureProps) {
  const [scriptId, setScriptId] = useState(sampleScripts[0].id)
  const script = sampleScripts.find((item) => item.id === scriptId) ?? sampleScripts[0]
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const targetProgress = Math.min(100, (seconds / 30) * 100)
  const readinessLabel = seconds >= 20 ? '고품질 구간' : seconds >= 10 ? '사용 가능 구간' : '10초 이상 권장'

  return (
    <section className="soa-clone-card soa-voice-capture-pro" aria-labelledby="clone-capture-title">
      <div className="soa-clone-card__head">
        <div>
          <span>STEP 01 · CAPTURE</span>
          <h2 id="clone-capture-title">내 목소리의 기준 샘플을 만드세요.</h2>
        </div>
        <strong className={recording ? 'is-recording' : ''}>{recording ? `REC ${formatSeconds(seconds)}` : readinessLabel}</strong>
      </div>
      <p>15~30초 동안 평소 발성으로 또렷하게 읽는 것이 가장 안정적입니다. 감정을 과하게 연기하기보다 숨소리·룸 노이즈·반사를 줄이는 것이 먼저입니다.</p>

      <div className="soa-capture-tips" aria-label="좋은 샘플 만들기 팁">
        <span>↔ 마이크 15~25cm</span>
        <span>⌁ 한 공간에서 녹음</span>
        <span>◌ 배경음악 없이</span>
        <span>◎ 평소 말하는 크기</span>
      </div>

      <div className="soa-reference-script">
        <div className="soa-reference-script__head">
          <strong>읽기 가이드</strong>
          <div role="tablist" aria-label="샘플 문장 선택">
            {sampleScripts.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === scriptId}
                className={item.id === scriptId ? 'is-active' : ''}
                onClick={() => setScriptId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <p>{script.text}</p>
      </div>

      <div className="soa-record-guide is-pro" aria-label={`녹음 길이 ${seconds}초`}>
        <i style={{ width: `${targetProgress}%` }} />
        <span>0s</span>
        <span>10s 최소</span>
        <span>20s 권장</span>
        <span>30s 최적</span>
      </div>

      <div className="soa-capture-actions">
        <button
          type="button"
          className={recording ? 'is-stop' : 'is-record'}
          onClick={recording ? onStop : onStart}
        >
          {recording ? '■ 녹음 마치기' : '● 마이크로 녹음'}
        </button>
        <label>
          음성 파일 가져오기
          <input
            type="file"
            accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/webm,audio/ogg,.m4a"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const selected = event.target.files?.[0]
              if (selected) onFile(selected)
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      {error ? <p className="soa-clone-error">{error}</p> : null}
      {file && previewUrl ? (
        <div className="soa-sample-preview is-pro">
          <div>
            <span><strong>{file.name}</strong><small>원본 샘플</small></span>
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <audio controls src={previewUrl} />
          <button type="button" onClick={onReset}>이 샘플 지우고 다시 준비</button>
        </div>
      ) : null}
    </section>
  )
}
