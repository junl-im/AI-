# SoriON AI 0.9.3-beta.1 누적 패치

기준 버전: `0.9.3-alpha.2`
목표 버전: `0.9.3-beta.1 Device Verification, STT Measurement & Final Export`

이 패치는 alpha.3 lock 안정화와 beta.1 기능을 함께 포함한다. ZIP 덮어쓰기만으로 기존 파일은
삭제되지 않으므로 저장소 루트에서 반드시 다음 적용 스크립트를 실행한다. 적용기는 기존
package-lock의 의존성 그래프가 같은 경우에만 루트 버전 메타데이터를 beta.1로 동기화한다.

Windows:

```text
APPLY_PATCH.cmd
```

macOS·Linux:

```bash
chmod +x APPLY_PATCH.sh
./APPLY_PATCH.sh
```

적용 뒤 `git status`에 `public/sorion-icon.svg`가 삭제로 표시되는지 확인하고 `git add -A`로
삭제까지 커밋한다. 이후 lock 파일을 준비하고 Web·API·Worker CI를 실행한다.
