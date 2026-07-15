# QA Report - AI 쇼츠 제작 스튜디오 v1.2.3

## Summary

- Passed: 105/105
- Failed: 0/105
- Result: PASS

## v1.2.3 Focus

- 쇼츠 정체성: 9:16 컷 프레임, 0:00~0:15 타임라인, HOOK·BEAT·CAPTION 큐
- 상단 메타: BUILD, 로컬 9:16 렌더 상태와 DESIGNED BY의 단일 기준선 정렬
- 시작 액션: 기존 `fileInput`을 사용하는 `새 쇼츠 만들기` label 연결
- PC 구조: 제품 카피와 9:16 비주얼·액션의 2열 구성
- 모바일 구조: PC용 세로 프레임과 시작 액션 제거, 브랜드·설명·타임라인 유지
- 상태 안정성: command bridge가 메타 텍스트와 pulse DOM을 파괴하지 않도록 수정
- 첫 렌더: 첫 화면 밖 상세 패널의 기능 감지형 페인트 지연 유지
- 캐시 일치: v1.2.3 버전, `1.2.3-shorts-pulse-hero` 빌드 키와 서비스워커 캐시 동기화
- 기존 안정성: Observer 피드백 루프 방지 규칙 유지

## Automated Checks

- 문법, DOM 앵커와 버전 동기화
- 분석·추천·컷·자막·렌더·저장 모듈 계약
- PC Prime 3열 작업실과 모바일 4단계 진행 화면
- 메뉴바 용어와 응답성 회귀 가드
- 9:16 쇼츠 프레임, 짧은 컷 타임라인과 기존 파일 입력 연결
- 예전 시네마틱 상단 CSS 미로드·미캐시 확인
- `content-visibility`와 intrinsic size 회귀 검사
- reduced-motion 및 performance-lite 폴백

## Runtime Browser Audit

전체 스크립트를 Chromium 엔진에서 실행했습니다.

- 0.8초: RAF 25, Mutation 58, 오류 0
- 2.6초: RAF 25, Mutation 58, 오류 0
- body build: `1.2.3`
- version sync: `true`
- readyState: `complete`
- DOM nodes: 893
- CDP/page exceptions: 0

두 시점의 RAF와 Mutation 수가 동일하므로 초기 동기화 이후 반복 갱신 루프가 없습니다. 상세 값은 `qa/runtime-browser-audit.json`에 저장했습니다.

## Visual Layout Checks

- Desktop static Chromium render: 1600x1000
- Mobile static Chromium render: 390x844
- PC에서 상단 메타 레일, 큰 제목, 컷 타임라인, 9:16 프레임과 작업실 시작 영역 확인
- 모바일에서 BUILD와 DESIGNED BY, 제품 설명, 압축 타임라인, 4단계 진행 화면과 메뉴바 확인
- 시각 검수는 전체 CSS를 통합한 레이아웃 검사이며 실제 미디어 기능은 별도 E2E 대상입니다.

## Command

```bash
npm run check
```

## Remaining Manual E2E

실제 MP3·MP4를 사용한 자동 분석, 추천 생성, 후보 선택, 미리보기와 MediaRecorder 저장 과정은 사용자 브라우저와 실기기에서 추가 검증이 필요합니다.
