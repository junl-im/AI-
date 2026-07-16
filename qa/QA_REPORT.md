# AI 쇼츠 스튜디오 v1.3.2 QA REPORT

## 요약

v1.3.2는 자동 검사 **124/124**와 Chromium PC·모바일 런타임 감사, 합성 MP3·MP4 실미디어 E2E 감사를 통과했습니다. 이번 검수는 Worker 폴백, 렌더 사전 검사, 사용자 취소, 재생 실패 즉시 중단, 실패 작업의 새 operation 재시도와 출력 파일 재생 가능 여부를 포함합니다.

## 자동 QA

- 총 검사: **124**
- 통과: **124**
- 실패: **0**
- 포함 범위: 문법, DOM 앵커, 버전·캐시, 메뉴 containment, SVG 아이콘, 단계형 로딩, 모듈형 엔진, operation coordinator, 렌더 큐, Worker 폴백, 취소·재시도, 네온 랜딩, 작업실 조절, 브라우저 감사, 실미디어 감사와 이중 배포 계약

## Chromium 반응형 런타임 감사

| 항목 | PC 1366×768 | 모바일 390×844 |
|---|---:|---:|
| JavaScript 오류 | 0 | 0 |
| 처리되지 않은 Promise | 0 | 0 |
| console.error | 0 | 0 |
| 메뉴 표시 | 8/8 | 8/8 |
| 가로 overflow | 0 | 0 |
| 단계 랜딩 네온 | 확인 | 확인 |
| 랜딩 종료 후 지속 강조 | 확인 | 확인 |
| 작업실 리사이저 | 2/2 | 숨김 |
| 미리보기 집중 폭 | 약 897px | 해당 없음 |
| 파형 확대 폭 | 약 1334px | 해당 없음 |

초기 안정화 샘플 사이 RAF는 증가하지 않았고 Mutation 증가는 PC 3회, 모바일 0회로 허용 범위 안이었습니다.

감사 파일: `qa/runtime-browser-audit-v1.3.2.json`

## 실미디어 E2E 감사

### 합성 MP3 20초

- 파일: `sample-20s.mp3`, 약 321KB
- 분석·추천·후보 선택 완료
- 사용자 구간: 00:00~00:02
- 렌더 큐: done 1 / failed 0 / cancelled 0
- 출력: MP4 계열 컨테이너, 약 1.90초, 약 340KB
- Worker 폴백 경로 실행 확인
- 런타임 오류와 남은 활성 operation: 0

### 합성 MP4 20초

- 파일: `sample-20s.mp4`, 약 3.2MB
- 오디오·모션 분석, 추천·후보 선택 완료
- 사용자 구간: 00:00~00:02
- 렌더 큐: done 1 / failed 0 / cancelled 0
- 출력: MP4 계열 컨테이너, 약 1.95초, 약 218KB
- 런타임 오류와 남은 활성 operation: 0

### 렌더 취소

- 실행 중 취소 버튼 활성화 확인
- 큐: cancelled 1 / done 0 / failed 0
- 다운로드: 0건
- 종료 후 활성 operation과 브라우저 오류: 0

### 재생 실패와 재시도

- 첫 시도에 원본 `play()` 실패를 주입
- 첫 큐: failed 1, 재시도 버튼 활성화
- 재시도는 새 operation으로 시작
- 두 번째 시도: attempts 2 / done 1 / failed 0
- 출력: MP4 계열 컨테이너, 약 2.00초, 약 398KB
- 종료 후 오류와 활성 operation: 0

감사 파일: `qa/runtime-media-e2e-v1.3.2.json`

## 배포 검증

- 전체 설치 ZIP과 v1.3.1 덮어쓰기 패치 ZIP 생성
- 두 ZIP `unzip -t` 무결성 검사
- 깨끗한 v1.3.1 복사본에 패치 적용
- 패치 파일: **70개**, 누락 0건, 불일치 0건
- 전체 ZIP: **241개 항목**
- SHA-256 체크섬 생성

## 남은 실기기 검증

- 5분·15분·30분 대용량·고해상도 MP4 장시간 분석과 메모리 사용
- 모바일 Safari·Samsung Internet·인앱 브라우저 MediaRecorder MIME·확장자
- captureStream이 없는 브라우저에서 원본 오디오 포함 여부와 사용자 안내
- 서비스워커 제어 상태와 영구 localStorage를 포함한 설치형 PWA 흐름
