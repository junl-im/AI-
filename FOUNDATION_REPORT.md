# SoriON AI 0.11.11 Verification Report

결과 버전: **0.11.11 · Mobile Studio Flow & Natural Voice Playback**  
기준 버전: **0.11.10 · Horizontal Timeline Workspace**

## 적용 범위

- 모바일 홈에서도 Dubbing Player와 주요 Dock을 함께 표시해 화면별 네비게이션 차이를 제거
- One-Flow에서 현재 선택 목소리 1개만 노출하고 전체 프리셋은 `목소리 선택` Sheet에서 비교
- preset별 `잘 맞는 상황 / 장점 / 주의점 / natural speed-pitch range` 메타데이터와 대본 문맥 기반 추천 추가
- Voice Sheet 미리듣기는 현재 선택을 변경하지 않는 preview-only 계약으로 수정
- 모바일 textarea focus 및 VisualViewport 변화 시 현재 편집 칸을 상단 작업 위치로 재정렬
- 1024px 미만 Timeline도 실제 좌→우 시간축을 사용하고 760px 이하 기본 zoom을 1.25배로 적용
- 모바일 트랙의 왼쪽 고정 라벨 공간을 제거해 lane을 화면 폭에 가깝게 확장
- 생성 track의 store-driven play 요청과 Player 버튼 상태를 즉시 연결하고 native play 실패 시 상태 원복
- Mobile Studio Flow 전용 dependency-free preflight 추가
- 앱·API·Worker 제품 버전 0.11.11 동기화

## 검증 결과

- Repository preflight: **46/46 통과**
- API pytest: **219/219 통과**
- Worker pytest: **14/14 통과**
- Python compileall: 통과
- 제품 버전 sync: **v0.11.11 통과**
- dependency-free TS/TSX transpile: **215/215 통과**
- Mobile Studio Flow contract: 통과
- One-Flow contract: 통과
- Horizontal Timeline contract: 통과
- 기준 0.11.10 대비 변경 범위: **추가 9 + 수정 40 = 49파일, 삭제 0**
- 기준본 전체 파일: **933**, 결과 전체 파일: **942**

## 자연스러움과 음성 품질 경계

- 대본 맞춤 추천은 키워드·길이 기반 선택 보조이며 자동 적용하지 않습니다.
- preset의 natural speed/pitch range는 극단 설정의 carry-over를 줄이는 UX 안전 범위이며 실제 음질 보증 수치가 아닙니다.
- CosyVoice 전용 preset의 실제 자연스러움과 상황 적합도는 승인 WAV·화자 동의·사람 검수·실기기 청취 증거가 준비된 뒤 확정합니다.
- 현재 voice evidence preflight의 pending 20건은 기존 운영 준비 항목이며 이번 패치가 이를 성공으로 가장하지 않습니다.

## Web 검증 환경 제한

- 전달본에는 `node_modules`를 포함하지 않습니다.
- 현재 실행 환경에서는 완전한 npm dependency install이 보장되지 않아 전체 ESLint·semantic TypeScript·Vitest·Vite production build·실제 Chromium layout은 GitHub Actions `Web quality`를 최종 source of truth로 둡니다.
- 대신 변경 소스를 포함한 전체 TS/TSX 215개 파일을 global TypeScript dependency-free transpile로 검사했고 syntax diagnostic 0건입니다.

## 패치 재현성

- 실제 최종 패치 ZIP을 0.11.10 전체본에 overlay 후 `APPLY_PATCH.sh`를 실행했고 Repository preflight **46/46**을 통과했습니다.
- overlay 결과와 0.11.11 완성본을 SHA-256 단위로 비교한 결과 **942/942 files · missing 0 · extra 0 · changed 0**입니다.
