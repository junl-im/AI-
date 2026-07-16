# QA Report - AI 쇼츠 제작 스튜디오 v1.2.6

## Summary

- Passed: 109/109
- Failed: 0/109
- Result: PASS

## v1.2.6 Focus

- 공통 디자인 토큰을 사용한 패널·입력·버튼·메뉴바 계층 통일
- 강한 중첩 테두리와 글로우 감소
- PC 8항목 단일 플로팅 메뉴바
- 모바일 4열×2행 메뉴바의 높이·대비 개선
- 모바일 상단과 4단계 안내 밀도·줄바꿈 조정
- 저사양·모션 감소 폴백 유지
- 단계형 UI 로딩과 진행 내비게이션 회귀 방지
- v1.2.6 버전·빌드 키·서비스워커 캐시 동기화

## Automated Checks

- 문법, DOM 앵커, 버전·빌드·캐시 동기화
- 분석·추천·컷·자막·렌더·저장 모듈 계약
- PC Prime 3열 작업실과 모바일 진행 중심 화면
- 메뉴바 용어, 단색 글리프와 진행 내비게이션
- Observer 피드백 루프와 상시 폴링 회귀 방지
- `shell → editing → export` 단계 의존성
- UI refinement 스타일이 최종 캐스케이드인지 확인
- PC 8열·모바일 4열 메뉴 구조 확인
- 공통 표면·선 토큰과 저사양 폴백 확인

## Runtime Loading Baseline

| 시점 | 직접 스크립트 | 지연 스크립트 | 준비 단계 |
|---|---:|---:|---|
| 첫 렌더 직후 | 39 | 0 | Core |
| Shell 준비 후 | 39 | 9 | shell |
| Editing 준비 후 | 39 | 15 | shell, editing |
| Export 준비 후 | 39 | 16 | shell, editing, export |

기존 v1.2.5 단계 로딩 감사에서 브라우저 예외와 경고는 0건이었으며 v1.2.6은 로딩·엔진 로직을 변경하지 않았습니다. 상세 기준선은 `qa/runtime-browser-audit.json`에 있습니다.

## Responsive Visual Checks

- Desktop Chromium static render: 1440×1080
- Mobile Chromium static render: 390×844
- PC 상단과 3열 작업실의 간격·카드 계층 확인
- PC 메뉴바 8개 항목 한 줄 표시 확인
- 모바일 상단·4단계 안내·메뉴바가 한 화면 안에서 겹치지 않는지 확인
- 모바일 중복 파일 불러오기 화면이 노출되지 않는지 확인
- 버전 옆 `모바일 · PC 호환`과 디자인 서명 정렬 확인

관리형 Chromium이 로컬 URL 탐색을 차단하므로 시각 검수는 CDP 문서 주입과 CSS 인라인 방식으로 실제 Chromium 렌더 엔진에서 수행했습니다.

## Command

```bash
npm run check
```

## Remaining Manual E2E

실제 MP3·MP4 디코딩, 영상 모션 분석, 장시간 MediaRecorder 렌더·저장, 모바일 Safari와 인앱 브라우저 출력 형식은 실기기에서 추가 검증이 필요합니다.
