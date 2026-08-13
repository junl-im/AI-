# Workflow Hardening 0.11.14

## 목적

SoriON의 단일 GitHub Actions workflow와 Dependabot 설정을 2026-08 기준으로 점검하고,
재현성·동시 실행 격리·캐시 수명·의존성 업데이트 누락을 줄입니다.

## 확인된 문제와 수정

1. GitHub 공식 Actions 일부가 이전 메이저에 고정되어 있었습니다.
   - checkout v6 -> v7
   - setup-python v6 -> v7
   - upload-artifact v6 -> v7
   - download-artifact v7 -> v8
   - cache restore/save v5 -> v6
   - setup-node v6, configure-pages v6, upload-pages-artifact v5, deploy-pages v5는 현재 계약을 유지합니다.
2. 수동 workflow의 concurrency group이 `runtime_soak_minutes` 값만으로 묶일 수 있어 서로 다른 ref의 수동 실행이 취소/대기 관계가 될 수 있었습니다.
   - ref 또는 PR 번호를 항상 group에 포함하고, lock 생성/soak 같은 수동 maintenance run은 같은 ref에서 서로 취소하지 않고 직렬화합니다.
3. npm registry cache는 run id/attempt를 key에 포함해 동일 lock에서도 새 cache가 계속 생길 수 있었습니다.
   - lock hash 기반 안정 key를 사용하고 exact hit일 때 save를 생략합니다.
4. 일반 Push/PR에서 API·Worker `uv.lock`이 없으면 CI가 자동 생성할 수 있었습니다.
   - npm과 동일하게 일반 실행은 committed lock을 요구하고, `workflow_dispatch + generate_lockfiles=true`만 생성합니다.
5. Dependabot이 Worker uv dependencies와 GitHub Actions를 추적하지 않았고 API도 legacy `pip` ecosystem으로 설정되어 있었습니다.
   - API/Worker를 `uv` ecosystem으로 등록하고 `github-actions` 업데이트를 추가합니다.
6. setup/install 단계가 일찍 실패하면 `if: always()` artifact 업로드가 증거 경로 부재로 2차 실패할 수 있었고, recovery drill이 시작되지 않은 경우에도 최대 60초 evidence wait가 실행될 수 있었습니다.
   - checkout 직후 placeholder evidence를 만들고, recovery drill wait는 drill이 실제 시작된 경우에만 실행합니다.

## 유지한 결정

- 활성 workflow는 `.github/workflows/ci.yml` 하나입니다.
- 전역 `contents: read` 최소 권한과 Pages deploy job의 `pages: write`, `id-token: write`만 유지합니다.
- preflight 실패가 API·Worker 품질 결과까지 가리지 않도록 failure-domain 분리는 유지합니다.
- lock 생성은 저장소에 자동 commit/push하지 않습니다.
- `astral-sh/setup-uv`는 검증된 commit SHA 고정을 유지합니다.

## 회귀 방지

`scripts/check-ci-failure-domains.mjs`와 `scripts/check-project-rules.mjs`가 다음을 검사합니다.

- 최신으로 채택한 Action major가 workflow에 존재하는지
- 폐기한 Action major가 재유입되지 않는지
- API/Worker committed uv lock gate가 유지되는지
- npm cache가 lock hash 기반이고 exact cache hit에서 중복 save하지 않는지
- manual concurrency group이 ref를 포함하는지
- Dependabot이 npm, API uv, Worker uv, GitHub Actions를 모두 추적하는지
