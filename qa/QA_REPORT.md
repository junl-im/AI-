# QA Report - AI 쇼츠 제작 스튜디오 v1.2.8

## Summary

- Passed: 112/112
- Failed: 0/112
- Result: PASS

## v1.2.8 Focus

- 상단 중앙 `LOCAL · PRIVATE · 9:16` 문구와 상태 점 제거
- 상단 메타를 왼쪽 빌드·기기 호환 / 오른쪽 디자인 서명의 2열 구조로 단순화
- 모바일 720px·390px 구간에서 BUILD와 DESIGNED BY 라벨 유지
- 런타임 내비게이션 모듈이 제거된 중앙 상태를 다시 생성하지 않도록 수정
- `header-meta-rail.css`의 최종 캐스케이드 소유권 확인
- v1.2.8 버전·빌드 키·서비스워커 캐시 동기화
- 전체 설치 ZIP과 v1.2.7 덮어쓰기 패치 ZIP 계약 확인

## Automated Checks

- 문법, DOM 앵커, 버전·빌드·캐시 동기화
- 분석·추천·컷·자막·렌더·저장 모듈 계약
- PC Prime 3열 작업실과 모바일 진행 중심 화면
- 진행 내비게이션과 단계형 UI 로딩 회귀 방지
- Observer 피드백 루프와 상시 폴링 회귀 방지
- 전용 SVG 아이콘 20종과 메뉴 연결 유지
- 중앙 메타 마크업·문구·런타임 재생성 로직 부재 확인
- 전체/패치 배포 스크립트와 v1.2.7 → v1.2.8 매니페스트 확인

## Runtime Loading Baseline

| 시점 | 직접 스크립트 | 지연 스크립트 | 준비 단계 |
|---|---:|---:|---|
| 첫 렌더 직후 | 39 | 0 | Core |
| Shell 준비 후 | 39 | 9 | shell |
| Editing 준비 후 | 39 | 15 | shell, editing |
| Export 준비 후 | 39 | 16 | shell, editing, export |

분석·추천·렌더 엔진과 단계 로딩 계약은 변경하지 않았습니다.

## Responsive Visual Checks

- Desktop Chromium static render: 1440×1080
- Mobile Chromium static render: 390×844
- 중앙 상태 요소: PC·모바일 모두 없음
- Desktop metadata rail: BUILD/호환 왼쪽, DESIGNED BY 오른쪽
- Mobile metadata rail: BUILD/호환 왼쪽, DESIGNED BY 오른쪽
- Mobile horizontal overflow: 0px
- Desktop horizontal overflow: 0px
- Mobile version top: 24px
- Mobile compatibility top: 23.5px
- Mobile designer credit top: 28px
- 페이지 렌더 오류: 0건

관리형 Chromium의 로컬 URL 제한 때문에 실제 HTML과 CSS를 인라인 주입한 감사 문서로 Chromium 렌더 엔진을 검수했습니다. 세부 값은 `qa/runtime-browser-audit-v1.2.8.json`에 기록했습니다.

## Distribution Checks

- 전체 설치 ZIP: 프로젝트 전체 파일 포함
- 덮어쓰기 패치 ZIP: v1.2.7 → v1.2.8 변경 파일만 포함
- 패치 적용 후 대상 파일이 전체 버전과 바이트 단위로 일치하는지 확인
- 전체 ZIP 221개 항목, 패치 ZIP 57개 항목
- 패치 매니페스트 57개 파일의 누락 0건·불일치 0건
- 두 ZIP 압축 무결성 검사와 SHA-256 생성

## Command

```bash
npm run check
npm run package
```

## Remaining Manual E2E

실제 MP3·MP4 디코딩, 영상 모션 분석, 장시간 MediaRecorder 렌더·저장, 모바일 Safari와 인앱 브라우저 출력 형식은 실기기에서 추가 검증이 필요합니다.
