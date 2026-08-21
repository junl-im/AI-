# 0.11.33 · Voice Engine Major Hardening

## 목적

이번 릴리스는 `내 목소리` 생성과 5개 성우 preset의 품질·복구·엔진 계약을 실제 런타임 기준으로 강화하고, 폐기된 `최종 MP3 + 자막` 공개 기능이 다시 유입될 수 있는 오래된 패치 경로를 제거한다.

## MY VOICE

- 브라우저 품질 판정만 신뢰하지 않고 API가 실제 업로드 오디오를 다시 디코딩해 길이, RMS, 무음 비율, clipping을 검사한다.
- FFmpeg가 있으면 WAV/MP3/M4A/WEBM/OGG를 실제 파형으로 검사하고, 검증 완료 reference는 16 kHz mono PCM WAV로 정규화한다.
- reference 권장 구간은 20~30초, hard maximum은 30초다. 녹음기는 timer drift를 피하기 위해 29.5초에 hard stop한다.
- 무음, 극저음량, 과도한 clipping, 30초 초과, zero-byte 녹음은 생성 준비 전에 차단한다.
- 브라우저 reset 직후 늦게 도착한 MediaRecorder stop 이벤트가 폐기한 녹음을 되살리는 race를 막는다.
- 로컬 profile ID를 서버에도 `client_profile_id`로 보내 재시도/응답 유실에서 중복 profile을 줄인다.
- 서버 profile GET에서 현재 Worker readiness를 다시 반영해 과거 `engine-unavailable` profile이 Worker 복구 뒤 `engine-ready`로 돌아올 수 있다.
- API가 완전히 없을 때 만든 local-only profile은 자동 업로드하지 않는다. 사용자가 명시적으로 서버 등록을 재시도해야 한다.

## CosyVoice Worker

- reference WAV는 16 kHz mono, 5~30초 계약을 Worker 진입점에서도 다시 확인한다.
- `inference_cross_lingual(..., stream=True)`로 keyword argument를 명시해 기존 positional `True`가 speaker-id 위치로 오해될 수 있는 호출 위험을 제거한다.
- 검증/정규화 전 reference를 Worker에 넘기지 않는다.

## 5개 성우 preset

- preset reference도 Worker와 같은 canonical 기준인 16 kHz mono, 5~30초를 사용한다.
- RMS, 무음 비율, clipping을 승인 전 검사하고 진단 API에 RMS를 노출한다.
- 서로 다른 preset이 같은 WAV를 공유하거나, 반대 성별 reference로 대체되거나, 동의/권리/사람 검수/해시가 미완료된 reference가 neural READY가 되는 기존 차단은 유지한다.
- 저장소에는 실제 rights-cleared 성우 WAV가 없고 5개 manifest가 pending이므로 임의 음성을 넣지 않는다. 실제 성우 자산이 준비되기 전 neural 5/5 품질 성공을 주장하지 않는다.

## Final Export 퇴역

사용자용 `최종 MP3 + 자막` / `최종 WAV + 자막` 공개 기능은 제품 표면에서 제거한다.

제거 범위:

- Timeline Final Export 버튼과 dialog
- Web final export API adapter/archive module
- FastAPI `/exports` route와 export schema
- 관련 UI/API 테스트
- 과거 Final Export hotfix
- 0.11.15 Live Voice/MY VOICE payload apply 스크립트와 stale payload snapshots

내부 `final_export.py`와 export soak는 장시간 WAV 결합/자막 타이밍 품질검사용 내부 도구이므로 공개 제품 API와 분리해 유지한다.

`VERIFY_LIVE_VOICE_MYVOICE.mjs`는 최신 구조를 검사하며 폐기된 파일/route가 다시 생기면 실패한다.

## 개인정보 경계

- 사용자 음성 원본을 Git/전달 ZIP에 포함하지 않는다.
- local-only MY VOICE를 사용자 동의 없이 서버로 자동 업로드하지 않는다.
- 실제 성우 reference WAV, 모델 가중치, 동의/계약 문서도 전달 ZIP에서 제외한다.
- 릴리스 ZIP은 실제 `.env.development/.env.production`을 제외하고 `.env.example`로 Firebase 공개 클라이언트 설정 계약을 검증한다.

## 검증 상태

최종 릴리스 패키징 시 API/Worker 회귀, repository preflight, TypeScript dependency-free syntax, 정적 voice 계약을 다시 실행한다. Dependency 기반 Web lint/Vitest/typecheck/build는 로컬 npm registry DNS가 복구되지 않으면 GitHub Actions final gate로 남긴다.
