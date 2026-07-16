# AI 쇼츠 스튜디오 v1.2.9 QA REPORT

## 결론

v1.2.9 안정화 릴리스는 자동 검사 **115/115**와 실제 Chromium 런타임 감사를 통과했습니다. 이번 검수에서 PC 메뉴바 잘림, 단계 로더 편집 키 불일치, 제거된 함수의 잔존 호출, 미디어 루프·렌더 타이머 정리 부족을 확인하고 수정했습니다.

## 주요 발견과 수정

### 1. PC 메뉴바 잘림

- 증상: 1366px급 PC에서 마지막 `저장` 메뉴가 화면 밖으로 밀림
- 원인: 바깥 프레임 970px과 내부 레일 1180px 규칙이 동시에 적용됨
- 수정: 내부 레일을 부모 폭 100%로 고정하고 8열을 `minmax(0, 1fr)`로 변경
- 폴백: 1180px 미만에서 4열×2행

### 2. 단계 로더 상태 불일치

- 증상: 편집 메뉴 접근 시 editing 단계 선로딩이 누락될 수 있음
- 원인: 실제 메뉴 키는 `edit`, 로더 조건은 `editor`
- 수정: `edit`로 통일하고 런타임 config 기반 빌드 쿼리를 사용
- 추가: 10초 타임아웃과 `staged-ui-load-error` 진단

### 3. 실제 브라우저 초기화 오류

- 증상: 전체 스크립트 실행 중 `ReferenceError: syncTopLine is not defined`
- 원인: 함수는 제거됐지만 이벤트 리스너와 공개 API에 참조가 남음
- 수정: 잔존 호출과 공개 API 참조 제거
- 재검증: window error 0, unhandled rejection 0, console error 0

### 4. 미디어·렌더 정리 경로

- 미리보기 `play()` 거절 시 RAF·interval을 시작하지 않도록 수정
- 렌더 성공·오류·중단에서 RAF, interval, timeout, MediaStreamTrack과 볼륨을 공통 cleanup으로 정리
- 세션 자동 저장은 30초 주기이며 hidden/pagehide에서 heartbeat 중단

## 자동 QA

```text
Passed: 115/115
Failed: 0/115
```

검사 범위:

- JavaScript 문법
- DOM 앵커와 UI 계약
- 엔진 모듈·상태 계약
- 단계형 로딩과 캐시
- PC 메뉴 containment
- 런타임 안정성 코드 가드
- 실제 Chromium 감사 JSON
- 문서·인계·배포 계약

## Chromium 런타임 감사

감사 파일: `qa/runtime-browser-audit-v1.2.9.json`

| 항목 | PC 1366×768 | 모바일 390×844 |
|---|---:|---:|
| window 오류 | 0 | 0 |
| Promise 거절 | 0 | 0 |
| console 오류 | 0 | 0 |
| runtimeHealth 오류 | 0 | 0 |
| RAF 2초 → 4초 | 25 → 25 | 25 → 25 |
| Mutation 2초 → 4초 | 59 → 59 | 59 → 59 |
| 보이는 메뉴 | 8/8 | 8/8 |
| 가로 overflow | 0px | 0px |

감사용 문서는 관리형 Chromium의 로컬 URL 제한 때문에 실제 HTML·CSS·스크립트를 CDP 문서에 주입해 실행했습니다. 이 환경에서는 secureContext와 serviceWorker가 false이며 배포 서비스워커 결함을 의미하지 않습니다.

## PC 메뉴 너비 검수

1180, 1280, 1366, 1920px에서 8개 메뉴가 모두 viewport 안에 들어왔습니다. 1180px 미만은 4열×2행 폴백을 사용합니다. 1366px 기준 메뉴바는 1080px이며 마지막 `저장` 항목의 오른쪽 끝은 1209px로 viewport 1366px 안에 있습니다.

## 배포 검증 기준

- 전체 설치 ZIP 생성
- v1.2.8 덮어쓰기 패치 ZIP 생성
- `PATCH_MANIFEST.txt`의 from/to 확인
- 두 ZIP `unzip -t` 검사
- 깨끗한 v1.2.8 복사본에 패치 적용 후 변경 파일 바이트 비교
- SHA-256 체크섬 생성

최종 결과:

- 전체 ZIP: 225개 항목, 압축 오류 0건
- 패치 ZIP: 67개 파일, 압축 오류 0건
- v1.2.8 복사본 패치 적용: 누락 0건, 불일치 0건

## 남은 제한

- 실제 대용량 MP4 장시간 분석·렌더·다운로드 E2E는 아직 완료하지 않았습니다.
- 모바일 Safari와 인앱 브라우저의 MediaRecorder·SVG mask는 실기기 검증이 필요합니다.
- 실제 사용자 파일의 코덱 다양성과 렌더 중 탭 전환·중단·재시도 시나리오는 다음 엔진 점검 대상입니다.
