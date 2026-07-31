# TEST

## 계층

1. 단위 테스트: 숫자 읽기, 정규화, 문장 분할, WAV 병합
2. 파이프라인 테스트: 장문 분할, 자식 WAV 정리, 결과 지표
3. 어댑터 테스트: 주입된 Melo 모델, 설치된 eSpeak 실제 WAV
4. API 계약 테스트: 엔진 목록, 진단, 전처리, A/B 비교, 취소
5. 컴포넌트 테스트: 엔진 상태, 생성, 품질 연구소, 결과 표시
6. 실기기: Android Chrome, iOS Safari, 설치형 PWA

## 명령

```bash
npm run quality:rules
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:api
```

## 0.5.0 추가 검사

- 큰 정수의 한국어 읽기
- 날짜, 금액, 퍼센트, 영문 약어 전처리
- 40~500자 분할 기준 검증
- 같은 PCM 형식 WAV 병합과 구간 무음
- 장문 파이프라인의 자식 WAV 삭제
- 처리 시간, 파일 크기, RTF 응답
- 품질 진단의 Python·메모리·엔진 상태
- 평가 문장 API
- Mock 비교가 음원 없이도 안전한 결과를 반환하는지 확인
- 지원하지 않는 감정·피치 UI 비활성화

## 한국어 평가 세트

`docs/evaluation/KOREAN_TTS_SENTENCES.json`에 기본, 숫자, 날짜, 시각, 금액, 단위, 영문, 높임말, 긴 문장 분할 항목을 관리합니다.

## 배포 차단 기준

- 테스트 실패
- 500줄 제한 위반
- AI, Local TTS, Demo 표시 혼동
- 전처리 과정에서 원문 일부가 유실되는 문제
- 서로 다른 WAV 형식을 강제로 병합하는 문제
- 자식 임시 WAV가 병합 후 남는 문제
- 저장 루트 밖 파일 접근
- 사용자 문장 또는 비밀키가 로그·저장소에 포함됨

## 0.5.0 추가 검사

- JobManager 완료·취소 진행률 스냅샷
- 완료 후 작업 상태 조회와 알 수 없는 작업 404
- 장문 정규화·구간 생성·병합 진행 순서
- Setup API 필수·선택 진단 항목
- Voice API 주소 `/api/v1` 정규화
- 품질 JSON 버전과 CSV 한국어·따옴표 이스케이프
- IndexedDB v1 프로젝트 사용자의 v2 스키마 업그레이드 수동 확인

## 0.5.1 브랜드 배너 검사

- 접근 가능한 제목 이름이 `곰같은여우 SoriON AI`인지 확인
- 한국어 순환 문구 3종이 DOM에 존재하는지 확인
- 로고 마이크와 Voice Core 마이크 요소가 존재하는지 확인
- 360px, 390px, 430px에서 배너가 작업 영역을 과도하게 밀어내지 않는지 수동 확인
- 760px 이상에서 Voice Core가 표시되고 그 이하에서는 숨겨지는지 확인
- 모션 감소 환경에서 첫 슬라이드만 정적으로 표시되는지 확인
- SVG 파일과 SVG 아이콘이 새로 추가되지 않았는지 확인

## 0.5.2 CI 안정성 검사

- `.github/workflows`의 활성 YAML이 `ci.yml` 하나인지 확인
- 기능 브랜치 PR 갱신 시 동일 커밋의 Push·PR 실행이 중복되지 않는지 확인
- `main` Push 한 번에서 Web quality, API quality, Deploy GitHub Pages가 같은 실행 안에 표시되는지 확인
- API CI가 Python 3.10으로 실행되는지 확인
- API 소스에 `from datetime import UTC` 또는 `datetime.UTC`가 없는지 확인
- 같은 컴포넌트를 여러 테스트에서 렌더링해도 이전 DOM이 남지 않는지 확인
- GitHub Pages Source가 `GitHub Actions`인지 확인

## 0.5.3 CI 테스트 호환성 검사

- JSDOM의 `Blob`에 `arrayBuffer()`가 없어도 WAV RIFF 헤더 테스트가 실행되는지 확인
- `FileReader` 기반 폴리필이 `ArrayBuffer`를 반환하고 읽기 실패를 reject하는지 확인
- HomePage 테스트가 전체 document가 아니라 현재 render 컨테이너만 검색하는지 확인
- `읽을 문장` 입력을 접근성 이름과 `textbox` 역할 조합으로 유일하게 찾는지 확인
- 매 테스트 후 Testing Library cleanup과 `document.body` 초기화가 실행되는지 확인
- API Ruff가 `py310`을 유지하고 `UP017`만 제외하는지 확인
- `timezone.utc`가 Python 3.10 호환 코드로 유지되는지 확인
- API Job이 `services/api`에서 Python 3.10으로 Ruff와 pytest를 실행하는지 확인
- checkout·setup-node·setup-uv에 Node.js 20 세대 major가 남지 않았는지 확인
