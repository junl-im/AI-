# QA REPORT — AI 쇼츠 스튜디오 v1.3.5

## 결과

- 자동 검사: **131/131 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- PC 메뉴바: 8/8 표시
- 모바일 간단 메뉴: 핵심 4/4 표시, 현재 단계 포함
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 단계 네온 랜딩·지속 라인·PC 작업실 조절 정상

## 신규 런타임·보안 검사

- 서비스워커 등록 성공 결과와 현재 버전 diagnostic 확인
- 중복 등록 호출 시 실제 `register()` 1회만 실행
- 등록 후 `update()` 1회 요청
- 등록 실패가 unhandled rejection 없이 diagnostic으로 처리됨
- 실패 후 다음 호출에서 재시도 가능
- 확장자 전용 영상과 MIME 전용 오디오 판별 정상
- PDF 등 미지원 파일 판별 결과가 빈 값이며 앱 입력 단계에서 차단됨
- `<img onerror>` 형태 문자열이 HTML이 아닌 텍스트로 이스케이프됨
- 세션 파일명, 후보 제목·구간, 렌더 라벨·오류가 텍스트 노드로 출력됨

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → 2초 렌더 → 다운로드 완료
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → 2초 렌더 → 다운로드 완료
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 두 번째 attempts 2·done 1
- 10분 MP3: 분석 약 5.2초, 장시간 균형 모드, 8kHz 분석 트랙
- 분석 트랙 약 18.3MB, decoded AudioBuffer·channelData 유지 없음
- 디코딩 예상 메모리 약 219.7MB, 위험도 medium, raw buffer 추가 복사 없음
- 6초 렌더 ETA와 유효 출력 파일 확인

## 감사 파일

- `qa/runtime-browser-audit-v1.3.5.json`
- `qa/runtime-media-e2e-v1.3.5.json`

## 알려진 제한

- 인라인 Chromium 감사에서는 실제 서비스워커 설치가 비활성입니다. 등록 로직은 모의 service worker API로 성공·실패 경로를 단위 검증했습니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari 장시간 출력은 실기기 검증이 필요합니다.
