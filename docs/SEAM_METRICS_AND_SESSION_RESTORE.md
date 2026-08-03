# Seam Metrics and Player Session Restore

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4`

## 구간 전환 측정 정의

부분 재생의 seam 값은 이전 WAV 구간의 `ended` 이벤트가 발생한 시점부터 다음 WAV 구간의 실제 `playing` 이벤트가 발생한 시점까지의 시간입니다.

- 측정 경계: `ended → playing`
- 단위: 밀리초
- 생성 대기 여부: 다음 구간이 아직 준비되지 않았던 전환은 `waitedForSegment=true`로 별도 기록
- 보존 한도: 트랙별 최근 20개 전환
- 내보내기: Quality Lab의 `구간 전환 증거 JSON 저장`

이 값에는 다음 구간 생성 대기, 네트워크 fetch, WAV decode와 media element source 교체 시간이 함께 포함될 수 있습니다. 따라서 값이 짧더라도 **gapless** 재생을 증명하지 않습니다.

## 새로고침 뒤 플레이어 복원

플레이어 세션은 브라우저 localStorage에 500ms debounce와 `pagehide` checkpoint로 저장합니다.

복원 대상:

- `https://` 또는 `http://` 원격 최종 API 음원
- Browser Speech 재생 정보
- 선택된 트랙, 반복 모드, 재생 속도
- 최종 음원의 마지막 재생 위치

복원 제외:

- 부분 음원과 `progressive.segments`
- Blob URL과 소유권 해제가 필요한 미리듣기 음원
- 만료 서명 segment URL
- 25분이 지난 플레이어 세션

서버 최종 음원의 기본 TTL이 30분이므로 복원 창을 25분으로 제한합니다. 복원 뒤에는 자동 재생하지 않고 저장된 위치만 적용합니다. 모바일 autoplay 정책과 사용자 의도를 보존하기 위한 결정입니다.

## 개인정보와 수명

- 사용자 대본을 별도 증거 필드로 복제하지 않습니다.
- 원격 음원 주소와 Browser Speech 텍스트는 재생 복원에 필요한 범위에서만 해당 브라우저에 저장됩니다.
- 대기열을 비우면 다음 persistence checkpoint에서 저장 세션도 제거됩니다.
- 오래되거나 안전하지 않은 항목은 load 단계에서 폐기합니다.


## Heartbeat 6.4 P95와 signed rehydration

Quality Lab은 정렬된 seam 값의 nearest-rank P95를 평균·최대와 함께 표시합니다. 최종 WAV 교체 시 목표 위치와 실제 media element 위치의 차이도 `finalHandoffErrorMs`로 기록합니다. 두 값 모두 브라우저 이벤트 기반이며 파형 무음 측정은 아닙니다.

최종 API 트랙은 작업 ID를 세션에 함께 저장합니다. 복원 단계에서 완료 결과를 다시 조회해 새 HMAC URL로 바꾸고, 실패한 트랙만 제외합니다. media element 오류에서도 트랙당 기존 URL 기준 한 번 재발급합니다.
