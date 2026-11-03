# Line chart accessibility audit evidence — 2026-10-21

Scope: line chart browser interaction, presentation, and lifecycle states. This is supporting evidence for the repository audit, not a claim of WCAG AAA conformance. Formal target supplied by the user: WCAG 2.2 AAA where applicable.

## Browser and routes

- Chrome 155.0.8059.86, Playwright headless; fresh browser contexts.
- Demo routes exercised locally on `http://127.0.0.1:5192/dev.html` (3 charts); browser regressions exercised on `http://127.0.0.1:5189/packages/line-chart/browser-tests/fixture.html`.
- Viewports 320, 375, 390, 480, 640, 768, 1024, 1280, and 1440 CSS px: document `scrollWidth` equalled `innerWidth` at every width; no page-level horizontal overflow. The chart's own data/plot region can scroll where its contents need it.
- Firefox and WebKit (Playwright) regressions: 17/17 passed after focus-recovery changes, including empty/error transitions, modal reconnect, modal Tab after content replacement, and line/bar controls.

## Verified outcomes

- Line browser regression plus audit suites on Chrome: 17/17 passed (13 audit + 4 line-specific). Five focused line unit suites: 80 tests passed; TypeScript `tsc -p tsconfig.json --noEmit` passed.
- Axe `wcag2aaa`, `wcag21aaa`, `wcag22aaa` on the three-chart dev page: no violations after tooltip/status contrast changes. The new line browser regression repeats AAA-tagged axe on the fixture.
- AAA target size measurements: visible labels, buttons, selects, and disclosure summaries have computed boxes at least 44 CSS px in both dimensions; checkboxes are 20×20 inside 44px labels. Forced-colors focused navigator outline measured 3px and nontransparent; reduced-motion pressed transform measured `none`.
- Tooltip/default status text now inherits system `CanvasText` with `Canvas` surface. The former gray row text measured 5.08:1 on white and red badge text 5.62:1; both were below 7:1. Axe AAA returned no contrast violations after correction. Actual arbitrary user-supplied theme/custom styles were not exhaustively sampled.
- Initial render no longer exposes a default tooltip. Keyboard focus/period movement reveals the card; Escape dismisses it while retaining navigator focus, and another navigation key reveals it again. Pointer hover remains ECharts-owned and the card is not an interactive/tab-stop surface.
- Period slider has a concise localized accessible name and short keyboard help description; it no longer references the entire data table. DOM `aria-valuetext` and polite live text contain the canonical selected-period narrative.
- Important platform limitation: Chrome CDP Accessibility output reported native range `valuetext` as the numeric step (`1`) in this component and a standalone minimal input, despite DOM `aria-valuetext` containing the full narrative. A custom `role=slider` check returned empty `valuetext`. This appears to be a browser/accessibility-tree exposure limitation, not proof of what assistive technology announces. Live region is retained as a compatibility announcement path. No human screen-reader test was available, so spoken output, duplication, and announcement timing remain unverified.
- Focus remains on the chart when an action disappears, when data becomes empty, when invalid data replaces empty data, and when period controls become unavailable. Native modal state remained truthful on reconnect; explicit document-level Tab progression fixed WebKit escape after dialog content replacement.

## Remaining evidence limits

- No actual NVDA, JAWS, VoiceOver, or TalkBack session was performed. Do not infer complete screen-reader parity from DOM, Playwright snapshots, or CDP.
- Axe automated checks do not establish all WCAG AAA success criteria. Visual inspection was limited to the listed line routes and viewport widths; browser/device combinations, magnification, color-vision simulation, and user testing were not exhaustive.
- Status/tooltip contrast was measured in default system colors; custom theme colors and every target-range fill/line combination have not been independently contrast-sampled.
