# 0.11.35 R1 · Web Quality Hotfix

`VoiceListeningQaCard.tsx`의 localStorage 재조회 트리거용 `revision` state를 제거하고 QA entries 자체를 React state로 관리합니다. 저장 후 repository를 다시 읽어 `setEntries(...)` 하므로 UI 즉시 갱신은 유지되며 React Hooks unnecessary dependency 경고는 제거됩니다.

0.11.35 full ZIP 패키징에서 누락된 `.env.example`도 복구했습니다. 실제 `.env`/secret은 포함하지 않습니다.

검증: Voice Listening QA contract PASS, Repository preflight 55/55 PASS. 제품 semver는 0.11.35를 유지합니다.
