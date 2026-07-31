import { motion } from 'motion/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { TtsSynthesisRequest, TtsSynthesisResult, VoiceEmotion } from '../ai/contracts'
import { StatusPill } from '../components/ui/StatusPill'
import { saveProject } from '../projects/projectRepository'
import { useAppStore } from '../store/useAppStore'
import { synthesizeSpeech } from '../tts/voiceApi'
import { validateVoiceSample } from '../utils/fileValidation'

const voices = [
  { id: 'sori-warm', name: '소리 · 따뜻함' },
  { id: 'on-clear', name: '온 · 또렷함' },
  { id: 'dam-calm', name: '담 · 차분함' },
]

const emotions: Array<{ id: VoiceEmotion; name: string }> = [
  { id: 'neutral', name: '자연스럽게' },
  { id: 'happy', name: '밝게' },
  { id: 'calm', name: '차분하게' },
  { id: 'commercial', name: '광고톤' },
]

export function HomePage() {
  const showNotice = useAppStore((state) => state.showNotice)
  const [text, setText] = useState('안녕하세요. 목소리의 가능성을 켜는 소리온입니다.')
  const [voiceId, setVoiceId] = useState(voices[0].id)
  const [emotion, setEmotion] = useState<VoiceEmotion>('neutral')
  const [advanced, setAdvanced] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [pitch, setPitch] = useState(0)
  const [sampleName, setSampleName] = useState<string | null>(null)
  const [result, setResult] = useState<TtsSynthesisResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim()) {
      showNotice('먼저 읽을 문장을 입력해 주세요.')
      return
    }

    const request: TtsSynthesisRequest = {
      text: text.trim(),
      voiceId,
      emotion,
      speed,
      pitch,
      format: 'wav',
    }

    setSubmitting(true)
    try {
      const nextResult = await synthesizeSpeech(request)
      const now = new Date().toISOString()
      await saveProject({
        id: crypto.randomUUID(),
        title: text.trim().slice(0, 24),
        text: text.trim(),
        voiceId,
        emotion,
        createdAt: now,
        updatedAt: now,
        status: nextResult.audioUrl ? 'generated' : 'draft',
        lastJobId: nextResult.jobId,
      })
      setResult(nextResult)
      showNotice(nextResult.message)
    } catch (error) {
      showNotice(error instanceof Error ? error.message : '음성 생성 요청에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSample(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const validation = validateVoiceSample(file)
    if (!validation.valid) {
      event.target.value = ''
      showNotice(validation.message)
      return
    }
    setSampleName(file.name)
    showNotice('음성 샘플은 현재 기기에만 준비되었습니다.')
  }

  return (
    <div className="pb-3 pt-6">
      <section className="mb-6">
        <StatusPill label="VOICE STUDIO" tone="good" />
        <h1 className="mt-4 max-w-[390px] text-[38px] font-black leading-[0.98] tracking-[-0.07em]">
          문장을 입력하면,
          <br />
          <span className="text-soa-muted">소리온이 말합니다.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-soa-muted">
          어려운 설정은 숨기고 가장 중요한 작업만 앞에 두었습니다. 문장을 입력하고 목소리를 고른 뒤 바로 생성하세요.
        </p>
      </section>

      <motion.form
        onSubmit={handleSubmit}
        layout
        className="rounded-[30px] border border-soa-line bg-soa-card p-4 shadow-soa"
      >
        <label htmlFor="voice-text" className="mb-2 block text-xs font-bold text-soa-muted">읽을 문장</label>
        <textarea
          id="voice-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1000}
          rows={6}
          className="focus-ring w-full resize-none rounded-2xl border border-soa-line bg-white px-4 py-3 text-[17px] font-medium leading-7 tracking-[-0.025em]"
          placeholder="목소리로 만들 문장을 입력하세요."
        />
        <div className="mt-2 flex justify-end text-[11px] font-semibold text-soa-muted">{text.length} / 1,000</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-bold text-soa-muted">
            목소리
            <select
              value={voiceId}
              onChange={(event) => setVoiceId(event.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-soa-line bg-white px-3 py-3 text-sm font-semibold text-soa-ink"
            >
              {voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-soa-muted">
            느낌
            <select
              value={emotion}
              onChange={(event) => setEmotion(event.target.value as VoiceEmotion)}
              className="focus-ring mt-2 w-full rounded-2xl border border-soa-line bg-white px-3 py-3 text-sm font-semibold text-soa-ink"
            >
              {emotions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setAdvanced((value) => !value)}
          className="focus-ring mt-4 w-full rounded-2xl border border-soa-line px-4 py-3 text-left text-sm font-bold text-soa-muted"
          aria-expanded={advanced}
        >
          {advanced ? '−' : '+'} Advanced 설정
        </button>

        {advanced ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-4 rounded-2xl bg-[#f4f2ec] p-4">
            <label className="block text-xs font-bold text-soa-muted">
              속도 {speed.toFixed(1)}배
              <input type="range" min="0.7" max="1.4" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-2 w-full" />
            </label>
            <label className="block text-xs font-bold text-soa-muted">
              피치 {pitch > 0 ? '+' : ''}{pitch}
              <input type="range" min="-6" max="6" step="1" value={pitch} onChange={(event) => setPitch(Number(event.target.value))} className="mt-2 w-full" />
            </label>
            <label className="block rounded-2xl border border-dashed border-soa-line bg-white px-4 py-3 text-sm font-semibold">
              <span className="block">목소리 샘플 선택</span>
              <span className="mt-1 block text-xs font-normal text-soa-muted">{sampleName ?? 'MP3, WAV, FLAC, M4A · 최대 25MB'}</span>
              <input type="file" accept="audio/*" onChange={handleSample} className="mt-3 block w-full text-xs" />
            </label>
          </motion.div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring mt-4 min-h-14 w-full rounded-2xl bg-soa-ink px-5 text-base font-black text-white transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'AI 서버 확인 중…' : '음성 생성 시작'}
        </button>
      </motion.form>

      {result ? (
        <section className="mt-4 rounded-[26px] border border-soa-line bg-soa-lime p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black tracking-[-0.035em]">개발 연결 결과</h2>
            <StatusPill label={result.engineId} />
          </div>
          <p className="mt-2 text-sm leading-6">{result.message}</p>
          <p className="mt-3 text-xs font-semibold text-soa-muted">작업 ID {result.jobId.slice(0, 8)} · 예상 {result.estimatedDurationSeconds.toFixed(1)}초</p>
        </section>
      ) : null}
    </div>
  )
}
