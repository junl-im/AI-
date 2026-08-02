# SoriON AI 0.9.3-beta.3 Patch

기준: `0.9.3-beta.2 · CI Hardening 1`
목표: 검증 증거 저장, STT 재생성 전후 비교, 장문 Export soak와 스트리밍 안정화

## 적용

1. 패치 ZIP을 기존 프로젝트 폴더에 덮어씁니다.
2. Windows는 `APPLY_PATCH.cmd`, macOS·Linux는 `APPLY_PATCH.sh`를 실행합니다.
3. 적용기는 누적 폐기 파일을 삭제하고, 의존성 그래프가 바뀌지 않은 기존 `package-lock.json`의 루트 버전만 안전하게 동기화합니다.
4. GitHub Desktop에서 변경과 삭제를 모두 확인한 뒤 Commit·Push합니다.
5. 실제 장치·STT 결과는 `.sorion/quality`에만 기록하고 저장소에 음원·모델·개인 장치명을 넣지 않습니다.

## 검증

- API pytest 117개, Worker pytest 14개
- TypeScript·TSX 145개 parser 검사
- 10·30·60분 WAV·MP3 합성 soak 6개 시나리오
- 프로젝트 규칙, CI failure-domain, lock retry, free-only, engine blueprint, 모델 onboarding, evidence 계약 검사

합성 soak는 파일 구조와 자막 싱크 검증이며 실제 음질·GPU·모바일 성능 증거가 아닙니다.

