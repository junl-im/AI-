# QA Report - AI 쇼츠 제작 스튜디오 v1.2.1

## Summary

- Passed: 104/104
- Failed: 0/104
- Result: PASS

## v1.2.1 Focus

- 상단 정보 구조: 제품 카피와 스튜디오 상태 데크의 PC 2열 구성
- 시작 액션: 기존 `fileInput`을 사용하는 실제 label 연결
- 신뢰 정보: 로컬 처리 안내와 `READY` 상태 표시
- 반응형: 860px 이하 상태 데크 제거, 720px 이하 타이포그래피 압축
- 접근성: 키보드 포커스 표시와 의미 있는 aria label 유지
- 성능 대응: 저사양 모드와 모션 감소 환경에서 애니메이션·블러 축소
- 캐시 일치: v1.2.1 버전, 빌드 키와 서비스워커 캐시 동기화
- 기존 안정성: v1.2.0 Observer 피드백 루프 방지 규칙 유지

## Automated Checks

- 문법, DOM 앵커와 버전 동기화
- 분석·추천·컷·자막·렌더·저장 모듈 계약
- PC Prime 3열 작업실과 모바일 4단계 진행 화면
- 메뉴바 용어와 응답성 회귀 가드
- 시네마틱 히어로 요소, 상태 데크, 기존 파일 입력 연결
- 서비스워커의 새 상단 CSS 프리캐시
- reduced-motion 및 performance-lite 폴백

## Visual Layout Checks

- Desktop static Chromium render: 1600x1000
- Mobile static Chromium render: 390x844
- PC에서 상단 2열 데크, 대형 제목, 기능 칩, 플랫폼 레일과 작업실 시작 영역 확인
- 모바일에서 상태 데크와 플랫폼 레일이 제거되고 브랜드 소개·4단계 진행 화면·메뉴바가 표시되는지 확인
- 이 시각 검수는 HTML과 전체 CSS를 통합 렌더한 정적 레이아웃 검사이며, 실제 런타임 기능 검사는 자동 QA와 사용자 브라우저 E2E로 별도 확인합니다.

## Command

```bash
npm run check
```

## Remaining Manual E2E

실제 MP3·MP4를 사용한 자동 분석, 추천 생성, 후보 선택, 미리보기와 MediaRecorder 저장 과정은 사용자 브라우저와 실기기에서 추가 검증이 필요합니다.
