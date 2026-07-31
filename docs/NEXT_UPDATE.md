# NEXT UPDATE

## 목표 버전

`0.6.0 Mobile Voice Clone Foundation`

## 제품 방향

SoriON AI의 목표는 연구 도구가 아니라 한국인이 모바일에서 10초 안에 음성 생성·복제·변환을 시작하는 AI Voice Platform이다. 다음 버전부터 품질 연구소 중심 개발을 멈추고 두 번째 핵심 흐름인 **목소리 복제**로 이동한다.

## 목표

상단의 압축형 브랜드 배너와 마이크 아이덴티티는 `0.5.1`에서 완료했고, CI·Pages·Python 3.10 호환성은 `0.5.2`에서 안정화했다. 다음 버전은 시각 장식 확장보다 모바일 목소리 복제의 안전한 핵심 흐름을 우선한다.

사용자가 휴대폰에서 짧은 샘플을 안전하게 녹음하고, 소유권과 동의를 확인한 뒤, 복제 엔진에 전달할 수 있는 모바일 온보딩과 데이터 계약을 만든다. 실제 복제 모델이 없어도 녹음·검증·삭제·동의 흐름은 완전하게 동작해야 한다.

## 예상 구현

- 모바일 마이크 녹음과 파일 업로드
- 10초·30초 샘플 품질 가이드
- 무음, 클리핑, 너무 짧은 음원 사전 검사
- 본인 목소리·정당한 권한 확인 체크리스트
- 명시적 동의 기록과 철회·삭제 흐름
- 복제 샘플은 기본적으로 기기 로컬 보관
- 엔진 교체형 `VoiceCloneEngine` 계약
- 복제 준비 상태와 예상 처리 시간 표시
- 원본 음성 → 대상 음색 변환 요청 계약 초안
- 모바일 3단계 흐름: 녹음 → 확인 → 복제 시작

## 절대 조건

- 타인의 목소리를 동의 없이 복제하는 기능을 제공하지 않는다.
- 미성년자, 사칭, 금융·공공기관 오용 방지 문구와 차단 지점을 먼저 설계한다.
- 음성 원본을 Firebase 또는 외부 서버에 자동 업로드하지 않는다.
- 실제 복제 모델이 연결되지 않았는데 성공한 것처럼 표시하지 않는다.
- 초보자의 기본 흐름은 3번 이하의 주요 조작으로 끝나야 한다.

## 예상 변경 영역

- `src/pages/ClonePage.tsx`
- `src/components/clone/`
- `src/voiceclone/`
- `src/storage/`
- `services/api/app/engines/voiceclone/`
- `services/api/app/api/routes/voiceclone.py`
- `docs/VOICE_CLONE_POLICY.md`
- `docs/SECURITY.md`
- `docs/HANDOVER.md`

## 0.5.3 선행 안정화 결과

- JSDOM Blob 호환 폴리필과 HomePage 쿼리 범위 수정
- Python 3.10과 Ruff UP017 충돌 제거
- checkout·setup-node·setup-uv의 Node.js 24 대응 버전 적용
- 다음 기능 구현 전 GitHub Actions 전체 성공을 필수 조건으로 유지

## 선행 확인

- `SoriON CI & Pages` 단일 실행에서 Web·API·Deploy 성공
- 공개 사이트에 `BUILD v0.5.3` 표시
- 설정 화면에서 Voice API 주소 저장과 연결 검사 성공
- 긴 문장 생성 중 실제 진행률 표시 확인
- 품질 별점 저장 후 JSON·CSV 다운로드 확인

## 이후 방향

`0.7.0`에서는 음성 → 음성 변환의 첫 파이프라인과 STT 자막 기반 편집을 연결한다.
