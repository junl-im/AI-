# SoriON AI 0.9.2 CI Hotfix 2

기준 버전: `0.9.2 CI Hotfix`

이 패치는 이전 버전에서 남은 `public/sorion-icon.svg` 때문에
`npm run quality:rules`가 실패하는 문제를 해결합니다.

## Windows 적용

1. 패치 ZIP을 저장소 루트에 덮어씁니다.
2. `docs/patches/0.9.2-ci-hotfix-2/APPLY_HOTFIX.cmd`를 실행합니다.
3. GitHub Desktop의 Changes에서 `public/sorion-icon.svg` 삭제가 표시되는지 확인합니다.
4. `npm run quality:rules`가 통과한 뒤 커밋하고 Push합니다.

## macOS / Linux 적용

```sh
sh docs/patches/0.9.2-ci-hotfix-2/APPLY_HOTFIX.sh
```

수동 적용 시 `DELETE_LIST.txt`의 파일을 반드시 삭제해야 합니다.
전체 프로젝트 ZIP에는 해당 SVG가 포함되지 않습니다.
