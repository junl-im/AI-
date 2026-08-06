# Heartbeat 6.8.3.2 → 6.8.3.3 덮어쓰기 패치

1. GitHub Desktop에서 현재 변경사항이 없는지 확인합니다.
2. 패치 ZIP을 저장소 루트에 압축 해제하고 파일 덮어쓰기를 허용합니다.
3. `npm run quality:preflight`를 실행하거나 Push 후 GitHub Actions의 녹색 결과를 확인합니다.

주요 변경은 일반 화면의 기술 연결 상태 비노출, 가장 빠른 API 후보 병렬 탐색, 자동 heartbeat·재연결, 엔진 목록 cache, API↔Worker 지속 연결 풀과 readiness supervisor입니다.

실제 모델 cold start와 네트워크 왕복은 0초를 보장할 수 없습니다. 모델·GPU·비밀키·운영자 토큰은 패치에 포함하지 않습니다.

검증 결과: Repository preflight 26/26, API pytest 171개, Worker pytest 14개, TS/TSX 192개 구문 검사와 Python compileall 통과. Web ESLint·Vitest·Vite build는 GitHub Actions가 최종 판정합니다.
