# ROADMAP

## Phase 1 — Foundation

- [x] 신규 코드베이스 기초 구조
- [x] 모바일 PWA 셸
- [x] FastAPI 엔진 게이트웨이
- [x] 로컬 프로젝트 저장
- [x] Firebase 선택형 로그인 어댑터
- [x] CI와 프로젝트 규칙 검사
- [x] GitHub Pages 자동 배포
- [ ] 실제 Firebase 개발 프로젝트 연결
- [ ] 설치형 PWA 실기기 점검

## Phase 2 — AI Core

- [x] 모바일 Voice Workspace
- [x] 한국어 음성·감정 프리셋 UI
- [x] 생성 상태, 실패, 재시도 UI
- [x] 오디오 플레이어와 WAV 다운로드 흐름
- [x] Mock·Demo·실제 AI 구분
- [ ] 첫 실제 한국어 TTS 엔진 어댑터
- [ ] Faster Whisper STT
- [ ] 목소리 샘플 전처리
- [ ] 복제 동의 및 권리 확인 흐름

## Phase 3 — Professional

- [ ] 실제 감정·속도·톤·피치 제어
- [ ] 한국어 발음 사전
- [ ] 다국어 번역과 더빙
- [ ] 배치 생성
- [ ] 프로젝트 버전과 즐겨찾기

## Phase 4 — Service

- [ ] 관리자 화면
- [ ] 사용량·비용·오류 지표
- [ ] 요금제와 할당량
- [ ] AI 성우 마켓 기반
- [ ] 실시간 음성 변환 연구

## 현재 진행 상태

- `0.2.0`: 모바일 TTS 생성 흐름
- `0.3.0`: 실제 한국어 엔진 어댑터
- `0.4.0`: 한국어 전처리와 품질 연구소
- `0.5.0`: API 연결, 실제 진행률, 품질 기록 보존
- `0.6.0`: 모바일 목소리 복제 온보딩과 동의 기반
- `0.7.0`: 음성 → 음성 변환과 STT 연결


## 0.6.0 완료

- 모바일 마이크 녹음과 음성 파일 선택
- 로컬 길이·무음·클리핑·음량 검사
- 명시적 동의와 동의 철회 삭제
- IndexedDB v3 음성 프로필
- CosyVoice Worker 경계와 API capability
- Dock 대기열, 이전·다음, 반복, 속도, 다운로드

## 0.7.0 예정

- CosyVoice Worker 실제 health·모델·GPU 진단
- 제로샷 speaker prompt와 복제 실행
- 스트리밍 TTS·복제 결과
- 프로젝트별 Dock 세션 복구


## 0.7.1 완료

- API↔Worker 서명 인증
- 요청 제한과 감사 로그
- 모델·GPU readiness 강화
- SSE 재연결 계약
- 종료 작업 TTL 정리

## 0.7.4 예정

- GPU 배포 템플릿
- 모델 설치·체크섬·로딩 진행률
- 문장별 조기 재생
- Worker 재시작 상태 복구
- speaker prompt cache 수명주기


## 0.7.2 완료

- CI Ruff·Vitest·React Hooks 회귀 수정
- 문장별 UI 분할 계약 안정화
- 동일 오류 재유입 방지 규칙 추가

## 0.7.3 예정

- GPU 배포 템플릿과 progressive playback
- Worker 재시작 복구와 prompt cache 수명주기


## 0.7.3 완료

- 임시채팅 영구 HANDOVER 메모리 기준점
- 제품 목표·UX 결정·아키텍처·엔진·보안·환경·CI·제한 통합 기록
- 다음 기능 목표를 0.7.4로 이동


## 0.8.0 완료

- 초기 랜딩 유지와 Chat-to-Timeline 편집 작업공간
- 세로 보이스 라이브러리, 채팅 composer, 문장·쉼 타임라인
- 첫 ready 블록 Progressive Playback과 연결 바텀시트

## 0.8.1 완료

- 모바일 API 주소 정규화·last-good·최근 주소 복구
- API·TTS·Worker·GPU 네 계층 상태
- 네트워크 전환·PWA 복귀 자동 재점검
- GET 제한 재시도와 TTS POST job 결과 복구
- Private Network preflight와 모바일 safe-area·터치 영역 강화

## 0.8.2 완료

- 동일 TTS job·동일 요청의 실행 Task 공유와 완료 결과 재사용
- 다른 payload의 job ID 재사용 409 차단
- HTTP 호출 취소와 서버 생성 Task 수명 분리
- 타임라인 job ID 보존과 recover-first 재시도
- 모바일 localStorage 실패 fallback과 randomUUID 호환
- 생성 중 편집·분할의 stale 결과 방지

## 0.8.3 완료

- SQLite 기반 교체 가능한 TTS JobStore
- API 재시작 뒤 상태·완료 결과 복구
- 다중 API 프로세스 원자적 claim과 stale claim 재획득
- 결과 TTL·이력 TTL 분리와 completed tombstone 410
- 저장소 기반 cross-process 취소 신호

## 0.8.4 완료

- 수동 API 주소 입력과 엔진 연결 Bottom Sheet 제거
- 같은 Origin·환경 변수·성공 이력·안전 로컬 후보 자동 탐색
- 첫 랜딩 Dock 비노출, 작업공간 진입 뒤 메뉴·Player Dock 표시
- 최근 프로젝트 클릭 불러오기와 채팅·보이스·타임라인 복원
- 저장된 job ID 결과 recover-first와 만료 시 블록별 재생성 안내

## 0.8.5 완료

- 메뉴 이동 중 만들기 초안·채팅·타임라인 보존
- 품질·프로젝트·설정 공통 헤더와 다크 IA 통일
- 설정 직접 접근과 프로젝트 loading/error/empty/retry 상태
- 자동 엔진 순위화·fallback·실행 시도 메타데이터
- 반복 실패 엔진 circuit breaker와 품질 진단 연결

## 0.8.6 예정

- 열린 채팅·타임라인 전체 IndexedDB 자동 저장
- PWA 종료·새로고침 뒤 마지막 작업공간 자동 복원
- Object URL 소실 시 서버 결과 또는 Blob 복구
- 저장 quota·private mode·iOS 정리 fallback
- Android Chrome·iOS Safari·PWA 단절 복구 실기기 매트릭스
