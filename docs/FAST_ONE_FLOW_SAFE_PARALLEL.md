# Fast One-Flow & Safe Parallel Generation

적용 버전: **SoriON AI 0.11.8**

## 목표

긴 대본에서 첫 결과를 빨리 들려주고 전체 완료 시간도 줄이되, 재생 순서·취소·엔진 보호 계약을 깨뜨리지 않습니다. One-Flow의 기본 화면은 계속 `목소리 → 대본 → 바로 더빙 → 듣기`에 집중합니다.

## 생성 계약

1. 첫 대사는 단독으로 우선 생성하고 준비되면 자동 재생합니다.
2. 남은 대사는 `runBoundedOrderedBatch`로 최대 2개만 동시에 실행합니다.
3. 요청 완료 순서와 재생 순서를 분리합니다. 완료 후 `alignTrackOrder`로 대상 트랙을 원문 타임라인 순서에 맞춥니다.
4. batch run token이 바뀌면 새 작업을 더 가져오지 않습니다. `생성 중지`와 `전체 비우기`는 active 요청도 abort합니다.
5. 취소 전에 이미 ready가 된 음원은 보존하고, 아직 완성되지 않은 voice block은 queued로 되돌립니다. 취소된 batch를 완성 프로젝트로 저장하지 않습니다.

## One-Flow 편의 계약

- SRT/VTT는 파일 가져오기뿐 아니라 clipboard paste에서도 cue 번호와 timecode를 제거합니다.
- `말하기 좋게 정리`는 Markdown heading/list/quote/구분선과 불필요한 공백만 정리하며 대사의 의미나 문체를 자동 재작성하지 않습니다.
- `첫 문장 미리듣기`는 샘플 문구 대신 현재 대본 첫 문장을 현재 voice/speed/pitch/emotion/normalize 설정으로 합성합니다.
- 생성 중에는 완료/전체, 생성 중, 대기, 실패 수와 중지 동작을 같은 카드에서 표시합니다.
- 명시적인 `화자: 대사` 라벨이 2명 이상이면 화자 수만 안내합니다. 자동 성별 추정이나 무승인 voice 배정은 0.11.8에서 하지 않습니다.

## 성능·안전 트레이드오프

병렬도 2는 처리량과 로컬/원격 엔진 부하 사이의 보수적 상한입니다. 기존 engine circuit breaker, active-request load awareness, fallback 규칙을 우회하지 않습니다. 장시간 soak에서 실패율·P95·엔진 switching이 악화되지 않는지 0.11.9에서 증거화합니다.

## 검증 계약

- repository preflight가 bounded parallel, 첫 음성 우선, 순서 복원, 취소/clear run invalidation, 대본 정리와 진행 UI 토큰을 검사합니다.
- 순수 함수 smoke test는 bounded batch의 최대 동시 실행 수와 결과 순서, player queue 재정렬을 검증합니다.
- API/Worker 회귀는 기존 엔진·복구·evidence 경계를 유지하는지 확인합니다.
- 전체 Web ESLint/Vitest/semantic typecheck/Vite/Chromium은 GitHub Actions `Web quality`를 최종 gate로 둡니다.
