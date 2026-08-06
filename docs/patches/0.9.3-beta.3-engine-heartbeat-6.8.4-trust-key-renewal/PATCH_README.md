# Heartbeat 6.8.3.3 → 6.8.4 덮어쓰기 패치

1. GitHub Desktop에서 현재 변경사항이 없는지 확인합니다.
2. 패치 ZIP을 저장소 루트에 압축 해제하고 파일 덮어쓰기를 허용합니다.
3. `npm run quality:preflight`를 실행하거나 Push 후 GitHub Actions의 녹색 결과를 확인합니다.

주요 변경은 active·previous HMAC 신뢰 키 ring, 기존 승인 current-key 재서명, 동의·권리·WAV 결박 갱신 대기열과 같은 로컬 파일시스템의 API 프로세스 간 승인 잠금입니다.

알 수 없는 key ID·잘못된 HMAC은 자동 재서명하지 않으며 동의·권리 만료일도 자동 연장하지 않습니다. 실제 secret, 운영자 토큰, 화자 WAV와 동의·권리 원문은 패치에 포함하지 않습니다.

검증 결과: Repository preflight 27/27, API pytest 179개, Worker pytest 14개, TS/TSX 191개 구문 검사와 Python compileall 통과. Web npm 의존성 설치가 내부 registry의 `zustand@5.0.8` 404로 차단되어 ESLint·Vitest·Vite build는 GitHub Actions가 최종 판정합니다.
