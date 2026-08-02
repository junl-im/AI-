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
    <aside className="mx-auto mt-2 w-[min(94%,960px)] rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950" aria-label="카카오톡 브라우저 엔진 안내">
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block text-sm">카카오톡 안에서는 PC 로컬 엔진에 직접 연결할 수 없습니다.</strong>
          <p className="mt-1 leading-5">
            {isBrowserSpeechSupported()
              ? '지금은 기기 브라우저 음성으로 즉시 재생합니다. 실제 AI 엔진은 외부 브라우저와 공개 HTTPS API에서 사용하세요.'
              : '이 WebView는 브라우저 음성도 제한합니다. 외부 브라우저에서 열어 주세요.'}
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
