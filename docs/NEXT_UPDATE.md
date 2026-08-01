# NEXT UPDATE

현재 기준: `0.8.6 Longform Voice Studio & Session Persistence`

## 목표 버전

`0.8.7 Korean Voice Quality Streaming`

## 방향

장문 제작 IA와 자동 연결 경계를 유지하면서 실제 한국어 AI 음질과 첫 음성 체감 속도를 높인다.
공개 API 배포가 먼저 준비되지 않으면 AI 엔진 성공으로 표시하지 않는다.

## 1. 실제 엔진 품질

- 공개 HTTPS FastAPI와 GPU Worker 배포 템플릿
- Fun-CosyVoice 3 일반 TTS Adapter 실제 등록
- 한국어 숫자·고유명사·장문 호흡 평가 세트 확대
- 시스템 음성, MeloTTS, CosyVoice 결과의 블라인드 비교
- 장문 중간 문장 실패 시 해당 구간만 재생성

## 2. 스트리밍 체감 속도

- 첫 문장 음원부터 Progressive Playback
- SSE 진행률과 첫 오디오 지연 측정
- 장문 블록 선행 생성과 안전한 제한 병렬화 검토
- 재생 순서와 생성 순서가 어긋나지 않는 queue 계약

## 3. 운영 안정성

- 공개 API 인증과 rate-limit 정책
- Worker GPU health·모델 버전·VRAM 운영 지표
- Actions에서 공개 API URL 누락을 배포 전 명확히 표시
- Android Chrome·iOS Safari·설치형 PWA 실기기 검증
