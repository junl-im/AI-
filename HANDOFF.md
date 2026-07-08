# HANDOFF - AI 쇼츠 제작 스튜디오 v1.0.5

## 요약

v1.0.5는 v1.0.4 글라스 UI 이후 실제 사용감을 다시 다듬은 안정화 패치입니다. 핵심은 **Dock 클릭 → 작업 패널 전면 reveal**, **후보 카드 선택성 강화**, **글라스 UI 가독성 보강**입니다.

## 변경 파일

```text
assets/css/workspace-comfort.css
src/ui/workspace-comfort.js
qa/workspace_comfort_smoke.js
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
Dock = 작업 탭 + 패널 reveal
후보 탭 = 선택 가능한 후보 카드
미리보기 = 선택 후보 확인
글라스 UI = 예쁘지만 가독성이 우선
```

## 주의

- `workspace-comfort.css`는 `glass-pro-ui.css` 뒤에 로드되어야 합니다.
- `workspace-comfort.js`는 기존 flow 모듈을 대체하지 않고, 마지막 편의 레이어로 보강합니다.
- Dock 클릭 후 reveal 동작을 제거하지 마세요. 현재 사용성의 핵심입니다.
- 후보 안내 문구에 shimmer/반짝임 애니메이션을 다시 넣지 마세요.

## 검수

```bash
npm run check
```

현재 결과: 75/75 통과.


## 검수 순서

```text
1. 문법 검수
2. 기존 흐름 QA
3. Dock reveal QA
4. Workspace Comfort QA
5. 문서/패키징 확인
```

## 알려진 제한

- 실제 미디어 렌더링 품질은 브라우저의 MediaRecorder/Canvas/captureStream 지원에 따라 달라집니다.
- iOS 일부 브라우저에서는 진동 피드백이 무시될 수 있습니다.
- 무료 로컬 브라우저 렌더링 방식이라 저장 포맷은 브라우저 지원에 따라 WebM으로 나올 수 있습니다.
