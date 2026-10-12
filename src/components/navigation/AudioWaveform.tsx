import { useEffect, useRef, useState } from 'react'
import { fetchBoundedAudio, inspectPreviewWav, waveformPeaks } from '../../audio/waveform'

interface Props { url: string; duration: number; current: number; onSeek: (fraction: number) => void }
export function AudioWaveform({ url, duration, current, onSeek }: Props) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [url])
  async function load() {
    if (loading) return
    const abort = new AbortController()
    abortRef.current?.abort()
    abortRef.current = abort
    setLoading(true)
    setStatus('파형을 읽고 있습니다…')
    let context: AudioContext | null = null
    try {
      if (duration > 300) throw new Error('5분 이하 음원에서 파형을 볼 수 있어요. 긴 음원은 기존 탐색바를 이용하세요.')
      if (!window.AudioContext) throw new Error('이 브라우저에서는 파형 분석을 지원하지 않습니다.')
      const bytes = await fetchBoundedAudio(url, abort.signal)
      if (abort.signal.aborted) return
      inspectPreviewWav(bytes)
      context = new AudioContext()
      const audio = await context.decodeAudioData(bytes)
      if (abort.signal.aborted) return
      if (audio.duration > 300) throw new Error('5분 이하 음원에서 파형을 볼 수 있어요.')
      const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index))
      setPeaks(waveformPeaks(channels))
      setStatus('실제 음원의 파형 · 아래 탐색바로 이동할 수 있어요.')
    } catch (error) {
      if (!abort.signal.aborted) setStatus(error instanceof Error ? error.message : '파형을 읽지 못했습니다.')
    } finally {
      if (context) await context.close().catch(() => undefined)
      if (!abort.signal.aborted) setLoading(false)
    }
  }
  return (
    <section className="soa-audio-waveform" aria-label="결과 음원 파형">
      {peaks.length ? <>
        <svg viewBox="0 0 384 40" preserveAspectRatio="none" aria-hidden="true">{peaks.map((peak, index) => <rect key={index} x={index * 384 / peaks.length} y={20 - peak * 19} width={Math.max(1, 384 / peaks.length - 1)} height={Math.max(1, peak * 38)} rx="1" className={index / peaks.length < current / Math.max(1, duration) ? 'is-played' : ''} />)}</svg>
        <input type="range" min={0} max={Math.max(1, duration)} step={0.1} value={Math.min(current, Math.max(1, duration))} onChange={(event) => onSeek(Number(event.target.value) / Math.max(1, duration))} aria-label="파형 재생 위치" aria-valuetext={`${Math.round(current)}초 / ${Math.round(duration)}초`} />
      </> : <button type="button" disabled={loading} onClick={() => void load()}>{loading ? '파형 준비 중…' : '파형 보기'}</button>}
      {status ? <p role="status">{status}</p> : null}
    </section>
  )
}
