import { encodePcmMp3 } from './encodePcmMp3'

interface Mp3WorkerRequest { wav: Blob }
const postToPage = self.postMessage.bind(self) as (message: unknown, transfer?: Transferable[]) => void

self.onmessage = async (event: MessageEvent<Mp3WorkerRequest>) => {
  try {
    const mp3 = await encodePcmMp3(event.data.wav, {
      onProgress: (done, total) => postToPage({ type: 'progress', done, total }),
    })
    const buffer = await mp3.arrayBuffer()
    postToPage({ type: 'done', buffer }, [buffer])
  } catch (error) {
    postToPage({ type: 'error', message: error instanceof Error ? error.message : 'MP3 변환에 실패했습니다.' })
  }
}
