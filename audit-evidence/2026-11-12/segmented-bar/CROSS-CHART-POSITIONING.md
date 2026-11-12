# Cross-chart detail positioning review

Reviewed the line, bar, grouped bar, and segmented bar components.

- Bar cards previously sat at the row's right edge regardless of hover location. They now anchor horizontally to the pointer within the active row, or to the category button for keyboard focus. Pinned cards stay put; entering the card does not move it. Listener cleanup follows the existing controller lifecycle.
- Grouped bars render the same bar component and inherit the fix.
- Bar and segmented bar now reuse `packages/chart-core/src/ui/position-floating-card.ts` for viewport/container clamping, vertical placement, and narrow-screen/oversized-card flow fallback.
- Line tooltips already use the active point and switch sides near chart edges, with horizontal scroll-window clamping. No implementation change needed; a new browser regression verifies first/last point placement and Escape dismissal.

Validation: 318 unit tests; all package typechecks; all three builds and packed-consumer checks; 8 bar browser tests, 8 line browser tests, 9 segmented browser tests, and 5 grouped browser tests passed. Coverage includes keyboard focus/dismissal, pointer movement and card entry, right-edge clamping, 320px layout, forced colors, and automated accessibility checks. Visually inspected `tmp/segmented/bar-anchored-details.png`.

Initial browser launch failed because Playwright's bundled Chromium was absent. Reran successfully using installed Chrome. Audit Vite logs include unrelated dependency-scan warnings from a saved QA HTML file in tmp; fixture tests completed successfully. No manual screen-reader testing or deployment performed.
