function normalizeRegistry(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function registryPackagePath(packageName, packageVersion) {
  return `${encodeURIComponent(packageName)}/${encodeURIComponent(packageVersion)}`
}

async function probeRegistry(registry, {
  fetchImpl,
  packageName,
  packageVersion,
  timeoutMs,
}) {
  const normalized = normalizeRegistry(registry)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = Date.now()
  try {
    const response = await fetchImpl(
      new URL(registryPackagePath(packageName, packageVersion), normalized),
      {
        headers: { accept: 'application/vnd.npm.install-v1+json' },
        signal: controller.signal,
      },
    )
    if (!response.ok) {
      return {
        registry: normalized,
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: `HTTP ${response.status}`,
      }
    }
    const payload = await response.json()
    const valid = payload?.name === packageName && payload?.version === packageVersion && payload?.dist?.integrity
    return {
      registry: normalized,
      ok: Boolean(valid),
      latencyMs: Date.now() - startedAt,
      error: valid ? null : 'package metadata mismatch',
    }
  } catch (error) {
    return {
      registry: normalized,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error?.name === 'AbortError' ? 'probe timeout' : String(error?.message || error),
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function rankRegistryCandidates(candidates, {
  fetchImpl = globalThis.fetch,
  packageName,
  packageVersion,
  timeoutMs = 12_000,
} = {}) {
  const unique = [...new Set(candidates.map(normalizeRegistry))]
  if (!packageName || !packageVersion || typeof fetchImpl !== 'function') {
    return { ordered: unique, probes: [] }
  }
  const probes = await Promise.all(unique.map((registry) => probeRegistry(registry, {
    fetchImpl,
    packageName,
    packageVersion,
    timeoutMs,
  })))
  const responsive = probes
    .filter((probe) => probe.ok)
    .sort((left, right) => left.latencyMs - right.latencyMs)
    .map((probe) => probe.registry)
  const unresponsive = unique.filter((registry) => !responsive.includes(registry))
  return { ordered: [...responsive, ...unresponsive], probes }
}
