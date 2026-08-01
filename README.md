# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 장문 AI Voice Platform**

SoriON AI는 대본·오디오북·강의·광고 원고처럼 긴 한국어 문서를 붙여 넣고,
문장별 음성 블록으로 나누어 순차 제작하는 음성 작업공간입니다. 첫 화면은 단순하게,
실제 편집은 CapCut형 타임라인으로 제공하며 엔진 연결과 선택은 시스템이 자동 처리합니다.

## 현재 상태

- 버전: `0.8.6 Longform Voice Studio & Session Persistence`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 Fun-CosyVoice 3 Adapter
- 기본 제작: 최대 20,000자 장문 원고 → 문장별 음성 타임라인
- 엔진 운영: `engine_id=auto`, fallback과 circuit breaker
- 로컬 대체: Windows·macOS·eSpeak 시스템 한국어 음성
- 세션: IndexedDB 자동 저장, localStorage·memory fallback
- 결과 복구: SQLite job ID 기반 recover-first
- 프로젝트: 목록에서 원고·옵션·타임라인·완료 결과 복원
- 재생: 첫 완성 블록부터 Linked Player Dock에 연결

## 0.8.6 핵심

### 장문 중심 제작 화면

- 채팅형 입력을 제거하고 원고 편집기를 중심으로 재설계
- 일반 Enter는 줄바꿈, `Ctrl/⌘+Enter`는 제작 시작
- 문자 수, 문단 수, 예상 음성 블록 수와 예상 길이 표시
- 원고는 생성 후에도 유지하고 문장별 타임라인만 새로 구성
- 서버가 늦게 연결되면 눌러 둔 제작 요청을 연결 복구 뒤 자동 재개

### 브랜드·이동·종료 UX

- 제공된 SoriON 메인 아이콘을 favicon, PWA, 첫 화면과 상단 브랜드에 통일
- 모든 작업 화면의 상단 아이콘·이름을 누르면 첫 페이지로 이동
- 첫 브라우저 뒤로가기는 앱 내부 종료 확인창 표시
- 확인창이 열린 상태에서 뒤로가기를 한 번 더 누르면 즉시 이탈
- 첫 페이지에는 Dock을 렌더링하지 않고 작업공간 진입 뒤에만 표시

### 자동 Voice API 연결

- GitHub Pages 주소 자체와 `:8443`을 Voice API로 잘못 탐색하지 않음
- 공개 배포는 저장소 Actions 변수 `SORION_PUBLIC_API_BASE_URL`을 빌드에 자동 주입
- 사용자에게 API 주소 입력이나 엔진 선택 UI를 제공하지 않음
- API·TTS·Worker·GPU 상태를 분리하고 `/connectivity`와 `/engines`가 같은 추천 엔진을 표시

### 모바일 작업공간 복원

- 전송 전 장문 원고, 보이스, 읽기 옵션, 타임라인과 job ID 자동 저장
- 앱 종료·새로고침·화면 잠금 뒤 마지막 작업공간 복원
- 세션 revision과 블록 revision으로 오래된 저장·생성 결과 차단
- Object URL과 Player track ID는 저장하지 않고 서버 결과로 재구성

## 개발 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
```

다른 터미널에서:

```bash
npm run dev
```

기본 주소: Web `127.0.0.1:5173`, API `127.0.0.1:8000`, Worker `127.0.0.1:9000`.

## 공개 배포에서 반드시 필요한 것

GitHub Pages는 정적 Web만 제공하므로 Python Voice API를 별도 HTTPS 서버에 배포해야 합니다.
저장소 `Settings → Secrets and variables → Actions → Variables`에서 다음 값을 한 번 설정합니다.

```text
SORION_PUBLIC_API_BASE_URL=https://voice-api.example.com
```

이 설정은 운영자 배포 설정이며 사용자 화면에는 노출되지 않습니다. URL이 없으면 앱은 Pages
주소를 잘못 호출하지 않고 “공개 음성 서버 배포 대기” 상태에서 자동 재검사합니다.

## 주요 문서

- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 시작 안내: [`START_HERE.md`](START_HERE.md)
- 장문 작업공간: [`docs/LONGFORM_VOICE_WORKSPACE.md`](docs/LONGFORM_VOICE_WORKSPACE.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- 세션 복원: [`docs/WORKSPACE_SESSION.md`](docs/WORKSPACE_SESSION.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- GitHub Pages: [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md)
- 전달 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## 개발 원칙

- 장문 원고 제작이 기본 흐름이며 채팅형 입력으로 되돌리지 않습니다.
- 모바일·한국어를 먼저 완성하고 PC는 정밀 편집 확장으로 사용합니다.
- 실제 AI, Local/System, Mock, Browser Demo를 명확히 구분합니다.
- 연결 실패나 모델 미설치를 성공으로 가장하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 사용자에게 API 주소·엔진 수동 연결을 요구하지 않습니다.
- 음성 원본은 명시적 동의 없이 외부로 전송하지 않습니다.
