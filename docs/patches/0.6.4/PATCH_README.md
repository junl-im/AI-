# SoriON AI 0.6.3 → 0.6.4 패치 안내

## 적용 대상

- 현재 `package.json` 버전이 정확히 `0.6.3`인 프로젝트
- 기존 `.git` 폴더는 유지

## 적용 방법

1. 현재 변경사항을 커밋하거나 별도 백업한다.
2. 패치 ZIP을 저장소 루트에 압축 해제한다.
3. 모든 파일을 덮어쓴다.
4. 이번 패치의 삭제 파일은 없으므로 별도 삭제 명령은 필요하지 않다.
5. `npm run quality:rules`를 실행한다.
6. GitHub Actions의 Web quality, API quality, Pages 배포를 확인한다.

## 핵심 확인

- 상단 BUILD가 `v0.6.4`인지 확인한다.
- 첫 화면에 500자 입력창과 `0 / 500` 카운터가 보이는지 확인한다.
- 숫자·날짜 자동 변환 토글이 기본 활성화인지 확인한다.
- 문장을 입력하면 CTA가 `WAV로 생성하기 (약 3초)`로 바뀌는지 확인한다.
- 생성 후 문장별 생성 구간 리스트가 보이는지 확인한다.
- Dock 메뉴가 화면 상단으로 이동하는지 확인한다.

## 권장 브랜치와 커밋

```text
feature/premium-creation-ux
```

```text
feat: refine premium creation experience
```
