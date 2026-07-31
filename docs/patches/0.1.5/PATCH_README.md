# SoriON AI 0.1.2 → 0.1.5 GitHub Pages 복구 패치

## 적용 대상

- GitHub에서 확인된 현재 버전: `0.1.2`
- 대상 버전: `0.1.5`
- 저장소: `junl-im/AI-`

## 적용 방법

1. GitHub Desktop에서 작업 중인 변경을 커밋하거나 백업합니다.
2. 패치 ZIP의 내용을 기존 저장소 루트에 압축 해제합니다.
3. 파일 덮어쓰기를 허용합니다.
4. `.git` 폴더는 삭제하거나 변경하지 않습니다.
5. 저장소 루트에서 아래 명령으로 더 이상 사용하지 않는 파일을 정리합니다.

```bash
node docs/patches/0.1.5/remove-obsolete-files.mjs
```

6. GitHub Desktop의 Changes에서 새 배포 워크플로와 삭제 1건을 확인합니다.
7. 커밋 후 `main`에 Push합니다.
8. GitHub `Settings → Pages → Source`를 **GitHub Actions**로 지정합니다.
9. Actions의 `Deploy SoriON to GitHub Pages` 성공을 확인합니다.

## 삭제 파일

- `src/components/ui/BrandMark.tsx`

삭제 파일은 빌드에 더 이상 사용되지 않지만 저장소를 전체본과 동일하게 유지하려면 정리해야 합니다.

## 핵심 변경

- 0.1.3 브랜드 마스트헤드 반영
- 0.1.4 전달·인수인계 영구 규칙 반영
- 0.1.5 GitHub Pages build/deploy 워크플로 반영
- `/AI-/` Vite base 및 PWA 경로 수정
- 이전 서비스워커 캐시 교체 설정
