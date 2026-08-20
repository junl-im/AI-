import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  downloadNeuralReferenceManifestTemplate,
  invalidateNeuralPresetPreviewCatalog,
  mapNeuralPresetPreviewReadiness,
  primeNeuralPresetPreviewCatalog,
} from '../../quality/neuralVoiceReference'
import { getSetupStatus } from '../../settings/setupApi'
import type { VoicePresetDiagnostic } from '../../settings/setupTypes'
import { voicePresets } from '../../tts/voicePresets'
import { StatusPill } from '../ui/StatusPill'

function shortHash(value: string | null) {
  return value ? `${value.slice(0, 10)}…${value.slice(-6)}` : '-'
}

export function NeuralVoiceReferenceCard() {
  const [diagnostics, setDiagnostics] = useState<VoicePresetDiagnostic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const setup = await getSetupStatus()
      setDiagnostics(setup.voicePresetDiagnostics)
      invalidateNeuralPresetPreviewCatalog()
      primeNeuralPresetPreviewCatalog(setup.voicePresetDiagnostics)
    } catch (caught) {
      setDiagnostics([])
      setError(caught instanceof Error ? caught.message : 'Neural reference 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const rows = useMemo(() => voicePresets.map((preset) => {
    const diagnostic = diagnostics.find((item) => item.voiceId === preset.id) ?? null
    return {
      preset,
      diagnostic,
      readiness: diagnostic ? mapNeuralPresetPreviewReadiness(diagnostic) : null,
    }
  }), [diagnostics])
  const readyCount = rows.filter((item) => item.readiness?.ready).length

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">NEURAL VOICE REFERENCE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">성우 reference intake · 미리듣기 승격</h2>
        </div>
        <StatusPill
          label={loading ? '검사 중' : `${readyCount}/5 NEURAL READY`}
          tone={readyCount === voicePresets.length ? 'good' : 'warning'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        원본 WAV와 동의 문서는 Git에 넣지 않습니다. 서버의 SORION_COSYVOICE_PRESET_DIRECTORY에 같은 ID의 WAV/manifest를 두고,
        동의·권리·사람 검수·reference SHA-256·model fingerprint가 모두 맞는 v4 manifest만 ▶ 미리듣기의 CosyVoice neural 경로로 승격합니다.
      </p>

      <div className="mt-4 grid gap-2">
        {rows.map(({ preset, diagnostic, readiness }) => (
          <article key={preset.id} className="rounded-2xl border border-soa-line bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-black">{preset.name} <span className="font-mono text-[10px] text-soa-muted">{preset.id}</span></div>
                <div className="mt-1 text-[10px] font-bold text-soa-muted">
                  reference {shortHash(diagnostic?.referenceFingerprint ?? diagnostic?.actualSha256 ?? null)} · model {shortHash(diagnostic?.modelFingerprint ?? null)}
                </div>
              </div>
              <StatusPill
                label={readiness?.ready ? 'NEURAL READY' : diagnostic?.status?.toUpperCase() ?? 'PENDING'}
                tone={readiness?.ready ? 'good' : diagnostic?.status === 'blocked' ? 'danger' : 'warning'}
              />
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
              {readiness?.reason ?? 'setup 진단을 기다리고 있습니다.'}
            </p>
            <div className="mt-2 grid gap-1 text-[10px] font-bold text-soa-muted sm:grid-cols-2">
              <span>manifest v{diagnostic?.schemaVersion ?? '-'}</span>
              <span>engine {diagnostic?.neuralPreviewEngineId ?? '-'}</span>
              <span>approval {diagnostic?.approvalId ?? '-'}</span>
              <span>cache {shortHash(diagnostic?.previewCacheKey ?? null)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadNeuralReferenceManifestTemplate(preset.id)}
                className="min-h-10 rounded-xl border border-soa-line px-3 text-xs font-black"
              >v4 manifest 템플릿</button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-soa-line bg-white p-3">
        <p className="text-[10px] font-bold leading-4 text-soa-muted">
          템플릿의 SHA/fingerprint를 채운 뒤 아래의 프리셋 수동 승인에서 실제 WAV와 검수 묶음을 결박해야 합니다. 파일명만 맞춘다고 neural-ready가 되지 않습니다.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="min-h-10 shrink-0 rounded-xl border border-soa-line px-3 text-xs font-black disabled:opacity-40"
        >다시 검사</button>
      </div>
      {error ? <p className="mt-3 text-xs font-black text-red-600">{error}</p> : null}
    </section>
  )
}
