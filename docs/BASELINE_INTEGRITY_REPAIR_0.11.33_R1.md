# 0.11.33 R1 · Baseline Integrity Repair

0.11.34 기능 개발 전 저장소 기준선 정합성을 복구하는 안정화 리비전입니다. 제품 semver는 0.11.33을 유지합니다.

## 복구 내용
- 0.11.33 DELETE_LIST 대상인데 전달본에 잔존한 Final Export Web/API/schema 제거
- 구형 Live Voice/MY VOICE apply script와 payload snapshot 제거
- 최신 `VERIFY_LIVE_VOICE_MYVOICE.mjs`의 retired/forbidden 계약과 실제 저장소 일치
- 릴리스 ZIP에서 개발 산출물·캐시·비밀 환경파일 제외

## 검증
- Live Voice/MY VOICE verifier 51/51 PASS
- API pytest 237/237 PASS
- Worker pytest 16/16 PASS
- Web dependency 기반 검사는 로컬 설치 제한으로 미완료; GitHub Actions final gate

## 비변경 영역
Timeline, Voice Picker, MY VOICE synthesis/recovery, Neural Preview/shared cache, Quality Lab 활성 기능은 변경하지 않습니다.
