import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSetupStatus } from '../../settings/setupApi'
import type { VoicePresetDiagnostic } from '../../settings/setupTypes'
import { voiceGenderLabels, voicePresets } from '../../tts/voicePresets'
import {
  applyVoicePresetApproval,
  listVoicePresetApprovalHistory,
  loadVoiceReviewOperatorToken,
  previewVoicePresetApproval,
  rollbackVoicePresetApproval,
  saveVoiceReviewOperatorToken,
  type VoicePresetApprovalInput,
  type VoicePresetApprovalPreview,
  type VoicePresetApprovalRecord,
} from '../../quality/voicePresetApprovalApi'
import { StatusPill } from '../ui/StatusPill'

const SHA256_PATTERN = /^[0-9a-f]{64}$/

function shortHash(value: string | null | undefined) {
  return value ? `${value.slice(0, 12)}…${value.slice(-8)}` : '-'
}

export function VoicePresetApprovalCard() {
  const [diagnostics, setDiagnostics] = useState<VoicePresetDiagnostic[]>([])
  const [operatorToken, setOperatorToken] = useState(loadVoiceReviewOperatorToken)
  const [history, setHistory] = useState<VoicePresetApprovalRecord[]>([])
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [reviewer, setReviewer] = useState('')
  const [sampleText, setSampleText] = useState('같은 문장과 같은 엔진 조건에서 현재 프리셋의 인물·성별·음질을 확인했습니다.')
  const [bundleSha256, setBundleSha256] = useState('')
  const [notes, setNotes] = useState('')
  const [reviewedAt, setReviewedAt] = useState('')
  const [preview, setPreview] = useState<VoicePresetApprovalPreview | null>(null)
  const [rollbackReason, setRollbackReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (token: string) => {
    const setup = await getSetupStatus()
    setDiagnostics(setup.voicePresetDiagnostics)
    const records = await listVoicePresetApprovalHistory(token)
    setHistory(records)
  }, [])

  useEffect(() => {
    void refresh(loadVoiceReviewOperatorToken()).catch((caught) => {
      setError(caught instanceof Error ? caught.message : '승인 이력을 불러오지 못했습니다.')
    })
  }, [refresh])

  const diagnostic = useMemo(
    () => diagnostics.find((item) => item.voiceId === voiceId) ?? null,
    [diagnostics, voiceId],
  )
  const selectedPreset = voicePresets.find((item) => item.id === voiceId) ?? voicePresets[0]
  const canPreview = Boolean(
    reviewer.trim()
    && sampleText.trim()
    && SHA256_PATTERN.test(bundleSha256)
    && diagnostic?.actualSha256,
  )

  function approvalInput(): VoicePresetApprovalInput {
    const timestamp = reviewedAt || new Date().toISOString()
    if (!reviewedAt) setReviewedAt(timestamp)
    return {
      voiceId,
      reviewer: reviewer.trim(),
      sampleText: sampleText.trim(),
      reviewBundleSha256: bundleSha256,
      expectedAudioSha256: diagnostic?.actualSha256 ?? '',
      reviewedAt: timestamp,
      notes: notes.trim(),
    }
  }

  async function handlePreview() {
    setBusy(true); setError(null); setNotice(null)
    try {
      setPreview(await previewVoicePresetApproval(approvalInput(), operatorToken))
      setNotice('현재 WAV·manifest·검수 묶음을 다시 계산한 승인 미리보기를 만들었습니다.')
    } catch (caught) {
      setPreview(null)
      setError(caught instanceof Error ? caught.message : '승인 미리보기를 만들지 못했습니다.')
    } finally { setBusy(false) }
  }

  async function handleApply() {
    if (!preview) return
    setBusy(true); setError(null); setNotice(null)
    try {
      await applyVoicePresetApproval(approvalInput(), preview.previewId, operatorToken)
      setNotice('승인을 적용하고 이전 manifest snapshot을 감사 기록에 보존했습니다.')
      setPreview(null)
      await refresh(operatorToken)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '승인을 적용하지 못했습니다.')
    } finally { setBusy(false) }
  }

  async function handleRollback(record: VoicePresetApprovalRecord) {
    if (!rollbackReason.trim()) {
      setError('롤백 사유를 먼저 입력하세요.')
      return
    }
    setBusy(true); setError(null); setNotice(null)
    try {
      await rollbackVoicePresetApproval(
        record.approvalId,
        rollbackReason.trim(),
        operatorToken,
      )
      setNotice('승인 이전 manifest로 롤백하고 롤백 이력을 별도 기록했습니다.')
      setRollbackReason('')
      await refresh(operatorToken)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '승인을 롤백하지 못했습니다.')
    } finally { setBusy(false) }
  }

  const latestApproval = history.find((item) => item.event === 'approved' && item.voiceId === voiceId)

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">SIGNED REVIEW APPROVAL</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">프리셋 수동 승인·롤백</h2>
        </div>
        <StatusPill label={preview?.canApply ? '적용 가능' : '미리보기 필요'} tone={preview?.canApply ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        A/B 기록만으로 자동 승인하지 않습니다. 현재 WAV checksum, 동의·권리, 중복 여부와 manifest diff를 다시 확인한 뒤 명시적으로 적용합니다.
      </p>

      <div className="mt-4 rounded-2xl border border-soa-line bg-white p-3">
        <label className="text-xs font-black">원격 운영자 토큰
          <input
            type="password"
            value={operatorToken}
            onChange={(event) => setOperatorToken(event.target.value)}
            autoComplete="off"
            className="mt-1 min-h-11 w-full rounded-xl border border-soa-line px-3 font-mono text-xs"
            placeholder="로컬 PC에서는 비워도 됨 · LAN/외부는 32자 이상 토큰"
          />
        </label>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold leading-4 text-soa-muted">토큰은 이 탭의 sessionStorage에만 저장되며 검수 API 요청 헤더에만 사용됩니다.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              saveVoiceReviewOperatorToken(operatorToken)
              setError(null)
              void refresh(operatorToken).catch((caught) => {
                setError(caught instanceof Error ? caught.message : '승인 이력을 불러오지 못했습니다.')
              })
            }}
            className="min-h-10 shrink-0 rounded-xl border border-soa-line px-3 text-xs font-black disabled:opacity-40"
          >토큰 저장·재연결</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-black">프리셋
          <select value={voiceId} onChange={(event) => { setVoiceId(event.target.value); setPreview(null); setReviewedAt('') }} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line bg-white px-3">
            {voicePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} · {voiceGenderLabels[preset.gender]}</option>)}
          </select>
        </label>
        <label className="text-xs font-black">검수자
          <input value={reviewer} onChange={(event) => { setReviewer(event.target.value); setPreview(null) }} maxLength={120} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line px-3" placeholder="실제 검수자 이름 또는 운영자 ID" />
        </label>
      </div>
      <label className="mt-3 block text-xs font-black">검수 묶음 SHA-256
        <input value={bundleSha256} onChange={(event) => { setBundleSha256(event.target.value.trim().toLowerCase()); setPreview(null) }} maxLength={64} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line px-3 font-mono text-[11px]" placeholder="검수 JSON의 64자리 payload SHA-256" />
      </label>
      <label className="mt-3 block text-xs font-black">사람이 실제로 들은 검수 문장
        <textarea value={sampleText} onChange={(event) => { setSampleText(event.target.value); setPreview(null) }} maxLength={3000} className="mt-1 min-h-24 w-full rounded-xl border border-soa-line p-3 text-sm" />
      </label>
      <label className="mt-3 block text-xs font-black">승인 메모
        <input value={notes} onChange={(event) => { setNotes(event.target.value); setPreview(null) }} maxLength={1000} className="mt-1 min-h-11 w-full rounded-xl border border-soa-line px-3" placeholder="선택 사항" />
      </label>

      <div className="mt-3 rounded-2xl bg-[#f7f5ef] p-3 text-[10px] font-bold leading-5 text-soa-muted">
        <strong className="text-xs text-soa-ink">{selectedPreset.name} · 현재 파일 상태</strong>
        <p>WAV {shortHash(diagnostic?.actualSha256)} · manifest schema {diagnostic?.schemaVersion ?? '-'}</p>
        <p>동의 {diagnostic?.consentStatus ?? '-'} · 권리 {diagnostic?.allowedUses.join(', ') || '-'} · 검수 {diagnostic?.humanReviewStatus ?? '-'}</p>
        <p>서명 {diagnostic?.signatureStatus ?? 'missing'} · key {diagnostic?.signingKeyId ?? '-'}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" disabled={!canPreview || busy} onClick={() => void handlePreview()} className="focus-ring min-h-11 rounded-xl border border-soa-line bg-white text-xs font-black disabled:opacity-40">승인 diff 미리보기</button>
        <button type="button" disabled={!preview?.canApply || busy} onClick={() => void handleApply()} className="focus-ring min-h-11 rounded-xl bg-soa-ink text-xs font-black text-white disabled:opacity-40">현재 WAV 승인 적용</button>
      </div>

      {preview && (
        <div className="mt-4 rounded-2xl border border-soa-line bg-white p-3 text-[10px] font-bold leading-5">
          <p><strong>미리보기:</strong> {shortHash(preview.previewId)} · 변경 {preview.changes.length}개 · 서명 {preview.signatureMode}{preview.signingKeyId ? ` (${preview.signingKeyId})` : ''}</p>
          <p>manifest {shortHash(preview.currentManifestSha256)} → {shortHash(preview.proposedManifestSha256)}</p>
          {preview.blockingIssues.map((item) => <p key={item} className="text-red-700">차단 · {item}</p>)}
          {preview.warnings.map((item) => <p key={item} className="text-amber-700">확인 · {item}</p>)}
          <div className="mt-2 max-h-48 overflow-auto rounded-xl bg-[#f7f5ef] p-2 font-mono">
            {preview.changes.map((item) => <p key={item.path}>{item.path}: {JSON.stringify(item.before)} → {JSON.stringify(item.after)}</p>)}
          </div>
        </div>
      )}

      {latestApproval && (
        <div className="mt-4 rounded-2xl border border-soa-line bg-white p-3">
          <strong className="text-xs">최근 승인 롤백</strong>
          <p className="mt-1 text-[10px] font-bold text-soa-muted">{latestApproval.approvalId} · {latestApproval.reviewer} · {new Date(latestApproval.at).toLocaleString()}</p>
          <div className="mt-2 flex gap-2">
            <input value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} maxLength={500} className="min-h-10 flex-1 rounded-xl border border-soa-line px-3 text-xs" placeholder="롤백 사유 필수" />
            <button type="button" disabled={busy} onClick={() => void handleRollback(latestApproval)} className="rounded-xl border border-red-200 px-3 text-xs font-black text-red-700 disabled:opacity-40">승인 롤백</button>
          </div>
        </div>
      )}

      {notice && <p className="mt-3 text-xs font-bold text-emerald-700">{notice}</p>}
      {error && <p className="mt-3 text-xs font-bold text-red-700">{error}</p>}
      <p className="mt-3 text-[10px] font-bold text-soa-muted">checksum은 파일 변경 탐지이고, HMAC 서명은 설정된 로컬 신뢰 키 보유 여부를 확인합니다. 둘 다 화자 신원·법적 권리를 자동 증명하지 않습니다.</p>
    </section>
  )
}
