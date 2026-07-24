# PROJECT NOTES v1.6.3

## 릴리스 성격

Stage Focus & Progressive Disclosure UI/UX 패치입니다. 분석·렌더·프로젝트·캐시 데이터 계약은 변경하지 않습니다.

## 주요 소유권

- 단계 집중 상태·동적 inline 복원: `src/ui/workflow-focus-layout.js`
- 집중 레이아웃 시각 규칙: `assets/css/workflow-focus-layout.css`
- 실제 앱 상태 → workflow phase: `src/ui/ux-controls.js`
- shell 지연 적재: `src/boot/staged-ui-loader.js`
- 앱 셸 오프라인 자산: `sw.js`, `asset-integrity.json`

## 성능 계약

- 직접 실행 스크립트 49개
- 단계 집중 컨트롤러는 shell phase에서 적재
- 동일 상태의 레이아웃 inline 재적용 방지
- CSS `!important` 593개 유지
- 하단 메뉴는 ResizeObserver 기반 실측, polling 없음

## 패키징 기준

- 기준 커밋: v1.6.2 `66e5b42`
- 전체본: `ai-shorts-studio-v1.6.3-release.zip`
- 패치본: `ai-shorts-studio-v1.6.3-patch-from-v1.6.2.zip`
- 패치 적용 결과는 전체본과 파일별 SHA-256 비교
