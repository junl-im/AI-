import { useState } from 'react'
import {
  buildExternalBrowserUrl,
  detectInAppBrowser,
} from '../../browser/inAppBrowser'
import { isBrowserSpeechSupported } from '../../tts/browserSpeech'

export function InAppBrowserEngineNotice() {
  const info = detectInAppBrowser()
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  if (!info || dismissed) return null

  async function openExternally() {
    const pageUrl = window.location.href
    try {
      await navigator.clipboard?.writeText(pageUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
    window.location.assign(buildExternalBrowserUrl(pageUrl))
  }

  return (
    <aside className="mx-auto mt-2 w-[min(94%,960px)] rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950" aria-label="카카오톡 브라우저 기능 안내">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-sm">이 브라우저에서는 일부 음성 기능이 제한될 수 있습니다.</strong>
          <p className="mt-1 leading-5">
            {isBrowserSpeechSupported()
              ? '기본 음성 기능은 바로 사용할 수 있습니다. 더 안정적인 제작을 위해 외부 브라우저 사용을 권장합니다.'
              : '음성 재생 지원이 제한된 환경입니다. 외부 브라우저에서 열어 주세요.'}
          </p>
          {copied ? <p className="mt-1">주소도 복사했습니다.</p> : null}
        </div>
        <button type="button" className="shrink-0 rounded-xl bg-amber-950 px-3 py-2 text-white" onClick={() => void openExternally()}>
          외부 브라우저로 열기
        </button>
        <button type="button" className="shrink-0 px-1 text-lg" aria-label="안내 닫기" onClick={() => setDismissed(true)}>×</button>
      </div>
    </aside>
  )
}
