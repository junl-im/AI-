# SoriON AI 0.8.0 → 0.8.1 패치

## 목적

모바일 환경에서 API·실제 TTS·CosyVoice Worker·GPU/모델 상태를 분리하고, 네트워크
전환과 PWA 복귀 후 자동 재검사하며, 음성 생성 응답이 끊겨도 동일 job ID로 결과를
복구하도록 연결 계층을 강화합니다.

## 적용 조건

현재 저장소의 `package.json` 버전이 정확히 `0.8.0`일 때만 적용합니다.

## 적용 방법

1. 현재 변경사항을 커밋하거나 별도 백업합니다.
2. `.git` 폴더는 유지합니다.
3. 패치 ZIP을 저장소 최상위에 압축 해제합니다.
4. 같은 이름의 파일을 전부 덮어씁니다.
5. `DELETE_LIST.txt`를 확인합니다. 이번 패치의 삭제 대상은 없습니다.
6. `package.json` 버전이 `0.8.1`인지 확인합니다.
7. 아래 품질 검사를 실행합니다.
8. 기능 브랜치에서 커밋하고 GitHub Actions를 확인합니다.

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
npm run test:worker
```

## 모바일 연결 확인

- 휴대폰의 localhost가 아니라 PC LAN IP 또는 공개 HTTPS API를 입력합니다.
- HTTP 개발 Web과 HTTP LAN API를 함께 사용하거나, 공개 환경은 HTTPS API를 사용합니다.
- 연결 바텀시트에서 API·TTS·Worker·GPU 네 상태를 확인합니다.
- Wi-Fi 전환과 PWA 복귀 뒤 자동 재검사를 확인합니다.
- TTS 생성 중 응답이 끊겨도 같은 job의 완료 결과가 복구되는지 확인합니다.

## 환경 변수

개발 LAN Private Network preflight를 허용하려면:

```env
SORION_ALLOW_PRIVATE_NETWORK=true
```

공개 운영에서는 HTTPS, 제한된 CORS Origin, 사용자 인증과 방화벽을 함께 적용합니다.

## 권장 브랜치와 커밋

```text
fix/mobile-engine-api-reliability
```

```text
fix: harden mobile engine and API recovery
```
