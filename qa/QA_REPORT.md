# QA REPORT — AI 쇼츠 스튜디오 v1.3.8

## 결과

- 자동 검사: **138/138 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- PC 메뉴바 8/8, 모바일 간단 메뉴 4/4, 모바일 전체 메뉴 8/8 표시
- 단계 네온 랜딩, 지속 라인, PC 작업실 조절 정상

## 신규 결함·예외 검사

- 손상·과대 localStorage 세션에서 복구 실패 이유 표시와 삭제 버튼 유지
- localStorage 설정 enum·수치·텍스트·색상 상한과 알 수 없는 키 차단
- 프로젝트의 잘못된 duration 폐기와 부분 중첩 설정 깊은 병합
- 렌더 종료 후 원본 `currentTime`, `playbackRate`, `muted`, `volume` 복원
- 렌더 내부 범위 재검증
- 분석 워커 무응답 watchdog, 워커 종료, 호환 분석 fallback, 진단 기록
- 잘못된 워커 메시지의 `messageerror` fallback
- 서비스워커가 이전 AI Shorts 캐시만 삭제하고 관련 없는 origin 캐시를 보존

## 기존 회귀 유지

- 프로젝트 스키마 v3, 미래 스키마·과대 JSON/SRT 거부
- 후보·자막·설정·문자열·시간 구간 상한
- 중복 후보 ID 정리, 같은 파일 재선택, 지연 분석 세션 경합 방지
- 분석·미리보기·렌더 operation 취소·정리
- 서비스워커 등록·업데이트 단일 소유와 동시 요청 합치기
- 렌더 스트림·트랙의 성공·실패·취소 cleanup
- `PATCH_MANIFEST.txt`를 생성하거나 배포 ZIP에 포함하지 않는 계약

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → 약 2초 렌더 → MP4 다운로드 완료
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → 약 2초 렌더 → MP4 다운로드 완료
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 새 작업 재시도 done 1
- 10분 MP3 분석: 약 **6.223초**
- 장시간 균형 모드, 8kHz 분석 트랙, 예상 분석 메모리 약 **18.3MB**
- 예상 디코딩 메모리 약 **219.7MB**, 위험도 medium, raw buffer 추가 복사 없음
- decoded AudioBuffer·channelData 분석 후 유지 없음
- 렌더 중 ETA 약 3초 노출
- 6초 렌더 출력: 약 **6.015초**, **1,426,623바이트**, ffprobe 재생 가능 확인
- 감사 시나리오별 체크포인트 저장 확인

## 배포 무결성

- 전체 ZIP과 v1.3.7 기준 패치 ZIP `unzip -t` 통과
- 두 ZIP의 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`, 중첩 ZIP: 0개
- v1.3.7 전체 ZIP에 v1.3.8 패치를 적용한 결과와 전체 v1.3.8 ZIP 비교: 243개 파일, 누락 0, 초과 0, 해시 불일치 0
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` **138/138 재통과**

## 감사 파일

- `qa/runtime-browser-audit-v1.3.8.json`
- `qa/runtime-media-e2e-v1.3.8.json`

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이므로 실제 서비스워커 설치→대기→활성화 전환은 localhost/HTTPS에서 별도 감사가 필요합니다.
- 워커 watchdog fallback은 영구 대기를 막지만 심한 시스템 부하에서는 정상 워커 뒤 호환 분석을 다시 수행해 총 시간이 늘 수 있습니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
