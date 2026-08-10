# SoriON AI 0.11.7 Verification Report

결과 버전: **0.11.7 · One-Flow Dubbing UX**  
기준 버전: **GitHub b5cd5cb · 0.11.5 기준선 위 0.11.7 패치 적용 상태**

## CI chain hotfix 적용 범위

- GitHub 기준선 누락 복구: 0.11.6에서 추가·변경됐지만 b5cd5cb에 빠진 recovery/session 파일 21개를 0.11.7 완성본과 동기화
- `scripts/check-recovery-evidence-session-safety.mjs` 복원
- API evidence bundle schema v3 + legacy v2 verifier 호환 구현 복원
- workspace session schema v3, batch retry privacy sanitizer, recovery evidence provenance 구현 복원
- preflight 누락 스크립트 진단을 raw MODULE_NOT_FOUND 대신 명시적 패치 기준 오류로 개선

## 기존 0.11.7 기능 범위

- 새 프로젝트 PC 기본 레이아웃을 양쪽 패널 접힘 집중 모드로 변경
- 헤더 `프로 패널` 한 번으로 좌우 프로젝트/Voice 패널 동시 확장·접기
- 중앙 Longform Composer에 빠른 목소리·미리듣기·세부 설정·대본·생성 결합
- 기본 5개 프리셋 즉시 선택과 기존 전체 Voice Picker 유지
- 빈 프로젝트 timeline 숨김과 직접 편집 진입 버튼
- 제작 기록을 접힌 details로 축소
- TXT·MD·SRT·VTT 선택/drag-and-drop intake와 subtitle cue/timestamp 정리
- `Ctrl/Cmd+Enter` 즉시 생성, 사용자 생성 직후 첫 준비 음성 자동 재생
- 새 프로젝트 제목의 첫 대본 기반 자동 제안
- desktop layout storage v3 및 one-flow dependency-free preflight 계약 추가
- 0.11.6 recovery evidence/session safety와 기존 batch/engine contracts 유지

## 현재 검증 결과

- API pytest: 통과 · **219/219**
- Worker pytest: 통과 · **14/14**
- Python compileall: 통과
- 제품 버전 sync: 통과 · **v0.11.7**
- one-flow dubbing UX dependency-free 계약: 통과
- dependency-free TS/TSX transpile syntax: 통과 · **201/201**
- Repository preflight: 통과 · **43/43**
- npm lock install 시도: 현재 전달 환경 내부 registry의 `zustand@5.0.8` 404로 중단
- 올바른 0.11.7 전체본 API pytest: **219/219**
- GitHub b5cd5cb 재구성 상태 API pytest: **3 failed / 215 passed** 재현 후 hotfix 적용으로 **219/219** 복구
- GitHub b5cd5cb 재구성 상태 preflight: recovery checker `MODULE_NOT_FOUND` 재현 후 hotfix 적용으로 **43/43** 복구
- current GitHub 재구성 + 34파일 self-contained hotfix overlay + `APPLY_PATCH.sh`: **906/906 files · missing 0 / extra 0 / changed 0**
- Python 3.10 문법 호환 parse: **143/143 API app/test files 통과**

## 검증 환경 제한

- 현재 내부 npm registry가 lock에 고정된 `zustand@5.0.8`을 제공하지 않아 이 환경에서 GitHub Actions와 동일한 ESLint·semantic TypeScript·Vitest·Vite production build·Chromium visual layout을 재실행할 수 없습니다.
- 0.11.6은 로컬 검증·패키징까지 완료됐지만 GitHub `b5cd5cb`의 부모가 0.11.5 계열임이 확인되어, 0.11.6이 원격 기준선에 적용됐다고 간주하지 않습니다. 이 hotfix 적용 뒤 GitHub Actions가 Python 3.10 API와 전체 Web quality를 최종 판정합니다.
- API 테스트에는 기존 FastAPI 422 상수 deprecation warning 1건이 남습니다.

## 기능·운영 제한

- 첫 결과 자동 재생은 사용자가 현재 세션에서 `바로 더빙 만들기`를 직접 실행한 흐름에만 적용합니다. 새로고침/세션 복원 autoplay 금지 정책은 유지합니다.
- TXT·MD·SRT·VTT intake는 브라우저 텍스트 편의 기능이며 원본 파일 자체를 프로젝트 session에 저장하거나 원본 자막을 덮어쓰지 않습니다.
- 승인 Chromium baseline PNG는 아직 저장소에 없으므로 `SORION_VISUAL_BASELINE_REQUIRED=1`을 강제로 켜지 않았습니다.
- 실제 CosyVoice 5개 preset WAV·화자 동의/권리·사람 검수 자료·모델 가중치는 포함하지 않습니다.
