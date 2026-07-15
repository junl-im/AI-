# QA Report - AI 쇼츠 제작 스튜디오 v1.2.4

## Summary

- Passed: 106/106
- Failed: 0/106
- Result: PASS

## v1.2.4 Focus

- 진행 내비게이션: 파일 선택 → 추천 → 후보 → 미리보기 단계에서 메뉴 활성 상태, 대상 패널 강조와 화면 이동을 일치시켰습니다.
- 런타임 충돌 수정: 레거시 `hyperflow-tabs`가 내부의 오래된 `active=file` 값을 다시 쓰던 문제를 제거했습니다.
- PC 포커스: 현재 대상 패널에 `현재 작업` 레이블, 외곽 강조와 한 번의 포커스 펄스를 적용했습니다.
- 상단 메타: 버전 바로 옆에 CSS 기반 기기 기호와 `모바일 · PC 호환`을 PC·모바일 모두 표시합니다.
- 아이콘 언어: 주요 작업 기호를 `＋ ✦ ◆ ▶ ∿ ✂ ◫ ↓`로 통일하고 파형·저장·업데이트 문구의 컬러 이모지를 제거했습니다.
- 모바일 알림: 업데이트 토스트를 상단에서 하단 메뉴바 위로 이동해 메타 정보를 가리지 않게 했습니다.
- 캐시 일치: v1.2.4 버전, `1.2.4-navigation-focus` 빌드 키와 서비스워커 캐시를 동기화했습니다.

## Automated Checks

- 문법, DOM 앵커와 버전 동기화
- 분석·추천·컷·자막·렌더·저장 모듈 계약
- PC Prime 3열 작업실과 모바일 진행 중심 화면
- 메뉴바 용어와 Observer 피드백 루프 회귀 가드
- 단일 내비게이션 소유권과 레거시 탭 상태 수용 규칙
- 현재 작업 패널 강조, `aria-current=step`과 메뉴 중앙 정렬
- 모바일·PC 호환 메타와 단색 스튜디오 글리프
- reduced-motion 및 performance-lite 폴백

## Runtime Browser E2E

Chromium에서 합성 20초 WAV를 실제 파일 입력에 넣어 진행 흐름을 확인했습니다.

| 시점 | body 활성 단계 | 메뉴 `aria-current` | 강조 패널 | 결과 |
|---|---|---|---|---|
| 초기 | file | file | - | 정상 |
| 파일 분석 후 | recommend | recommend | recommend | 정상 |
| 추천 생성 후 | candidates | candidates | candidates | 후보 1개 생성 |
| 후보 선택 후 | preview | preview | preview | 정상 |

- 브라우저 오류: 0건
- 후보 선택 직후: RAF 201 / Mutation 414
- 추가 1.8초 후: RAF 201 / Mutation 414
- 단계 이동 종료 후 추가 반복 갱신 없음
- 상세 결과: `qa/runtime-browser-audit.json`

## Responsive Visual Checks

- Desktop Chromium render: 1440×900
- Mobile Chromium render: 390×844
- PC에서 버전 옆 호환 정보, 중앙 상태, 디자인 서명과 3열 작업실 확인
- PC 실제 진행 후 미리보기 메뉴와 대상 패널이 함께 활성화되는지 확인
- 모바일에서 `모바일 · PC 호환`이 버전 옆에 표시되는지 확인
- 모바일에서 PC용 9:16 시작 비주얼은 숨고 하단 제작 메뉴바가 유지되는지 확인
- 업데이트 알림이 모바일 상단 메타를 가리지 않는 위치인지 확인

## Command

```bash
npm run check
```

## Remaining Manual E2E

실제 MP4의 영상 모션 분석, 장시간 MediaRecorder 렌더·저장, 모바일 Safari와 인앱 브라우저 출력 형식은 실기기에서 추가 검증이 필요합니다.
