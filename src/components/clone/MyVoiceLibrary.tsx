import { useEffect, useMemo } from 'react'
import { calculateVoiceSampleScore, voiceSampleScoreLabel } from '../../voiceclone/sampleQualityScore'
import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'

interface MyVoiceLibraryProps {
  profiles: VoiceCloneProfile[]
  selectedId: string | null
  loading: boolean
  onSelect: (profile: VoiceCloneProfile) => void
  onCreate: () => void
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value))
  } catch {
    return '최근 저장'
  }
}

function SavedVoiceCard({
  profile,
  selected,
  onSelect,
}: {
  profile: VoiceCloneProfile
  selected: boolean
  onSelect: () => void
}) {
  const previewUrl = useMemo(() => URL.createObjectURL(profile.sampleBlob), [profile.sampleBlob])
  const score = calculateVoiceSampleScore(profile.analysis)

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  return (
    <article className={`soa-myvoice-card ${selected ? 'is-selected' : ''}`}>
      <button
        type="button"
        className="soa-myvoice-card__select"
        aria-pressed={selected}
        onClick={onSelect}
      >
        <span className="soa-myvoice-avatar" aria-hidden="true">
          {profile.displayName.trim().slice(0, 1) || 'V'}
        </span>
        <span className="soa-myvoice-card__copy">
          <strong>{profile.displayName}</strong>
          <small>{profile.status === 'engine-ready' ? '실제 생성 준비됨' : '샘플 준비됨'} · {formatDate(profile.updatedAt)}</small>
        </span>
        <span className={`soa-myvoice-score is-${profile.analysis.status}`}>
          <b>{score}</b>
          <small>{voiceSampleScoreLabel(score)}</small>
        </span>
      </button>
      <audio controls preload="metadata" src={previewUrl} aria-label={`${profile.displayName} 원본 샘플 미리듣기`} />
    </article>
  )
}

export function MyVoiceLibrary({
  profiles,
  selectedId,
  loading,
  onSelect,
  onCreate,
}: MyVoiceLibraryProps) {
  return (
    <section className="soa-myvoice-library" aria-labelledby="myvoice-library-title">
      <div className="soa-myvoice-library__head">
        <div>
          <span>MY VOICE LIBRARY</span>
          <h2 id="myvoice-library-title">내 목소리</h2>
          <p>좋은 샘플을 여러 개 만들어 두고, 가장 자연스러운 목소리를 바로 골라 테스트하세요.</p>
        </div>
        <button type="button" className="soa-myvoice-create" onClick={onCreate}>＋ 새 목소리</button>
      </div>

      {loading ? (
        <div className="soa-myvoice-empty" role="status">저장된 목소리를 불러오는 중…</div>
      ) : profiles.length ? (
        <div className="soa-myvoice-list" aria-label="저장된 내 목소리">
          {profiles.map((profile) => (
            <SavedVoiceCard
              key={profile.id}
              profile={profile}
              selected={profile.id === selectedId}
              onSelect={() => onSelect(profile)}
            />
          ))}
        </div>
      ) : (
        <div className="soa-myvoice-empty">
          <strong>아직 저장된 내 목소리가 없습니다.</strong>
          <span>20~30초의 깨끗한 샘플 하나면 첫 프로필을 만들 수 있습니다.</span>
          <button type="button" onClick={onCreate}>첫 목소리 만들기</button>
        </div>
      )}
    </section>
  )
}
