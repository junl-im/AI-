# AI 쇼츠 제작 스튜디오 v1.5.2

음악이나 영상을 브라우저 안에서 분석하고 하이라이트 추천, 9:16 미리보기, 편집, MP4 저장까지 이어주는 로컬 웹 스튜디오입니다. 미디어 파일과 분석 결과는 서버로 전송하지 않습니다.


## v1.5.2 적용 내용

- 자막·품질·자동 컷 설정의 정규화, 저장, UI 동기화를 전용 설정 컨트롤러로 분리했습니다.
- 설정 범위 보정과 프리셋·초기화 경로를 중앙화해 화면과 저장 상태 불일치를 줄였습니다.
- 분석·미리보기·렌더 작업을 20회 반복하는 cleanup 감사를 추가했습니다.
- 자동 QA 152/152와 실제 MP3·MP4·취소·재시도·10분 미디어 감사를 통과했습니다.

## v1.5.0 적용 내용

- 작업 시작 후 큰 소개 영역을 자동으로 접어 작업 패널을 첫 화면에 더 빨리 표시합니다.
- 상단 상태 카드에서 전체 진행률, 현재 단계, 가장 적절한 다음 행동을 확인하고 실행할 수 있습니다.
- 자동 분석을 직접 취소하고 취소·실패 뒤 다시 시작할 수 있습니다.
- UI 안내 책임을 `studio-experience-controller`로 분리해 지연 로드합니다.
- 성능 여유가 있는 짧은 영상은 오디오와 움직임을 병렬 분석합니다.
- 장시간·저메모리 환경은 안전 순차 분석을 유지합니다.
- 한 분석 축이 실패해도 가능한 결과를 유지하고 경고를 제공합니다.
- 분석 캐시는 clone-safe LRU·30분 TTL·상태 통계를 사용해 재사용 결과 오염을 막습니다.

## 검수 결과

- 자동 QA: **149/149**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 가로 overflow: **0px**
- MP3·MP4 분석→추천→선택→MP4 저장 통과
- 렌더 취소와 의도적 재생 실패 후 재시도 통과
- 10분 MP3 분석: **5.423초**
- 6초 MP4 출력 작업: **6.190초**, **1,908,764바이트**
- 병렬 분석 시간 단축과 움직임 분석 실패 축소 동작 통과
- 서비스워커 설치·활성·캐시 정리·오프라인 복구 격리 감사 통과

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다.

## 전체 검수

```bash
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset
python3 qa/run_media_e2e.py --cases longAudio
node qa/run_service_worker_lifecycle.js
```

## 주요 구조

분석·추천·렌더 기능은 기존 **모듈형 엔진** 계약 위에서 동작하며, v1.5.0은 그 위에 적응형 병렬 분석과 clone-safe 캐시를 추가합니다.


- 메인 앱 상태·오케스트레이션: `src/app.js`
- 작업 진행률·다음 행동·소개/작업실 전환: `src/ui/studio-experience-controller.js`
- 적응형 분석 예산: `src/engine/performance-budget.js`
- 병렬·순차 분석 파이프라인: `src/engine/analysis-pipeline.js`
- clone-safe LRU 분석 캐시: `src/engine/analysis-cache.js`
- 설정 정규화·저장·UI 동기화: `src/app/settings-controller.js`
- 렌더 워크플로·큐 UI: `src/app/render-workflow-controller.js`
- 렌더 실행·미디어 복원: `src/render/vertical-renderer.js`
- 서비스워커 등록·업데이트: `src/boot/service-worker-registration.js`
- 변경·검수·제약 누적 기록: `HANDOFF.md`

## 배포 파일 생성

```bash
npm run package:full
PATCH_BASE_ARCHIVE=/path/to/AI_Shorts_Studio_v1.4.1_Full.zip PATCH_FROM_VERSION=1.4.1 npm run package:patch
```

전체 ZIP은 모든 실행·문서·QA 파일을 포함합니다. 패치 ZIP은 v1.4.1 설치 폴더 위에 같은 경로로 덮어쓸 변경·신규 파일만 포함합니다.

## 알려진 제한

실제 Chromium 감사 기기는 4GB 메모리로 보고돼 실미디어 영상은 안전 순차 전략을 사용했습니다. 병렬 분기는 모의 시간·부분 실패 검사로 통과했으며 8코어·8GB 이상 실기기 계측이 추가로 필요합니다. 모바일 Safari·Samsung Internet과 15분·30분 고해상도 MP4 장시간 출력도 별도 검증 대상입니다.
