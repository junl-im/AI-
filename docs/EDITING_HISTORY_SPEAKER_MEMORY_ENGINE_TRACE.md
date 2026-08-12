# Editing History, Speaker Memory & Engine Routing Trace

SoriON AI 0.11.12는 편집 실수 복구와 반복 작업 단축, 장문 엔진 자동 분산의 관측 가능성을 함께 강화합니다.

## Bounded timeline Undo / Redo

- 최근 20개의 편집 명령을 `past/future` stack으로 유지합니다.
- `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+Y`와 Timeline toolbar 버튼을 지원합니다.
- 이동·재정렬·대사 수정·분할·쉼 추가·삭제·다중 삭제·일괄 목소리 변경을 기록합니다.
- 순서만 바뀐 ready clip은 기존 track/audio를 유지합니다.
- 대사/voice처럼 음성 결과를 무효화하는 상태를 되돌릴 때는 폐기된 object URL/job을 재사용하지 않고 해당 clip을 queued로 복원합니다.
- 새 프로젝트/세션/저장 프로젝트 복원은 이전 편집 history를 초기화해 다른 프로젝트 상태가 Undo로 섞이지 않게 합니다.

## Speaker voice memory

- 다중 화자 배정을 승인하면 최근 24개 화자-voice 조합을 브라우저 로컬에 기억합니다.
- 화자 원문은 저장하지 않고 NFKC 정규화 뒤 stable hash key와 `voiceId`만 저장합니다.
- 다음에 같은 화자 label을 만나면 기존 배정을 우선 제안하지만 자동 적용하지 않습니다.
- 최종 `이 화자 배정으로 만들기` 확인 gate는 그대로 유지합니다.

## Engine routing trace

- 장문 batch 완료 결과의 실제 `engineId`를 원문 순서대로 집계합니다.
- 엔진별 사용 횟수, engine switch 횟수, fallback 횟수, 실제 시도된 engine 수를 계산합니다.
- 완료 메시지에서 routing trace를 확인할 수 있습니다.
- 이 trace는 음질 benchmark가 아니며 다음 장시간 soak에서 병렬도 상향/하향 판단의 관측 지표로 사용합니다.

## 안전 경계

- 동시 생성 상한은 0.11.8에서 고정한 최대 2를 유지합니다.
- engine circuit breaker, active-request load penalty, EWMA performance penalty, explicit engine 선택 계약은 변경하지 않습니다.
- speaker memory에는 대본/오디오/job/error를 저장하지 않습니다.
