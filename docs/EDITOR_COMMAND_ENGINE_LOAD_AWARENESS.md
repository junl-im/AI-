# Editor Command UX & Adaptive Engine Load Awareness

대상 버전: **0.11.5**

## 목적

긴 대본에서 반복 클릭을 줄이고, 여러 생성 요청이 동시에 들어올 때 auto routing이 한 엔진에만 몰리지 않도록 합니다. 기존 명시적 엔진 선택, circuit breaker, half-open probe, 프리셋 호환 실패 계약은 유지합니다.

## Timeline command UX

다중 선택 상태에서 다음 키를 지원합니다. 폼 입력 요소나 contenteditable에 포커스가 있으면 전역 명령으로 처리하지 않습니다.

- `Ctrl/Cmd+A`: 전체 대사 선택
- `R`: 선택 재생성 안전 미리보기
- `Shift+R`: 실패한 선택만 재시도
- `Alt+←/→`: 선택 블록 이동
- `Delete/Backspace`: 삭제 안전 미리보기
- `Esc`: 다중 선택 해제
- `?`: 단축키 도움말

준비된 음원이 있는 재생성과 삭제는 바로 실행하지 않고 영향 범위를 보여준 뒤 명시적으로 실행합니다. 이동은 직전 1회에 한해 반대 방향으로 되돌립니다.

## Auto routing load awareness

`EngineRuntimeState.active_requests`가 1건 이상이면 auto candidate selection에서 요청당 12점, 최대 36점의 임시 감점을 적용합니다. 목적은 동시에 시작된 작업을 이미 준비된 backup 엔진으로 분산하는 것입니다. 명시적 엔진 선택의 candidate 목록은 바꾸지 않습니다.

이 값은 benchmark가 아닙니다. 엔진의 처리량이나 GPU 용량을 추정하지 않고 현재 API 프로세스 안에서 실행 중인 요청 수만 사용합니다.

## Performance observation session

엔진 정보와 진단에는 다음 관찰 필드를 노출합니다.

- active request count
- sample count / minimum samples
- observation window / remaining seconds
- observation status: `disabled`, `idle`, `warming`, `active`, `expired`
- observation started / last sample timestamps
- latency EWMA / reliability EWMA

관찰창이 만료된 뒤 새 표본이 들어오면 이전 EWMA·표본을 먼저 비우고 새로운 관찰 세션을 시작합니다.

## 안전 경계

- 명시적 엔진 선택을 부하 감점 때문에 거부하지 않습니다.
- circuit open/cooldown/half-open probe 규칙보다 active-request 분산을 우선하지 않습니다.
- `SOA-4022` 프리셋 호환 실패를 엔진 장애로 오인하지 않습니다.
- UI의 관찰 값은 음질 평가나 실제 성능 benchmark로 표시하지 않습니다.

## 회귀 계약

- 첫 auto 요청이 primary에서 실행 중이면 두 번째 auto 요청은 준비된 backup을 선택하는 테스트를 고정합니다.
- 관찰 상태가 warming → active → expired → 새 warming session으로 전환되는 테스트를 고정합니다.
- dependency-free preflight에서 command handler, 안전 preview, move undo, load penalty, observation schema/UI 연결을 확인합니다.
