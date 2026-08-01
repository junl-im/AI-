# Korean TTS Production Readiness

현재 기준 버전: `0.8.6`

## 목적

SoriON Web은 정적 배포와 Python 음성 시스템을 분리한다. 사용자는 API 주소나 엔진을
직접 연결하지 않으며, 앱 bootstrap이 배포 설정과 안전 후보를 자동 확인하고 준비된 실제
엔진을 선택한다. Mock·시스템 음성·실제 AI 상태는 계속 구분한다.

## 자동 연결 배포

1. 로컬 Vite 개발은 `/api` proxy 또는 현재 호스트의 API 후보를 사용한다.
2. GitHub Pages 등 정적 HTTPS 배포는 빌드 시 `VITE_API_BASE_URL`에 HTTPS API를 주입한다.
3. same-origin 운영은 reverse proxy에서 `/api/v1`을 FastAPI로 전달한다.
4. 앱은 same-origin, 환경변수, 마지막 성공 주소와 안전 후보를 순서대로 검사한다.
5. 사용자가 주소를 입력하거나 저장하는 설정 화면은 제공하지 않는다.

비밀키와 Worker 인증 정보는 Web에 저장하지 않고 API·Worker 배포 Secret으로만 주입한다.

## 작업 진행률과 결과 복구

`POST /api/v1/tts/synthesize`는 job ID를 사용한다. Web은 같은 `job_id`로 상태와 결과를
조회하며 SQLite JobStore 덕분에 API 재시작 뒤에도 복구할 수 있다.

진행 단계:

- `queued`
- `normalizing`
- `generating`
- `merging`
- `completed`
- `cancelled`
- `failed`

프로젝트 불러오기는 저장 job ID의 `/result`를 먼저 조회한다. 결과가 만료됐을 때 같은 POST를
자동 재전송하지 않으며 해당 블록에 재생성 안내를 남긴다.

## 첫 화면과 작업공간

- 브랜드 랜딩에는 Dock과 메뉴를 렌더링하지 않는다.
- 만들기 또는 프로젝트 불러오기로 작업공간에 진입한 뒤 메뉴 Dock을 표시한다.
- 첫 ready 음성이 생성·복구되면 Player가 메뉴 위에 나타난다.

## 품질 평가 보존

별점과 메모는 브라우저 IndexedDB의 `qualityReviews` 저장소에 보관한다. 평가 문장과
엔진 ID 조합별로 최신 평가를 갱신하며 JSON·CSV로 내보낼 수 있다.

## 현재 한계

- 모델 설치와 GPU provisioning은 자동화하지 않는다.
- 공개 사용자 인증과 access token은 아직 구현되지 않았다.
- MP3·FLAC 변환과 편집 순서를 반영한 최종 WAV Export는 미완료다.
- 공개 HTTPS Voice API와 GPU 모델 배포는 저장소 코드와 별도로 필요하다.

## 0.8.5 추가 게이트

- 일반 합성은 Web에서 `auto` 요청을 사용하고 실제 엔진은 서버가 결정한다.
- fallback 시 실제 시도 순서와 최종 엔진을 운영 로그·응답에서 추적할 수 있어야 한다.
- 반복 실패 엔진은 cooldown 동안 자동 제외되고 준비 엔진이 없으면 503을 명확히 반환한다.
- 메뉴 이동으로 현재 만들기 세션이 사라지면 배포를 차단한다.
- 품질·프로젝트·설정의 공통 헤더와 색상 대비가 모바일 360px에서도 유지돼야 한다.

## 0.8.6 추가 게이트

- IndexedDB schema upgrade 3→4 후 기존 프로젝트·품질·보이스 프로필 보존
- iOS private mode IndexedDB 거부 시 localStorage fallback
- pagehide·화면 잠금 뒤 마지막 입력과 job ID 보존
- 오래된 generation response의 revision mismatch 폐기
- 세션 45일 만료와 잘못된 schema record 안전 무시

## 0.8.6 장문·공개 연결 게이트

- GitHub Pages에서 github.io same-origin 또는 8443을 API 후보로 만들지 않는다.
- main build는 `SORION_PUBLIC_API_BASE_URL`을 `VITE_API_BASE_URL`로 주입한다.
- 공개 API 변수가 없으면 실제 음성 준비로 표시하지 않는다.
- 장문 원고 생성 뒤 원문을 유지하고 첫 ready 블록부터 재생한다.
- 상단 브랜드는 모든 작업 화면에서 첫 페이지로 이동한다.
- 첫 뒤로가기 확인과 두 번째 뒤로가기 이탈을 모바일 실기기에서 검사한다.
- `/connectivity`와 `/engines` 추천 엔진 상태가 일치해야 한다.
