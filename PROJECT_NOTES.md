# Project Notes - AI Shorts Studio v1.0.1

## 방향

이번 버전은 상단 타이틀과 실행 버튼이 섞여 보이는 문제를 정리하고, PC/모바일을 같은 레이아웃으로 억지 적용하지 않도록 분리한 패치입니다.

## 레이아웃 원칙

- Hero: 브랜드와 프로그램 소개만 담당
- Start command panel: 파일 열기, 프로젝트 불러오기, 자동 분석 안내, 편집 흐름 안내 담당
- HyperFlow stage: 현재 흐름 상태 담당
- Main workspace: 현재 선택된 탭의 실제 작업 담당
- Bottom Dock: 탭 이동만 담당

## PC / 모바일 차이

- PC: 넓은 작업면, 8탭 Dock 한 줄, 작업 패널 최대 폭 확장
- Mobile: 4탭 x 2줄 Dock, 세로 흐름, 작은 버튼/카드 중심

## 추가된 파일

- `assets/css/responsive-workspace.css`
- `qa/responsive_workspace_smoke.js`
