# SoriON AI 6.8.0 → 6.8.1 덮어쓰기 패치

기준 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.0 · Preset Evidence Review`
대상 버전: `0.9.3-beta.3 · Engine Heartbeat 6.8.1 · Review Export Sync & Voice Selection Telemetry`

## GitHub Desktop 적용

1. 현재 변경사항을 먼저 Commit하거나 프로젝트 폴더를 백업합니다.
2. 패치 ZIP의 내용물을 저장소 최상위 폴더에 바로 압축 해제해 덮어씁니다.
3. `.git` 폴더는 건드리지 않습니다.
4. GitHub Desktop Changes에서 변경·추가 파일 53개, 삭제 0개를 확인합니다.
5. `npm run quality:preflight`, API·Worker 테스트를 실행하거나 Push 후 GitHub Actions 결과를 확인합니다.
6. 이상이 없으면 Commit·Push합니다.

## 핵심 변경

- Quality Lab 검수 기록의 승인 후보·재검토·거부 결정과 SHA-256 검수 묶음 JSON 내보내기·가져오기
- 검수 묶음 변조·누락 checksum, 5MiB 초과, 5000건 초과와 계약 불일치 차단
- manifest v2의 승인 당시 WAV SHA-256 결박과 WAV 교체 시 `stale` 자동 무효화
- 동의·권리 만료 30일 전 경고와 만료 후 차단
- Windows System.Speech·MeloTTS 실제 선택 화자 이름·ID·성별 판정·선택 근거 진단
- 모델 digest·가속 장치·GPU·프리셋별 benchmark와 final handoff P95 집계
- review sync/telemetry 정적 계약을 포함한 preflight 22개

## 제한

실제 5명 WAV, 동의·권리 원본, 운영자 서명, CosyVoice 모델 가중치와 실기기 benchmark 값은 포함하지 않습니다. 검수 묶음 SHA-256은 파일 변경 탐지용이며 전자서명·권리·화자 신원 증명이 아닙니다. 가져오기는 로컬 평가만 병합하고 manifest를 자동 승인하지 않습니다.

전체 파일 목록은 `PATCH_MANIFEST.txt`, 삭제 목록은 `DELETE_LIST.txt`를 확인합니다.
