import { AnimatePresence, motion } from 'motion/react'
import type { ChangeEvent } from 'react'
import {
  formatPitch,
  VOICE_PITCH_CONTROL,
  VOICE_SPEED_CONTROL,
} from '../../voice/voiceControlOptions'

interface AdvancedVoiceSettingsProps {
  open: boolean
  speed: number
  pitch: number
  supportsSpeed: boolean
  supportsPitch: boolean
  onToggle: () => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
}

export function AdvancedVoiceSettings({
  open,
  speed,
  pitch,
  supportsSpeed,
  supportsPitch,
  onToggle,
  onSpeedChange,
  onPitchChange,
}: AdvancedVoiceSettingsProps) {
  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={onToggle}
        className="focus-ring flex min-h-12 w-full items-center justify-between rounded-2xl border border-soa-line bg-[#f4f2ec] px-4 text-sm font-black"
        aria-expanded={open}
        aria-controls="advanced-voice-settings"
      >
        <span>Advanced 설정</span>
        <span className="text-lg text-soa-muted" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="advanced-voice-settings"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-5 rounded-[22px] border border-soa-line bg-white p-4">
              <label className={`block text-xs font-black text-soa-muted ${supportsSpeed ? '' : 'opacity-45'}`}>
                <span className="flex justify-between"><span>말하기 속도</span><strong className="text-soa-ink">{speed.toFixed(2)}배</strong></span>
                <input
                  type="range"
                  min={VOICE_SPEED_CONTROL.min}
                  max={VOICE_SPEED_CONTROL.max}
                  step={VOICE_SPEED_CONTROL.step}
                  value={speed}
                  disabled={!supportsSpeed}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onSpeedChange(Number(event.target.value))}
                  className="mt-3 w-full accent-[#171714] disabled:cursor-not-allowed"
                  aria-label="음성 속도"
                  aria-valuetext={`${speed.toFixed(2)}배`}
                />
              </label>
              <label className={`block text-xs font-black text-soa-muted ${supportsPitch ? '' : 'opacity-45'}`}>
                <span className="flex justify-between"><span>높낮이</span><strong className="text-soa-ink">{formatPitch(pitch)}</strong></span>
                <input
                  type="range"
                  min={VOICE_PITCH_CONTROL.min}
                  max={VOICE_PITCH_CONTROL.max}
                  step={VOICE_PITCH_CONTROL.step}
                  value={pitch}
                  disabled={!supportsPitch}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onPitchChange(Number(event.target.value))}
                  className="mt-3 w-full accent-[#171714] disabled:cursor-not-allowed"
                  aria-label="음성 높낮이"
                  aria-valuetext={formatPitch(pitch)}
                />
              </label>
              <p className="rounded-2xl bg-[#f4f2ec] px-3 py-2 text-[11px] font-semibold leading-5 text-soa-muted">
                현재 음성 방식에서 사용할 수 있는 설정만 활성화됩니다. 긴 문장은 자동으로 나누어 WAV 하나로 연결합니다.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
