# 0.11.45 R1 · Chromium Startup CI Hotfix

기준: 0.11.45 (9c9322f), 제품 semver 0.11.45 유지.

## 원인

GitHub Actions run 39552501846에서 데스크톱 visual runner의 Chromium `DevToolsActivePort`가 15초 안에 생기지 않아 두 번 연속 실패했습니다. 같은 커밋의 모바일 runner는 정상 통과해 제품 UI나 baseline 차이가 아니라 데스크톱 브라우저 시작 단계의 가변 지연으로 분류했습니다. DBus 주소 오류 로그만으로는 원인을 확정할 수 없습니다.

## 변경

- Chromium 시작/endpoint 준비를 최대30초 기다립니다.
- 실패 시 이전 프로세스가 종료됐는지 확인하고 프로필을 정리한 뒤 새 프로필로 단 한 번 재시도합니다.
- 종료 신호와 exit code를 모두 확인합니다. 두 번 실패하면 이전과 같이 오류·stderr와 runner-failure.json을 남기며 실패 처리합니다.
- 화면 크기, 검사 기준, screenshot/baseline 승인 정책과 제품 UI는 변경하지 않습니다.

## 검증

Node syntax, visual runner 정적 계약, Repository preflight 55/55 PASS. Windows Chrome에서 desktop1024/1280/1440과 mobile360/390/430 검사 PASS. 실제 GitHub Actions Ubuntu의 안정성은 이 커밋의 CI 결과로 확인합니다.

## 제한

한 번의 재시도는 일시적인 시작 지연만 복구합니다. 브라우저 실행 환경이 계속 준비되지 않으면 원래처럼 CI를 실패시킵니다. 실제 음성 엔진·실기기 청취는 이 안정화 패치 범위 밖입니다.
