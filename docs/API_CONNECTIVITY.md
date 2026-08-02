# API 자동 연결

현재 기준 버전: `0.9.3-beta.3 Engine Heartbeat 3`

## 사용자 원칙

사용자는 API 주소나 엔진을 입력하지 않는다. Web은 실행 환경을 보고 자동 연결하며 실패하면
Browser Speech로 전환한다.

## 후보 순서

1. 빌드 또는 런타임 설정에 주입된 무료 자체 호스팅 API
2. 마지막 정상 API와 최근 성공 이력
3. 로컬 개발 same-origin proxy
4. 데스크톱 정적 Web의 `127.0.0.1:8000`, `localhost:8000`
5. 모바일 정적 Web의 Browser Speech

## 정적 호스트 보호

다음 호스트는 정적 Web으로 간주해 자체 `/api`와 `:8443`을 검사하지 않는다.

- `*.github.io`
- `*.web.app`
- `*.firebaseapp.com`

데스크톱에서는 localhost 무료 런타임만 자동 검사합니다. 모바일에서는 localhost가 사용자 PC를
가리키지 않으므로 검사하지 않습니다.

## 무료 로컬 실행

```bash
npm run dev:free
```

이 명령은 Web과 FastAPI를 함께 시작합니다. CosyVoice 모델이 준비된 경우 `--worker` 옵션으로
Worker를 추가합니다. 연결 성공 주소는 브라우저 저장소에 기록하고 다음 실행에서 먼저 확인합니다.

## 장애 전환

- 현재 API 실패 시 같은 주소만 무한 재시도하지 않음
- 실패 주소를 제외하고 다음 후보 탐색
- 온라인 복귀·네트워크 변경·PWA 복귀 시 재탐색
- TTS 요청은 사용자 내용과 job ID를 유지
- 서버가 없으면 Browser Speech로 즉시 재생 가능 상태 유지
- 카카오톡 모바일 WebView는 PC localhost를 가리키지 않으므로 로컬 엔진 후보에서 제외하고 외부 브라우저·공개 HTTPS API를 안내
- 외부 브라우저 열기 버튼은 사용자 클릭으로 실행하고 주소 복사와 수동 열기 안내를 함께 제공

## Engine Doctor

설정 화면의 Engine Doctor는 저장된 Voice API 주소로 `/health`, `/connectivity`, `/setup`,
`/engines`, 목소리 복제 capability를 검사합니다. API·TTS·Worker·GPU를 분리 표시하고
`voice-presets`의 3개 기준 WAV 준비 개수도 보여 줍니다. 주소 저장·즉시 재진단·자동 연결
복구를 제공하며 복사되는 진단 JSON에는 개인 음원과 로컬 파일 경로를 넣지 않습니다.

`START_ENGINE.cmd`는 별도 환경변수가 없으면 프로젝트 루트의 `voice-presets` 폴더를
`SORION_COSYVOICE_PRESET_DIRECTORY`로 자동 연결합니다.

## Private Network Access

데스크톱 정적 Web이 로컬 API를 호출할 때 브라우저가 private-network preflight를 보낼 수 있습니다.
FastAPI의 `PrivateNetworkCORSMiddleware`가 허용 Origin과 헤더를 검증한 뒤 응답합니다.
