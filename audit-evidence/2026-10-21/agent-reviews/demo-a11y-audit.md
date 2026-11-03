# Demo-shell accessibility audit — 2026-10-21

## Scope

Inspected the five active routes: the chart gallery, line development page, generated standalone line demo, report prototype, and generated standalone bar demo. Historical Angular material is not part of the active route set. Source templates and shell CSS were updated; generated line/bar pages and the report page were rebuilt.

## Changes made

- Added keyboard skip links to both line demo variants and the bar demo, with focusable destinations and a named chart-examples section in the line demo.
- Fixed line demo flex sizing so chart examples stay within the viewport column at 320 CSS px.
- Raised shell-level settings/navigation targets to at least 44 by 44 CSS px, including gallery links, configuration summaries/labels, checkbox labels, selects, and color inputs. Changed gallery muted text and the bar-chart demo-hint color to AAA-level contrast.
- Changed the report page from an “official ADAPT website” claim to an explicit, visible design-prototype notice. Static actions, menu, and breadcrumb are identified as non-interactive previews; the breadcrumb preview is now inside `main`, and the skip target receives focus.
- Improved the report shell colors that failed enhanced contrast checks and clarified its audience status as illustrative.
- Replaced the bar demo’s fake `example.org/reporting` references with a local `#reporting-notes` anchor and a localized note on the same page.
- Added browser tests for keyboard skip behavior, English/French UI state, the local reporting-note link, all active routes, all requested viewport widths, and shell-owned 44px targets.

## Evidence and results

- All five routes returned HTTP 200 and reported one `main`, one `h1`, no uncaught browser errors, and no broken `aria-labelledby`/`aria-describedby`/`aria-controls` references except the chart-component issue below.
- Gallery rendered 10 examples (5 line, 5 bar); line routes rendered 3 charts each; report rendered 1; bar rendered 4.
- Document horizontal overflow was zero at 320, 375, 390, 480, 640, 768, 1024, 1280, and 1440 CSS px on every active route. A 320px test with WCAG text-spacing override values also produced no document overflow.
- Axe scans returned zero violations across the five routes’ default, available modal, expanded, French, and Spanish states. This included WCAG 2.2 A/AA and best-practice rules plus axe’s enhanced-contrast rule. The local axe report and viewport/structure ledger are in `/tmp/a11y-chart-shell-audit-final/axe.json` and `routes.json`; spacing and forced-colors screenshots are in the same folder.
- Playwright shell tests passed 5/5 using the installed Chrome channel:
  `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome ./node_modules/.bin/playwright test --config playwright.audit.config.mjs browser-tests/demo-shells.spec.ts`

The 44px check applies to the shell-owned targets exercised by the new browser test. Chart-internal targets were excluded from that check because chart-source work is outside this shell task.

## Outstanding / limits

- The route ledger identifies one hidden gallery bar-chart dialog with `aria-labelledby="a11y-bar-chart-5-dialog-title"` whose referenced ID is absent from the light DOM. Axe did not report it, but it is a component-generated reference that should be checked by the chart owner.
- No screen-reader or assistive-technology session was run. Browser accessibility trees, axe, keyboard interaction, and responsive rendering do not establish complete WCAG conformance.
- WCAG 2.2 AAA was the audit target where applicable; this is not a conformance certification. WCAG’s AAA enhanced contrast target is 7:1 for normal text (4.5:1 for large text), and Target Size (Enhanced) specifies 44 by 44 CSS px subject to its exceptions. Reflow’s 320px criterion is Level AA. [Contrast (Enhanced)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced), [Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced), [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
