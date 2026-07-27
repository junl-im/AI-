# AI Shorts Studio v1.6.15

로컬 영상 분석·쇼츠 편집·렌더링 도구입니다. 정적 PWA 구조에서 가져오기·분석·추천·미리보기·스마트 리프레임·렌더를 모듈형 엔진과 전용 컨트롤러로 분리하며, 사용자 영상·프로젝트·모델 파일은 브라우저 내부에서 처리합니다.

## v1.6.15 핵심 변경

- `src/app/preview-controller.js`를 추가해 미리보기 RAF, 완료 감시 타이머, 재생 작업 토큰, 중단·종료 정리를 `src/app.js`에서 분리했습니다.
- 미리보기 시작 실패, 새 원본 교체, 사용 중단, 페이지 종료 시 RAF와 interval이 남지 않도록 단일 teardown 경로를 적용했습니다.
- `src/app.js`는 기존 함수 이름을 얇은 브리지로 유지해 가져오기·렌더·UI 모듈과의 호환성을 보존합니다.
- 비전 모델 팩 화면에 브라우저 저장소 사용량, 설치 모델 용량, 고아 캐시 개수·추정 용량을 표시합니다.
- 고아 모델 캐시를 삭제하지 않고 먼저 검사하는 dry-run API와, 사용자 명시 동작으로만 실행되는 수동 정리 버튼을 추가했습니다.
- 수동 정리는 모델 팩 전용 Cache Storage와 synthetic URL namespace만 다루며 등록된 모델 팩은 보존합니다.
- v1.6.14의 quota 사전 점검, 트랜잭션 설치, 벤치마크 freshness, backend 복구, 이전 모델 롤백 계약을 유지합니다.
- feedback UX를 shell 단계로 지연 적재해 Preview Controller 추가 후에도 직접 시작 스크립트를 49개로 유지합니다.
- 최종 소스 기준 서비스워커 SHA-256 매니페스트를 재생성하고 변조 탐지·수동 복구를 검증했습니다.

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다. 비전 모델 팩은 공식 MediaPipe Tasks Vision 런타임과 얼굴 감지 모델 파일을 사용자가 직접 선택해 설치합니다. 모델 바이너리는 배포 ZIP에 포함되지 않습니다.

## 검사

```bash
npm test
node qa/run_all_checks.js --shard 1/4
node qa/run_all_checks.js --match preview_controller
node qa/run_all_checks.js --match vision_model_pack
node qa/run_all_checks.js --report qa/latest-qa-run.json
```

현재 릴리스는 **259/259 검사 통과** 상태이며 세부 결과는 `qa/QA_REPORT.md`에 기록합니다. 결과 전달 순서는 `DELIVERY_RULES.md`를 따릅니다.
