# Browser Device Evidence

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.4`

## 목적

품질 연구소의 `현재 기기 재생 점검`은 브라우저에서 자동으로 확인할 수 있는 기능, 실제 사용자 제스처 재생, 탭 숨김·복귀와 네트워크 전환 관찰을 분리해 JSON 증거로 저장합니다. 이 기록은 **실기기 인증**을 자동 완료하는 기능이 아니라 Android Chrome·iOS Safari·PWA 수동 검증의 보조 자료입니다.

## 자동 감지 항목

- 공개 HTTPS Secure Context 여부
- 현재 online 상태
- `EventSource` API 지원 여부
- Service Worker와 Media Session 지원 여부
- browser tab 또는 standalone PWA 표시 모드
- 현재 문서 visibility 상태

전체 User-Agent 문자열, 사용자 문장, 음성 파일과 IP 주소는 기록하지 않습니다. 장치 프로필은 Android Chrome, iOS Safari, 설치형 PWA, Desktop Browser 수준으로만 정규화합니다.

## 관찰 세션

카드가 열려 있는 동안 다음 이벤트를 localStorage에 누적합니다.

- online·offline 네트워크 전환 횟수
- `visibilitychange` 횟수
- 숨김 뒤 visible로 돌아온 백그라운드 복귀 횟수
- 숨김 누적 시간과 최장 숨김 시간
- BFCache `pageshow.persisted` 복원 횟수

이 관찰은 브라우저 이벤트가 발생했다는 증거입니다. 음성이 백그라운드에서 끊김 없이 재생됐거나 SSE가 계속 연결됐음을 자동으로 증명하지 않습니다.

## 실제 동작 검사

`재생 허용 검사`는 사용자가 버튼을 누른 같은 제스처 안에서 짧은 무음 WAV의 `audio.play()`를 실행해 재생 허용·차단·실패를 구분합니다. 사용자 제스처 없는 autoplay 성공을 의미하지 않습니다.

다음 항목은 별도 실기기 soak가 필요합니다.

- 10분 이상 SSE 연결 유지와 proxy buffering
- Wi-Fi·셀룰러 전환 중 실제 음원 fetch 복구
- 잠금 화면과 Media Session 제어
- iOS 메모리 압박 뒤 media element 복구
- 실제 CosyVoice 구간 사이 decode gap

## 증거 저장

- 자동 검사와 관찰 세션은 해당 브라우저의 localStorage에만 저장합니다.
- `기기 증거 JSON 저장`으로 로컬 파일을 내려받을 수 있습니다.
- `관찰 세션 초기화`는 누적 전환과 숨김 시간을 새로 시작합니다.
- JSON은 장치 모델명이나 전체 User-Agent를 포함하지 않습니다.
- 릴리스 판정은 JSON과 함께 기기·OS·브라우저 버전, 테스트 시나리오, 화면 녹화 또는 로그를 별도로 보관해야 합니다.
