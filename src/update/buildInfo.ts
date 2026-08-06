export interface AppBuildInfo {
  schemaVersion: 1
  appVersion: string
  heartbeat: string
  revision: string
  buildId: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function parseAppBuildInfo(value: unknown): AppBuildInfo | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (
    candidate.schemaVersion !== 1
    || !isNonEmptyString(candidate.appVersion)
    || !isNonEmptyString(candidate.heartbeat)
    || !isNonEmptyString(candidate.revision)
    || !isNonEmptyString(candidate.buildId)
  ) {
    return null
  }
  return {
    schemaVersion: 1,
    appVersion: candidate.appVersion.trim(),
    heartbeat: candidate.heartbeat.trim(),
    revision: candidate.revision.trim(),
    buildId: candidate.buildId.trim(),
  }
}

const injectedBuildInfo = typeof __SORION_BUILD_INFO__ === 'undefined'
  ? {
      schemaVersion: 1 as const,
      appVersion: '0.9.7',
      heartbeat: '6.8.4',
      revision: 'test',
      buildId: '0.9.7-6.8.4-test',
    }
  : __SORION_BUILD_INFO__

export const currentBuildInfo: AppBuildInfo = {
  schemaVersion: 1,
  appVersion: injectedBuildInfo.appVersion,
  heartbeat: injectedBuildInfo.heartbeat,
  revision: injectedBuildInfo.revision,
  buildId: injectedBuildInfo.buildId,
}

export function isDifferentBuild(current: AppBuildInfo, remote: AppBuildInfo): boolean {
  return current.buildId !== remote.buildId
}

export function formatBuildLabel(info: AppBuildInfo): string {
  return `v${info.appVersion}`
}

export function formatBuildDiagnosticsLabel(info: AppBuildInfo): string {
  const revision = info.revision === 'local' ? 'local' : info.revision.slice(0, 8)
  return `v${info.appVersion} · EH ${info.heartbeat} · ${revision}`
}

