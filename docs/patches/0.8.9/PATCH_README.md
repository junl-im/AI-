# SoriON AI 0.8.9 Unified Product Shell & Korean Neural Engine Mesh

- 기준 전체본: `SoriON-AI-0.8.8-full.zip`
- 대상 버전: `0.8.9`
- 적용 방식: 저장소 루트에 패치 ZIP을 바로 덮어씁니다.
- 삭제 대상: 없음

## 핵심 변경

1. 프로젝트·품질·복제·설정 페이지를 공통 PageScaffold, 헤더, 간격과 상태 영역으로 통합했습니다.
2. 모든 내부 페이지는 공식 로고, 작은 `SoriON AI` 프로그램명과 현재 페이지명을 같은 구조로 표시합니다.
3. CosyVoice Worker 일반 TTS, NAVER CLOVA Voice Premium, Google Chirp 3 HD,
   Azure Neural Voice와 ElevenLabs v3 Adapter를 추가했습니다.
4. 자격 증명·Worker·동의된 기준 음성이 준비된 엔진만 자동 후보가 되며 사용자는 엔진을 고르지 않습니다.
5. 한국어 특화도, 품질 등급과 요청 기능 적합성으로 자동 순위를 정하고 실패 시 다음 엔진으로 전환합니다.
6. 런타임 JSON과 `SORION_PUBLIC_API_BASE_URLS`의 복수 HTTPS API를 자동 탐색합니다.
7. 현재 API가 실패하면 그 주소를 제외하고 다음 정상 후보를 승계해 한 주소에 고정되지 않습니다.

## 운영 전제

GitHub Pages는 정적 Web만 실행합니다. 고품질 AI 합성은 별도 HTTPS FastAPI 배포와
서버 측 공급자 자격 증명 또는 CosyVoice 모델·GPU·동의된 기준 음성이 필요합니다.
자격 증명이 없는 Premium Adapter는 준비되지 않은 상태로 남으며 자동 선택되지 않습니다.
Browser Speech는 공개 API가 없을 때의 재생 안전망이며 AI·WAV·복제로 표시하지 않습니다.
