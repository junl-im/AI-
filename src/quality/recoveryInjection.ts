export type RecoveryInjectionKind = 'online-resume' | 'page-resume' | 'network-change'
export type RecoveryInjectionEvidenceClass = 'synthetic-injection'

export interface RecoveryInjectionResult {
  schemaVersion: 1
  evidenceClass: RecoveryInjectionEvidenceClass
  kind: RecoveryInjectionKind
  injectedAt: string
  supported: boolean
  events: string[]
  detail: string
}

function dispatchWindow(name: string, events: string[]) {
  window.dispatchEvent(new Event(name))
  events.push(name)
}

export function injectRecoveryPath(kind: RecoveryInjectionKind): RecoveryInjectionResult {
  if (typeof window === 'undefined') {
    return {
      schemaVersion: 1,
      evidenceClass: 'synthetic-injection',
      kind,
      injectedAt: new Date().toISOString(),
      supported: false,
      events: [],
      detail: '브라우저 환경이 아닙니다.',
    }
  }
  const events: string[] = []
  let supported = true
  if (kind === 'online-resume') {
    dispatchWindow('online', events)
  } else if (kind === 'page-resume') {
    dispatchWindow('pageshow', events)
    dispatchWindow('focus', events)
  } else {
    const connection = (navigator as Navigator & { connection?: EventTarget }).connection
    if (connection && typeof connection.dispatchEvent === 'function') {
      connection.dispatchEvent(new Event('change'))
      events.push('navigator.connection.change')
    } else {
      supported = false
    }
  }
  dispatchWindow('sorion-engine-refresh', events)
  return {
    schemaVersion: 1,
    evidenceClass: 'synthetic-injection',
    kind,
    injectedAt: new Date().toISOString(),
    supported,
    events,
    detail: supported
      ? '앱의 복구 이벤트 처리 경로를 주입했습니다.'
      : '기기 Network Information API는 없지만 엔진 재점검 경로는 주입했습니다.',
  }
}

export function downloadRecoveryInjectionEvidence(result: RecoveryInjectionResult) {
  const payload = {
    schemaVersion: result.schemaVersion,
    evidenceClass: result.evidenceClass,
    generatedAt: new Date().toISOString(),
    result,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-recovery-injection-${result.kind}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
