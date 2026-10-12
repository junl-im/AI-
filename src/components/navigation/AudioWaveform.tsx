import { useEffect, useRef, useState } from 'react'
import { streamWavPeaks } from '../../audio/streamWavPeaks'

interface Props { url: string; duration: number; current: number; onSeek: (fraction: number) => void }
export function AudioWaveform({ url, duration, current, onSeek }: Props) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [waveDuration, setWaveDuration] = useState(duration)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [url])
  async function load() {
    if (loading) return
    const abort = new AbortController()
    abortRef.current?.abort()
    abortRef.current = abort
    setLoading(true)
    setStatus('파형을 읽고 있습니다…')
    let timedOut = false
    const timeout = window.setTimeout(() => { timedOut = true; abort.abort() }, 60000)
    try {
      const result = await streamWavPeaks(url, abort.signal, (percent) => {
        if (!abort.signal.aborted) setStatus(`파형을 읽고 있습니다… ${percent}%`)
      })
      if (abort.signal.aborted) return
      setPeaks(result.peaks)
      setWaveDuration(result.duration)
      setStatus('실제 음원의 파형 · 아래 탐색바로 이동할 수 있어요.')
    } catch (error) {
      if (abortRef.current !== abort) return
      if (timedOut) setStatus('파형 읽기 시간이 초과됐습니다. 다시 시도해 주세요.')
      else if (!abort.signal.aborted) setStatus(error instanceof Error ? error.message : '파형을 읽지 못했습니다.')
    } finally {
      window.clearTimeout(timeout)
      if (abortRef.current === abort && (!abort.signal.aborted || timedOut)) setLoading(false)
    }
  }
  function cancel() {
    abortRef.current?.abort()
    setLoading(false)
    setStatus('파형 읽기를 취소했습니다. 음원 재생은 계속할 수 있어요.')
  }
  return (
    <section className="soa-audio-waveform" aria-label="결과 음원 파형">
      {peaks.length ? <>
        <svg viewBox="0 0 384 40" preserveAspectRatio="none" aria-hidden="true">{peaks.map((peak, index) => <rect key={index} x={index * 384 / peaks.length} y={20 - peak * 19} width={Math.max(1, 384 / peaks.length - 1)} height={Math.max(1, peak * 38)} rx="1" className={index / peaks.length < current / Math.max(0.1, waveDuration) ? 'is-played' : ''} />)}</svg>
        <input type="range" min={0} max={Math.max(0.1, waveDuration)} step={0.1} value={Math.min(current, Math.max(0.1, waveDuration))} onChange={(event) => onSeek(Number(event.target.value) / Math.max(0.1, waveDuration))} aria-label="파형 재생 위치" aria-valuetext={`${Math.round(current)}초 / ${Math.round(waveDuration)}초`} />
      </> : <button type="button" disabled={loading} onClick={() => void load()}>{loading ? '파형 준비 중…' : '파형 보기'}</button>}
      {loading ? <button type="button" onClick={cancel}>파형 읽기 취소</button> : null}
      {status ? <p role="status">{status}</p> : null}
    </section>
  )
}
