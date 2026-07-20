# PROJECT NOTES v1.3.8

## 설계 결정

- 서비스워커 등록과 모든 업데이트 확인은 `AIShortsServiceWorkerRegistration`이 단일 소유합니다.
- 서비스워커 cache cleanup은 `ai-shorts-studio-shell-` 네임스페이스에만 적용합니다.
- 자동저장 레코드는 유효하지 않아도 사용자가 삭제할 수 있어야 합니다.
- 렌더 기능 사전 검사는 부작용이 없어야 하며 실제 렌더가 변경한 미디어 상태는 전부 복원합니다.
- 워커 분석은 오류·잘못된 메시지·무응답을 모두 결정적 실패로 처리하고 호환 분석으로 전환합니다.
- localStorage와 프로젝트 설정은 공통된 허용 목록, 범위, 텍스트 정제 정책을 사용합니다.
- 부분 프로젝트 설정은 현재 설정을 기반으로 깊은 병합합니다.
- 패치 파일 목록용 `PATCH_MANIFEST.txt`나 동일 목적의 임시 파일을 생성하지 않습니다.

## 지속 상태·프로젝트 규칙

1. 현재 프로젝트 스키마는 v3입니다.
2. 미래 스키마는 추측해 복구하지 않고 업데이트 안내와 함께 거부합니다.
3. 후보 24개, 자막 5,000개, 프로젝트 텍스트 약 250만 자를 기본 상한으로 사용합니다.
4. 설정 enum은 허용 목록에 있는 값만 복구하고 수치는 기능별 상한으로 clamp합니다.
5. 텍스트·색상 값은 길이·형식 검사를 통과해야 하며 prototype·알 수 없는 설정 키를 거부합니다.
6. 부분 프로젝트의 `captionOptions`, `qualityOptions`, `autoCutOptions` 등은 현재 그룹에 깊은 병합합니다.
7. 손상 자동저장은 `invalid` 상태를 표시하되 삭제 UI를 비활성화하지 않습니다.

## 렌더 자원 규칙

1. `inspectRenderCapability()`는 API 존재 여부만 확인합니다.
2. `recordVerticalSegment()`는 호출 경계에서 범위를 다시 정규화합니다.
3. source/canvas/audio 스트림과 모든 트랙은 성공·실패·취소·초기화 실패에서 중지합니다.
4. 원본 미디어의 `currentTime`, `playbackRate`, `muted`, `volume`, 재생 상태를 작업 전 값으로 복원합니다.
5. 원래 재생 중이던 미디어만 정상 완료 후 재생을 복구하고 취소 신호에서는 재생을 강제하지 않습니다.

## 분석 워커 규칙

1. 워커 요청마다 no-progress watchdog을 설정합니다.
2. 정상 진행 메시지가 도착할 때마다 watchdog을 갱신합니다.
3. `error`, `messageerror`, 무응답은 워커 종료 후 공유 분석 코어 fallback으로 연결합니다.
4. fallback 이유는 diagnostics에 남기고 중복 resolve/reject를 막습니다.
5. `ANALYSIS_WORKER_STALL_MS`는 런타임 설정에서 관리하며 지나치게 작은 값은 허용하지 않습니다.

## 서비스워커 규칙

1. `src/boot/service-worker-registration.js`가 등록과 `registration.update()`의 최종 소유자입니다.
2. `sw.js` activate는 현재 캐시를 보존하고 같은 앱 prefix의 이전 캐시만 삭제합니다.
3. 같은 origin의 다른 cache namespace는 절대 삭제하지 않습니다.
4. Update Sentinel은 진단·이전 캐시 정리를 담당하되 브라우저 등록 객체를 직접 조작하지 않습니다.
5. **Update Sentinel**과 기존 **모듈형 엔진** 계약은 계속 유지합니다.

## 런타임·QA 원칙

- 정적 QA와 실제 Chromium 감사를 모두 통과해야 릴리스합니다.
- QA 보고서 수치는 마지막 `npm test` 결과와 일치해야 합니다.
- 손상 세션 삭제, 지속 설정 정규화, 부분 설정 깊은 병합을 독립 검사합니다.
- 워커 무응답과 잘못된 메시지 fallback을 가짜 타이머·워커로 독립 검사합니다.
- 서비스워커 활성화에서 관련 없는 origin 캐시가 보존되는지 VM으로 검사합니다.
- MP3·MP4 저장뿐 아니라 취소, 실패 재시도, 장시간 분석, ETA를 검사합니다.
- 실미디어 감사 결과는 각 시나리오 완료 직후 JSON에 저장합니다.

## 배포 원칙

- 전체 설치 ZIP과 직전 릴리스 기준 덮어쓰기 ZIP을 함께 만듭니다.
- Git 작업 트리에서는 Git diff를 사용하고, Git 없는 설치본에서는 직전 ZIP/디렉터리와 현재 파일 내용을 비교합니다.
- `PATCH_MANIFEST.txt` 같은 중간 목록 파일은 생성·포함하지 않습니다.
- 삭제 파일이 있으면 자동 패치를 중단하고 별도 적용 절차를 요구합니다.
- 전체·패치 ZIP 모두 `unzip -t`, SHA-256, 패치 적용 후 파일 해시 동일성을 확인합니다.

## 다음 우선순위

1. 실제 localhost/HTTPS 서비스워커 lifecycle 감사
2. 렌더·취소·파일 교체 20회 반복 자원 누수 감사
3. 15분·30분 MP4 장시간 계측
4. 모바일 Safari·Samsung Internet 실기기 검증
5. 손상 세션 진단·내보내기 사용자 도구 검토
