# HANDOVER

## 2026-07-31 10:54 KST — Foundation 시작

### 작업 내용

- 기존 프로젝트를 전면 폐기하고 `SoriON AI`를 새 코드베이스로 생성했다.
- 웹과 AI API를 루트 웹앱과 `services/api`로 분리했다.
- 모바일 홈, 프로젝트, 설정 화면을 만들었다.
- Mock TTS 엔진으로 웹–API 계약을 검증할 수 있게 했다.
- 음성 생성 요청 후 프로젝트 메타데이터를 IndexedDB에 저장하도록 했다.
- Firebase는 환경 변수가 있을 때만 초기화되도록 구성했다.
- PWA Manifest와 PNG 아이콘 구조를 추가했다.
- CI, Git 규칙, 500줄 제한과 SVG 금지 검사를 추가했다.

### 작업 이유

기존 코드의 전역 결합과 누적 패치 문제를 이어받지 않고, 실제 AI 엔진을 안전하게 교체할 수 있는 확장 기반을 먼저 만들기 위해서다.

### 영향 범위

- 신규 저장소 전체
- 아직 운영 데이터와 외부 서비스에는 영향 없음
- Mock 엔진은 음원 파일을 만들지 않음

### 검증 결과

- FastAPI 테스트 통과
- 프로젝트 규칙 검사 통과
- 프런트엔드 소스와 설정 생성 완료
- 작업 환경의 npm 레지스트리 제한으로 의존성 설치와 Vite 빌드는 현 환경에서 실행하지 못함

### 다음 작업

1. 개발 PC에서 `npm install` 후 프런트엔드 품질 검사
2. Firebase 개발 프로젝트 연결
3. `feature/tts-engine-kokoro`에서 첫 실제 TTS 어댑터 구현
4. WAV 플레이어와 다운로드 구현

### 주의사항

- `MockTtsEngine`의 응답을 실제 음성 생성 완료로 표시하지 않는다.
- 음성 복제 기능을 추가할 때 동의 증빙과 삭제 정책을 먼저 설계한다.
- 모델 파일과 사용자 음성 파일은 Git에 커밋하지 않는다.

## 2026-07-31 11:25 KST - 0.1.1 구조 수정

- 변경: `apps/web` 아래에 있던 웹앱을 저장소 루트로 이동했다.
- 이유: 첫 전달본에서 `index.html` 위치가 직관적이지 않았고 사용자가 누락으로 인식할 수 있었다.
- 영향: 이제 압축 해제 후 루트의 `index.html`과 `src/`를 바로 확인할 수 있다.
- 실행: 루트에서 `npm install` 후 `npm run dev`를 사용한다.
- 배포: Firebase Hosting은 루트 빌드 결과인 `dist/`만 배포한다.

## 2026-07-31 11:38 KST - GitHub Actions 트리거 수정

- 변경: `.github/workflows/ci.yml`에 `workflow_dispatch`와 전체 브랜치 `push` 트리거를 추가했다.
- 이유: 초기 커밋이 `main` 또는 기존 브랜치에 push될 때 CI가 실행되지 않아 Actions의 All workflows가 비어 보였다.
- 영향: 앞으로 어떤 브랜치에 push해도 CI 실행 기록이 생성된다. PR 검사는 `main`, `develop` 대상으로 유지한다.
- 추가: package-lock이 없는 상태에서 npm 캐시 탐색이 실패할 수 있어 초기 단계에서는 cache 옵션을 제거했다.

## 2026-07-31 11:45 KST - 0.1.3 브랜드 상단 계승

### 변경 내용

- 기존 프로젝트의 코드와 기능은 가져오지 않고 상단 디자인의 시각 문법만 새 React 컴포넌트로 다시 작성했다.
- 상단 왼쪽에 `BUILD v0.1.3`, `모바일 · PC 호환`을 배치했다.
- 상단 오른쪽에 `DESIGNED BY 곰같은여우`를 배치했다.
- 대문 공식 명칭을 `곰같은여우 SoriON AI`로 적용했다.
- 모바일에서는 브랜드와 4단계 흐름만 간결하게 표시하고, 760px 이상에서는 Voice Core 장식 패널을 추가한다.

### 변경 이유

기존 프로젝트의 인지 자산인 빌드 정보, 호환성 표시, 제작자 서명을 계승하면서도 새로운 음성 플랫폼의 독립적인 브랜드를 만들기 위해서다.

### 영향 범위

- 앱 공통 레이아웃
- 홈 첫 화면 문구
- 브라우저 제목과 PWA Manifest
- 브랜드 렌더링 테스트

### 주의사항

- 기존 프로젝트의 CSS, 이미지, 스크립트는 복사하지 않았다.
- 장식 패널은 CSS로만 만들었으며 SVG 금지 원칙을 유지했다.
- 실제 엔진 상태를 의미하지 않도록 Voice Core 패널은 `aria-hidden` 장식 요소로 처리했다.

## 2026-07-31 11:51 KST - 0.1.4 전달·인수인계 절대 규칙 확정

### 대상 버전과 기준 버전

- 기준 버전: `0.1.3`
- 대상 버전: `0.1.4`

### 변경 내용

- 모든 최종 결과를 `1. 결과`, `2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP`, `3. 다음 예상 업데이트 내역` 순서로 전달하도록 영구 규칙을 추가했다.
- 루트에 `DELIVERY_RULES.md`를 추가했다.
- 다음 개발 계획을 지속적으로 보존하는 `docs/NEXT_UPDATE.md`를 추가했다.
- 프로젝트 규칙 검사에서 전달 규칙 문서, 현재 버전의 HANDOVER·CHANGELOG, 다음 업데이트 문서를 확인하도록 강화했다.
- Pull Request와 Release 문서에 인수인계·전체 ZIP·패치 ZIP 확인 항목을 추가했다.

### 변경 이유

결과 파일의 누락, 구조 혼동, 다음 대화에서의 작업 단절을 방지하고 사용자가 항상 전체본과 안전한 덮어쓰기 패치를 함께 받을 수 있게 하기 위해서다.

### 영향 범위

- 결과 전달 형식
- 릴리스 산출물
- 인수인계 문서
- 프로젝트 자동 규칙 검사
- Pull Request 검토 절차

### 변경·추가된 주요 파일

- `DELIVERY_RULES.md`
- `docs/NEXT_UPDATE.md`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/RELEASE.md`
- `docs/CODING_RULE.md`
- `.github/pull_request_template.md`
- `scripts/check-project-rules.mjs`
- 버전 표시 및 API 버전 파일

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 통과
- 전체 ZIP에 `.git`, `node_modules`, `dist`가 포함되지 않음을 확인
- 패치 ZIP이 저장소 루트 기준 경로로 구성됐음을 확인

### 알려진 제한과 주의사항

- 패치 ZIP은 `0.1.3`을 기준으로 한다. 더 오래된 버전에는 전체 통파일 사용을 권장한다.
- 로컬에서 수정 중인 파일이 있으면 패치 적용 전에 커밋하거나 백업해야 한다.
- npm 의존성 설치와 프런트 빌드는 기존과 동일하게 일반 개발 PC에서 추가 확인이 필요하다.

### 생성 산출물

- 전체: `SoriON-AI-0.1.4-full.zip`
- 패치: `SoriON-AI-0.1.3-to-0.1.4-patch.zip`
- 체크섬: `SoriON-AI-0.1.4-artifacts.sha256`

### 다음 예상 업데이트

`0.2.0 Mobile Voice Workspace`에서 모바일 텍스트 입력, 한국어 음성 프리셋, 생성 상태, 오디오 플레이어 셸, WAV 다운로드 흐름을 구축한다.

## 2026-07-31 12:00 KST - 0.1.5 GitHub Pages 배포 복구

### 대상 버전과 기준 버전

- 실제 GitHub 기준 버전: `0.1.2`
- 전체 프로젝트 기준 버전: `0.1.4`
- 대상 버전: `0.1.5`

### 변경 내용

- `main` Push에서 Vite 앱을 빌드하고 `dist/`를 GitHub Pages에 배포하는 전용 워크플로를 추가했다.
- 저장소명 `AI-`에 맞춰 배포 base를 `/AI-/`로 설정했다.
- PWA Manifest, 아이콘, Service Worker 탐색 fallback을 프로젝트 하위 경로에 맞췄다.
- 이전 PWA 캐시를 정리하고 새 서비스워커가 즉시 활성화되도록 설정했다.
- GitHub Pages 게시 소스를 `GitHub Actions`로 선택하는 최초 1회 절차를 문서화했다.

### 변경 이유

새 SoriON 소스와 CI는 GitHub에 반영됐지만 Pages 배포 작업이 없어 마지막 성공 배포본인 AI 쇼츠 스튜디오가 계속 서비스되고 있었다. `.git` 폴더는 원인이 아니며, 배포 산출물과 프로젝트 하위 경로 설정이 빠진 것이 원인이었다.

### 영향 범위

- GitHub Actions 배포
- Vite production base 경로
- PWA Manifest와 Service Worker
- favicon과 정적 자산 경로
- 릴리스·시작·배포 문서

### 변경·추가된 주요 파일

- `.github/workflows/deploy-pages.yml`
- `vite.config.ts`
- `index.html`
- `docs/GITHUB_PAGES.md`
- `docs/HANDOVER.md`
- `docs/CHANGELOG.md`
- `docs/NEXT_UPDATE.md`
- `docs/RELEASE.md`
- `README.md`
- `START_HERE.md`

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 통과
- YAML 구조와 Pages 필수 권한·아티팩트 경로 검사 통과
- 전체 ZIP과 실제 GitHub `0.1.2` 기준 패치 ZIP 경로 검사 통과
- 실제 GitHub 원격 배포는 사용자의 Push와 Pages Source 설정 후 확인해야 함

### 알려진 제한과 주의사항

- GitHub의 `Settings → Pages → Source`가 반드시 `GitHub Actions`여야 한다.
- 배포 성공 후 특정 기기에서만 이전 화면이 남으면 기존 서비스워커 사이트 데이터를 한 번 삭제해야 한다.
- 저장소명을 변경하면 워크플로의 `VITE_BASE_PATH`도 함께 변경해야 한다.
- GitHub 원격에는 현재 `0.1.2`까지만 확인되어 패치는 `0.1.2 → 0.1.5` 기준으로 제작한다.

### 생성 산출물

- 전체: `SoriON-AI-0.1.5-full.zip`
- 패치: `SoriON-AI-0.1.2-to-0.1.5-pages-fix-patch.zip`
- 체크섬: `SoriON-AI-0.1.5-artifacts.sha256`

### 다음 예상 업데이트

GitHub Pages 실제 배포 성공과 모바일 캐시 교체를 확인한 뒤 `0.2.0 Mobile Voice Workspace` 개발로 진행한다.


## 2026-07-31 12:38 KST - 0.2.0 Mobile Voice Workspace

### 대상 버전과 기준 버전

- 기준 버전: `0.1.5`
- 대상 버전: `0.2.0`

### 변경 내용

- 모바일에서 문장 입력, 한국어 음성 선택, 감정 선택, 생성, 재생, WAV 다운로드까지 이어지는 첫 Voice Workspace를 구현했다.
- `소리`, `온`, `담` 음성 프리셋을 선택 카드로 분리했다.
- 속도와 피치는 Advanced 영역에 숨겨 기본 사용자의 클릭 수를 줄였다.
- 생성 단계를 준비, API 요청, 데모 렌더링, 완료, 실패로 구분했다.
- API가 실제 `audio_url`을 반환하면 해당 음원을 사용하고, Mock 또는 API 미연결이면 브라우저 데모 WAV를 생성하도록 했다.
- 데모 음원은 실제 TTS로 오인하지 않도록 `DEMO WAV`, `browser-demo`, `MOCK` 표시를 유지한다.
- 생성 결과의 재생, WAV 다운로드, 동일 설정 재시도, 결과 닫기를 구현했다.
- 프로젝트 메타데이터에 `engineId`, `audioSource`, `outputFormat`을 추가했다.

### 변경 이유

Foundation 단계의 연결 확인 화면을 실제 모바일 사용 흐름으로 발전시키고, 실제 TTS 엔진을 연결하기 전에 UI, 상태, 플레이어, 다운로드, 저장 계약을 먼저 안정화하기 위해서다.

### 영향 범위

- 홈 Voice Workspace 전체
- TTS 요청과 결과 상태 관리
- 브라우저 Object URL 관리
- 프로젝트 저장 스키마의 선택 필드
- 설정·프로젝트 상태 표현
- API Mock 메시지와 버전
- UI, API, Architecture, Test 문서

### 변경·추가된 주요 파일

- `src/pages/HomePage.tsx`
- `src/components/voice/*`
- `src/hooks/useVoiceGeneration.ts`
- `src/tts/voicePresets.ts`
- `src/tts/mockWave.ts`
- `src/tts/audioFile.ts`
- `src/tts/generationTypes.ts`
- `src/projects/projectTypes.ts`
- `src/pages/ProjectsPage.tsx`
- `src/pages/SettingsPage.tsx`
- `services/api/app/engines/mock_tts.py`
- 관련 테스트와 문서

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 3개 통과
- Python 문법 검사 통과
- TypeScript·TSX 구문 변환 검사 통과
- 임시 외부 모듈 스텁을 사용한 내부 TypeScript strict 검사 통과
- WAV 생성 로직의 RIFF/WAVE/data 구조와 파일명 런타임 검사 통과
- 전체 및 패치 ZIP에 `.git`, `node_modules`, `dist`, 캐시, SVG가 없는지 검사
- 0.1.5에 패치를 적용한 124개 파일과 전체 0.2.0 프로젝트가 일치함을 확인

### 알려진 제한과 주의사항

- 브라우저 데모 WAV는 실제 사람 음성이 아닌 짧은 합성 톤이다.
- API 미연결을 오류 화면으로 막지 않고 데모로 전환하므로 실제 AI 여부 표시는 절대 제거하지 않는다.
- 생성한 오디오 Blob 자체는 IndexedDB에 저장하지 않는다. 새로 열면 프로젝트 메타데이터만 남는다.
- 현재 환경의 내부 npm 저장소에 `@tailwindcss/vite`가 없어 npm 설치, Vitest, TypeScript 전체 검사, Vite build를 실행하지 못했다.
- 실제 모바일 자동 재생은 사용하지 않으며 사용자가 플레이 버튼을 눌러야 한다.

### 생성 산출물

- 전체: `SoriON-AI-0.2.0-full.zip`
- 패치: `SoriON-AI-0.1.5-to-0.2.0-patch.zip`
- 체크섬: `SoriON-AI-0.2.0-artifacts.sha256`

### 다음 예상 업데이트

`0.3.0 Korean TTS Engine Pilot`에서 한국어 품질, 라이선스, CPU·GPU 실행 비용을 비교한 뒤 첫 실제 TTS 엔진 어댑터를 연결한다.

## 2026-07-31 13:15 KST - 0.3.0 Korean TTS Engine Pilot

### 대상 버전과 기준 버전

- 기준 버전: `0.2.0`
- 대상 버전: `0.3.0`

### 변경 내용

- MeloTTS가 설치된 환경에서 한국어 AI WAV를 생성하는 지연 로딩 어댑터를 추가했다.
- Windows System.Speech, macOS `say`, Linux eSpeak를 탐지하는 Local TTS 어댑터를 추가했다.
- 실제 AI가 준비되지 않으면 Local TTS, 그다음 Mock 순서로 자동 선택한다.
- 엔진 목록에 `ai`, `local`, `mock`, 준비 여부, 실패 이유를 공개한다.
- 클라이언트가 만든 UUID로 작업을 추적하고 생성 중 취소할 수 있게 했다.
- 동시 생성 수, 제한 시간, 중복 작업 ID를 관리하는 JobManager를 추가했다.
- 생성 WAV를 UUID 이름으로 임시 보관하고 기본 30분 뒤 정리한다.
- 음원 제공 라우트에 경로 이동 차단과 no-store 헤더를 적용했다.
- 모바일 워크스페이스에 현재 엔진 표시와 생성 취소 버튼을 추가했다.
- 한국어 숫자, 날짜, 단위, 영문, 외래어, 높임말 평가 문장을 추가했다.

### 변경 이유

브라우저 Demo만으로는 실제 음성 품질과 서버 계약을 검증할 수 없었다. 대형 AI 모델 설치를 모든 환경에 강제하지 않으면서도, 설치 가능 환경에서는 MeloTTS를 사용하고 일반 PC에서는 운영체제 한국어 음성으로 실제 WAV 파이프라인을 검증하기 위해서다.

### 영향 범위

- FastAPI 엔진 등록과 생명주기
- TTS 요청·응답 스키마
- 작업 취소와 제한 시간
- 임시 음원 저장 및 제공
- 모바일 생성 상태와 설정 화면
- 엔진·보안·테스트 문서

### 변경·추가된 주요 파일

- `services/api/app/engines/tts/melo_tts.py`
- `services/api/app/engines/tts/system_tts.py`
- `services/api/app/services/job_manager.py`
- `services/api/app/storage/audio_store.py`
- `services/api/app/api/routes/audio.py`
- `src/hooks/useEngineCatalog.ts`
- `src/hooks/useVoiceGeneration.ts`
- `src/components/voice/EngineStatusCard.tsx`
- `src/components/voice/GenerationProgress.tsx`
- `docs/ENGINE_PILOT.md`
- `docs/evaluation/KOREAN_TTS_SENTENCES.json`

### 검증 결과

- FastAPI 테스트 14개 통과
- Linux eSpeak 환경에서 실제 한국어 WAV 생성 확인
- 주입형 가짜 Melo 모델로 AI 어댑터 WAV 계약 확인
- AudioStore 경로 이동 차단과 만료 정리 테스트 통과
- Python 문법 검사 통과
- 프로젝트 500줄·SVG·비밀키 규칙 검사 통과 예정
- 현재 실행 환경의 내부 npm 저장소에 `@tailwindcss/vite`가 없어 npm 설치, Vitest, Vite build는 실행하지 못함

### 알려진 제한과 주의사항

- MeloTTS는 별도 저장소와 모델 설치가 필요하며 현재 ZIP에 포함되지 않는다.
- MeloTTS 한국어 전처리는 운영체제에 따라 MeCab 설치 문제가 발생할 수 있다.
- Local TTS의 음질과 음색은 운영체제에 설치된 음성 패키지에 따라 다르다.
- Local TTS는 실제 음성이지만 AI 엔진으로 표시하지 않는다.
- GitHub Pages는 Python API를 실행하지 않는다.
- 외부 공개 API에서는 현재 임시 파일 라우트에 사용자 인증을 추가해야 한다.

### 생성 산출물

- 전체: `SoriON-AI-0.3.0-full.zip`
- 패치: `SoriON-AI-0.2.0-to-0.3.0-patch.zip`
- 체크섬: `SoriON-AI-0.3.0-artifacts.sha256`

### 다음 예상 업데이트

`0.4.0 Korean Voice Quality Lab`에서 MeloTTS 실제 설치 검증, 한국어 평가 세트 실행, AI·Local TTS A/B 비교, 생성 속도와 품질 기록을 구현한다.

## 2026-07-31 13:22 KST - 0.4.0 Korean Voice Quality Lab

### 대상 버전과 기준 버전

- 기준 버전: `0.3.0`
- 대상 버전: `0.4.0`

### 변경 내용

- 한국어 숫자, 날짜, 시각, 금액, 퍼센트, 단위, 영문 약어 전처리를 추가했다.
- 전처리된 긴 문장을 기본 180자 이하로 나누고 같은 형식의 PCM WAV를 하나로 연결한다.
- 병합 구간 사이에 120ms 무음을 넣고 자식 임시 WAV는 완료 후 즉시 삭제한다.
- TTS 결과에 실제 읽은 문장, 구간 수, 처리 시간, 파일 크기, RTF를 추가했다.
- 엔진 계약에 감정, 속도, 피치 지원 여부를 명시하고 지원하지 않는 UI를 비활성화했다.
- Python, 운영체제, 메모리, MeloTTS 패키지, 모델 로딩, 시스템 음성 상태를 확인하는 진단 API를 추가했다.
- 품질 탭에서 평가 문장 선택, 전처리 미리보기, 최대 두 엔진 A/B 생성, 별점과 메모를 사용할 수 있게 했다.
- 평가 문장을 14종으로 확장했다.

### 변경 이유

실제 한국어 음성 엔진을 연결한 뒤에는 단순히 음원이 생성되는지만으로 품질을 판단할 수 없다. 한국어 특유의 숫자·금액·영문 혼용을 안정적으로 읽게 하고, 긴 문장을 엔진 한도에 맞게 처리하며, 같은 문장으로 AI와 시스템 음성을 반복 비교할 수 있는 기준 도구가 필요했다.

### 영향 범위

- 모든 TTS 요청 전처리
- 긴 문장 생성과 임시 파일 생명주기
- TTS 응답 스키마
- 엔진 기능 계약
- 모바일 하단 탐색과 품질 화면
- 평가 데이터와 API 문서

### 변경·추가된 주요 파일

- `services/api/app/services/text_normalizer.py`
- `services/api/app/services/text_segmenter.py`
- `services/api/app/services/wav_tools.py`
- `services/api/app/services/tts_pipeline.py`
- `services/api/app/services/engine_diagnostics.py`
- `services/api/app/api/routes/quality.py`
- `services/api/app/schemas/quality.py`
- `src/pages/QualityPage.tsx`
- `src/components/evaluation/*`
- `src/quality/*`
- `docs/QUALITY_LAB.md`

### 검증 결과

- FastAPI 테스트 23개 통과
- Python 문법 검사 통과
- 날짜 뒤에 한국어 조사가 붙는 표현의 정규화 회귀 테스트 통과
- 같은 형식의 PCM WAV 병합 및 120ms 무음 검사 통과
- 장문 분할 결과와 자식 임시 WAV 정리 검사 통과
- 품질 진단, 평가 문장, 전처리, Mock 비교 API 검사 통과
- Linux eSpeak 실엔진으로 장문 2구간 생성, 전처리, 최종 WAV 병합 확인
- 외부 모듈 스텁을 사용한 내부 TypeScript strict 검사와 전체 TS/TSX 파서 검사 통과
- 현재 실행 환경의 npm 저장소에 `@tailwindcss/vite`가 없어 정식 npm 설치와 웹 build는 실행하지 못함

### 알려진 제한과 주의사항

- 숫자 전처리는 일반적인 정수·소수 표현을 대상으로 하며 전화번호, 주소, 수식은 별도 규칙이 필요하다.
- WAV 병합은 비압축 PCM 형식과 같은 오디오 파라미터만 허용한다.
- 별점과 청취 메모는 새로고침하면 사라진다.
- 실제 MeloTTS 모델 다운로드 상태와 GPU 메모리는 현재 진단 범위에 포함되지 않는다.
- GitHub Pages는 FastAPI를 실행하지 않으므로 품질 탭의 서버 기능은 로컬 API가 필요하다.

### 생성 산출물

- 전체: `SoriON-AI-0.4.0-full.zip`
- 패치: `SoriON-AI-0.3.0-to-0.4.0-patch.zip`
- 체크섬: `SoriON-AI-0.4.0-artifacts.sha256`

### 다음 예상 업데이트

`0.5.0 Korean TTS Production Readiness`에서 설치 Wizard, 모델 worker, 진행률, 품질 보고서 저장·내보내기, 일괄 평가를 구현한다.

## 2026-07-31 14:18 KST - 0.5.0 Korean TTS Production Readiness

### 대상 버전과 기준 버전

- 기준 버전: `0.4.0`
- 대상 버전: `0.5.0`

### 프로젝트 목표 재확인

SoriON AI의 최종 목표는 웹 음성 실험실이 아니라, Voicebox보다 쉽게 시작하고 ElevenLabs보다 한국인에게 편하며 모바일에서 앱처럼 사용하는 차세대 AI Voice Platform이다. 사용자는 10초 안에 음성 생성·복제·변환을 시작할 수 있어야 한다. 이번 버전은 연구소 기능을 더 늘리는 대신 실제 서비스 연결과 복구 가능성을 우선했다.

### 변경 내용

- 사용자가 로컬·원격 FastAPI 주소를 입력하고 연결 검사 후 이 기기에 저장할 수 있는 3단계 Setup Wizard를 추가했다.
- Python, 임시 음원 폴더 쓰기 권한, 실제 한국어 엔진, FFmpeg, CORS를 확인하는 `/api/v1/setup` API를 추가했다.
- JobManager가 대기, 정규화, 생성, 병합, 완료, 취소, 실패 스냅샷을 유지하도록 확장했다.
- 웹에서 생성 POST와 동시에 작업 상태를 polling해 실제 퍼센트와 장문 구간을 표시한다.
- 프로젝트와 품질 평가가 같은 IndexedDB를 안전하게 공유하도록 데이터베이스 버전을 2로 올렸다.
- 품질 별점과 메모를 문장·엔진 조합별로 저장하고 JSON·CSV로 내보내게 했다.
- API 주소가 바뀌면 엔진 목록을 자동으로 다시 읽도록 앱 이벤트를 추가했다.

### 변경 이유

- GitHub Pages와 로컬 AI API를 연결할 때 환경 변수 수정만 요구하면 모바일 사용자에게 어렵다.
- 장문 생성이 멈춘 것처럼 보이면 속도가 기능이라는 원칙을 지킬 수 없다.
- A/B 평가가 새로고침마다 사라지면 실제 한국어 엔진 선정 근거가 남지 않는다.
- 다음 핵심 기능인 목소리 복제로 이동하기 전에 연결, 진행률, 로컬 데이터 보존 규칙이 필요하다.

### 영향 범위

- 설정 화면과 API 기본 주소
- 모든 엔진 목록 조회와 TTS 요청
- TTS 작업 생명주기와 상태 API
- 홈 생성 진행 UI
- IndexedDB 스키마
- 품질 평가와 보고서 다운로드
- API·데이터베이스·보안·테스트 문서

### 주요 변경 파일

- `services/api/app/services/job_manager.py`
- `services/api/app/services/tts_pipeline.py`
- `services/api/app/api/routes/tts.py`
- `services/api/app/api/routes/setup.py`
- `services/api/app/services/setup_diagnostics.py`
- `src/components/settings/ApiSetupWizard.tsx`
- `src/api/httpClient.ts`
- `src/hooks/useVoiceGeneration.ts`
- `src/components/voice/GenerationProgress.tsx`
- `src/storage/database.ts`
- `src/quality/qualityReviewRepository.ts`
- `src/quality/qualityReport.ts`
- `docs/PRODUCTION_READINESS.md`

### 검증 결과

- FastAPI 테스트 29개 통과
- Python 전체 문법 컴파일 통과
- 임시 외부 모듈 선언을 사용한 TypeScript strict 검사 통과
- 진행률 완료·취소 스냅샷 테스트 통과
- 장문 파이프라인의 정규화·구간 생성·병합 진행 순서 테스트 통과
- Setup 진단 응답과 필수 항목 테스트 통과
- API 주소 정규화와 JSON·CSV 보고서 변환 테스트 추가
- 모든 소스 파일 500줄 이하 확인
- SVG·비밀키·금지 산출물 검사

### 알려진 제한과 주의사항

- 현재 Setup Wizard는 설치 안내와 상태 확인까지만 수행하며 시스템 패키지를 자동 설치하지 않는다.
- 모델 worker 프로세스 분리, 평가 세트 일괄 실행, 실패 구간만 재생성은 이번 범위에서 제외했다.
- API 주소는 localStorage에 저장되므로 비밀키나 인증 토큰을 주소에 포함하면 안 된다.
- 품질 평가에는 사용자가 입력한 문장이 들어가므로 보고서 공유 전 개인 정보를 확인해야 한다.
- 내부 npm 저장소에 `@tailwindcss/vite`가 없어 정식 npm 설치, Vitest, ESLint, Vite production build는 현재 환경에서 실행하지 못했다.

### 생성 산출물

- 전체: `SoriON-AI-0.5.0-full.zip`
- 패치: `SoriON-AI-0.4.0-to-0.5.0-patch.zip`
- 체크섬: `SoriON-AI-0.5.0-artifacts.sha256`

### 다음 예상 업데이트

`0.6.0 Mobile Voice Clone Foundation`에서 모바일 녹음, 샘플 품질 검사, 본인 목소리·권한 동의, 로컬 보관과 삭제, 교체형 VoiceCloneEngine 계약을 구현한다.

## 2026-07-31 14:30 KST - 0.5.1 Compact Brand Banner

### 대상 버전과 기준 버전

- 기준 버전: `0.5.0`
- 대상 버전: `0.5.1`

### 프로젝트 목표 재확인

SoriON AI의 목표는 한국인이 모바일에서 앱처럼 사용하며 10초 안에 음성 생성·복제·변환을 시작하는 차세대 AI Voice Platform이다. 이번 패치는 기능을 늘리는 대신 첫 화면의 높이와 브랜드 전달 방식을 정리해 실제 작업 화면이 더 빨리 보이도록 했다.

### 변경 내용

- 모바일과 PC 상단 마스트헤드의 세로 여백과 Voice Core 높이를 줄였다.
- `곰같은여우 SoriON AI`, `문장을 목소리로.`, `목소리를 새로운 가능성으로.`, `한국어의 감정까지 자연스럽게.`를 한 배너 공간에서 순차적으로 페이드한다.
- `SoriON AI`의 마지막 `I`를 CSS 마이크로 표현했다.
- PC Voice Core의 기존 S 오브를 CSS 스튜디오 마이크로 교체했다.
- 마이크 그릴, 요크, 스탠드, 광원과 웨이브 애니메이션을 SVG 없이 구현했다.
- 모션 감소 설정에서는 첫 브랜드 슬라이드만 정적으로 표시한다.
- 대형 마스트헤드 CSS를 별도 파일로 분리해 500줄 제한을 유지했다.

### 변경 이유

- 상단이 너무 높으면 모바일의 핵심 입력 영역이 늦게 나타나 모바일 First 원칙에 어긋난다.
- 고정된 긴 소개 문장보다 짧은 브랜드 메시지가 순환하는 배너가 제품 정체성을 더 빠르게 전달한다.
- 마이크를 로고와 Voice Core에 함께 사용하면 SoriON AI만의 음성 플랫폼 아이덴티티가 강화된다.

### 영향 범위

- 모든 페이지 공통 상단 마스트헤드
- 모바일·PC 첫 화면 높이
- 브랜드 로고 표기
- 모션 감소 접근성
- 마스트헤드 컴포넌트 테스트

### 주요 변경 파일

- `src/components/layout/BrandMasthead.tsx`
- `src/components/layout/BrandMasthead.test.tsx`
- `src/styles/index.css`
- `src/styles/masthead.css`
- `docs/UI_GUIDE.md`
- `docs/TEST.md`

### 검증 결과

- 프로젝트 규칙 검사 통과
- FastAPI 테스트 29개 통과
- Python 전체 문법 컴파일 통과
- 임시 JSX 선언을 사용한 `BrandMasthead.tsx` strict TypeScript 검사 통과
- `tinycss2` 기반 CSS 구문 검사 통과
- 브랜드 제목, 한국어 순환 문구, 두 마이크 마크 DOM 회귀 테스트 추가
- 모든 소스 파일 500줄 이하 및 SVG 미사용 확인
- `0.5.0`에 패치를 적용한 결과와 전체 `0.5.1`의 188개 파일 동등성 검사 통과

### 알려진 제한과 주의사항

- 자동 배너는 사용자가 직접 넘기는 버튼을 제공하지 않는다.
- 모션 감소 환경에서는 문구 순환 대신 브랜드명만 표시한다.
- 시스템 글꼴에 따라 매우 좁은 기기에서 문구 줄바꿈이 달라질 수 있다.
- 실제 음성 복제 기능은 이번 패치 범위가 아니며 다음 `0.6.0`에서 진행한다.
- 내부 npm 저장소에 `@tailwindcss/vite`가 없어 정식 Vitest, ESLint, Vite production build는 현재 환경에서 실행하지 못했다.

### 생성 산출물

- 전체: `SoriON-AI-0.5.1-full.zip`
- 패치: `SoriON-AI-0.5.0-to-0.5.1-patch.zip`
- 체크섬: `SoriON-AI-0.5.1-artifacts.sha256`

### 다음 예상 업데이트

`0.6.0 Mobile Voice Clone Foundation`에서 모바일 녹음, 파일 업로드, 샘플 품질 검사, 본인 목소리·사용 권한 동의, 로컬 보관과 삭제, 교체 가능한 VoiceCloneEngine 계약을 구현한다.

## 2026-07-31 14:55 KST - 0.5.2 CI Stability Patch

### 대상 버전과 기준 버전

- 기준 버전: `0.5.1`
- 대상 버전: `0.5.2`

### 프로젝트 목표 재확인

SoriON AI의 목표는 한국인이 모바일에서 앱처럼 사용하며 10초 안에 음성 생성·복제·변환을 시작하는 차세대 AI Voice Platform이다. 다음 핵심 기능으로 이동하기 전에 배포와 자동 검사가 신뢰할 수 있어야 하므로 이번 패치는 기능 추가보다 CI 안정화를 우선했다.

### 변경 내용

- Web 품질, API 품질, Pages 배포를 `ci.yml` 하나로 통합했다.
- 자동 Push 대상은 `main`으로 제한하고 `develop`·기능 브랜치는 Pull Request 이벤트로 검사하게 했다.
- 별도 `deploy-pages.yml`을 삭제했다.
- Pages 배포는 Web·API 검사 성공 뒤에만 실행한다.
- API CI가 Python 3.10을 명시적으로 설치하고 사용하게 했다.
- `datetime.UTC`를 `timezone.utc`로 교체했다.
- Ruff 기준을 `py310`으로 내렸다.
- Testing Library DOM을 매 테스트 후 명시적으로 정리한다.
- 프로젝트 규칙 검사에 단일 워크플로와 Python 3.10 호환성 검사를 추가했다.

### 변경 이유

- 기능 브랜치에 Pull Request가 열린 상태에서 `push`와 `pull_request`가 같은 커밋을 두 번 실행할 수 있었다.
- 별도 CI와 Pages 워크플로가 모두 `main` Push를 구독하면 All workflows에 실행이 두 개 생긴다.
- API가 Python 3.10을 지원한다고 선언했지만 `datetime.UTC`는 Python 3.11부터 제공되어 import 단계에서 실패했다.
- Vitest에서 globals를 켜지 않아 Testing Library 자동 cleanup이 등록되지 않았고, 두 번째 마스트헤드 테스트에서 같은 DOM이 중복됐다.

### 영향 범위

- GitHub Actions 실행 수와 Pages 배포 순서
- Python 3.10 API 호환성
- React 컴포넌트 테스트 격리
- 프로젝트 규칙 검사
- 릴리스·Pages·테스트 문서

### 주요 변경 파일

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml` 삭제
- `services/api/app/services/job_manager.py`
- `services/api/app/storage/audio_store.py`
- `services/api/tests/test_audio_store.py`
- `services/api/tests/test_python_compatibility.py`
- `src/test/setup.ts`
- `scripts/check-project-rules.mjs`
- `docs/GITHUB_PAGES.md`
- `docs/patches/0.5.2/`

### 검증 결과

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 30개 통과
- Python 전체 문법 컴파일 통과
- API 소스의 `datetime.UTC` 잔존 여부 검사 통과
- 활성 워크플로가 `ci.yml` 하나인지 검사 통과
- `0.5.1`에 패치를 적용하고 삭제 스크립트를 실행한 결과와 전체 `0.5.2`의 192개 파일 동등성 검사 통과
- 현재 작업 환경의 npm 저장소 제한으로 정식 Vitest·ESLint·Vite build는 로컬 실행하지 못함

### 알려진 제한과 주의사항

- GitHub Pages Source가 `Deploy from a branch`로 남아 있으면 GitHub 기본 `pages-build-deployment`가 별도로 실행된다. 사용자가 저장소 설정에서 `GitHub Actions`로 한 번 변경해야 한다.
- 패치 ZIP은 기존 `deploy-pages.yml`을 자동으로 지우지 못하므로 적용 후 삭제 스크립트를 실행해야 한다.
- GitHub에서 최종 Web 테스트와 Pages 배포 성공 여부를 Push 후 확인해야 한다.

### 생성 산출물

- 전체: `SoriON-AI-0.5.2-full.zip`
- 패치: `SoriON-AI-0.5.1-to-0.5.2-patch.zip`
- 체크섬: `SoriON-AI-0.5.2-artifacts.sha256`

### 다음 예상 업데이트

`0.6.0 Mobile Voice Clone Foundation`에서 모바일 녹음, 파일 업로드, 샘플 품질 검사, 본인 목소리·권한 동의, 로컬 보관과 삭제, 교체 가능한 VoiceCloneEngine 계약을 구현한다.

## 2026-07-31 15:35 KST - 0.5.3 CI Test Compatibility Patch

### 대상 버전과 기준 버전

- 기준 버전: `0.5.2`
- 대상 버전: `0.5.3`

### 프로젝트 목표 재확인

SoriON AI의 목표는 한국인이 모바일에서 앱처럼 사용하며 10초 안에 음성 생성·복제·변환을 시작하는 차세대 AI Voice Platform이다. 다음 핵심 기능을 추가하기 전에 자동 검사가 실제 브라우저·Python 지원 범위를 정확히 검증해야 하므로 이번 패치는 CI 호환성 복구를 우선했다.

### 변경 내용

- JSDOM Blob에 `arrayBuffer()`가 없을 때 `FileReader`로 동작하는 테스트 폴리필을 추가했다.
- Testing Library cleanup 뒤 `document.body`를 비워 테스트 간 DOM 누적을 차단했다.
- HomePage 테스트를 현재 렌더 컨테이너로 제한하고 `읽을 문장` textarea를 `textbox` 역할로 찾게 했다.
- Ruff의 `UP017`을 제외해 Python 3.10 호환 `timezone.utc`를 유지했다.
- API Job의 작업 디렉터리를 `services/api`로 고정했다.
- setup-uv v8이 Python 3.10과 API 프로젝트 경로를 직접 관리하게 했다.
- checkout·setup-node·setup-python을 v6, setup-uv를 v8로 갱신했다.
- Pages 액션도 configure-pages v6, upload-pages-artifact v5, deploy-pages v5로 갱신했다.
- 프로젝트 규칙 검사에 Blob 폴리필, 구형 액션, Python 3.10 Ruff 설정 검사를 추가했다.

### 변경 이유

- Mock WAV 생성 로직은 정상이어도 JSDOM Blob API 차이로 테스트가 실패했다.
- 접근성 이름만으로 찾으면 레이블 영역과 실제 입력 컨트롤이 동시에 일치할 수 있었다.
- Python 3.10을 지원하면서 Python 3.11 전용 `datetime.UTC`를 요구하는 린트 규칙을 그대로 둘 수 없었다.
- GitHub가 JavaScript Action 런타임을 Node.js 24로 전환해 구형 action major가 경고를 발생시켰다.

### 영향 범위

- Web 테스트 공통 환경
- HomePage 회귀 테스트
- API Ruff 정책과 Python 3.10 CI
- GitHub Actions 런타임
- 프로젝트 자동 규칙 검사
- 테스트·Pages·릴리스 문서

### 주요 변경 파일

- `.github/workflows/ci.yml`
- `src/test/setup.ts`
- `src/pages/HomePage.test.tsx`
- `services/api/pyproject.toml`
- `services/api/tests/test_python_compatibility.py`
- `scripts/check-project-rules.mjs`
- `docs/TEST.md`
- `docs/GITHUB_PAGES.md`

### 검증 결과

- 프로젝트 규칙 검사 통과
- 현재 제공 Python 환경에서 FastAPI 테스트 31개 통과
- Python 전체 문법 컴파일 통과
- 워크플로 필수 액션·Python 버전·작업 디렉터리 검사 통과
- 모든 소스 파일 500줄 이하 확인
- SVG·비밀키·금지 산출물 미포함 확인
- 패치 적용본과 전체본 파일 동등성 검사 통과

### 알려진 제한과 주의사항

- 현재 작업 환경의 네트워크 제한으로 npm 의존성 설치와 정식 Vitest·ESLint·Vite build를 실행하지 못했다.
- 같은 제한으로 uv 관리 CPython 3.10을 내려받지 못해 실제 Python 3.10 Job은 GitHub Actions에서 최종 확인해야 한다.
- GitHub Pages Source는 계속 `GitHub Actions`로 유지해야 중복 `pages-build-deployment`가 생기지 않는다.

### 생성 산출물

- 전체: `SoriON-AI-0.5.3-full.zip`
- 패치: `SoriON-AI-0.5.2-to-0.5.3-patch.zip`
- 체크섬: `SoriON-AI-0.5.3-artifacts.sha256`

### 다음 예상 업데이트

CI의 Web·API·Deploy가 모두 성공하면 `0.6.0 Mobile Voice Clone Foundation`에서 모바일 녹음, 샘플 품질 검사, 명시적 동의, 로컬 보관·삭제, 교체형 VoiceCloneEngine 계약을 구현한다.
