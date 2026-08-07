export const RUNTIME_FAULT_EVENT = 'sorion-runtime-fault-injection'

export type RuntimeFaultKind =
  | 'network-offline'
  | 'network-online'
  | 'network-change'
  | 'background-hidden'
  | 'background-visible'

export interface RuntimeFaultDetail {
  kind: RuntimeFaultKind
  injectedAt: string
  source: 'quality-lab'
}

export function dispatchRuntimeFault(kind: RuntimeFaultKind): RuntimeFaultDetail {
  const detail: RuntimeFaultDetail = {
    kind,
    injectedAt: new Date().toISOString(),
    source: 'quality-lab',
  }
  window.dispatchEvent(new CustomEvent<RuntimeFaultDetail>(RUNTIME_FAULT_EVENT, { detail }))
  return detail
}

export function subscribeRuntimeFaults(
  listener: (detail: RuntimeFaultDetail) => void,
): () => void {
  const handle = (event: Event) => {
    const detail = (event as CustomEvent<RuntimeFaultDetail>).detail
    if (!detail || detail.source !== 'quality-lab') return
    listener(detail)
  }
  window.addEventListener(RUNTIME_FAULT_EVENT, handle)
  return () => window.removeEventListener(RUNTIME_FAULT_EVENT, handle)
}
