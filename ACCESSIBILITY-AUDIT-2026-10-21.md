# Chart accessibility audit — October 21, 2026

## Target and verdict

Target requested: **WCAG 2.2 AAA wherever applicable**, with exceptional keyboard,
screen-reader, and state-transition behavior as the product-quality goal.
The audit covers local, active framework-free chart demos. It does not certify
conformance or claim a completed spoken screen-reader evaluation. Actual
VoiceOver/Safari, NVDA/Firefox or Chrome, and mobile screen-reader listening
remain release gates. Browser trees are evidence about exposed semantics, not
proof of spoken output. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and
[W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/conformance/)
provide the audit framework.

## Scope and method

Five active routes, 21 chart instances (the two line demo variants intentionally
repeat three examples):

| Route on http://127.0.0.1:5189 | Charts | Coverage |
|---|---:|---|
| `/demo-gallery/index.html` | 5 line + 5 bar | All examples, author settings, resets, cards, dialogs, inline tables |
| `/packages/line-chart/demo/dev.html` | 3 line | Source demo, controls, locales, cards, dialogs |
| `/packages/line-chart/demo/index.html` | 3 line | Generated standalone equivalent |
| `/packages/line-chart/demo/report-demo.html` | 1 line | Report prototype shell and customized controls |
| `/packages/bar-chart/demo/index.html` | 4 bar | Generated standalone, controls, locales, cards, tables |

The WebKit keyboard checks use Option+Tab for initial links when its platform
keyboard preference skips links during plain Tab. Modal traversal is explicitly
contained; ordinary chart traversal retains the browser's keyboard behavior.

The gallery also runs at http://127.0.0.1:5191/. The frozen Angular reference app,
external destinations, arbitrary consumer HTML/themes/custom tooltip renderers,
and deployment environments are excluded. Prototype report chrome is explicitly
identified as noninteractive; it is not a production reporting application.

Methods: axe-core including enhanced contrast, DOM/ARIA/link inventory, keyboard
interaction through Playwright, computed dimensions/styles, Chrome accessibility
tree inspection, Firefox and WebKit interaction checks, and screenshot review.
Viewport widths: **320, 375, 390, 480, 640, 768, 1024, 1280, 1440 CSS px**.
320px supplies the 400%-zoom-equivalent reflow width of a 1280px viewport; this
is not a claim of an actual browser zoom or text-only enlargement session.
Expanded content also receives the text-spacing override (1.5 line height,
0.12em letter spacing, 0.16em word spacing, 2em paragraph spacing). Forced colors
and reduced motion are exercised in browser tests and screenshots.

Raw evidence and reproducible tooling:

- `audit-evidence/2026-10-21/before/axe.json`: initial scan leads.
- `audit-evidence/2026-10-21/routes.json`: final route, width, reference and link ledger.
- `audit-evidence/2026-10-21/axe.json`: final state/localization scans, including incomplete checks.
- `packages/line-chart/scripts/audit-accessibility.mjs`: rerunnable full route sweep.
- `packages/line-chart/browser-tests/`: interaction, focus-transition, shell, and scan regressions.

## Findings and remediation

| ID | Severity | Finding | Criteria / relationship |
|---|---|---|---|
| A11Y-01 | High | Tooltip, muted demo text, and report colors missed enhanced contrast; report “Un-publish” also missed AA | 1.4.6 AAA; report 1.4.3 AA |
| A11Y-02 | High | Chart action targets and disclosure/authoring controls were below 44×44px | 2.5.5 AAA, subject to native/inline exceptions |
| A11Y-03 | High | Focus escaped a line modal after updating data in WebKit | 2.1.1, 2.4.3; correct modal interaction |
| A11Y-04 | High | A focused line action lost focus to the document when data became empty | 2.4.3; state recovery |
| A11Y-05 | Medium | Bar detail trigger names did not contain their visible label text in the tested standalone demo | 2.5.3 AA |
| A11Y-06 | Medium | Demo pages lacked keyboard bypass links or complete landmark containment | 2.4.1; landmarks also a best practice |
| A11Y-07 | Medium | Dismissed bar cards failed to reopen on keyboard reentry while the pointer remained over the row | Predictable focus/hover state parity |
| A11Y-08 | Medium | Named summary/indicator/table/configuration elements lacked suitable roles; hidden fallback used an empty ARIA boolean | Semantic exposure and valid ARIA |
| A11Y-09 | Medium | Pending smooth-scroll reveals could reopen line cards after dismissal or focus departure | Predictable keyboard card visibility |
| UX-01 | Medium | Line navigator repeated directions in its name; initial tooltip obscured the chart before interaction | Reading clarity and predictable discovery |
| UX-02 | Medium | Bar card reading omitted the category definition and lacked quick category navigation | Keyboard/SR parity beyond basic operability |
| UX-03 | Medium | Prototype shell claimed official status; reporting-note links pointed at a placeholder | Content truthfulness and functional destinations |
| UX-04 | Low | Screen-reader-only fallback tables were styled as scroll regions; an unused hidden dialog referenced an absent title | Avoid invisible focus traps and invalid reference state |

Initial measurements include tooltip gray text **5.08:1**, white badge text on
red **5.62:1**, gallery muted text approximately **5.35–6.07:1**, report action
blue **6.01:1**, and report danger text **4.41:1**. These are measured initial
conditions, not current color guarantees for custom consumer themes. Controls
included 36px line actions, 40px bar actions, and approximately 29px glossary
toggles. WebKit additionally rendered native demo selects at 23px despite min-height; an
explicit height corrected their hit area. Retests measure effective label/button hit areas rather than demanding
that a native checkbox glyph itself be 44px.

Manual review of axe incomplete results found the semantic grouping and empty
ARIA boolean issues listed above. Hidden-dialog reference leads are separately
checked against the actual DOM ID inventory. Incomplete contrast results remain
explicit in the raw evidence; a zero-violation result is not universal contrast proof.

The hidden-table scroll flags are not evidence that screen-reader users could
not read the table. The correction keeps hidden fallback content readable
without creating invisible keyboard stops, while visible overflowing data
regions must remain named and keyboard-scrollable.

The findings above have been remediated locally and covered by the final checks
below. Spoken assistive-technology behavior remains a separate open verification
gate, not a resolved finding inferred from these fixes.

## Keyboard and state contract

Line: Tab into the period navigator; Left/Right and Home/End select periods;
readings distinguish actual, target/range, outcome, missing/suppressed values,
and baseline context. Escape dismisses the card without losing the selected
period or focus. The initial chart remains unobscured until interaction.
Zoom and restore remain synchronized with the reader control.

Bar (when detail cards are enabled): focus a category for its complete reading;
Up/Down and Home/End move between categories; normal Tab still enters/exits the
sequence. Enter/Space pin or unpin, and Escape dismisses without moving focus.
Definitions and target interpretation are available in the reading. Cards remain
opt-in; ordinary lists and data tables provide core content without transient UI.

The tested transition families include focus/hover preview, pinned/dismissed
cards, pointer travel, dialog open/close, forward/reverse Tab, view changes,
settings changes, data replacement, focused category removal, disabled details,
empty/invalid data, and disconnect/reconnect. A test covers a named scenario;
this does not mean every possible combination of API options is exhaustively tested.

Regression coverage maps the state families to these checks:

| State family | Expected focus behavior | Evidence |
|---|---|---|
| Initial, hidden, revealed, reconnect | No initial overlay; initialize when visible; retain modal behavior on reconnect | `audit.spec.ts`, `line-accessibility-regressions.spec.ts` |
| Focus/hover, pin, Escape, reentry | Reading matches focused item; dismissal retains focus; reentry restores access | `bar-accessibility.spec.ts`, `artifacts.spec.ts`, shared UI unit tests |
| Previous/next, arrows, Home/End | Preserve logical selection; recover when an endpoint button becomes disabled | `audit.spec.ts`, line/bar accessibility regressions |
| Data dialog, Tab/Shift+Tab, close | Keep focus inside the active dialog and return to a remaining opener | `audit.spec.ts`, bar accessibility regressions |
| Settings, reset, zoom/restore | Preserve focus and synchronize the chart and reading control | `gallery.spec.ts`, `audit.spec.ts` |
| Data replacement/removal, empty/error | Preserve identity where possible; otherwise focus a remaining control or explanatory message | `focus-transitions.spec.ts`, line/bar accessibility regressions |
| Narrow viewport, text spacing, forced colors, reduced motion | Maintain readable content, usable targets and visible focus | Route sweep, accessibility regressions, visual review |

## Accessibility-tree investigation

The line navigator retains both its narrative `aria-valuetext` and a polite live
reading. Chromium, Firefox and WebKit DOM probes confirm that both update with
period navigation. Playwright snapshots show the numeric range step instead.
Chrome CDP also exposes a numeric value text in a minimal native-range reproduction
and an empty value text in a minimal ARIA-slider reproduction. This is an unresolved
accessibility-tree exposure discrepancy in this environment, not evidence that a
particular screen reader speaks the wrong value. The fallback's actual timing and
possible duplicate speech require listening. Full probe evidence is preserved in
`audit-evidence/2026-10-21/agent-reviews/a11y-cross-engine-evidence.md`.

## Screen-reader release gate

Do not sign off “exceptional” or WCAG AAA based on an axe score. Run and record:

1. VoiceOver with Safari on macOS, NVDA with Firefox/Chrome on Windows, and the
   relevant mobile pairing (VoiceOver/Safari and/or TalkBack/Chrome).
2. Read heading/summary/context, then enter each chart's reading control. Confirm
   actual/target/range/outcome/definition/baseline information is understandable
   and not skipped, duplicated, interrupted, or announced out of order.
3. Read first/middle/last, missing, suppressed, zero, equal-target, above/below,
   and within/outside-range cases. Verify the current position is discoverable.
4. Pin/dismiss/reenter cards, move across periods/categories, and Tab away/back.
   Confirm no stale reading and no hidden content in the keyboard path.
5. Open Data, traverse captions/headers/rows, Shift+Tab/Tab through the modal,
   close it, and confirm return to the opener. Repeat after data/view changes.
6. Trigger empty/invalid data and remove the currently focused category/control;
   confirm both focus recovery and an intelligible explanation.
7. Test real 200%/400% browser zoom, text-only enlargement, touch exploration,
   and screen-reader verbosity settings. Review data graphics in forced colors.

No media, authentication, transactions, timed tasks, or irreversible form
submissions exist in these demos; those WCAG families are not exercised by this
scope. Plain-language explanations and definitions help comprehension, but a
formal reading-level/user study was not performed. Arbitrary host themes and
trusted custom HTML tooltip callbacks require their own contrast/semantics checks.

## Verification results

- **232 unit tests passed** (131 line/shared, 101 bar); both package typechecks and the gallery typecheck passed.
- **47/47 browser tests passed in each of Chrome, Firefox and WebKit** (141 engine/test executions). Final engine results are preserved in `audit-evidence/2026-10-21/checks/`.
- **8 packed-artifact browser checks passed**, covering standalone/ESM use, coexistence, touch, forced colors, and card reentry.
- Both packages, both standalone demos, the report prototype and the gallery rebuilt successfully. Packed runtime/declaration smoke checks passed. Vite's existing large-bundle advisory remains for the ECharts-containing demo builds.
- **35 state/localization scans across 5 routes and 21 chart instances: zero automatic violations**, including the enabled AAA enhanced-contrast rules.
- **45 viewport checks:** no page-level horizontal overflow; all five text-spacing checks passed. No broken ARIA references or page JavaScript errors were found.
- Incomplete axe results are retained: hidden-dialog `aria-controls` leads were checked against the DOM reference inventory; some contrast checks still require manual judgment. The scan is not comprehensive proof of contrast or AAA conformance.
- `git diff --check` passed. Screenshot review and focus evidence are linked in `audit-evidence/2026-10-21/visual-review.md`.

A transient Firefox tooltip failure during the earlier changing-source run did not
reproduce on the stable focused rerun. The separate stale-scroll reveal defect
was corrected using selection generations invalidated by Escape and blur, with
regressions for dismissal and interior stepper selection.

The fixes are local working-tree changes. No commit, push, deployment, or production
verification is included. CI now includes Chromium, Firefox and WebKit browser
checks; the workflow has been configured locally but has not run remotely.

Remaining signoff gates are the spoken screen-reader journeys above, actual browser
zoom/text-only enlargement, and user comprehension review. “Exceptional” remains
a quality target, not a certification asserted by this report.
