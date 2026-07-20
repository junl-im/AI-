# HANDOFF v1.3.5

## 요약

v1.3.5는 **서비스워커 등록 오류 제거**, **지원하지 않는 파일 입력 차단**, **사용자 데이터 DOM 삽입 방어**를 적용한 런타임·보안 안정화 릴리스입니다.

기존 앱은 서비스워커 등록 성공 콜백에서 선언되지 않은 `runtimeConfig.APP_VERSION`을 참조했습니다. 인라인 감사에서는 서비스워커가 비활성이라 이 경로가 실행되지 않았지만, 실제 HTTPS·localhost 환경에서는 정상 등록 후 오류 진단이 남을 수 있었습니다. 등록 책임을 전용 모듈로 옮기고 성공·실패·중복 실행·재시도를 독립적으로 검증했습니다.

또한 드래그 입력에서 지원하지 않는 파일을 오디오로 간주하던 동작을 차단하고, 파일명·프로젝트 후보·렌더 라벨처럼 사용자가 조작할 수 있는 문자열을 동적 `innerHTML`로 출력하지 않도록 수정했습니다.

## 주요 변경 파일

- `src/boot/service-worker-registration.js`: 등록 가능 여부, 단일 실행, 업데이트 확인, 성공·실패 진단과 재시도를 소유합니다.
- `src/app.js`: 전용 등록 모듈을 호출하고 지원하지 않는 미디어 파일을 분석 전에 거부합니다.
- `src/utils/core-utils.js`: `detectMediaKind`, `isSupportedMediaFile`, `escapeHtml`을 제공합니다.
- `src/ui/session-continuity.js`: 복구 세션 파일명을 텍스트 노드로 출력합니다.
- `src/ui/candidate-preview-pro.js`: 프로젝트에서 들어온 후보 제목과 구간을 텍스트로 렌더링합니다.
- `src/ui/export-finish-center.js`: 렌더 작업 라벨과 실패 문구를 텍스트로 렌더링합니다.
- `qa/runtime_guard_smoke.js`: 서비스워커 성공·실패·중복 방지·재시도, 미디어 판별과 사용자 텍스트 안전 출력을 검사합니다.
- `index.html`, `sw.js`: 신규 부팅 모듈을 로드·캐시합니다.
- 버전·빌드 키·서비스워커 캐시는 v1.3.5 / `1.3.5-adaptive-mobile`입니다.

## 런타임·보안 유지 규칙

1. 서비스워커 등록은 `AIShortsServiceWorkerRegistration`만 소유합니다.
2. 앱 본체에서 `navigator.serviceWorker.register()`를 직접 다시 호출하지 않습니다.
3. 버전은 `AIShortsVersionSync.version` 또는 `AIShortsRuntimeConfig.APP_VERSION`에서만 읽습니다.
4. 등록 성공 후 `registration.update()`는 한 번만 요청합니다.
5. 등록 실패는 처리된 결과와 diagnostic으로 남기고 다음 호출에서 재시도할 수 있어야 합니다.
6. 파일 입력은 MIME과 확장자를 모두 확인하고 오디오·영상이 아니면 분석 상태를 변경하지 않습니다.
7. 파일명, 프로젝트 JSON, 렌더 라벨 등 외부 문자열은 동적 `innerHTML`에 직접 넣지 않습니다.
8. 마크업이 필요한 고정 UI 골격과 사용자 데이터 출력 경로를 분리합니다.

## 기존 기능 유지 규칙

- PC 메뉴는 8개를 모두 유지합니다.
- 모바일은 현재·다음 단계를 포함한 핵심 4개와 전체 8개 전환을 유지합니다.
- 긴 파일은 metadata 확인 뒤 디코딩 메모리 위험도를 계산합니다.
- `decodeAudioData(arrayBuffer.slice(0))` 형태의 전체 버퍼 복사를 다시 넣지 않습니다.
- 분석 완료 뒤 decoded AudioBuffer와 channelData를 상태에 남기지 않습니다.
- 렌더 취소·실패 재시도·ETA와 operation 정리 계약을 유지합니다.

## 검수 순서

1. `npm test`로 문법, 버전·캐시, 서비스워커 등록 계약, 사용자 텍스트 안전 출력과 기존 회귀를 검사합니다.
2. `python3 qa/run_browser_audit.py`로 PC 8개, 모바일 핵심 4개·전체 8개, overflow와 네온 랜딩을 확인합니다.
3. `python3 qa/run_media_e2e.py`로 MP3·MP4, 취소, 실패 재시도와 10분 MP3를 검사합니다.
4. `npm run package`로 전체 ZIP과 v1.3.4 덮어쓰기 ZIP을 생성합니다.
5. 두 ZIP에 `unzip -t`를 실행하고 SHA-256을 생성합니다.

## 검수 결과

- `npm test`: **131/131 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴: 8/8 표시
- 모바일 간단 메뉴: 4/4 표시, 현재 단계 유지
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력, 렌더 취소와 실패 재시도 정상
- 10분 MP3 분석 약 5.2초, 분석 트랙 약 18.3MB
- 10분 파일 디코딩 예상 메모리 약 219.7MB, 위험도 medium
- 서비스워커 성공·실패·중복 방지·재시도 단위 검사 통과
- 조작된 HTML 형태 문자열의 텍스트 출력 검사 통과

## 배포 규칙

1. 전체 설치용 ZIP과 직전 버전 덮어쓰기용 패치 ZIP을 함께 만듭니다.
2. v1.3.5 패치 기준은 v1.3.4입니다.
3. `PATCH_MANIFEST.txt`는 실제 변경·추가 파일만 기록합니다.
4. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.
5. 삭제 파일이 생기면 별도 삭제 목록과 적용 절차를 제공합니다.

## 알려진 제한

- 실제 서비스워커 등록은 HTTPS·localhost가 필요합니다. 자동 QA는 등록 API를 모의 실행하고, 인라인 Chromium 감사는 UI 런타임을 검사합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.

## Update Sentinel 유지 규칙

- HTML 자산 쿼리, 런타임 BUILD_KEY와 서비스워커 캐시 키를 같은 값으로 갱신합니다.
- 이전 셸 캐시 정리, service worker `updatefound` 감시와 진단 복사 기능을 유지합니다.
- 서비스워커 등록 모듈과 Update Sentinel은 역할을 분리하되 같은 등록 객체를 기준으로 동작해야 합니다.
