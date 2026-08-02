# SoriON AI 0.9.3-beta.3 CI Hardening 6 Patch

기준본은 `0.9.3-beta.3 CI Hardening 5`입니다. ZIP을 저장소 루트에 덮어쓴 뒤 GitHub Desktop에서 변경사항 전체를 Commit·Push합니다.

이번 패치는 PWA precache를 막던 2.46MB 로고를 1024px 약 1.01MB로 최적화하고, 1.5MiB asset budget 검사를 추가합니다. Firebase 공개 Web 설정 6개는 `.env.development`와 `.env.production`에 등록되어 로컬 개발과 GitHub Pages production build에서 자동 로드됩니다.

`.firebaserc`는 `device-streaming-96b2272c` 프로젝트를 가리킵니다. Firestore와 Storage는 현재 사용하지 않으므로 제공된 규칙 파일이 모든 읽기·쓰기를 차단합니다. `firebase.json`은 무료 정적 Hosting 전용 정책을 유지합니다.

삭제 파일은 없습니다. 별도 환경변수 입력이나 터미널 명령 없이 패치 덮어쓰기 후 GitHub Desktop Commit·Push로 적용할 수 있습니다.
