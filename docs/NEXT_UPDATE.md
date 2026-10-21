# NEXT UPDATE

현재 기준: 0.11.47 · Draft Recovery & Korean Phrasing
## 목표 버전

0.11.48 · Project Save Recovery & Prosody QA

- 생성 완료 후 프로젝트 목록 저장이 실패했을 때, 같은 프로젝트 기록을 중복 없이 재시도하는 동선을 만듭니다.
- 장문 한국어 문장·숫자·영문 혼합의 분할/쉼 규칙과 성우별 출력 경계를 점검합니다.
- 승인 WAV·권리·모델이 확보되면 기본 성우별 사람 청취 평가를 진행합니다.
- 실제 Android/iOS·Firefox/Safari의 입력·재생 검증은 장치 확보 후 진행합니다.

예상 영역: HomePage 프로젝트 저장 경로, projectRepository, 한국어 분할/Prosody 테스트.
선행 조건: 0.11.47 CI green. Neural 음질 인증은 승인 자산/모델과 실제 재생 증거 필요.
유지 결정: 원본 대본 보존, 명시적 저장/복구, 음성 동의 경계. 유료 API·음성 자동 업로드·모델 자동 다운로드 없음.
