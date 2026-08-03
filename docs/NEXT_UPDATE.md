# NEXT UPDATE

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.5.1 · CI Regression Hotfix`

## 목표 버전

`0.9.3-beta.3 · Engine Heartbeat 6.6 · Field Evidence & Reproducible Web Quality`

## 핵심 기능

0. 선행 게이트: Heartbeat 6.5.1을 Push해 API Ruff와 전체 Web quality가 모두 통과하는지 확인한다.
1. 검증된 `package-lock.json`을 생성해 ESLint, 전체 Vitest, semantic typecheck와 Vite production build를 재현 가능하게 확정한다.
2. Android Chrome·iOS Safari·설치형 PWA의 실제 10·30·60분 recorder 결과를 증거 bundle로 가져오고 서명·중복·기기 식별 최소화 규칙을 추가한다.
3. 실제 CosyVoice 모델과 동의받은 프리셋 5종의 first audio, RTF, 생성 대기 seam, decode seam, handoff error와 실패율을 기록한다.
4. field evidence의 표본 수와 측정 시각을 표시하고 표본이 부족한 P95를 성능 보장처럼 보이지 않게 한다.
5. 브라우저 다운로드가 여러 파일을 차단하는 환경을 위해 사용자가 선택한 Export를 단일 ZIP으로 묶는 로컬 전용 경로를 검토한다.
6. 서버 장기 보존이 필요한 운영 환경을 위한 opt-in object storage 설계만 문서화하고 기본 제품에는 활성화하지 않는다.

## 선행 조건과 위험

- npm registry 접근과 검증된 lock 생성 환경이 필요합니다.
- 실제 Android·iPhone/iPad, 설치형 PWA와 공개 HTTPS Voice API가 필요합니다.
- 실제 CosyVoice 모델·GPU와 권리·동의가 확인된 프리셋 WAV 5종이 필요합니다.
- P95는 표본 수가 적으면 의미가 약하므로 표본 수와 함께 해석해야 합니다.
- 브라우저는 여러 파일 자동 다운로드를 차단할 수 있어 사용자가 개별 링크를 눌러야 할 수 있습니다.
- 서버 장기 archive는 개인정보 삭제, 접근 제어, 저장 비용과 동의 철회 정책 없이는 활성화하지 않습니다.

## 넘기는 결정

- Heartbeat 6.5의 실기기 recorder는 사람이 실제 측정을 시작·종료해야 하며 CI가 READY를 만들지 않습니다.
- 복구 시나리오는 성공 boolean과 복구 시간 필드가 모두 있어야 READY 후보가 됩니다.
- 생성 대기 seam과 순수 decode seam은 분리 집계합니다.
- 최종 Export 서버 파일은 기본 30분 임시이고 사용자 다운로드만 보존본입니다.
- localStorage에는 보존 파일명 메타데이터만 남고 음성 바이트·원문·전체 URL은 저장하지 않습니다.
