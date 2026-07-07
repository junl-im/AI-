# AI 쇼츠 제작 스튜디오 v0.9.3

음악이나 영상을 열면 자동 분석하고, 쇼츠 후보 추천·세로 미리보기·파형·컷·자막·저장까지 이어주는 로컬 웹 스튜디오입니다.

Design by 곰같은여우.

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다.

## 사용 흐름

1. `📂 파일` 탭에서 음악 또는 영상을 엽니다.
2. 파일을 열면 자동 분석됩니다.
3. `✨ 추천` 탭에서 추천 생성을 누릅니다.
4. 후보를 선택하면 `📱 미리보기`로 자동 연결됩니다.
5. `〰️ 파형`, `✂️ 컷`, `🎛️ 편집`, `💬 자막`, `⬇️ 저장` 탭으로 필요한 작업을 이어갑니다.

## v0.9.3 모듈형 엔진 구조

- `src/engine/module-registry.js` - 엔진 모듈 등록/스냅샷
- `src/engine/module-contracts.js` - 모듈 계약 및 결과 검증
- `src/engine/analysis-cache.js` - 세션 분석 캐시
- `src/engine/performance-budget.js` - 기기/파일 기반 성능 예산
- `src/engine/pro-engine-tuner.js` - 추천 신뢰도와 후보 등급 보강
- `src/engine/stability-auditor.js` - 런타임 안정성 점검
- `src/engine/analysis-pipeline.js` - 분석 파이프라인
- `src/engine/scoring-pipeline.js` - 추천 점수 파이프라인
- `src/engine/engine-kernel.js` - 앱과 엔진을 연결하는 커널

## 무료 로컬 처리

원본 미디어는 서버로 업로드하지 않고 브라우저 안에서 처리합니다. 브라우저/기기 성능에 따라 분석과 내보내기 속도는 달라질 수 있습니다.

## 검수

```bash
npm run check
```
