# SoriON AI 0.9.3-beta.3 Engine Heartbeat 5 Patch

기준: `0.9.3-beta.3 · Engine Heartbeat 4`

이 패치는 모바일 공개 HTTPS Voice API Bridge 진단, CosyVoice 프리셋 WAV 사전검증,
첫 서버 음성 파일 준비 시간, PC 3단 패널의 조절·접기·로컬 저장을 추가합니다.

## 적용

1. Engine Heartbeat 4 저장소의 미커밋 변경을 백업하거나 커밋합니다.
2. 패치 ZIP을 저장소 루트에 바로 압축 해제해 덮어씁니다.
3. Windows는 `APPLY_PATCH.cmd`, macOS·Linux는 `./APPLY_PATCH.sh`를 실행합니다.
4. GitHub Desktop에서 변경 파일과 누적 삭제 대상 `public/sorion-icon.svg`를 확인합니다.
5. Web 전체 품질은 검증된 npm lock과 의존성이 있는 CI에서 확인한 뒤 Commit·Push합니다.

## 검증 결과

- Repository preflight 11/11
- API pytest 127개
- Worker pytest 14개
- Python compileall
- TypeScript·TSX 156개 transpile 구문 검사

## 주의

- `first_audio_ms`는 실제 스피커 출력이 아니라 서버의 첫 사용 가능 파일 준비 시간입니다.
- Browser Speech 실제 `onstart`는 아직 측정하지 않으므로 0ms로 표시하지 않습니다.
- 공개 Bridge의 forwarded header는 진단 전용이며 인증에 사용하지 않습니다.
- 실제 partial-ready 음원 전달과 재생은 Engine Heartbeat 6 범위입니다.
- 추적 파일 삭제는 없으며 `DELETE_LIST.txt`는 누적 영구 삭제 파일만 유지합니다.
