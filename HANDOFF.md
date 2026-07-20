# HANDOFF v1.3.6

## 요약

v1.3.6는 v1.3.5 작업물의 검수 결과를 다시 재현하면서 발견된 **배포 버전 불일치**, **서비스워커 이중 업데이트**, **프로젝트·세션 입력 상한 부재**, **실미디어 감사 경합**을 수정한 안정화 릴리스입니다.

초기 재검증에서 문서상 131/131과 달리 실제 `npm test`는 100/131이었습니다. `index.html`이 아직 `1.3.4` 빌드 키를 사용하고 QA만 새 버전을 기대한 것이 주원인이었습니다. 이를 숨기지 않고 소스·HTML·서비스워커·QA·문서를 v1.3.6 기준으로 다시 맞췄습니다.

## 이번 점검 기록

1. `PATCH_MANIFEST.txt` 생성 방식을 제거했습니다. 패치 ZIP은 Git 변경 파일을 직접 계산하며 중간 매니페스트를 만들지 않습니다.
2. 서비스워커 등록 성공 뒤 존재하지 않는 변수에 접근하던 경로를 제거했습니다.
3. `AIShortsVersionSync`가 별도로 `registration.update()`를 호출하던 이중 소유를 제거했습니다.
4. 서비스워커 제어 자산 실패 시 앱 HTML이 대신 반환되는 폴백을 막았습니다.
5. 프로젝트 스키마를 v3으로 올리고 후보·자막·문자열·파일 크기·미디어 시간 상한을 추가했습니다.
6. 미래 스키마와 과대 JSON/SRT를 거부하고, 알 수 없는 설정·프로토타입 키를 제거합니다.
7. 최대 미디어 길이 경계에서 후보·자막 종료 시간이 상한을 넘을 수 있던 예외를 수정했습니다.
8. 프로젝트 후보 ID를 CSS 선택자 문자열에 삽입하던 경로를 제거해 `]`, 역슬래시 등 특수 문자 ID에서도 비교·핀 선택이 끊기지 않게 했습니다.
9. 같은 파일 재선택, 지연 자동 분석의 이전 파일 경합, 취소 상태 정리, 프로젝트 설정 저장 누락을 수정했습니다.
10. 실미디어 감사의 다운로드 감시를 렌더 시작 전에 등록하고, 각 시나리오 완료 시 결과를 체크포인트 저장하도록 변경했습니다.
11. PC·모바일 Chromium 감사와 MP3·MP4·취소·재시도·10분 미디어 E2E를 다시 실행했습니다.

## 주요 변경 파일

- `src/boot/service-worker-registration.js`: 등록 가능 환경, 단일 실행, 업데이트 확인, 성공·실패 진단과 재시도를 소유합니다.
- `src/boot/app-version-sync.js`: DOM과 로컬 버전만 동기화하고 서비스워커 작업은 등록 모듈에 위임합니다.
- `src/boot/update-sentinel.js`: **Update Sentinel** 진단과 이전 셸 캐시 정리를 유지합니다.
- `sw.js`: navigation과 제어 자산의 네트워크 폴백을 분리합니다.
- `src/project/project-service.js`: 스키마 v3, 개수·길이·시간 상한, 설정 키 허용 목록과 정규화를 담당합니다.
- `src/app.js`: 파일 크기 사전 검사, 같은 파일 재선택, 지연 분석 세션 확인, 프로젝트 설정 저장을 담당합니다.
- `src/ui/session-continuity.js`: 세션 복구에도 프로젝트 스키마 검증과 크기 제한을 재사용합니다.
- `qa/project_import_guard_smoke.js`: 비정상 JSON·미래 스키마·경계 시간·과대 입력을 검사합니다.
- `qa/run_media_e2e.py`: 선택 시나리오 실행과 체크포인트 저장을 지원합니다.
- `tools/create-patch-zip.sh`: Git diff 기반으로 패치 ZIP을 만들며 매니페스트 파일을 생성하지 않습니다.

## 유지 규칙

1. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
2. 앱 본체와 버전 동기화 모듈에서 `navigator.serviceWorker.register()`를 직접 호출하지 않습니다.
3. 서비스워커는 HTTPS 또는 localhost 계열에서만 등록합니다.
4. navigation 실패는 앱 셸로 복구할 수 있지만 manifest·service worker 제어 자산 실패는 HTML로 대체하지 않습니다.
5. 프로젝트·세션 JSON은 `AIShortsProjectService.parseProjectText()`를 거쳐야 합니다.
6. 후보·자막·선택 범위는 양수 길이를 유지하되 미디어 시간 상한을 넘지 않아야 합니다.
7. 파일명·프로젝트 문자열·렌더 라벨은 동적 `innerHTML`에 넣지 않습니다.
8. 분석·렌더 취소 후 operation과 UI 상태가 모두 정리되어야 합니다.
9. 실미디어 감사는 시나리오별 결과를 즉시 저장해야 합니다.
10. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 생성하지 않습니다.

## 검수 순서

1. `npm test`로 문법, 버전·캐시, 서비스워커, 프로젝트 입력, UI와 기존 회귀를 검사합니다.
2. `python3 qa/run_browser_audit.py`로 PC·모바일 오류, 메뉴, overflow와 작업실 조절을 확인합니다.
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`을 실행합니다.
4. `python3 qa/run_media_e2e.py --cases longAudio`로 결과 파일에 장시간 항목을 병합합니다.
5. `npm run package`로 전체 ZIP과 v1.3.4 덮어쓰기 ZIP을 생성합니다.
6. 두 ZIP에 `unzip -t`를 실행하고 SHA-256 체크섬을 생성합니다.
7. ZIP 내부에 `PATCH_MANIFEST.txt`, `.git`, `node_modules`, 이전 배포 ZIP이 없는지 확인합니다.

## 검수 결과

- `npm test`: **132/132 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴: 8/8 표시
- 모바일 간단 메뉴: 4/4 표시, 현재 단계 유지
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 실패 재시도: 첫 시도 failed 1, 재시도 attempts 2·done 1
- 10분 MP3 분석: 약 5.79초
- 10분 분석 예산: 8kHz, 약 18.3MB, decode 예상 약 219.7MB, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 출력과 렌더 ETA 정상

## 배포 규칙

1. 전체 설치 ZIP과 기준 버전 덮어쓰기 ZIP을 함께 만듭니다.
2. 이번 v1.3.6 패치 기준은 Git HEAD의 v1.3.4입니다.
3. 패치 대상은 Git 변경 파일에서 직접 계산합니다.
4. 중간 매니페스트 파일은 만들지 않습니다.
5. 삭제 파일이 생기면 패치 생성은 실패시키고 별도 적용 절차를 문서화합니다.
6. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.

## 다음 우선순위

1. 실제 localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 E2E 추가
2. 15분·30분 MP4의 분석 시간, decode peak memory, 렌더 성공률 계측
3. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
4. 초기 CSS와 지연 UI 자산을 단계별 번들로 정리해 첫 페인트 비용 축소
5. 프로젝트 스키마 v2→v3 명시적 마이그레이션 로그와 사용자 안내 추가

## 알려진 제한

- 인라인 Chromium 감사에서는 실제 서비스워커 설치가 비활성입니다. 등록 API 계약은 단위 검증되지만 배포 서버의 업데이트 전환은 별도 검증이 필요합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 자동 처리하지 않습니다. 삭제가 필요한 릴리스는 별도 삭제 절차가 필요합니다.
