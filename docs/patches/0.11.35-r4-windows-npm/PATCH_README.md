# 0.11.35 R4 Windows npm portability

기준: 로컬 0.11.35 R3 (b544e44). 작업 중 변경을 백업한 뒤 저장소 루트에 덮어씁니다. 삭제 파일 없음. GitHub Desktop Changes에서 검토 후 commit/push합니다.

Windows npm 실행을 Node CLI 직접 실행으로 보정하고 POSIX shell 전용 lock fallback fixture를 플랫폼 독립 Node fixture로 교체했습니다. shell을 사용하지 않으며 공백과 &가 포함된 임시 경로에서도 fallback과 기존 lock 복원을 검증합니다.

Repository preflight 55/55 PASS, 실제 Windows npm CLI 실행 PASS, npm ci --ignore-scripts 성공(557 packages), typecheck PASS, lint PASS, Vitest 75 files / 283 tests PASS, Vite build PASS, lock fallback/restoration fixture PASS. API/Worker, 실제 음성 모델, Android/iOS, 배포 화면 검증은 이번 개발 도구 수정 범위에서 미실행. build에 500kB chunk 권고가 남습니다. 로컬 Node 24.16.0/npm 11.13.0이며 CI 고정 런타임 재검증은 Push 후 필요합니다.

제품 semver는 유지됩니다. 전체 ZIP에는 실제 .env, .git, node_modules, dist, 모델/사용자 음성을 포함하지 않습니다.
