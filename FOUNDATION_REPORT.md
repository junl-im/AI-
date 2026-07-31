# 곰같은여우 SoriON AI Foundation Report

작성 시각: 2026-07-31 11:51 KST  
버전: 0.1.4

## 이번 버전 완료

- 결과 전달 순서를 `결과 → 전체 ZIP·패치 ZIP → 다음 예상 업데이트`로 고정
- 루트 영구 규칙 `DELIVERY_RULES.md` 추가
- 다음 개발 범위를 보존하는 `docs/NEXT_UPDATE.md` 추가
- `HANDOVER`, `CHANGELOG`, `NEXT_UPDATE` 현재 버전 기록을 자동 검사
- 덮어쓰기용 패치 ZIP의 경로·매니페스트·삭제 목록 규칙 정의
- Pull Request와 Release 체크리스트에 전달 산출물 검증 추가
- 웹·API 버전 `0.1.4` 반영

## 기존 기반 유지

- 모바일 우선 React PWA
- 공식 대문 표기 `곰같은여우 SoriON AI`
- FastAPI 엔진 레지스트리와 Mock TTS 어댑터
- IndexedDB 프로젝트 저장
- Firebase 선택형 연결
- GitHub Actions와 프로젝트 규칙 검사
- 500줄 제한과 SVG 금지

## 검증

- `node scripts/check-project-rules.mjs`: 통과
- `python -m pytest services/api/tests -q`: 통과
- 전체 ZIP 금지 항목 검사: 통과
- 패치 ZIP 루트 상대 경로 검사: 통과

## 현 환경의 제한

이전 버전과 동일하게 npm 의존성 설치가 완료되지 않은 환경에서는 정식 TypeScript typecheck, Vitest, Vite production build를 실행할 수 없다. 일반 개발 PC에서 아래 검사를 추가 수행한다.

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## 다음 목표

`0.2.0 Mobile Voice Workspace`

모바일 텍스트 입력, 한국어 음성 프리셋, 생성 상태, 오디오 플레이어 셸, WAV 다운로드 흐름을 구현한다.
