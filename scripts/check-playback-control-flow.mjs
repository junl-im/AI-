import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8')
}

function requireText(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: 필수 계약을 찾지 못했습니다: ${needle}`)
  }
}

const dock = await read('src/components/navigation/LinkedPlayerDock.tsx')
const tests = await read('src/components/navigation/LinkedPlayerDock.test.tsx')
const playerCss = await read('src/styles/player-dock.css')
const dubbingCss = await read('src/styles/dubbing-overlays.css')

requireText(dock, 'setPlaying(true)\n        startBrowserSpeech()', '브라우저 음성 즉시 전환')
requireText(dock, 'setPlaying(true)\n    try {\n      await element.play()', '파일 음원 즉시 전환')
requireText(dock, "aria-label={waitingForSegment ? '다음 구간 대기' : playing ? '일시정지' : '재생'}", '재생 버튼 라벨')
requireText(dock, 'aria-pressed={playing}', '재생 버튼 상태')
requireText(dock, 'speechRunIdRef.current !== speechRunId', '취소된 브라우저 재생 callback 차단')
requireText(tests, '실제 media 이벤트를 기다리지 않고 일시정지 버튼으로 바뀐다', '파일 재생 UX 회귀 테스트')
requireText(
  tests,
  "render(<LinkedPlayerDock />)\n    pause.mockClear()",
  '렌더 초기 pause 호출과 사용자 일시정지 호출 분리',
)
requireText(tests, '브라우저 음성도 시작 이벤트 전에 일시정지 버튼을 먼저 표시한다', '브라우저 재생 UX 회귀 테스트')
requireText(playerCss, '.soa-player-transport > .soa-player-toggle.is-playing', '고정 Dock 재생 상태 스타일')
requireText(dubbingCss, '.soa-dubbing-player-controls button.is-primary.is-playing', '만들기 재생 상태 스타일')

console.log('Playback control flow contract 통과 · 재생 -> 일시정지 -> 재생 순서 보장')
