# 곰같은여우 SoriON AI 배포 수정 보고서

작성 시각: 2026-07-31 12:00 KST  
버전: 0.1.5

## 원인

- GitHub `main`에는 새 SoriON Vite 소스가 올라갔다.
- 품질 검사 워크플로는 성공했지만 Pages에 `dist/`를 올리는 배포 워크플로가 없었다.
- GitHub Pages는 마지막 성공 배포본인 AI 쇼츠 스튜디오를 계속 제공했다.
- 기존 Vite 설정도 프로젝트 사이트 경로 `/AI-/`가 아니라 루트 `/`를 사용했다.
- `.git` 폴더는 원인이 아니다.

## 이번 버전 완료

- GitHub Pages 전용 build/deploy 워크플로 추가
- `main` Push와 수동 배포 지원
- `/AI-/` Vite base와 PWA scope 적용
- favicon, PWA 아이콘, navigation fallback 하위 경로 대응
- 이전 Workbox 캐시 정리와 새 Service Worker 즉시 활성화
- 최초 Pages Source 설정과 캐시 복구 문서 추가
- 웹·API 버전 `0.1.5` 반영

## 검증

- `node scripts/check-project-rules.mjs`: 통과
- `python -m pytest services/api/tests -q`: 통과
- 배포 YAML 필수 액션·권한·`dist` 경로 검사: 통과
- 전체 ZIP 금지 항목 검사: 통과
- `0.1.2 → 0.1.5` 패치 루트 상대 경로 검사: 통과

## 사용자가 해야 할 최초 1회 설정

GitHub 저장소에서 `Settings → Pages → Build and deployment → Source`를 **GitHub Actions**로 선택한다. 이후 `main` Push마다 자동 배포된다.

## 실제 배포 확인

이 환경에서는 사용자의 GitHub 저장소에 Push하거나 설정을 변경할 수 없다. 패치 Push 후 Actions의 `Deploy SoriON to GitHub Pages` 성공과 실제 URL의 `BUILD v0.1.5` 표시를 확인해야 한다.

## 다음 목표

Pages 배포를 확인한 뒤 `0.2.0 Mobile Voice Workspace`를 진행한다.
