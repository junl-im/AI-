# AI 쇼츠 제작 스튜디오 v1.3.7

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.7 핵심 개선

이번 버전은 **렌더 자원 해제**, **수동 범위 경계값**, **대용량 자막 보호**, **프로젝트 후보 식별자 안정성**, **서비스워커 업데이트 단일 소유**를 강화했습니다.

- 렌더 가능 여부 확인 단계에서 `captureStream()`을 호출하지 않아 검사만으로 미디어 트랙이 생성되지 않습니다.
- 실제 렌더에서 원본 스트림은 한 번만 생성하며 성공·실패·취소·초기화 실패 모두 캔버스·오디오·원본 영상 트랙을 정리합니다.
- 렌더 종료 후 원본 미디어의 `muted`와 `volume`을 렌더 전 상태로 복구합니다.
- 사용자가 미디어 길이 밖의 시작점이나 역순 범위를 입력해도 양수 구간으로 보정하고 실제 미디어 끝을 넘지 않습니다.
- 직접 붙여넣는 자막 텍스트는 100만 자, 파싱 결과는 5,000개 큐를 상한으로 제한합니다.
- 가져온 프로젝트의 중복 후보 ID를 고유하게 만들고 제어 문자를 제거해 선택·비교 상태 충돌을 막습니다.
- Update Sentinel과 버전 동기화 모듈은 서비스워커를 직접 업데이트하지 않고 `AIShortsServiceWorkerRegistration`에 위임합니다.
- 동시에 여러 업데이트 확인이 들어오면 하나의 `registration.update()` 작업으로 합칩니다.
- 기존 **모듈형 엔진**, 프로젝트 스키마 v3, PC 8개 메뉴, 모바일 핵심 4개/전체 8개 메뉴, 렌더 취소·재시도·ETA 흐름을 유지합니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset
python3 qa/run_media_e2e.py --cases longAudio
```

- 자동 QA: **135/135**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC 메뉴 8개, 모바일 간단 메뉴 4개, 모바일 전체 메뉴 8개 표시
- PC·모바일 페이지 가로 overflow: 0px
- 20초 MP3·MP4 출력, 취소, 실패 후 재시도 통과
- 10분 MP3 분석: 약 **6.734초**
- 10분 분석 트랙: 8kHz, 약 **18.3MB**
- 예상 디코딩 메모리: 약 **219.7MB**, 위험도 medium
- decoded AudioBuffer·channelData 분석 후 미보유 확인
- 6초 장시간 렌더 출력: 약 **5.866초**, 1,208,719바이트

## 배포 파일 생성

```bash
npm run package:full
PATCH_BASE_ARCHIVE=/path/to/ai-shorts-studio-v1.3.6-release.zip npm run package:patch
```

Git 작업 트리에서는 `PATCH_BASE_REF`를 사용할 수 있고, Git 메타데이터가 없는 전체 설치본에서는 직전 전체 ZIP 또는 디렉터리를 `PATCH_BASE_ARCHIVE`/`PATCH_BASE_DIR`로 지정합니다.

배포 ZIP에는 `PATCH_MANIFEST.txt`, Python 캐시, Git 메타데이터, `node_modules`, 이전 배포 ZIP을 포함하지 않습니다. 패치 ZIP도 중간 매니페스트 파일을 생성하지 않습니다.

## 주요 구조

- 서비스워커 등록·업데이트 소유권: `src/boot/service-worker-registration.js`
- 버전 UI 동기화: `src/boot/app-version-sync.js`
- 업데이트 진단 UI: `src/boot/update-sentinel.js`
- 공용 미디어 범위 정규화: `src/utils/core-utils.js`
- 프로젝트 스키마·후보 ID 정규화: `src/project/project-service.js`
- 자막 크기·큐 상한: `src/caption/caption-service.js`
- 렌더 스트림 생성·정리: `src/render/vertical-renderer.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 체크포인트 실미디어 감사: `qa/run_media_e2e.py`

## 알려진 제한

Web Audio의 `decodeAudioData()`는 브라우저 내부에서 원본 전체를 디코딩합니다. 매우 긴 WAV·AIFF나 다채널 오디오는 순간 메모리가 여전히 클 수 있습니다. 실제 HTTPS 서비스워커 설치→대기→활성화 전환, 모바일 Safari·Samsung Internet, 15분·30분 고해상도 MP4 장시간 출력은 실배포·실기기 검증이 추가로 필요합니다.
