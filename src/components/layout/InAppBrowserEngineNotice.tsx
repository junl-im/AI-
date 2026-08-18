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

  function openExternally() {
    const pageUrl = window.location.href
    const copy = navigator.clipboard?.writeText(pageUrl)
    if (copy) {
      void copy.then(() => setCopied(true), () => setCopied(false))
    }
    // Keep the custom-scheme navigation inside the original tap gesture for mobile WebViews.
    window.location.assign(buildExternalBrowserUrl(pageUrl))
  }

  return (
    <aside className="mx-auto mt-2 w-[min(94%,960px)] rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950" aria-label="카카오톡 브라우저 기능 안내">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-sm">이 브라우저에서는 일부 음성 기능이 제한될 수 있습니다.</strong>
          <p className="mt-1 leading-5">
            {isBrowserSpeechSupported()
              ? '음성 API가 표시되더라도 WebView 정책 때문에 재생 시작이 막힐 수 있습니다. 외부 브라우저에서 열면 더 안정적입니다.'
              : '음성 재생 지원이 제한된 환경입니다. 외부 브라우저에서 열어 주세요.'}
          </p>
          {copied ? <p className="mt-1">주소도 복사했습니다.</p> : null}
        </div>
        <button type="button" className="shrink-0 rounded-xl bg-amber-950 px-3 py-2 text-white" onClick={openExternally}>
          외부 브라우저로 열기
        </button>
        <button type="button" className="shrink-0 px-1 text-lg" aria-label="안내 닫기" onClick={() => setDismissed(true)}>×</button>
      </div>
    </aside>
  )
}
