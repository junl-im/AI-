# HANDOFF v1.3.8

## 현재 상태

v1.3.8은 v1.3.7의 **135/135 기준선**에서 저장 복구·서비스워커 캐시 범위·렌더 원본 상태·분석 워커 정지·지속 설정 손상을 재감사한 안정화 릴리스입니다.

최종 자동 검사는 **138/138**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 출력, 취소, 실패 후 재시도, 10분 MP3 분석과 6초 렌더도 다시 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 손상되거나 상한을 넘은 자동저장 세션이 localStorage에 남으면 복구는 실패하면서 기록 삭제 버튼까지 비활성화돼 사용자가 정상 상태로 돌아갈 수 없었습니다.
2. 서비스워커 활성화 시 현재 앱 캐시를 제외한 같은 origin의 모든 Cache Storage 항목을 삭제해 다른 앱·서비스 캐시까지 지울 수 있었습니다.
3. 렌더 후 원본 미디어의 재생 위치와 재생 속도가 렌더 종료 상태에 남아 편집 흐름을 바꿀 수 있었습니다.
4. 분석 워커가 오류 이벤트 없이 응답을 멈추면 Promise가 끝없이 대기해 자동 분석이 완료되지 않았습니다.
5. localStorage 설정이나 프로젝트 설정이 변조·손상되면 잘못된 duration·enum·수치·문자열 값이 상태에 들어가 추천 0개, 비정상 렌더 옵션, UI 불일치를 만들 수 있었습니다.
6. 부분 설정만 가진 이전 프로젝트를 불러올 때 중첩 설정 객체가 통째로 교체돼 현재 사용자의 자막·품질 설정이 사라질 수 있었습니다.

## 적용한 수정

- 손상 세션을 `invalid` 상태로 구분해 복구 실패 이유를 표시하고, 원본 레코드가 존재하면 삭제 버튼을 항상 사용할 수 있게 했습니다.
- 서비스워커 캐시 삭제를 `ai-shorts-studio-shell-` 네임스페이스의 이전 버전으로 제한했습니다.
- 렌더 전 `currentTime`, `playbackRate`, `muted`, `volume`, 재생 여부를 저장하고 성공·실패·취소 cleanup에서 복원합니다.
- 렌더러 내부에서도 공용 `normalizeMediaRange()`를 다시 적용해 호출 계층을 우회한 잘못된 범위를 거부합니다.
- 분석 워커에 무응답 watchdog을 추가하고 진행 메시지마다 갱신하며, 정지·잘못된 메시지에서는 워커를 종료한 뒤 메인 스레드 호환 분석으로 전환합니다.
- `ANALYSIS_WORKER_STALL_MS`를 런타임 설정으로 분리하고 최소 안전값을 적용했습니다.
- 상태 저장·복구에 enum 허용 목록, 수치 상한, 문자열·색상 정제, 알 수 없는 키 차단을 적용했습니다.
- 프로젝트 설정은 검증된 키만 복구하고 중첩 그룹을 깊은 병합해 부분·이전 프로젝트가 현재 설정을 지우지 않도록 했습니다.
- 신규 회귀 검사 3개를 추가해 QA를 135개에서 138개로 확장했습니다.
- `PATCH_MANIFEST.txt` 또는 같은 목적의 임시 목록 파일은 생성하지 않습니다.

## 주요 변경 파일

- `src/ui/session-continuity.js`: 손상 세션 상태·삭제 가능 복구 흐름
- `assets/css/session-continuity.css`: 손상 세션 경고 상태
- `sw.js`: 앱 네임스페이스 한정 캐시 정리
- `src/render/vertical-renderer.js`: 범위 재검증과 원본 미디어 상태 복원
- `src/analysis/audio-feature-extractor.js`: 워커 무응답 watchdog·messageerror fallback
- `src/config/app-runtime-config.js`: 분석 워커 정지 시간 예산
- `src/state/app-state.js`: 지속 설정 허용 목록·정규화·안전 저장
- `src/project/project-service.js`: 프로젝트 설정 정규화·부분 중첩 설정 깊은 병합
- `qa/persisted_state_recovery_smoke.js`: 손상 설정·세션·부분 프로젝트 회귀
- `qa/analysis_worker_stall_smoke.js`: 무응답·잘못된 워커 메시지 회귀
- `qa/service_worker_cache_scope_smoke.js`: 다른 서비스 캐시 보존 회귀

## 유지 규칙

1. 자동저장 원문이 존재하면 파싱·스키마 검증 실패와 관계없이 사용자가 삭제할 수 있어야 합니다.
2. 서비스워커는 자신의 캐시 prefix에 속한 이전 캐시만 삭제합니다.
3. 렌더가 변경한 원본 미디어의 위치·속도·음량·음소거·재생 상태는 작업 전 값으로 복원합니다.
4. 공개 UI에서 범위를 검증해도 렌더 경계에서 다시 검증합니다.
5. 워커 기반 분석은 오류 이벤트뿐 아니라 무응답과 잘못된 메시지를 감지해 결정적으로 종료·대체해야 합니다.
6. localStorage와 프로젝트에서 복구하는 설정은 동일한 허용 목록·상한·문자열 정제 정책을 따라야 합니다.
7. 부분 프로젝트 설정은 현재 설정을 기반으로 깊은 병합하며 누락 그룹을 삭제하지 않습니다.
8. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
9. **Update Sentinel**은 진단과 캐시 정리를 담당하며 등록 객체를 직접 업데이트하지 않습니다.
10. 기존 **모듈형 엔진**과 operation coordinator의 작업 소유권 계약을 유지합니다.
11. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **138/138 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: 다운로드 0, 활성 operation 0
- 재생 실패 후 새 작업 재시도 정상
- 10분 MP3 분석: 약 **6.223초**
- 장시간 분석 예산: 8kHz, 분석 트랙 약 **18.3MB**
- 예상 decode 메모리 약 **219.7MB**, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더 출력: 약 **6.015초**, **1,426,623바이트**, ffprobe 통과
- 렌더 중 ETA 약 3초 노출, 완료 후 활성 operation 0
- 전체·패치 ZIP 압축 무결성 통과, 금지 항목 0
- v1.3.7 전체 ZIP + v1.3.8 패치 결과가 v1.3.8 전체 ZIP 243개 파일과 해시 기준 완전 일치
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` 138/138 재통과

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. `PATCH_BASE_ARCHIVE=/path/to/ai-shorts-studio-v1.3.7-release.zip npm run package`
6. 전체·패치 ZIP `unzip -t`, SHA-256, 패치 적용 후 파일 해시 동일성 확인
7. ZIP 내부에 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`·ZIP이 없는지 확인

## 다음 우선순위

1. localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 자동 감사
2. 렌더·취소·파일 교체 20회 반복 시 MediaStream·AudioContext·ObjectURL 누수 계측
3. 15분·30분 MP4 분석 시간, decode peak memory, 장시간 렌더 성공률 계측
4. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
5. 손상 세션 내용을 다운로드해 복구·진단할 수 있는 사용자 도구 검토

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle을 실행하지 않습니다. 캐시 범위와 API 계약은 단위 검증됐지만 배포 서버의 waiting→activate 전환은 별도 확인이 필요합니다.
- 워커 watchdog은 UI 영구 대기를 막지만 CPU·메모리 압박으로 정상 분석이 제한 시간을 넘으면 호환 분석을 다시 수행해 총 시간이 늘 수 있습니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.7

# HANDOFF v1.3.7

## 현재 상태

v1.3.7은 v1.3.6의 **132/132 기준선**에서 다음 감사 라운드를 시작해, 기존 QA가 놓친 렌더 스트림 수명·수동 범위 경계·직접 붙여넣기 자막·중복 후보 ID·서비스워커 수동 업데이트 경합을 수정한 안정화 릴리스입니다.

최종 자동 검사는 **135/135**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 저장, 취소, 재생 실패 후 재시도, 10분 MP3 분석·6초 렌더도 다시 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 렌더 지원 여부를 확인하는 `inspectRenderCapability()`가 `captureStream()`을 호출해 검사만으로 미디어 트랙을 생성할 수 있었습니다.
2. 실제 렌더 초기 설정이 중간에 실패하면 canvas·audio·source video 트랙 일부가 남을 수 있었습니다.
3. 렌더가 원본 미디어의 `muted`를 변경한 뒤 항상 원래 상태로 돌려놓지는 않았습니다.
4. 사용자가 미디어 길이보다 큰 시작점이나 역순 시작·종료를 직접 입력하면 종료가 시작보다 작아질 수 있었습니다.
5. 직접 붙여넣는 자막은 파일 크기 사전 검사와 달리 텍스트·큐 개수 상한이 없어 UI와 렌더가 장시간 멈출 수 있었습니다.
6. 가져온 프로젝트에 같은 후보 ID가 여러 개 있으면 선택·비교·핀 상태가 같은 항목으로 충돌할 수 있었습니다.
7. Update Sentinel과 버전 동기화가 소유 모듈을 거치지 않고 `registration.update()`를 직접 호출해 동시에 여러 업데이트 요청이 생길 수 있었습니다.
8. 전체 설치 ZIP에서 개발을 이어가는 비-Git 환경에서는 기존 패치 스크립트가 기준 commit을 찾지 못해 `npm run package`가 실패했습니다.

## 적용한 수정

- 렌더 사전 검사는 `captureStream` 함수 존재 여부만 확인하고 스트림을 만들지 않습니다.
- 실제 렌더에서 source capture stream을 한 번만 생성하고, 성공·실패·취소·설정 실패 모두 생성한 트랙을 중지합니다.
- 사용되지 않는 source video track도 cleanup 대상에 포함했습니다.
- 렌더 전 원본 미디어의 `muted`와 `volume`을 저장하고 종료 시 복원합니다.
- `src/utils/core-utils.js`에 `normalizeMediaRange()`를 추가해 수동 범위와 프로젝트 후보·자막 범위가 같은 규칙을 사용하게 했습니다.
- 직접 붙여넣는 자막을 100만 자, 파싱 결과를 5,000개 큐로 제한하고 초과 시 진단을 남깁니다.
- 프로젝트 후보 ID에서 제어 문자를 제거하고 중복 ID에는 고유 접미사를 부여합니다.
- `AIShortsServiceWorkerRegistration.checkForUpdate()`를 추가해 Update Sentinel과 버전 동기화가 이 API에만 위임하도록 했습니다.
- 동시 업데이트 확인은 공유 Promise로 합쳐 브라우저 `registration.update()`를 한 번만 실행합니다.
- 패치 스크립트에 `PATCH_BASE_ARCHIVE`·`PATCH_BASE_DIR` 경로를 추가해 Git 없이도 직전 릴리스와 SHA-256 내용 비교로 변경 파일만 압축합니다.
- 신규 회귀 검사 3개를 추가해 QA를 132개에서 135개로 확장했습니다.
- `PATCH_MANIFEST.txt` 또는 같은 목적의 임시 목록 파일은 생성하지 않습니다.

## 주요 변경 파일

- `src/render/vertical-renderer.js`: 부작용 없는 기능 검사, 단일 캡처 생성, 트랙·미디어 상태 cleanup
- `src/utils/core-utils.js`: 공용 `normalizeMediaRange()`
- `src/app.js`: 수동 범위 보정, 직접 붙여넣기 자막 상한·진단
- `src/caption/caption-service.js`: 텍스트·큐 상한을 적용한 bounded parser
- `src/project/project-service.js`: 공용 범위 정규화, 후보 ID 정제·고유화
- `src/boot/service-worker-registration.js`: 등록·업데이트 단일 소유와 동시 업데이트 합치기
- `src/boot/update-sentinel.js`: 업데이트 확인을 소유 모듈에 위임
- `src/boot/app-version-sync.js`: freshness 확인을 소유 모듈에 위임
- `qa/render_resource_cleanup_smoke.js`: 캡처 사전 검사와 스트림 cleanup 회귀
- `qa/range_caption_guard_smoke.js`: 범위·자막·후보 ID 경계값 회귀
- `qa/service_worker_owner_smoke.js`: 업데이트 단일 소유·동시 호출 합치기 회귀

## 유지 규칙

1. 렌더 지원 여부 확인 함수는 스트림·AudioContext·ObjectURL을 생성하지 않습니다.
2. 생성한 모든 MediaStreamTrack은 성공·실패·취소·초기화 실패에서 반드시 중지합니다.
3. 렌더가 변경한 원본 미디어 상태는 작업 전 값으로 복구합니다.
4. 미디어 시간 구간은 공용 `normalizeMediaRange()`를 통과해야 합니다.
5. 후보·자막 구간은 양수 길이를 유지하면서 실제 미디어 끝을 넘지 않아야 합니다.
6. 직접 붙여넣기와 파일 가져오기는 같은 자막 크기·큐 상한을 사용합니다.
7. 프로젝트 후보 ID는 제어 문자가 없고 프로젝트 안에서 유일해야 합니다.
8. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
9. **Update Sentinel**은 진단과 캐시 정리를 담당하며 등록 객체를 직접 업데이트하지 않습니다.
10. 기존 **모듈형 엔진**과 operation coordinator의 작업 소유권 계약을 유지합니다.
11. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **135/135 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴 8/8, 모바일 간단 메뉴 4/4, 전체 메뉴 8/8
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: 다운로드 0, 활성 operation 0
- 재생 실패 후 새 작업 재시도 정상
- 10분 MP3 분석: 약 6.734초
- 장시간 분석 예산: 8kHz, 분석 트랙 약 18.3MB
- 예상 decode 메모리 약 219.7MB, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더: 약 5.866초, 1,208,719바이트, ffprobe 통과
- v1.3.6 전체 ZIP + v1.3.7 패치 적용 결과가 현재 소스 238개 파일과 해시 기준 완전 일치
- 전체·패치 ZIP 압축 오류 0, 금지 항목 0
- 렌더 중 ETA 표시와 완료 후 operation 해제 확인

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. 전체 ZIP과 v1.3.6 기준 덮어쓰기 ZIP 생성(`PATCH_BASE_ARCHIVE` 또는 Git 기준 사용)
6. `unzip -t`와 SHA-256 확인
7. ZIP 내부에 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 이전 배포 ZIP이 없는지 확인

## 다음 우선순위

1. localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 자동 감사
2. 15분·30분 MP4 분석 시간, decode peak memory, 장시간 렌더 성공률 계측
3. 렌더·취소·파일 교체를 20회 반복하는 MediaStream·AudioContext·ObjectURL 누수 스트레스 감사
4. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
5. 프로젝트 스키마 마이그레이션 로그와 사용자 복구 안내 개선

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle을 실행하지 않습니다. API 소유권과 경합은 단위 검증됐지만 배포 서버 전환은 별도 확인이 필요합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.6


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
