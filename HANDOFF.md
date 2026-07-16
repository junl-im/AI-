# HANDOFF v1.3.4

## 요약

v1.3.4는 **모바일 현재·다음 단계 중심 메뉴**, **8개 전체 메뉴 접근**, **긴 파일 디코딩 메모리 사전 점검**, **원본 ArrayBuffer 중복 복사 제거**를 추가한 UX·성능 안정화 릴리스입니다.

모바일에서 모든 8개 메뉴를 항상 노출하면 작은 화면의 작업 방향이 흐려졌습니다. 이번 버전은 핵심 4개만 우선 보여주고 전체 기능은 한 번의 버튼으로 펼칩니다. 긴 오디오에서는 분석 트랙 메모리뿐 아니라 `decodeAudioData()` 이전의 원본 파일 복사도 순간 메모리를 높이고 있어 해당 복사를 제거하고 위험도 안내를 추가했습니다.

## 주요 변경 파일

- `src/ui/mobile-menu-guide.js`: 현재 단계·다음 단계 기반 모바일 핵심 메뉴와 전체 메뉴 전환을 소유합니다.
- `assets/css/mobile-menu-guide.css`: 모바일 간단/전체 메뉴 높이, 4열 배치와 안내 레일을 정의합니다.
- `index.html`: 모바일 메뉴 안내와 전체 메뉴 버튼을 추가합니다.
- `src/engine/performance-budget.js`: 예상 디코딩 메모리, 위험도와 차단 기준을 계산합니다.
- `src/analysis/audio-feature-extractor.js`: `arrayBuffer.slice(0)`을 제거하고 디코딩 뒤 원본 버퍼와 AudioContext를 해제합니다.
- `src/app.js`: 고위험 파일 안내·진단과 안전 범위 초과 파일 차단을 수행합니다.
- `qa/run_browser_audit.py`: 모바일 핵심 4개·전체 8개 전환을 실제 Chromium에서 검사합니다.
- `qa/mobile_menu_guide_smoke.js`, `qa/decode_memory_preflight_smoke.js`: 신규 회귀 검사입니다.
- 버전·빌드 키·서비스워커 캐시는 v1.3.4 / `1.3.4-adaptive-mobile`입니다.

## 사용자 디자인·UX 선호

- 멋있지만 깔끔하고 쇼츠의 9:16·빠른 컷 정체성이 보여야 합니다.
- 현재 진행 중인 구역은 밝은 네온 라인으로 즉시 알아볼 수 있어야 합니다.
- PC는 여러 작업 구간이 보이고 메뉴·패널 강조·화면 위치가 함께 이동해야 합니다.
- 모바일은 본문 기능 중복을 피하고 현재 단계와 다음 행동을 먼저 보여줍니다.
- 사용자 노출 명칭은 `Dock`이 아니라 `메뉴바`입니다.
- 핵심 아이콘은 `assets/icons/studio/`의 전용 SVG만 사용합니다.
- 상단 메타는 BUILD·버전·모바일/PC 호환과 DESIGNED BY·곰같은여우만 유지합니다.
- 전체 설치 ZIP과 직전 버전 덮어쓰기 ZIP을 항상 함께 제공합니다.

## 모바일 메뉴 유지 규칙

1. `AIShortsMobileMenuGuide`가 모바일 축약 상태의 최종 소유자입니다.
2. 현재 단계와 다음 단계는 간단 메뉴에서 숨기지 않습니다.
3. `전체 메뉴`에서는 8개 탭이 모두 실제 크기를 가져야 합니다.
4. 단계 변경 시 간단 메뉴로 돌아가되 사용자 클릭으로 언제든 다시 펼칠 수 있어야 합니다.
5. PC 8개 메뉴 레이아웃에는 `data-mobile-priority`가 영향을 주지 않아야 합니다.
6. 모바일 안내 문구는 `현재 … · 다음 …` 형식을 유지합니다.
7. 접근성 상태 `aria-expanded`, `aria-controls`, `aria-hidden`을 유지합니다.
8. 모션 감소 설정에서도 메뉴 기능은 동일해야 합니다.

## 긴 파일 메모리 유지 규칙

1. metadata 확인 전에는 디코딩 메모리 위험도를 확정하지 않습니다.
2. 위험도 계산은 파일 크기, 재생 시간, 기기 메모리와 무압축 형식을 고려합니다.
3. 고위험 파일은 `decode-memory-warning` diagnostic과 사용자 안내를 남깁니다.
4. `hardBlock`은 브라우저가 멈출 가능성이 큰 파일에만 적용합니다.
5. `decodeAudioData(arrayBuffer.slice(0))` 형태의 전체 버퍼 복사를 다시 넣지 않습니다.
6. 디코딩 완료 뒤 raw ArrayBuffer와 AudioContext를 정리합니다.
7. 분석 전용 트랙의 저샘플레이트·모노·AbortSignal·UI yield 규칙을 유지합니다.
8. 분석 완료 뒤 decoded AudioBuffer와 channelData를 상태에 남기지 않습니다.

## 검수 순서

1. `npm test`로 문법, DOM, 버전·캐시, 모바일 메뉴, 메모리 사전 점검과 배포 계약을 검사합니다.
2. `python3 qa/run_browser_audit.py`로 PC 8개 메뉴, 모바일 핵심 4개·전체 8개, overflow, 네온 랜딩을 확인합니다.
3. `python3 qa/run_media_e2e.py`로 MP3·MP4, 취소, 실패 재시도와 10분 MP3를 검사합니다.
4. 긴 파일 예산에 `estimatedDecodeMemoryMb`, `memoryRisk`, `rawBufferCopyAvoided`가 남는지 확인합니다.
5. `npm run package`로 전체 ZIP과 v1.3.3 패치 ZIP을 생성합니다.
6. 깨끗한 v1.3.3에 패치를 적용해 매니페스트 파일을 바이트 단위로 비교합니다.
7. 두 ZIP에 `unzip -t`를 실행하고 SHA-256을 생성합니다.

## 검수 결과

- `npm test`: **129/129 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴: 8/8 표시
- 모바일 간단 메뉴: 4/4 표시, 현재 단계 유지
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력, 렌더 취소와 실패 재시도 정상
- 10분 MP3 분석 약 5.8초, 분석 트랙 약 18.3MB
- 10분 파일 디코딩 예상 메모리 약 219.7MB, 위험도 medium
- 장시간 렌더 완료 뒤 활성 operation과 런타임 오류 없음

## 배포 규칙

1. 전체 설치용 ZIP과 직전 버전 덮어쓰기용 패치 ZIP을 함께 만듭니다.
2. v1.3.4 패치 기준은 v1.3.3입니다.
3. `PATCH_MANIFEST.txt`는 실제 바이트 차이의 변경·추가 파일만 기록합니다.
4. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.
5. 삭제 파일이 생기면 별도 삭제 목록과 적용 절차를 제공합니다.

## 알려진 제한

- `decodeAudioData()`는 원본 전체 디코딩이 필요해 매우 긴 WAV·AIFF·다채널 오디오의 순간 메모리는 여전히 클 수 있습니다.
- 실제 장시간 감사 대상은 10분 MP3입니다. 15분·30분 고해상도 MP4는 추가 peak memory 측정이 필요합니다.
- 모바일 Safari·Samsung Internet·인앱 브라우저의 장시간 MediaRecorder 출력은 실기기 검증이 필요합니다.
- 서비스워커와 영구 localStorage는 인라인 브라우저 감사 범위 밖이며 정적 계약 검사로 보완합니다.

## Update Sentinel 유지 규칙

- HTML 자산 쿼리, 런타임 BUILD_KEY와 서비스워커 캐시 키를 같은 값으로 갱신합니다.
- 이전 셸 캐시 정리, service worker `updatefound` 감시와 진단 복사 기능을 유지합니다.
- 현재 버전의 브라우저·실미디어 감사 파일을 배포 매니페스트에 포함합니다.
