import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import type { TtsSynthesisRequest, VoiceEmotion } from '../ai/contracts'
import { AdvancedVoiceSettings } from '../components/voice/AdvancedVoiceSettings'
import { AudioResultCard } from '../components/voice/AudioResultCard'
import { EmotionSelector } from '../components/voice/EmotionSelector'
import { EngineStatusCard } from '../components/voice/EngineStatusCard'
import { GenerationErrorCard } from '../components/voice/GenerationErrorCard'
import { GenerationProgress } from '../components/voice/GenerationProgress'
import { TextComposer } from '../components/voice/TextComposer'
import { VoicePresetSelector } from '../components/voice/VoicePresetSelector'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import { useVoiceGeneration } from '../hooks/useVoiceGeneration'
import { saveProject } from '../projects/projectRepository'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { getVoicePreset, voicePresets } from '../tts/voicePresets'

const DEFAULT_TEXT = '안녕하세요. 목소리의 가능성을 켜는 소리온입니다.'

export function HomePage() {
  const showNotice = useAppStore((state) => state.showNotice)
  const setPlayerAudio = usePlayerStore((state) => state.setAudio)
  const [text, setText] = useState(DEFAULT_TEXT)
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [emotion, setEmotion] = useState<VoiceEmotion>('neutral')
  const [advanced, setAdvanced] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [pitch, setPitch] = useState(0)
  const generation = useVoiceGeneration()
  const engineCatalog = useEngineCatalog()
  const busy = ['preparing', 'requesting', 'rendering'].includes(generation.phase)

  function buildRequest(): TtsSynthesisRequest {
    return {
      text: text.trim(),
      voiceId,
      emotion: engineCatalog.selected?.supportsEmotion ? emotion : 'neutral',
      speed: engineCatalog.selected?.supportsSpeed ? speed : 1,
      pitch: engineCatalog.selected?.supportsPitch ? pitch : 0,
      format: 'wav',
      engineId: engineCatalog.selected?.id,
    }
  }

  async function saveGeneration(request: TtsSynthesisRequest, jobId: string, engineId: string, engineMode: 'ai' | 'local' | 'mock', source: 'api' | 'browser-demo') {
    const now = new Date().toISOString()
    await saveProject({
      id: crypto.randomUUID(),
      title: request.text.slice(0, 24),
      text: request.text,
      voiceId: request.voiceId,
      emotion: request.emotion,
      createdAt: now,
      updatedAt: now,
      status: 'generated',
      lastJobId: jobId,
      engineId,
      engineMode,
      audioSource: source,
      outputFormat: request.format,
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!text.trim()) {
      showNotice('먼저 읽을 문장을 입력해 주세요.')
      return
    }

    const request = buildRequest()
    const voice = getVoicePreset(voiceId)
    const audio = await generation.generate({ request, voiceName: voice.shortName })
    if (!audio) return

    setPlayerAudio(audio, request.text.slice(0, 34))

    try {
      await saveGeneration(request, audio.result.jobId, audio.result.engineId, audio.result.engineMode, audio.source)
      showNotice(audio.result.engineMode === 'ai' ? 'AI 음성을 생성하고 프로젝트에 저장했습니다.' : audio.result.engineMode === 'local' ? '로컬 음성을 생성하고 프로젝트에 저장했습니다.' : '데모 WAV를 만들고 프로젝트에 저장했습니다.')
    } catch {
      showNotice('음성은 준비됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }

  async function handleRetry() {
    const audio = await generation.retry()
    if (!audio || !generation.lastAttempt) return
    setPlayerAudio(audio, generation.lastAttempt.request.text.slice(0, 34))
    try {
      await saveGeneration(generation.lastAttempt.request, audio.result.jobId, audio.result.engineId, audio.result.engineMode, audio.source)
      showNotice('같은 설정으로 다시 생성했습니다.')
    } catch {
      showNotice('다시 생성했지만 프로젝트 저장에는 실패했습니다.')
    }
  }

  return (
    <div className="pb-3 pt-5">
      <section className="mb-5 px-1">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.17em] text-soa-muted">
          <span className="inline-block size-2 rounded-full bg-soa-lime shadow-[0_0_0_5px_rgba(216,255,114,0.28)]" aria-hidden="true" />
          KOREAN VOICE WORKSPACE
        </div>
        <h1 className="mt-4 max-w-[440px] text-[36px] font-black leading-[0.98] tracking-[-0.07em] sm:text-[42px]">
          문장 하나면,
          <br />
          <span className="text-soa-muted">목소리는 바로 시작됩니다.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm font-medium leading-6 text-soa-muted">
          문장을 입력하면 숫자와 날짜를 한국어 발음에 맞게 다듬고, 긴 문장은 자동으로 나눠 하나의 WAV로 연결합니다.
        </p>
      </section>

      <EngineStatusCard engine={engineCatalog.selected} loading={engineCatalog.loading} />

      <motion.form
        onSubmit={handleSubmit}
        layout
        className="rounded-[30px] border border-soa-line bg-soa-card p-4 shadow-soa sm:p-5"
      >
        <TextComposer value={text} onChange={setText} />
        <VoicePresetSelector value={voiceId} onChange={setVoiceId} />
        <EmotionSelector value={emotion} supported={engineCatalog.selected?.supportsEmotion ?? false} onChange={setEmotion} />
        <AdvancedVoiceSettings
          open={advanced}
          speed={speed}
          pitch={pitch}
          supportsSpeed={engineCatalog.selected?.supportsSpeed ?? false}
          supportsPitch={engineCatalog.selected?.supportsPitch ?? false}
          onToggle={() => setAdvanced((value) => !value)}
          onSpeedChange={setSpeed}
          onPitchChange={setPitch}
        />

        <GenerationProgress phase={generation.phase} progress={generation.progress} onCancel={generation.cancel} />

        <button
          type="submit"
          disabled={busy}
          className="focus-ring mt-5 min-h-14 w-full rounded-[20px] bg-soa-ink px-5 text-base font-black text-white shadow-[0_16px_32px_rgba(23,23,20,0.18)] transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-55"
        >
          {busy ? '소리온이 음성을 만들고 있어요…' : '음성 생성 시작'}
        </button>
        <p className="mt-2 text-center text-[10px] font-bold leading-4 text-soa-muted">
          로컬 API에 한국어 시스템 음성이 있으면 실제 WAV를 만들고, 연결되지 않으면 기능 확인용 데모 WAV를 만듭니다.
        </p>
      </motion.form>

      {generation.audio ? (
        <AudioResultCard audio={generation.audio} onRetry={() => void handleRetry()} onReset={generation.reset} />
      ) : null}
      {generation.error ? (
        <GenerationErrorCard message={generation.error} onRetry={() => void handleRetry()} />
      ) : null}
    </div>
  )
}
