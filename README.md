# AI Shorts Studio v1.6.13

로컬 영상 분석·쇼츠 편집·렌더링 도구입니다. 정적 PWA 구조에서 오디오·모션·추천·스마트 리프레임·렌더를 분리한 모듈형 엔진을 사용하며, 사용자 파일과 모델을 브라우저 내부에서 처리합니다.

## v1.6.13 핵심 변경

- 비전 모델 팩 설치를 트랜잭션 방식으로 변경해 Cache Storage 쓰기 실패 시 기존 팩과 활성 선택을 보존합니다.
- 부분 저장된 신규 모델 파일을 자동 정리해 고아 캐시와 불완전 설치를 방지합니다.
- 동일 모델의 CPU↔GPU 전환 실패 시 현재 모델의 마지막 정상 backend로 복구합니다.
- 이전 모델 롤백 대상은 backend 복구와 별개로 유지합니다.
- 반복 내보내기에서 다운로드 Object URL이 누적되던 문제를 수정해 활성 export URL을 1개로 제한하고 페이지 종료 시 전부 해제합니다.
- QA 실행기에 구간·검색·샤드·개별 타임아웃·fail-fast·JSON 보고서 출력을 추가했습니다.
- 결과 전달 형식은 `DELIVERY_RULES.md`를 필수 기준으로 사용합니다.

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다. 모델 팩은 공식 MediaPipe Tasks Vision 런타임과 얼굴 감지 모델 파일을 사용자가 직접 선택해 설치합니다.

## 검사

```bash
npm test
node qa/run_all_checks.js --shard 1/4
node qa/run_all_checks.js --match vision_model_pack
node qa/run_all_checks.js --report qa/latest-qa-run.json
```

전체 검사 시간이 긴 환경에서는 동일한 총 검사 목록을 여러 샤드로 나눠 실행할 수 있습니다.
