# 0.11.45 · Timeline Editing & Project Clarity

기준: 0.11.44 (c5361f6), 2026-10-21 KST.

## 변경

- 개별 클립 삭제 버튼·메뉴·키보드와 빠른 편집 삭제는 확인창을 거칩니다. 직접 다중 선택 삭제도 선택 당시 ID로 확인합니다. 기존 일괄 명령 미리보기는 유지합니다.
- 취소 기본 포커스, Escape/바깥 클릭 취소, Tab 포커스 잠금. 확인 시 현재 존재하는 대상만 전달하고 생성 중인 대사가 있으면 실행하지 않습니다.
- 대상 대사/쉼 개수와 최대120자 미리보기를 표시합니다. 원본 대본과 저장 프로젝트는 유지됩니다.
- 빈 빠른 편집 draft의 저장 실패 후 이전 대사를 분할하던 경로를 차단하고, 생성 중/2자 미만 대사의 분할을 막습니다.
- 모바일 타임라인 입력16px, 최대40dvh 스크롤. 빠른 편집 focus 동안 도크 static, blur 후 기존 배치 복귀.
- 프로젝트 목록의 기술 용어를 줄이고 서버 음원 만료 가능성을 안내합니다. 빈 목록의 대본 계속 편집은 새 작업 reset 없이 home으로 이동합니다.

## 검증

- 전체 Web: 84파일/330 tests PASS. lint, TypeScript 및 Vite production build PASS.
- 초기 index 청크406.43kB/gzip128.46kB, 500kB 초과 경고 없음.
- API244 PASS/1 skip, Worker16 PASS, Ruff PASS. 기존 Starlette/httpx deprecated 경고 유지.
- Repository preflight55/55 PASS, git diff --check PASS.
- Chromium360/390/430/768/1024/1440: 긴 대사 끝 스크롤, 분할2개, Escape 취소 시2개 유지, 확인 삭제 후1개, 프로젝트 빈 목록→기존 대본 복귀 PASS. 가로 넘침 없음, pageerror0.
- 모바일 높이420 조건: 입력16px, scrollTop1354~1355, 도크static, 확인창 화면 내 표시·포커스 PASS. 증거 docs/validation/0.11.45/timeline.json. 실제 휴대폰 키보드 측정 아님.

- 기존 주요17화면 단색 텍스트 대비 기준 미달0건. 전체 WCAG 인증이 아니며 hover/이미지/모든 상태 측정은 아님. 증거 docs/validation/0.11.45/contrast.json.

## 제한

데스크톱 Chromium viewport/합성 오류 검증이며 실제 Android/iOS 키보드·Firefox/Safari 인증은 아닙니다. 이번 변경은 Web UI이며 실제 승인 WAV·모델 없는 Neural 청취 성공을 주장하지 않습니다. 새 의존성·유료 API·자동 음성 업로드는 없습니다.
