# NEXT UPDATE

Current baseline: `0.11.30 R1 · Web Lint Type-Only Import Stabilization`

## 목표 버전

`0.11.31 · Neural Voice Runtime Certification & Shared Preview Cache`

### 핵심 기능

1. 권리·동의가 실제 확인된 preset v4 reference와 Worker/model이 준비된 경우 model/reference fingerprint를 runtime에서 다시 교차 검증합니다.
2. neural preview 결과를 `previewCacheKey + text digest` 기준으로 캐시해 PC와 모바일이 같은 검증 source에서 같은 미리듣기 asset을 사용할 수 있게 합니다.
3. 혜린·도윤·소리·준호·민준 각각에 대해 neural first-audio/playback/source SHA를 수집하고 Browser Speech와 실제 neural 품질을 구분합니다.
4. 실제 reference가 없는 환경은 계속 `PENDING`으로 두며 synthetic fixture나 기기 음성을 neural 성공으로 승격하지 않습니다.

### 선행 조건과 위험

- **Stabilization gate:** 0.11.30 R1을 Push한 뒤 Web quality가 lint → critical regression → full Vitest → typecheck → Vite build → desktop/mobile Chromium → multi-scene까지 green인지 먼저 확인합니다. 실패가 남으면 0.11.31 기능보다 CI 안정화를 우선합니다.
- 0.11.30 GitHub Actions Web quality/Chromium gate가 green이어야 합니다.
- 실제 reference WAV/model은 권리와 라이선스가 확인된 운영 자산만 사용합니다.
- 원본 WAV, 모델, 동의 문서는 Git/전달 ZIP에 포함하지 않습니다.
- 카카오 WebView 실기기에서 neural HTTP audio 재생과 fallback을 별도 확인합니다.

### 예상 변경 영역

- API/Worker model/reference fingerprint runtime cross-check
- neural preview artifact cache + text digest
- PC/mobile shared preview source evidence
- preset voice runtime certification UI/CLI
