# HANDOFF - AI 쇼츠 제작 스튜디오 v1.0.6

## 요약

v1.0.6은 Dock 탭 이동 시 보이던 화면 떨림을 잡는 **Motion Stability 핫픽스**입니다. 핵심은 탭 reveal 스크롤을 한 곳에서만 처리하고, 기존 flow 모듈들은 상태/가이드 보정 위주로 동작하게 만든 것입니다.

## 변경 파일

```text
assets/css/motion-stability.css
src/ui/motion-stability.js
qa/motion_stability_smoke.js
src/ui/hyperflow-tabs.js
src/ui/workspace-comfort.js
src/ui/flow-quality-gate.js
index.html
sw.js
package.json
README.md
CHANGELOG.md
PROJECT_NOTES.md
qa/QA_REPORT.md
```

## 적용 원칙

```text
상단 = 프로그램 소개와 시네마틱 브랜드
시작 패널 = 파일 열기 / 프로젝트 불러오기 / 자동 분석 안내
Dock = 작업 탭
Motion Stability = 탭 클릭 후 패널 reveal 단일 담당
Workspace Comfort = 후보 카드/안내 안정화
Flow Quality Gate = 잘못된 단계 자동 복구
```

## 주의

- 탭 클릭 reveal을 여러 모듈에서 다시 `smooth scroll`로 추가하지 마세요.
- `motion-stability.js`는 `hyperflow-tabs.js`보다 먼저 로드됩니다.
- 작업 패널 강조는 transform/scale 대신 outline/box-shadow 중심으로 유지하세요.
- `workspace-comfort.js`는 탭 클릭 시 직접 스크롤하지 않습니다.

## 검수

```bash
npm run check
```

현재 결과: 75/75 통과.

## 검수 순서

```text
1. 문법 검수
2. 기존 흐름 QA
3. Motion Stability QA
4. Workspace Comfort QA
5. 문서/패키징 확인
```

## 알려진 제한

- 브라우저별 스크롤 물리감은 조금 다를 수 있습니다.
- iOS 일부 브라우저에서는 진동 피드백이 무시될 수 있습니다.
- 무료 로컬 브라우저 렌더링 방식이라 저장 포맷은 브라우저 지원에 따라 WebM으로 나올 수 있습니다.
