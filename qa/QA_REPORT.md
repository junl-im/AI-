# QA REPORT — AI 쇼츠 스튜디오 v1.3.4

## 결과

- 자동 검사: **129/129 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- PC 메뉴바: 8/8 표시
- 모바일 간단 메뉴: 핵심 4/4 표시, 현재 단계 포함
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 단계 네온 랜딩·지속 라인·PC 작업실 조절 정상

## 모바일 메뉴 감사

- 초기 모드: `compact`
- 초기 안내: `현재 파일 열기 · 다음 추천`
- 핵심 메뉴: 파일 열기·추천·후보·미리보기
- 전체 메뉴 버튼: 8개 메뉴 모두 실제 크기로 복원
- 단계 변경 뒤 현재 메뉴가 핵심 4개 안에 유지됨
- `aria-expanded`, 숨은 탭 `aria-hidden`, 가로 overflow 검증

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → 2초 렌더 → 다운로드 완료
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → 2초 렌더 → 다운로드 완료
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 두 번째 attempts 2·done 1
- 10분 MP3: 분석 약 5.8초, 장시간 균형 모드, 8kHz 분석 트랙
- 분석 트랙 약 18.3MB, decoded AudioBuffer·channelData 유지 없음
- 디코딩 예상 메모리 약 219.7MB, 위험도 medium, raw buffer 추가 복사 없음
- 6초 렌더 ETA와 유효 출력 파일 확인

## 엔진·메모리 점검

- metadata 확인 뒤 성능·디코딩 메모리 예산 생성
- 파일 크기·길이·기기 메모리·무압축 여부 기반 위험도 계산
- 고위험 파일 사용자 안내와 diagnostic 기록
- 안정 범위 초과 파일 사전 차단 문구 확인
- `decodeAudioData(arrayBuffer)` 직접 전달과 원본 버퍼 해제 확인
- 분석 전용 저샘플레이트 트랙과 AbortSignal 유지
- 렌더 진행 이벤트 제한, ETA·경과 시간·접근성 progressbar 유지

## 감사 파일

- `qa/runtime-browser-audit-v1.3.4.json`
- `qa/runtime-media-e2e-v1.3.4.json`

## 알려진 제한

- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari 장시간 출력은 실기기 검증이 필요합니다.
