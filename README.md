# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 장문 AI Voice Platform**

SoriON AI는 대본·오디오북·강의·광고처럼 긴 한국어 원고를 프로젝트 단위로 편집하고,
문장별 음성 블록으로 나누어 순차 제작하는 음성 작업공간입니다. 엔진 연결과 선택은 시스템이
자동 처리하며, 사용자는 원고·목소리·재생 흐름에 집중합니다.

## 현재 상태

- 버전: `0.8.7 Dubbing Studio Workspace`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 Fun-CosyVoice 3 Adapter
- 기본 제작: 최대 20,000자 장문 원고 → 세로형 문장 음성 블록
- 편집 IA: 프로젝트 제목·저장 상태 → 화자/읽기 설정 → 원고 → 블록 → 고정 플레이어
- 엔진 운영: `engine_id=auto`, fallback과 circuit breaker
- 로컬 대체: Windows·macOS·eSpeak 시스템 한국어 음성
- 세션: IndexedDB 자동 저장, localStorage·memory fallback
- 결과 복구: SQLite job ID 기반 recover-first
- 프로젝트: 목록에서 원고·옵션·타임라인·완료 결과 복원

## 0.8.7 핵심

### 모바일 더빙 스튜디오

- 프로젝트 제목과 자동 저장 시각을 제작 화면 상단에 고정
- 화자 선택, 미리듣기와 속도·피치·감정 설정을 전용 Bottom Sheet로 분리
- 문장마다 직접 수정·생성·재생·분할·순서 이동·삭제 가능한 세로형 대사 블록
- 새 대사와 쉼 블록을 화면 하단의 빠른 추가 동작으로 삽입
- 하단 전체 폭 플레이어에서 진행률, 이전·재생·다음과 현재 트랙을 항상 확인
- 완성된 현재 음원 다운로드, 프로젝트 목록·복제·품질·설정 이동을 상단 메뉴에 통합
- 작업 전체 초기화는 앱 디자인과 같은 확인창을 거쳐 실행

### 장문·세션·엔진 연계 유지

- 전체 원고를 한 번에 문장 블록으로 나누는 장문 제작 흐름 유지
- 편집 중 원고·화자·설정·타임라인·job ID 자동 저장 및 재시작 복원
- 블록 revision으로 오래된 음성 결과가 최신 문장을 덮어쓰지 않도록 차단
- GitHub Pages를 Voice API로 오인하지 않으며 공개 API 주소는 배포 변수로 주입
- 사용자에게 API 주소나 엔진 수동 연결 화면을 노출하지 않음

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
저장소 `Settings → Secrets and variables → Actions → Variables`에서 다음 값을 설정합니다.

```text
SORION_PUBLIC_API_BASE_URL=https://voice-api.example.com
```

URL이 없으면 앱은 Pages 주소를 잘못 호출하지 않고 공개 음성 서버 배포 대기 상태에서 자동
재검사합니다. 이 운영 값은 사용자 화면에 노출되지 않습니다.

## 주요 문서

- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 시작 안내: [`START_HERE.md`](START_HERE.md)
- 더빙 스튜디오 UX: [`docs/DUBBING_STUDIO_UX.md`](docs/DUBBING_STUDIO_UX.md)
- 장문 작업공간: [`docs/LONGFORM_VOICE_WORKSPACE.md`](docs/LONGFORM_VOICE_WORKSPACE.md)
- 세션 복원: [`docs/WORKSPACE_SESSION.md`](docs/WORKSPACE_SESSION.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 전달 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## 개발 원칙

- 장문 원고와 문장 블록 편집이 기본 흐름이며 채팅형 입력으로 되돌리지 않습니다.
- 모바일·한국어를 먼저 완성하고 PC는 정밀 편집 확장으로 사용합니다.
- 실제 AI, Local/System, Mock, Browser Demo를 명확히 구분합니다.
- 연결 실패나 모델 미설치를 성공으로 가장하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 사용자에게 API 주소·엔진 수동 연결을 요구하지 않습니다.
- 음성 원본은 명시적 동의 없이 외부로 전송하지 않습니다.
