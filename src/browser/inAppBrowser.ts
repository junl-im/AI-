export interface InAppBrowserInfo {
  provider: 'kakao'
  label: string
  mobile: boolean
}

export function detectInAppBrowser(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): InAppBrowserInfo | null {
  if (!/KAKAOTALK/i.test(userAgent)) return null
  return {
    provider: 'kakao',
    label: '카카오톡 인앱 브라우저',
    mobile: /Android|iPhone|iPad|Mobile|\bwv\b/i.test(userAgent),
  }
}

export function isKakaoInAppBrowser(userAgent?: string): boolean {
  return detectInAppBrowser(userAgent)?.provider === 'kakao'
}

export function buildExternalBrowserUrl(
  pageUrl: string,
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): string {
  const url = new URL(pageUrl)
  if (/Android/i.test(userAgent)) {
    const path = `${url.host}${url.pathname}${url.search}${url.hash}`
    return `intent://${path}#Intent;scheme=${url.protocol.replace(':', '')};S.browser_fallback_url=${encodeURIComponent(pageUrl)};end`
  }
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(pageUrl)}`
}
