import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamWavPeaks } from '../../audio/streamWavPeaks'
import { AudioWaveform } from './AudioWaveform'
vi.mock('../../audio/streamWavPeaks',()=>({streamWavPeaks:vi.fn()}))
afterEach(()=>{vi.resetAllMocks();vi.useRealTimers()})
const props={url:'blob:test',duration:600,current:0,onSeek:vi.fn()}
describe('waveform lifecycle',()=>{
  it('does not request audio before clicking and discards a cancelled result after retry',async()=>{
    let resolveFirst!: (value: {peaks:number[];duration:number})=>void
    vi.mocked(streamWavPeaks).mockImplementationOnce(()=>new Promise(resolve=>{resolveFirst=resolve})).mockResolvedValueOnce({peaks:[0.5],duration:600})
    render(<AudioWaveform {...props}/> )
    expect(streamWavPeaks).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button',{name:'파형 보기'}))
    fireEvent.click(screen.getByRole('button',{name:'파형 읽기 취소'}))
    fireEvent.click(screen.getByRole('button',{name:'파형 보기'}))
    expect(await screen.findByRole('slider',{name:'파형 재생 위치'})).toHaveAttribute('max','600')
    await act(async()=>resolveFirst({peaks:[1],duration:2}))
    expect(screen.getByRole('slider')).toHaveAttribute('max','600')
    expect(screen.getByRole('status')).toHaveTextContent('실제 음원')
  })
  it('ends a stalled request after one minute and permits retry',async()=>{
    vi.mocked(streamWavPeaks).mockImplementation((_url,signal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))))
    vi.useFakeTimers()
    render(<AudioWaveform {...props}/> )
    fireEvent.click(screen.getByRole('button',{name:'파형 보기'}))
    await act(async()=>{await vi.advanceTimersByTimeAsync(60000)})
    expect(screen.getByRole('status')).toHaveTextContent('시간이 초과')
    expect(screen.getByRole('button',{name:'파형 보기'})).not.toBeDisabled()
  })
  it('aborts analysis when the track is removed',()=>{
    vi.mocked(streamWavPeaks).mockImplementation(()=>new Promise(()=>{}))
    const view=render(<AudioWaveform {...props}/> )
    fireEvent.click(screen.getByRole('button',{name:'파형 보기'}))
    const signal=vi.mocked(streamWavPeaks).mock.calls[0][1]
    view.unmount()
    expect(signal.aborted).toBe(true)
  })
})
