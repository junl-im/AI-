# SoriON AI 0.9.0 덮어쓰기 패치

기준 버전: `0.8.9`
대상 버전: `0.9.0 Free-First Korean Progressive Voice`

## 적용

1. 현재 저장소가 정확히 0.8.9인지 확인합니다.
2. 작업 중인 변경과 `.git`, `.env`, 실행 DB, 모델, 사용자 음성을 백업합니다.
3. 패치 ZIP을 저장소 루트에 풀어 같은 파일을 덮어씁니다.
4. 이번 패치에서 삭제할 파일은 없습니다.
5. `npm run quality:rules`와 GitHub Actions를 실행합니다.

## 핵심 변경

- 기본 `free-only` 엔진 비용 정책
- 과금형 Cloud Adapter의 서버 명시 opt-in
- TTS job SSE 진행률과 polling fallback
- 장문 Progressive Queue의 현재 트랙 보존
- 설정 화면의 읽기 전용 `무료 우선 자동` 상태

모델 가중치, Secret, 사용자 음성, `.git`, `node_modules`, 실행 DB와 캐시는 포함하지 않습니다.
