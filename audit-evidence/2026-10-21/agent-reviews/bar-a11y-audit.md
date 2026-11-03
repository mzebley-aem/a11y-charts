# Bar chart accessibility audit evidence

Date: 2026-10-21

## Coverage and evidence

- Chrome browser fixture route: `/packages/line-chart/browser-tests/fixture.html`; six Playwright regressions in `packages/line-chart/browser-tests/bar-accessibility.spec.ts` passed. Coverage includes category reading names, Arrow Up/Down and Home/End navigation, normal Tab sequence, preview/pin/Escape behavior, zero/missing/suppressed values, logical focus after replacement/removal and disabling details, invalid data, modal visibility changes, 44 CSS-pixel targets, and 7:1 status contrast.
- Demo routes checked in the running Vite server: `/demo-gallery/index.html` (all five gallery examples) and `/packages/bar-chart/demo/index.html` (all four standalone examples). Earlier axe-core scans reported zero violations on both routes after fixing the button-name and hidden scroll-region issues. No browser page errors occurred.
- At a 320 CSS-pixel viewport with text spacing overrides (line height 1.5, letter spacing .12em, word spacing .16em, paragraph margin 2em), both routes remained at 320 CSS pixels of document scroll width. Chart component client widths were 278px in the gallery and 304px standalone.
- Emulated forced-colors and reduced-motion checks confirmed system-color track/target/focus styling, solid 3px focus outline, and zero transition duration. At 320px, the page remained within the viewport.
- Default status label contrast measured approximately 7.35:1 for “met” and 7.75:1 for “not met”; muted text was approximately 7.01:1. Visible chart actions, category triggers, and inline disclosure summaries measured at least 44px in each dimension.

## Implementation notes

Category trigger names retain the visible category label and formatted values, then identify their meaning in order: for example, “Alpha Percentage of total: 30.00% Count: 3 …”. The values are ID-referenced from the same numeric spans shown visually. Keyboard instructions are exposed once on the first trigger to avoid repetitive help being read for every category. All category triggers remain tabbable; arrow/Home/End movement is optional and does not trap Tab.

The offscreen background table is no longer a focusable scroll region; visible table wrappers remain named and keyboard accessible. Inline-mode empty dialog shells use a valid fallback name until a dialog heading exists, preventing dangling `aria-labelledby` references.

## Limits

No real screen-reader audio/listening session was performed. The name evidence comes from browser accessibility-name computation, DOM relationships, axe-core, and Playwright. Forced-colors and reduced-motion were browser emulations, not physical display settings. Contrast evidence covers the tested default state palette; user-supplied custom themes can intentionally choose different colors.
