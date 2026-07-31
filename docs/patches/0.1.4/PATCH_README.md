# SoriON AI 0.1.3 → 0.1.4 패치

## 적용 대상

- 기준 버전: `0.1.3`
- 대상 버전: `0.1.4`

## 적용 방법

1. 현재 작업을 GitHub Desktop에서 커밋하거나 별도로 백업합니다.
2. 패치 ZIP의 내용을 기존 SoriON AI 저장소 루트에 압축 해제합니다.
3. 파일 덮어쓰기를 허용합니다.
4. `.git` 폴더는 삭제하거나 변경하지 않습니다.
5. `docs/patches/0.1.4/PATCH_MANIFEST.txt`와 GitHub Desktop의 Changes를 비교합니다.
6. `npm run quality:rules`와 `npm run test:api`를 실행합니다.

## 삭제 파일

없음.

## 핵심 변경

- 영구 결과 전달 규칙 추가
- 전체 ZIP과 덮어쓰기용 패치 ZIP 의무화
- HANDOVER, CHANGELOG, NEXT_UPDATE 기록 의무화
- 규칙 자동 검사 강화
