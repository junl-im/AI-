import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamWavPeaks } from './streamWavPeaks'

function wav(samples: number[], options: { bits?: number; format?: number; channels?: number; frames?: number } = {}) {
  const { bits = 16, format = 1, channels = 1, frames = samples.length / channels } = options
  const bytes = new Uint8Array(44 + samples.length * bits / 8)
  const view = new DataView(bytes.buffer)
  for (const [offset, text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']] as const) for (let i=0;i<4;i++) bytes[offset+i]=text.charCodeAt(i)
  view.setUint32(4, bytes.length-8, true);view.setUint32(16,16,true)
  view.setUint16(20,format,true);view.setUint16(22,channels,true);view.setUint32(24,8000,true)
  view.setUint32(28,8000*channels*bits/8,true);view.setUint16(32,channels*bits/8,true);view.setUint16(34,bits,true)
  view.setUint32(40,frames*channels*bits/8,true)
  samples.forEach((sample,i)=> {if(format===3)view.setFloat32(44+i*4,sample,true);else if(bits===16)view.setInt16(44+i*2,sample,true);else if(bits===32)view.setInt32(44+i*4,sample,true);else if(bits===24){bytes[44+i*3]=sample&255;bytes[45+i*3]=(sample>>8)&255;bytes[46+i*3]=(sample>>16)&255}else bytes[44+i]=sample})
  return bytes
}
function serve(bytes: Uint8Array, chunk=7) {
  let offset=0
  const cancel=vi.fn()
  const stream = new ReadableStream({pull(controller){if(offset===bytes.length){controller.close();return}controller.enqueue(bytes.slice(offset,offset+chunk));offset=Math.min(bytes.length,offset+chunk)},cancel})
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(stream)))
  return cancel
}
afterEach(()=>{ vi.unstubAllGlobals(); vi.restoreAllMocks() })
describe('streamed WAV peaks',()=>{
  it('handles split headers and stereo frames without losing channel peaks',async()=>{
    serve(wav([0,16384,-32768,0,0,0],{channels:2}))
    const progress=vi.fn();const result=await streamWavPeaks('blob:test',new AbortController().signal,progress)
    expect(result.duration).toBe(3/8000)
    expect(result.peaks[0]).toBe(0.5);expect(result.peaks[32]).toBe(1)
    expect(progress).toHaveBeenLastCalledWith(100)
  })
  it('supports long WAV data without using AudioContext',async()=>{
    serve(wav(Array(8000*600).fill(1000)),65536)
    const result=await streamWavPeaks('blob:test',new AbortController().signal)
    expect(result.duration).toBe(600)
    expect(result.peaks).toHaveLength(96)
    expect(result.peaks.every(n=>n===1000/32768)).toBe(true)
  })
  it('handles float samples, NaN and unsigned 8-bit silence',async()=>{
    serve(wav([NaN,-0.75,2],{format:3,bits:32}))
    const result=await streamWavPeaks('blob:test',new AbortController().signal)
    expect(result.peaks[0]).toBe(0);expect(result.peaks[32]).toBe(0.75);expect(result.peaks[64]).toBe(1)
    serve(wav([128,128],{bits:8}))
    expect((await streamWavPeaks('blob:test',new AbortController().signal)).peaks.every(n=>n===0)).toBe(true)
  })
  it('preserves signed 24-bit and 32-bit extrema across chunk boundaries',async()=>{
    for(const bits of [24,32]) {
      serve(wav([-(2**(bits-1)),2**(bits-2)],{bits}))
      const result=await streamWavPeaks('blob:test',new AbortController().signal)
      expect(result.peaks[0]).toBe(1);expect(result.peaks[48]).toBe(0.5)
    }
  })
  it('rejects oversized responses and cancels before reading',async()=>{
    const cancel=vi.fn()
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({cancel}),{headers:{'content-length':String(129*1024*1024)}})))
    await expect(streamWavPeaks('blob:test',new AbortController().signal)).rejects.toThrow('128MB')
    expect(cancel).toHaveBeenCalledOnce()
  })
  it('rejects malformed alignment and compressed data before processing samples',async()=>{
    const bytes=wav([0,0]);new DataView(bytes.buffer).setUint16(32,3,true);serve(bytes)
    await expect(streamWavPeaks('blob:test',new AbortController().signal)).rejects.toThrow('형식')
    serve(wav([0,0],{format:85}))
    await expect(streamWavPeaks('blob:test',new AbortController().signal)).rejects.toThrow('형식')
  })
  it('rejects excessive duration and metadata headers',async()=>{
    serve(wav([0],{frames:8000*3601}))
    await expect(streamWavPeaks('blob:test',new AbortController().signal)).rejects.toThrow('60분')
    const bytes=wav([0]);bytes.set(new TextEncoder().encode('JUNK'),12);new DataView(bytes.buffer).setUint32(16,100000,true);serve(bytes)
    await expect(streamWavPeaks('blob:test',new AbortController().signal)).rejects.toThrow('헤더')
  })
  it('cancels a pending stream read even when the body never delivers another chunk', async () => {
    const cancel = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new ReadableStream({ cancel }))))
    const controller = new AbortController()
    const pending = streamWavPeaks('blob:stalled', controller.signal)
    await Promise.resolve()
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('lets a scheduled cancel interrupt decoding of a single large cached chunk', async () => {
    const bytes = wav(Array(200000).fill(1000))
    serve(bytes, bytes.length)
    // Make the frame-budget boundary deterministic, independent of CPU speed.
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now += 10)
    const controller = new AbortController()
    const pending = streamWavPeaks('blob:large', controller.signal)
    setTimeout(() => controller.abort(), 0)
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('cancels its reader when already aborted',async()=>{
    const cancel=serve(wav([0]));const controller=new AbortController();controller.abort()
    await expect(streamWavPeaks('blob:test',controller.signal)).rejects.toMatchObject({name:'AbortError'})
    expect(cancel).toHaveBeenCalled()
  })
})
