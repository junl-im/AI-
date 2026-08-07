import { beforeEach, describe, expect, it } from 'vitest'
import {
  acknowledgeBrowserVoiceInventory,
  observeBrowserVoiceInventory,
  snapshotBrowserVoiceInventory,
} from './browserVoiceInventory'

function voice(name: string, lang = 'ko-KR'): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService: true,
    name,
    voiceURI: `voice://${name}`,
  }
}

describe('browser voice inventory', () => {
  beforeEach(() => window.localStorage.clear())

  it('keeps a stable fingerprint independent of voice order', () => {
    const a = snapshotBrowserVoiceInventory([voice('SunHi Female'), voice('InJoon Male')])
    const b = snapshotBrowserVoiceInventory([voice('InJoon Male'), voice('SunHi Female')])
    expect(a.fingerprint).toBe(b.fingerprint)
  })

  it('does not treat the initial empty Web Speech list as an inventory baseline', () => {
    expect(observeBrowserVoiceInventory([]).changed).toBe(false)
    expect(observeBrowserVoiceInventory([voice('SunHi Female')]).changed).toBe(false)
  })

  it('detects and acknowledges device voice inventory changes', () => {
    expect(observeBrowserVoiceInventory([voice('SunHi Female')]).changed).toBe(false)
    const changed = observeBrowserVoiceInventory([voice('SunHi Female'), voice('InJoon Male')])
    expect(changed.changed).toBe(true)
    expect(changed.previousFingerprint).not.toBeNull()
    expect(changed.assignmentDiff.some((item) => item.currentVoiceName === 'InJoon Male')).toBe(true)
    expect(acknowledgeBrowserVoiceInventory([voice('SunHi Female'), voice('InJoon Male')]).changed).toBe(false)
  })
})
