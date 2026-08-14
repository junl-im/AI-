# SoriON Voice Deck Visual Identity · 0.11.18

## 목표

랜딩의 Live Voice 영역을 기능 패널이 아니라 SoriON AI의 핵심 경험을 압축해서 보여주는 대표 시각 요소로 사용합니다.

이번 변경은 기능 추가가 아닙니다. 현재 Voice, Voice 종류, Engine, readiness, TTS workspace 진입 기능은 그대로 유지하고 표현 방식만 전면 교체합니다.

## Visual hierarchy

1. **Voice identity** — 큰 아바타와 성우 이름을 첫 시선에 둡니다.
2. **Voice signal** — 별도 카드 안에 갇힌 파형이 아니라 콘솔 중앙을 가로지르는 full-bleed signal로 표현합니다.
3. **Engine rail** — 엔진 정보는 작은 보조 레일로 낮춰 Voice보다 앞서 보이지 않게 합니다.
4. **Primary CTA** — `텍스트를 음성으로`는 오른쪽의 고대비 action으로 유지합니다.
5. **Readiness** — READY/LIVE/LIMITED/OFFLINE 상태는 상단의 작은 status capsule로만 표현합니다.

## SoriON visual language

- background: near-black navy
- voice spectrum: cyan → violet → soft pink
- avatar: illuminated voice source
- waveform: signal, not chart
- border/shadow: low-contrast glass depth
- typography: voice name dominant, metadata subordinate

## 유지 계약

- Live Voice accessibility label 유지
- MY VOICE / SoriON VOICE 구분 유지
- Engine 이름/ID 유지
- readiness text 유지
- `텍스트를 음성으로` workspace navigation 유지
- `prefers-reduced-motion` 대응 유지
- CTA `focus-visible` 유지
