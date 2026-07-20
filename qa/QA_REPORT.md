# QA REPORT — AI 쇼츠 스튜디오 v1.3.7

## 결과

- 자동 검사: **135/135 통과**
- PC Chromium 1366×768: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- 모바일 Chromium 390×844: JavaScript 오류 0, Promise 거절 0, 콘솔 오류 0
- PC 메뉴바 8/8, 모바일 간단 메뉴 4/4, 모바일 전체 메뉴 8/8 표시
- PC·모바일 가로 overflow: 0px
- 단계 네온 랜딩, 지속 라인, PC 작업실 조절 정상

## 신규 결함·예외 검사

- 렌더 기능 사전 검사에서 미디어 스트림을 생성하지 않음
- 실제 렌더의 원본 캡처 스트림 생성 횟수 1회
- 초기 설정 실패에서도 canvas·audio·source video 트랙 해제
- 성공·실패·취소 후 원본 미디어 `muted` 상태 복원
- 수동 시작점이 미디어 끝을 넘는 경우 안전한 구간으로 보정
- 역순 범위와 1초 미만 미디어의 양수 구간 유지
- 붙여넣기 자막 100만 자 상한과 5,000개 큐 상한
- 중복 프로젝트 후보 ID 고유화와 제어 문자 제거
- 서비스워커 업데이트 요청의 단일 소유와 동시 호출 합치기
- Update Sentinel·버전 동기화 모듈의 직접 `registration.update()` 호출 없음

## 기존 회귀 유지

- 프로젝트 스키마 v3, 미래 스키마·과대 JSON/SRT 거부
- 후보·자막·설정·문자열·시간 구간 상한
- 같은 파일 재선택과 지연 분석 세션 경합 방지
- 미지원 파일 차단과 사용자 문자열 안전 렌더링
- 분석·미리보기·렌더 operation 취소·정리
- 서비스워커 등록 성공·실패·중복 방지·재시도·비보안 origin 건너뛰기
- `PATCH_MANIFEST.txt`를 생성하거나 배포 ZIP에 포함하지 않는 계약

## 실미디어 E2E

- 20초 MP3: 분석 → 추천 → 선택 → 약 2초 렌더 → 다운로드 완료
- 20초 MP4: 오디오·움직임 분석 → 추천 → 선택 → 약 2초 렌더 → 다운로드 완료
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 재시도: 첫 시도 failed 1, 새 작업 재시도 done 1
- 10분 MP3 분석: 약 **6.734초**
- 장시간 균형 모드, 8kHz 분석 트랙, 예상 분석 메모리 약 **18.3MB**
- 예상 디코딩 메모리 약 **219.7MB**, 위험도 medium, raw buffer 추가 복사 없음
- decoded AudioBuffer·channelData 분석 후 유지 없음
- 렌더 중 ETA 약 3초 노출
- 6초 렌더 출력: 약 **5.866초**, **1,208,719바이트**, ffprobe 재생 가능 확인
- 감사 시나리오별 체크포인트 저장 확인

## 배포 무결성

- 전체 ZIP과 v1.3.6 기준 패치 ZIP `unzip -t` 통과
- 두 ZIP의 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`, 중첩 ZIP: 0개
- v1.3.6 전체 ZIP에 v1.3.7 패치를 덮어쓴 결과와 현재 소스 비교: 238개 파일, 누락 0, 초과 0, 해시 불일치 0
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` 135/135 재통과
- Git 없는 환경에서 `PATCH_BASE_ARCHIVE`·`PATCH_BASE_DIR` 기반 패치 생성 확인

## 감사 파일

- `qa/runtime-browser-audit-v1.3.7.json`
- `qa/runtime-media-e2e-v1.3.7.json`

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이므로 실제 서비스워커 설치→대기→활성화 전환은 localhost/HTTPS에서 별도 감사가 필요합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
