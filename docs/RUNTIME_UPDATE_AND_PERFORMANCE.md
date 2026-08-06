# Runtime Update Guard & Performance

기준: `0.9.4 · Runtime Update Guard`

## 목적

이번 유지보수 패치는 보안 승인 구조를 바꾸지 않고, 사용자가 새 배포본을 놓치지 않도록 하며 초기 화면 부담과 엔진 진단 경합을 줄입니다.

## Runtime Update Guard

- Vite build가 `version.json`을 생성합니다.
- 현재 앱에는 같은 build ID가 compile-time 상수로 포함됩니다.
- 배포본의 `version.json`은 `cache: no-store`와 cache-busting query로 확인합니다.
- 앱 시작 뒤, 30분 주기, 온라인 복귀, 탭 재표시 시 업데이트를 다시 확인합니다.
- 다른 build ID가 확인되면 전역 알림과 설정 화면에 새 버전 적용 버튼을 표시합니다.
- 적용 시 Service Worker registration update를 요청한 뒤 현재 페이지를 새로고침합니다.
- 개발 모드에서는 자동 원격 확인을 건너뜁니다.

`version.json`은 앱 버전, Engine Heartbeat, revision, build ID만 포함합니다. 사용자 데이터, API 주소, 토큰, 음성 파일 또는 로컬 경로는 포함하지 않습니다.

## 보조 화면 지연 로딩

초기 랜딩과 편집 연속성을 담당하는 `HomePage`는 계속 마운트합니다. 품질, 프로젝트, 설정, 보이스 클론 화면은 처음 방문할 때 동적으로 불러옵니다.

이 변경은 다음을 목표로 합니다.

- 첫 화면에서 즉시 필요하지 않은 화면 코드를 초기 청크에서 분리
- 모바일 첫 진입의 JavaScript parse·execute 부담 감소
- 홈 작업공간 상태를 페이지 이동 중에도 유지
- 지연 로딩 동안 명시적인 준비 상태 제공

실제 전송 크기와 LCP·INP 개선량은 GitHub Actions build artifact와 실기기 측정으로 확인하며, 측정 전 임의 수치를 문서에 기록하지 않습니다.

## 오래된 진단 결과 차단

Engine Doctor는 요청 순번을 증가시키고 마지막 요청만 상태에 반영합니다.

- 사용자가 주소를 바꾸며 연속 진단해도 느린 이전 응답이 새 결과를 덮지 않습니다.
- 자동 연결 복구 시 진행 중인 이전 결과를 무효화합니다.
- 온라인 복귀 시 현재 자동 연결 주소를 다시 진단합니다.
- 마지막 완료 시각을 화면에 표시합니다.

네트워크 요청 자체를 강제로 중단하지 못하는 API도 결과 반영 단계에서 경합을 차단합니다.

## 의존성 업데이트 판단

이번 패치에서는 package manifest와 lock을 변경하지 않습니다.

- 현재 GitHub Actions 녹색 기준선을 유지합니다.
- React와 Vitest는 현재 pinned 버전을 유지합니다.
- Zustand patch 업데이트 후보는 다음 Web toolchain 전용 브랜치에서 검증합니다.
- Vite는 외부 공개 registry 표시와 현재 검증 lock 사이의 버전 정보가 일치하지 않아 자동 변경하지 않습니다.
- package update는 manifest, lock, peer dependency, full Web quality, production build를 한 묶음으로 통과한 경우에만 병합합니다.

## 검증 계약

`quality:runtime-update`와 repository preflight가 다음을 확인합니다.

- build metadata와 `version.json` 생성
- no-store 업데이트 조회와 timeout
- 온라인·visibility·주기 확인
- 업데이트 알림과 설정 카드
- 보조 화면 lazy import와 Suspense fallback
- Engine Doctor request sequence guard와 온라인 재진단
