# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.8.3 · CI Quality Unblock & Approval Operator Gate`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 6.8.4 · Trust Key Rotation & Evidence Renewal Queue`

## 최우선 구현

- 현재 단일 HMAC 신뢰 키를 active·previous 복수 key ID 구조로 확장하고 무중단 교체·grace 기간·폐기 상태를 명시
- 이전 key로 서명된 승인 manifest를 검증하면서 운영자가 현재 key로 재서명할 수 있는 diff·preview 흐름
- 동의·권리 만료 임박 프리셋을 한 화면에 모으고 증거 교체, 만료일 변경, WAV 변경에 따른 승인 무효화를 순서대로 처리하는 갱신 대기열
- 실제 WAV·동의 문서 원문·비밀키를 제외한 approval history, manifest digest와 검증 결과의 개인정보 최소 감사 묶음 export·verify
- 모델 digest·GPU·프리셋별 최소 표본 수와 운영자가 정한 기준선을 저장하고 first audio·RTF·실패율·handoff 회귀를 경고
- 짧은 Worker 자동 telemetry와 실기기 soak 모두에서 표본 수 부족, digest 변경, 장치 변경을 명확히 분리
- 다중 API 프로세스에서도 승인 apply·rollback이 겹치지 않도록 프로세스 간 파일 잠금 또는 단일 writer 계약 추가
- CI evidence artifact에 실제 수집된 telemetry 요약을 선택적으로 연결하되 수치가 없으면 빈 상태를 유지

## 예상 변경 영역

- `services/api/app/services/voice_preset_approval.py`, key ring·재서명·프로세스 간 잠금·감사 bundle
- `services/api/app/services/voice_preset_evidence.py`, 복수 trust key 검증
- `src/components/evaluation`, key rotation·renewal queue·regression UI
- `services/api/app/api/routes/verification.py`, benchmark baseline과 regression summary
- `docs/VOICE_REVIEW_APPROVAL.md`, `docs/BENCHMARK_DASHBOARD.md`, 인수인계·테스트 문서

## 선행 조건과 위험

- 신뢰 키와 운영자 토큰은 환경 변수 또는 외부 secret store에서 관리하며 저장소, ZIP, 진단 복사본과 감사 묶음에 포함하지 않습니다.
- key rotation은 이전 서명을 무조건 무효화하지 않고 key ID·유효 기간·폐기 정책을 명시해야 합니다.
- 증거 만료일 갱신은 실제 동의·권리 원본을 사람이 확인한 뒤에만 수행하며 자동 연장하지 않습니다.
- benchmark 기준선은 충분한 실제 표본과 동일 모델 digest·장치 조건이 있을 때만 만들고, 저장소에서 임의 수치를 생성하지 않습니다.
- HMAC과 checksum은 화자 신원·법적 권리·측정 진실성을 자동 증명하지 않습니다.

## 6.8.3에서 넘기는 결정

- 원격 승인·이력·롤백은 운영자 토큰으로 보호하고, 로컬 loopback 무토큰 허용은 명시적 설정으로만 유지합니다.
- `X-SoriON-User-ID`와 `X-SoriON-Client-ID`는 인증이 아니라 감사용 선언 값입니다.
- 승인 apply·rollback은 마지막 파일 검증부터 쓰기·이력 추가까지 동일한 프로세스 잠금 안에서 수행합니다. 다중 프로세스 배포는 별도 보강 전 단일 writer를 유지합니다.
- 승인 preview는 현재 파일 상태에 결박되며 apply 시 다시 계산합니다. stale preview를 우회하지 않습니다.
- 서명 secret이 비어 있으면 unsigned가 정상이며, 가짜 key·기본 secret·운영자 토큰을 릴리스에 넣지 않습니다.
- signed manifest는 설정된 신뢰 키로 검증되지 않으면 READY가 아닙니다.
- Worker 자동 telemetry는 장시간 soak 증거가 아니며 두 집계를 합치지 않습니다.
- 실제 증거 없이 `confirmed`, `approved`, READY, 서명 또는 성능 수치를 생성하지 않습니다.
