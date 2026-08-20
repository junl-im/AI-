# 0.11.28 Voice Naturalness & Preview Quality Patch

Base: `0.11.27 R2 · Recovery Scene Selection Stabilization`
Target: `0.11.28 · Voice Naturalness & Preview Quality`
Delete count: 0

## Purpose

- reduce metallic/electronic pitch artifacts in built-in preset previews, especially 혜린;
- keep the 0.11.24 R1 natural speaking-rate calibration unchanged;
- make Browser Speech a conservative device-voice approximation instead of using aggressive pitch shaping;
- preserve Kakao direct user-gesture playback, 1.8s start watchdog, and external-browser fallback.

## Apply

Extract this PATCH ZIP directly over a clean `0.11.27 R2` repository root, review changes, then commit and push. Do not apply it to an older plain 0.11.27/R1 baseline.

## Important limitation

Browser Speech still depends on the OS/browser Korean voice. This patch reduces artificial pitch coloration but cannot turn a low-quality system voice into a neural actor voice. Verified neural reference/model audio remains a separate quality tier.
