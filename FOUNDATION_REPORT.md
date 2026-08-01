# SoriON AI 0.8.7 CI Hotfix Result Report

작업 일시: 2026-08-01 KST

결과 버전: **0.8.7 Dubbing Studio Workspace · CI Hotfix**

## 결과

- TimelineEditor의 여러 생성 버튼이 동일한 접근성 이름을 사용해 Vitest가 대상을 구분하지 못하던 Web quality 실패를 수정했다.
- 대사 번호와 상태를 포함한 고유 버튼 이름으로 실제 스크린리더 탐색도 개선했다.
- 실패 블록 재시도 테스트가 정확히 2번 대사를 선택하도록 회귀 기대값을 고정했다.
- 장문 원고 중심 구조 위에 모바일 더빙 프로젝트 편집 IA를 적용했다.
- 프로젝트 제목, 자동 저장 상태, 엔진 상태와 주요 작업을 상단에 통합했다.
- 화자 선택과 읽기 설정을 각각 전용 Bottom Sheet로 분리했다.
- 문장별 음성 블록에서 직접 수정·생성·재생·분할·이동·삭제할 수 있다.
- 화면 하단 전체 폭 플레이어가 현재 Queue와 트랙 진행 상태를 표시한다.
- 새 대사·쉼 추가, 현재 음원 다운로드와 다른 작업 화면 이동을 연결했다.
- 작업 초기화는 커스텀 확인창을 거치며 workspace reset 계약으로 안전하게 비운다.
- 0.8.6의 장문 자동 분할, IndexedDB 세션 복원, revision 보호와 자동 API 연결을 유지했다.

## 검증

- 프로젝트 규칙 검사 통과
- 독립 TypeScript semantic 검사 통과
- TypeScript·TSX 125개 구문 검사와 상대경로 import 267개 연결 통과
- API 90개·Worker 9개 회귀 통과
- Python compileall과 Python 3.10 AST 93개 파일 통과
- CSS 13개, JSON 7개, GitHub Actions YAML 구조 검사 통과
- 기준본 패치 적용 동등성과 ZIP 무결성 통과
- TimelineEditor 접근성 이름 정적 회귀 검사 통과

## 알려진 현실

공개 GitHub Pages에서 실제 음성을 만들려면 별도 HTTPS FastAPI와
`SORION_PUBLIC_API_BASE_URL` 배포 변수가 필요하다. System Voice는 실제 WAV를 만들 수 있지만
AI 모델 음성과 동일하지 않으며, CosyVoice 모델·GPU 준비 상태를 허위로 표시하지 않는다.

## 다음 목표

`0.8.8 Korean Voice Quality Streaming`
