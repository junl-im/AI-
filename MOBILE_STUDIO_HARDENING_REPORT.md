# SoriON Mobile Studio Integration & Performance Hardening

## Scope

This patch is intentionally focused on mobile interaction stability and end-to-end linkage. It does not change TTS engine policy, queue ordering, recovery semantics, or desktop timeline behavior.

## Findings addressed

1. **Soft-keyboard viewport churn**
   - `visualViewport.resize` and `visualViewport.scroll` could both run editor alignment repeatedly while the keyboard animates.
   - Alignment now coalesces viewport events through one `requestAnimationFrame`, accounts for `visualViewport.offsetTop`, and respects reduced-motion preference.
   - Global type-to-focus is skipped on coarse-pointer phone layouts to avoid unnecessary mobile key handling.

2. **Player Dock render isolation**
   - Playback time can update several times per second.
   - The primary Dock navigation is now a memoized child and page navigation uses a stable callback, so playback progress does not need to re-render the navigation subtree.
   - Dock page changes use next-frame instant top alignment instead of a smooth animation competing with lazy page layout.

3. **Touch-native timeline multi-selection**
   - Desktop supported Ctrl/Cmd click and Shift click, but a phone has no modifier keys.
   - Voice clips and pause clips now expose a touch selection toggle on phone layouts, while the existing desktop modifier-key flow remains unchanged.

4. **Safe-area and tap ergonomics**
   - Workspace bottom clearance now includes `safe-area-inset-bottom` so the fixed player/navigation Dock does not cover the final controls on devices with a home indicator.
   - Mobile Dock navigation targets are 48px tall and common mobile controls use `touch-action: manipulation`.

5. **MY VOICE mobile bridge guard**
   - If the previous Live Voice + MY VOICE integration is installed, the existing mobile quality checker additionally requires:
     - MY VOICE section in the voice sheet,
     - HomePage timeline selection bridge,
     - Timeline `onSelectionChange` bridge.
   - MY VOICE list height is bounded on phone screens so a large personal library cannot push the normal voice controls off-screen.

## Suggested device matrix

- 360x800: smallest supported phone flow
- 390x844: common modern phone
- 430x932: large phone
- 768x1024: tablet boundary check
- 820x1180: tablet boundary check

For each phone size verify: open voice picker -> select voice/MY VOICE -> select one or multiple timeline clips -> generate -> first playback -> pause/resume -> navigate to My Voice and back -> confirm player continuity and no content hidden behind the Dock.

## Real Chromium mobile layout mode

The existing dependency-free visual regression runner is extended with `--mobile`.

`npm run quality:mobile-layout` now drives Chromium through CDP at:

- 360x800
- 390x844
- 430x932

The mobile fixture uses the new touch multi-select buttons instead of Ctrl/Cmd-click, then checks horizontal overflow, bottom navigation visibility, >=44px navigation tap targets, touch multi-select visibility, editor/timeline containment, and fixed Dock clearance. Screenshots and a manifest are written to the existing `.sorion/web-quality` evidence area. Desktop `quality:visual-layout` remains unchanged unless `--mobile` is supplied.
