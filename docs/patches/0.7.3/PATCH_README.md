# SoriON AI 0.7.2 → 0.7.3 패치

## 목적

임시채팅에서도 다음 AI 또는 개발자가 제품 목표·사용자 결정·기술 상태·규칙을 잃지
않도록 `docs/HANDOVER.md`를 영구 프로젝트 메모리로 확정하는 문서·버전 패치입니다.

기능 코드는 0.7.2와 동일합니다.

## 적용 가능한 기준

현재 저장소의 `package.json` 버전이 정확히 `0.7.2`일 때만 적용합니다.

## 적용 순서

1. 현재 변경사항을 커밋하거나 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 이 패치 ZIP을 저장소 루트에 압축 해제합니다.
4. 같은 이름의 파일을 모두 덮어씁니다.
5. `package.json` 버전이 `0.7.3`인지 확인합니다.
6. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 읽습니다.
7. 프로젝트 규칙, API 테스트, Worker 테스트를 실행합니다.
8. GitHub Desktop에서 `PATCH_MANIFEST.txt`와 변경 파일을 비교합니다.
9. 커밋 후 Push하고 GitHub Actions를 확인합니다.

## 삭제 파일

없음.

## 권장 브랜치

```text
docs/handover-memory-baseline
```

## 권장 커밋

```text
docs: establish permanent handover memory
```

## 다음 기능 목표

`0.7.4 GPU Deployment & Progressive Playback`
