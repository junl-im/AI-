# SoriON AI 0.8.7 Dubbing Studio Workspace

## 적용 기준

- 기준 전체본: `SoriON-AI-0.8.6-full.zip`
- 대상 버전: `0.8.7`
- 저장소 루트에 패치 ZIP을 풀어 같은 경로의 파일을 덮어씁니다.
- 이번 패치의 삭제 대상은 없습니다.

## 주요 변경

- 프로젝트 제목·자동 저장·엔진 상태 중심의 모바일 제작 상단바
- 목소리 선택과 속도·피치·감정 설정 Bottom Sheet
- 문장별 직접 편집·생성·재생·분할·이동·삭제가 가능한 세로형 음성 블록
- 새 대사·쉼 추가와 하단 전체 폭 플레이어
- 작업 비우기 커스텀 확인창과 공통 workspace reset
- 장문 자동 분할, 세션 복원, revision 보호와 자동 엔진 오케스트레이션 유지

## 적용 후 확인

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

```bash
python -m pytest services/api/tests -q
python -m pytest services/worker/tests -q
```

실제 AI 음성을 사용하려면 공개 HTTPS FastAPI·Worker·모델이 별도로 준비되어야 합니다.
