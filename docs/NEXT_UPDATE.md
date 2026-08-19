# NEXT UPDATE

Current baseline: `0.11.29 · Certification Intake & Release Readiness`

## 목표 버전

`0.11.30 · Neural Voice Reference Intake & Preview Promotion`

### 핵심 기능

1. 혜린·도윤·소리·준호·민준 각 preset에 대해 권리·동의가 확인된 reference WAV/model fingerprint와 검수 상태를 intake하는 manifest를 정의합니다.
2. 실제 neural preview가 준비되고 검증된 preset만 API/neural preview를 기본 미리듣기로 승격하고, 준비되지 않은 경우 현재 `기기 음성` Browser/System fallback을 유지합니다.
3. PC와 모바일이 같은 검증된 neural preview asset을 사용하도록 source SHA-256/cache key를 통일해 기기별 음색 차이를 줄입니다.
4. reference 원본 WAV, 개인정보, 동의 문서는 Git/전달 ZIP에 넣지 않고 fingerprint와 권리 확인 상태만 저장합니다.

### 선행 조건과 위험

- 0.11.29 GitHub Actions Web quality/Chromium gate가 green이어야 합니다.
- 실제 preset reference는 사용 권리와 동의가 명확해야 하며 준비되지 않은 성우를 neural-ready로 표시하지 않습니다.
- 모델/Worker가 없는 환경에서는 Browser/System fallback 품질이 최종 neural 품질을 대신하지 않습니다.

### 예상 변경 영역

- voice preset reference manifest / rights-safe intake
- neural preview source selection + cache fingerprint
- Quality Lab preset readiness UI
- API/Worker preview routing contract
