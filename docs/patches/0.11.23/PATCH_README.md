# 0.11.23 PATCH README

기준: GitHub `main` commit `235cfd2b5030efe7c5c7837c5ad9b5c8ed4ab7fd`의 `0.11.22` 상태  
결과: `0.11.23 · Focused Voice Surface & Picker Polish`

## 적용 방식

PATCH ZIP의 내용을 기준 프로젝트 루트에 그대로 덮어씁니다. 삭제 대상 파일은 없습니다. `.git`은 포함하지 않습니다.

## 핵심 변경

- PC 메인 상단 전체가 아니라 지정된 오른쪽 Live Voice 보조 카드만 교체 디자인
- 브랜드/버전/제작자/제품 제목/소개 문구 유지
- Desktop Voice Drawer / Voice Picker의 `▶ = 선택 후 미리듣기` 동기화
- Voice Picker 외곽 clipping + 내부 scroll viewport로 라운드/스크롤 정리
- 사용자 화면의 `최종 WAV + 자막` 완료 버튼 제거, MP3+자막 동선 유지
- WAV backend/API 지원은 유지
- 관련 static contract와 회귀 테스트 갱신

## 검증

자세한 결과는 `VALIDATION.md`를 참고합니다. 로컬 dependency 기반 Vitest/ESLint/semantic typecheck/Vite build는 `node_modules` 부재로 실행하지 못했으며 GitHub Actions Web quality가 최종 gate입니다.
