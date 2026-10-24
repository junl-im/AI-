import { synthesizeSupertonicWav } from '../tts/supertonicWav'

// The page only accepts messages from its embedding Dalbit Unse page.
const allowedParent = (() => {
  try {
    const url = new URL(document.referrer)
    return url.origin === location.origin && url.pathname.startsWith('/meta/AIPlayground/DalbitUnse/dist/')
  } catch { return false }
})()

const channel = 'dalbit-byeolha'
let active: AbortController | null = null
let currentId = ''

function reply(type: string, id = '', extra: Record<string, unknown> = {}) {
  if (allowedParent) parent.postMessage({ channel, type, id, ...extra }, location.origin)
}

if (allowedParent && window.parent !== window) {
  window.addEventListener('message', async event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.channel !== channel) return
    const message = event.data as { type?: string; id?: string; text?: string }
    if (message.type === 'stop') { active?.abort(); active = null; currentId = ''; return }
    if (message.type !== 'speak' || typeof message.id !== 'string') return
    active?.abort()
    const controller = new AbortController()
    active = controller
    currentId = message.id
    const text = String(message.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 600)
    if (!text) { active = null; currentId = ''; reply('error', message.id, { message: '읽을 문장이 없습니다.' }); return }
    try {
      const generated = await synthesizeSupertonicWav(
        { text, voiceId: 'byeol-oracle', voiceName: '별하', speed: 0.96 },
        controller.signal,
        progress => reply('progress', message.id!, { message: progress }),
      )
      if (controller.signal.aborted || currentId !== message.id) return
      reply('audio', message.id, { blob: generated.blob })
    } catch (error) {
      if (!controller.signal.aborted && currentId === message.id)
        reply('error', message.id, { message: error instanceof Error ? error.message : '별하 음성 생성 실패' })
    } finally {
      if (active === controller) { active = null; currentId = '' }
    }
  })
  reply('ready')
}
