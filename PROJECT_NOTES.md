# PROJECT NOTES v1.1.7

이번 패치는 업데이트 적용 신뢰성과 엔진 성능 가시성을 다룹니다.

## 설계 결정

- 본 화면은 계속 단순 사용 방법 중심으로 유지합니다.
- 업데이트/캐시/엔진 상태는 정보 모달 안에 배치해 메인 작업 화면을 복잡하게 만들지 않습니다.
- 버전 표시는 `src/config/app-runtime-config.js`의 `APP_VERSION`을 단일 소스로 유지합니다.
- `Update Sentinel`은 캐시 문제로 새 버전이 안 보이는 상황을 사용자가 직접 확인하고 정리할 수 있게 합니다.
- `Engine Boost Profile`은 실제 엔진 설정을 무리하게 바꾸기보다, 브라우저 성능 프로필을 먼저 수집하는 안전한 기반 모듈입니다.
- 화면 이동은 계속 `Final Flow Director` 단일 소유 구조를 유지합니다.

## 유지 원칙

- 무료 로컬 브라우저 처리
- 글라스 디자인 유지
- 하단 Dock 중심 네비게이션
- 파일 열기 후 자동 분석
- 추천 → 후보 → 미리보기 → 저장 초연결 흐름
- 버전/캐시/인수인계 문서 동기화

## v1.1.7 추가 메모

- `src/boot/update-sentinel.js`는 정보 모달이 열릴 때가 아니라 DOMContentLoaded 시점에 패널을 주입합니다.
- `src/engine/engine-boost-profile.js`는 `AIShortsEngineBoostProfile.collect()` API를 제공합니다.
- 향후 실제 분석 샘플 수 조정은 `engine-boost-profile.js`의 `maxMotionSamples`, `recommendedParallelism`, `renderQueueLimit` 값을 참조해 연결할 수 있습니다.
- `Update Sentinel`의 캐시 삭제는 이전 앱 셸 캐시에 한정합니다. 사용자 프로젝트 데이터나 로컬 설정을 삭제하지 않습니다.
