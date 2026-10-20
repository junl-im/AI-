# NEXT UPDATE

현재 기준: 0.11.43 · Recovery & Preview Lifecycle
## 목표 버전
0.11.44 · Mobile Editing & Session Clarity

- 모바일 sticky 도구/키보드/긴 문장 편집과 저장 상태 안내를 추가 점검합니다.
- HomePage 세션 복원·새 작업 책임을 보조 훅으로 분리합니다.
- 실제 Firefox/Safari·모바일 장치에서 오프라인 복구와 재생을 확인합니다.
- 승인된 성우 WAV·권리·모델 확보 시 장문/숫자/영문 청취 검증 진행.

예상 영역: 모바일 편집 CSS, 세션 복원 훅, 저장 안내와 UI 테스트.
선행 조건: 현재 CI green, 장치 피드백. 실제 음질 인증에는 승인 자산·모델 필요.
유지 결정: 실패한 업데이트는 강제 reload하지 않음, 직접 미리듣기는 사용자 tap 안에서 speak 호출, PWA offline 캐시·대본 보존. 유료 API·음성 자동 업로드·모델 자동 다운로드 없음.
