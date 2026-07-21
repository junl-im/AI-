# AI 쇼츠 제작 스튜디오 v1.4.1

## v1.4.1 적용 내용과 결과

서비스워커 상태를 앱에서 관찰할 수 있게 하고 설치·활성화·캐시 정리·오프라인 복구 동작을 자동 검증했습니다.

- `getStatus()`와 `waitUntilControlled()` 생명주기 API 추가
- controller·update·worker 상태 전환 진단 기록 추가
- 실제 `sw.js` 이벤트 실행 감사 추가
- 자동 QA **145/145** 통과
- PC·모바일 Chromium 오류 0건
- MP3·MP4·취소·재시도·10분 미디어 E2E 통과

# AI 쇼츠 제작 스튜디오 v1.4.0

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다. 파일과 분석 결과는 서버로 전송하지 않습니다.

## v1.4.0 핵심 개선

이번 버전은 메인 앱에 집중돼 있던 렌더 책임을 분리하고 렌더 큐 표시와 작업 종료를 더 안전하고 결정적으로 만들었습니다.

- 렌더 큐 UI, 내보내기 payload, 작업 실행, 실패 재시도, 편집 선택 복원을 전용 `render-workflow-controller`로 분리했습니다.
- 렌더 큐의 제목·파일명·상태·오류를 HTML 문자열 대신 안전한 DOM과 `textContent`로 표시합니다.
- 렌더 operation 종료를 공통 `finally` 한 곳으로 통합해 정확히 한 번만 종료합니다.
- 렌더 성공·실패·취소 뒤 사용자가 보던 후보와 수동 범위를 복원합니다.
- `src/app.js`를 약 11.4% 축소했습니다.
- 실제 가짜 DOM·렌더 큐 실행 검사를 추가해 자동 QA를 **143/143**로 확장했습니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset
python3 qa/run_media_e2e.py --cases longAudio
```

최종 검수 결과:

- 자동 QA: **143/143**
- PC·모바일 Chromium JavaScript 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 페이지 가로 overflow: **0px**
- 20초 MP3·MP4 분석→추천→선택→MP4 저장 통과
- 렌더 취소와 의도적 재생 실패 후 재시도 통과
- 10분 MP3 분석: 약 **6.164초**
- 10분 분석 트랙: 8kHz, 약 **18.3MB**
- 예상 디코딩 메모리: 약 **219.7MB**, 위험도 medium
- decoded AudioBuffer·channelData 분석 후 미보유 확인
- 6초 렌더 출력: 약 **6.346초**, **1,670,118바이트**, ffprobe 통과

## 배포 파일 생성

```bash
npm run package:full
PATCH_BASE_ARCHIVE=/path/to/AI_Shorts_Studio_v1.3.9_Improved.zip npm run package:patch
```

전체 ZIP은 모든 실행·문서·QA 파일을 포함합니다. 패치 ZIP은 v1.3.9 설치 폴더 위에 같은 경로로 덮어쓰는 변경·신규 파일만 포함합니다.

배포 ZIP에는 `PATCH_MANIFEST.txt`, Python 캐시, Git 메타데이터, `node_modules`, 이전 배포 ZIP을 포함하지 않습니다.

## 주요 구조

- 메인 앱 오케스트레이션: `src/app.js`
- 렌더 워크플로·큐 UI·편집 선택 복원: `src/app/render-workflow-controller.js`
- 렌더 실행·미디어 상태 복원: `src/render/vertical-renderer.js`
- 렌더 작업 상태·취소·재시도: `src/render/render-queue.js`
- 세션 백업·손상 기록 내보내기: `src/ui/session-continuity.js`
- 안전한 클립보드·범위 정규화: `src/utils/core-utils.js`
- 서비스워커 등록·업데이트 소유권: `src/boot/service-worker-registration.js`
- 안전한 지속 설정: `src/state/app-state.js`
- 프로젝트 설정 검증·병합: `src/project/project-service.js`
- 모듈형 엔진 커널·계약·파이프라인: `src/engine/`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 체크포인트 실미디어 감사: `qa/run_media_e2e.py`

## 알려진 제한

현재 Chromium 인라인 감사는 실제 서비스워커 lifecycle과 localStorage 지속성을 실행하지 않습니다. 매우 긴 무압축 오디오의 순간 디코딩 메모리, 15분·30분 고해상도 MP4, 모바일 Safari·Samsung Internet 장시간 출력도 추가 검증이 필요합니다.
