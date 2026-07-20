# AI 쇼츠 제작 스튜디오 v1.3.8

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.8 핵심 개선

이번 버전은 **손상 세션 복구**, **서비스워커 캐시 격리**, **렌더 원본 상태 복원**, **분석 워커 무응답 복구**, **지속 설정 검증**을 강화했습니다.

- 손상된 자동저장 세션도 경고 상태에서 사용자가 즉시 삭제하고 정상 작업으로 돌아갈 수 있습니다.
- 서비스워커는 AI Shorts Studio의 이전 셸 캐시만 정리하고 같은 도메인의 다른 캐시는 건드리지 않습니다.
- 렌더 후 원본 미디어의 재생 위치·속도·음량·음소거·재생 여부를 이전 상태로 되돌립니다.
- 분석 워커가 멈추거나 잘못된 메시지를 보내면 제한 시간 후 종료하고 메인 스레드 호환 분석으로 자동 전환합니다.
- localStorage와 프로젝트 설정은 허용 값·수치 상한·문자열 정제를 통과한 항목만 복구합니다.
- 이전 프로젝트의 부분 설정은 현재 사용자 설정에 깊은 병합돼 누락 항목을 지우지 않습니다.
- 기존 **모듈형 엔진**, 프로젝트 스키마 v3, 렌더 취소·재시도·ETA, 서비스워커 업데이트 단일 소유를 유지합니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset
python3 qa/run_media_e2e.py --cases longAudio
```

- 자동 QA: **138/138**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC·모바일 페이지 가로 overflow: 0px
- 20초 MP3·MP4 출력, 취소, 실패 후 재시도 통과
- 10분 MP3 분석: 약 **6.223초**
- 10분 분석 트랙: 8kHz, 약 **18.3MB**
- 예상 디코딩 메모리: 약 **219.7MB**, 위험도 medium
- decoded AudioBuffer·channelData 분석 후 미보유 확인
- 6초 렌더 출력: 약 **6.015초**, 1,426,623바이트

## 배포 파일 생성

```bash
npm run package:full
PATCH_BASE_ARCHIVE=/path/to/ai-shorts-studio-v1.3.7-release.zip npm run package:patch
```

Git 작업 트리에서는 `PATCH_BASE_REF`를 사용할 수 있고, Git 메타데이터가 없는 전체 설치본에서는 직전 전체 ZIP 또는 디렉터리를 `PATCH_BASE_ARCHIVE`/`PATCH_BASE_DIR`로 지정합니다.

배포 ZIP에는 `PATCH_MANIFEST.txt`, Python 캐시, Git 메타데이터, `node_modules`, 이전 배포 ZIP을 포함하지 않습니다. 패치 ZIP도 중간 매니페스트 파일을 생성하지 않습니다.

## 주요 구조

- 서비스워커 등록·업데이트 소유권: `src/boot/service-worker-registration.js`
- 서비스워커 앱 캐시 범위: `sw.js`
- 손상 세션 복구: `src/ui/session-continuity.js`
- 안전한 지속 설정: `src/state/app-state.js`
- 프로젝트 설정 검증·병합: `src/project/project-service.js`
- 워커 정지 복구: `src/analysis/audio-feature-extractor.js`
- 렌더 스트림·원본 상태 복원: `src/render/vertical-renderer.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 체크포인트 실미디어 감사: `qa/run_media_e2e.py`

## 알려진 제한

Web Audio의 `decodeAudioData()`는 브라우저 내부에서 원본 전체를 디코딩합니다. 매우 긴 WAV·AIFF나 다채널 오디오는 순간 메모리가 여전히 클 수 있습니다. 실제 HTTPS 서비스워커 설치→대기→활성화 전환, 모바일 Safari·Samsung Internet, 15분·30분 고해상도 MP4 장시간 출력은 실배포·실기기 검증이 추가로 필요합니다.
