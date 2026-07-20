# AI 쇼츠 제작 스튜디오 v1.3.6

음악이나 영상을 브라우저 안에서 분석하고, 하이라이트 추천부터 9:16 미리보기와 저장까지 이어주는 로컬 웹 스튜디오입니다.

## v1.3.6 핵심 개선

이번 버전은 **배포 일관성**, **서비스워커 단일 소유**, **프로젝트 복구 안전성**, **실미디어 감사 신뢰성**을 강화했습니다.

- HTML·자산·서비스워커·QA의 버전과 빌드 키를 `1.3.6-adaptive-mobile`로 다시 동기화했습니다.
- 서비스워커 등록과 업데이트 확인은 `AIShortsServiceWorkerRegistration` 한 곳에서만 수행합니다.
- 비보안 외부 HTTP에서는 등록을 건너뛰고, HTTPS·localhost에서만 등록합니다.
- manifest·service worker 같은 제어 자산 실패 시 `index.html`을 대신 반환하지 않고 명시적인 503을 반환합니다.
- 프로젝트 스키마를 v3으로 올리고 후보·자막·문자열·미디어 길이·파일 크기의 상한을 적용했습니다.
- 미래 스키마, 과대 JSON/SRT, 지원하지 않는 파일, 오염된 설정 키와 비정상 시간 구간을 안전하게 거부하거나 보정합니다.
- 같은 파일 재선택, 지연 자동 분석 경합, 취소 후 분석 상태, 프로젝트 설정 저장 누락을 수정했습니다.
- 사용자 파일명·후보 제목·렌더 라벨은 HTML이 아니라 텍스트로 출력합니다.
- 실미디어 감사는 시나리오별 체크포인트를 저장하고 다운로드 감시를 렌더 시작 전에 등록합니다.
- 기존 **모듈형 엔진**, PC 8개 메뉴, 모바일 핵심 4개/전체 8개 메뉴, 긴 파일 메모리 예산, 렌더 취소·재시도·ETA 흐름을 유지합니다.

## 배포 파일 생성

```bash
npm run package
```

- `dist/ai-shorts-studio-v1.3.6-release.zip`: 전체 설치용
- `dist/ai-shorts-studio-v1.3.6-patch-from-v1.3.4.zip`: v1.3.4 덮어쓰기용

패치 대상은 Git 변경 파일에서 직접 계산합니다. `PATCH_MANIFEST.txt` 같은 중간 목록 파일은 만들거나 ZIP에 포함하지 않습니다.

## 실행과 검수

```bash
npm run serve
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry
python3 qa/run_media_e2e.py --cases longAudio
```

- 자동 QA: **132/132**
- PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- PC 메뉴: 8개 모두 표시
- 모바일 간단 메뉴: 핵심 4개 표시
- 모바일 전체 메뉴: 8개 모두 표시
- 페이지 가로 overflow: 0px
- 20초 MP3·MP4 출력, 취소, 실패 재시도 완료
- 10분 MP3 분석: 약 **5.79초**
- 10분 분석 트랙: 8kHz, 약 **18.3MB**
- decoded AudioBuffer·channelData 분석 후 해제 확인
- 6초 렌더 ETA와 ffprobe 출력 검증 완료

## 주요 구조

- 서비스워커 등록 소유권: `src/boot/service-worker-registration.js`
- 버전 UI 동기화: `src/boot/app-version-sync.js`
- 업데이트 진단 UI: `src/boot/update-sentinel.js`
- 프로젝트 스키마·입력 정규화: `src/project/project-service.js`
- 파일 입력·분석 상태 연결: `src/app.js`
- 세션 복구: `src/ui/session-continuity.js`
- 적응형 성능 예산: `src/engine/performance-budget.js`
- 비동기 작업 소유권: `src/engine/operation-coordinator.js`
- 렌더 취소·재시도·ETA: `src/render/render-queue.js`
- 체크포인트 실미디어 감사: `qa/run_media_e2e.py`

## 알려진 제한

Web Audio의 `decodeAudioData()`는 브라우저 내부에서 원본 전체를 디코딩합니다. 매우 긴 WAV·AIFF나 다채널 오디오는 순간 메모리가 여전히 클 수 있습니다. 실제 HTTPS 서비스워커 설치→대기→활성화 전환, 모바일 Safari·Samsung Internet, 15분·30분 고해상도 MP4 장시간 출력은 실배포·실기기 검증이 추가로 필요합니다.
