# Dalbit Unse voice bridge

`byeolha.html` is a small, isolated entry point for the SoriON Byeolha F1 voice. The Dalbit Unse page embeds it invisibly after the visitor turns on narration. It reuses SoriON's existing `synthesizeSupertonicWav` implementation and downloads the public local model on first speech.

Only same-origin messages from `/meta/AIPlayground/DalbitUnse/dist/` are accepted. Requests contain the text to narrate, not the user's birth form values. `speak` replies with a WAV Blob or an error; `stop` aborts synthesis. The normal SoriON app and its service worker remain independent.

The bridge is deployed by the existing GitHub Pages build with `VITE_BASE_PATH=/AI-/`. Deploy this repository before enabling the companion connector in `junl-im/meta`.
