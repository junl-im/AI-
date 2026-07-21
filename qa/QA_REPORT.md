# QA REPORT — AI 쇼츠 스튜디오 v1.4.1

- 자동 QA: **145/145**
- 격리 서비스워커 생명주기 감사 통과
- 브라우저 감사 오류 0
- MP3·MP4·취소·재시도·10분 미디어 E2E 통과
- localhost 실서비스워커 E2E는 실행 환경의 포트 바인딩 제한으로 미실행

---

# QA REPORT — AI 쇼츠 스튜디오 v1.4.0

## 결과

- 자동 검사: **143/143 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- PC 메뉴바 8/8, 모바일 간단 메뉴 4/4, 모바일 전체 메뉴 8/8 표시
- 단계 네온 랜딩, 지속 라인, PC 작업실 조절 정상

## v1.4.0 신규 구조·예외 검사

- 렌더 워크플로 컨트롤러 factory 공개 및 메인 앱보다 선행 로딩
- 컨트롤러의 서비스워커 셸 캐시 포함
- 렌더 큐 행에서 `innerHTML` 미사용
- HTML 태그 형태의 제목·오류가 literal text로 표시되는 동작
- 렌더 완료 출력 저장 1회
- render operation 종료 정확히 1회
- 렌더 후 원래 후보와 수동 범위 복원
- 실패 항목 재시도가 새 렌더 작업으로 연결되는 계약
- bitrate·FPS·ETA·접근성 진행률 전달 위치 갱신
- 핵심 직접 스크립트 예산 45개

## 기존 회귀 유지

- 클립보드 권한 실패 fallback과 실제 성공 결과 확인
- 유효·손상 자동저장 원문 내보내기
- 손상·과대 localStorage 세션 삭제 가능 상태
- 프로젝트 스키마 v3와 입력 상한
- 렌더 원본 미디어 상태·스트림·트랙 cleanup
- 분석 워커 무응답 watchdog과 호환 분석 fallback
- 서비스워커 단일 등록 소유와 앱 cache namespace 범위
- 분석·미리보기·렌더 operation 취소·정리
- `PATCH_MANIFEST.txt` 미생성·미포함 계약

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → MP4 다운로드, 2.264초, 418,961바이트
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → MP4 다운로드, 2.240초, 194,560바이트
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 새 작업 attempts 2, done 1
- 재시도 출력: 2.212초, 382,921바이트, ffprobe 통과
- 10분 MP3 분석: 약 **6.164초**
- 장시간 균형 모드, 8kHz 분석 트랙, 예상 분석 메모리 약 **18.3MB**
- 예상 디코딩 메모리 약 **219.7MB**, 위험도 medium
- decoded AudioBuffer·channelData 분석 후 유지 없음
- 렌더 중 ETA 약 3초 노출
- 6초 렌더 출력: 약 **6.346초**, **1,670,118바이트**, ffprobe 통과
- 모든 실미디어 시나리오에서 런타임 오류 0, 완료 후 활성 operation 0

## 감사 파일

- `qa/runtime-browser-audit-v1.4.0.json`
- `qa/runtime-media-e2e-v1.4.0.json`

## 배포 무결성

- 전체 설치본 유효 파일 254개, ZIP 항목 278개
- v1.3.9 기준 덮어쓰기 패치 91개 파일
- 전체·패치 ZIP `unzip -t` 통과
- `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`, 중첩 ZIP: 0개
- v1.3.9 전체 설치본 + 패치 결과가 v1.4.0 전체 설치본과 파일명·SHA-256 기준 완전 일치
- 전체 설치본을 별도 디렉터리에 풀어 `npm test` **143/143 재통과**

## 알려진 제한

- Chromium 감사 하네스는 비보안 인라인 환경이므로 실제 서비스워커 설치→대기→활성화 전환과 localStorage 지속성은 별도 감사가 필요합니다.
- 매우 긴 무압축 오디오의 순간 디코딩 메모리는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
