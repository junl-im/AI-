# 0.11.30 · Neural Voice Reference Intake & Preview Promotion Patch

Base: `0.11.29 · Certification Intake & Release Readiness`
Target: `0.11.30 · Neural Voice Reference Intake & Preview Promotion`

## 적용

이 PATCH ZIP의 내용을 SoriON 0.11.29 프로젝트 루트에 그대로 덮어씁니다. 삭제 파일은 없습니다.

## 핵심 변경

- Voice preset evidence manifest v4에 neural preview engine/model/reference fingerprint를 추가합니다.
- `/setup`은 기존 evidence가 usable이고 v4 provenance, `cosyvoice3`, 유효한 model SHA-256, 실제 WAV와 일치하는 reference fingerprint가 모두 있을 때만 neural preview READY/cache key를 노출합니다.
- Quality Lab에서 5개 preset의 neural reference readiness를 확인하고 pending v4 manifest 템플릿을 다운로드할 수 있습니다.
- Home의 preset ▶ 미리듣기는 검증된 READY preset만 `cosyvoice3`를 우선 사용합니다. 미검증/실패 상태는 기존 `기기 음성` fallback을 유지합니다.
- 실제 reference WAV, 모델, 동의/계약 문서, 사용자 음성은 PATCH/FULL ZIP에 포함하지 않습니다.

## 호환성

v1~v3 manifest는 기존 일반 생성 경로에서 계속 사용할 수 있습니다. 단, v4 provenance가 없는 preset을 neural preview 기본값으로 승격하지 않습니다.

## 검증

- Product version sync: 0.11.30 PASS
- Repository preflight: 53/53 PASS
- Neural Voice reference/promotion static contract: PASS
- API targeted setup/approval: 13/13 PASS
- API pytest: 223/223 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- Changed TS/TSX dependency-free transpile syntax: 9/9 PASS
- Global `tsc -b`: node_modules 부재로 Vite/Vitest/Node 타입을 찾지 못해 semantic PASS 미주장
- 실제 rights-cleared reference/model runtime: 미수집

## 주의

템플릿 다운로드나 schema v4만으로 neural READY가 되지 않습니다. 실제 권리·동의·사람 검수와 reference/model fingerprint가 확인되기 전에는 pending을 유지합니다.
