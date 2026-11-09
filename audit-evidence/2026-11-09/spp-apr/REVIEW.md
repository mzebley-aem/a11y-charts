# SPP/APR accessibility and usability review

Date: November 9, 2026. Baseline: `882b103`. Route: [deployed SPP/APR report](https://a11y-charts-report-preview.vercel.app/spp-apr/).

## Review contract and verdict

The user selected **WCAG 2.2 AA**, with AAA improvements reported separately. No legal or contractual overlay was supplied. AAA is advisory, not the release floor. This review covers the public report prototype, not an official state publication.

The review found and corrected report navigation, keyboard focus, rate terminology, text-spacing/reflow, feedback discoverability, and stronger-level contrast issues. The corrected build passes the automated AA checks across all 14 measure/view combinations, plus the separately tested disclosure and data-dialog states. This is suitable evidence for sharing an interactive prototype for feedback; it is **not a claim of full WCAG conformance**. Human screen-reader and mobile assistive-technology testing remain unperformed.

## Scope and method

- One report template, three indicators, seven measures, two chart views: 14 URL-addressable combinations. Native disclosures cover measurement, reading guidance, settings, terms, and sources. Both line and population chart data dialogs, and population details/definitions/explanation, were exercised.
- Exact widths: **320, 375, 390, 480, 640, 768, 1024, 1280, and 1440 CSS pixels**, at 900 CSS pixels high for the matrix. Additional mobile checks used 390 × 844. Text-spacing overrides at 320 and text resizing to 200% at 640 were tested. A 320 CSS-pixel viewport represents the reflow condition; actual browser 400% zoom was not separately exercised.
- Chromium/Chrome 156.0.8078.80 for the broad sweep; Playwright WebKit 27.2 and Firefox 157.0 for navigation, skip-link focus, and chart-view smoke tests. These engine checks do not substitute for testing physical iOS devices or Safari with VoiceOver.
- axe-core checks included WCAG A/AA tags through 2.2, plus its AAA rules as advisory. DOM structure, heading order, language, accessible names, landmarks, ID references, keyboard navigation, focus restoration, forced colors, reduced motion, source integrity, and same-origin destinations were inspected.
- Forty sequential Tab steps exposed no hidden focus target. Chart Home/End/Right Arrow changed the announced year/value. Reverse Tab remained inside each data dialog; Escape restored each trigger. Synthetic clipboard-denial and browser-storage-denial tests provided recoverable feedback.
- Local review-note saves/downloads were tested using synthetic text. The production synthetic walkthrough is read-only. No feedback was submitted or sent to anyone.
- Exclusions: contents/accessibility of the supplied PDFs, official state-data validation, legal compliance certification, third-party destinations, and a full conformance audit of the existing gallery/demos. The latter are regression checked for preservation.

## Findings and resolution

| ID | Category / severity | Finding | Resolution |
| --- | --- | --- | --- |
| A11Y-01 | AA / High | Skip navigation reloads the document and loses focus | Fixed: native fragment navigation focuses the indicator heading without reloading |
| A11Y-02 | AA / Medium | Text-spacing adjustments produce horizontal overflow at 320 CSS px | Fixed: wrapping and control sizing keep the document at 320 px |
| FUNC-01 | Functionality / High | Back skips indicator, measure, and view selections | Fixed: report navigation adds history entries; popstate restores the selected view without a document reload |
| UX-01 | Usability / High | Rate comparisons use count/population terminology | Fixed: rate labels, an authored outcome explanation, and a two-column rate table; inapplicable total/share fields and count-oriented downloads omitted for this view |
| UX-02 | Usability / Medium | Mobile reviewers have no direct route to feedback; note storage/sharing scope is easy to miss | Fixed: visible “Add review notes” link, indicator context, unsaved-state feedback, and explicit local-save/download instructions |
| UX-03 | Usability / Medium | Trend legend swatches can disagree with plotted series | Fixed in this report: a simple actual/target line presentation avoids auxiliary fill/outline series; baseline comparison remains in the authored summary |
| UX-04 | Usability / High | The synthetic reader repeats the conflicting 6B target without its caveat | Fixed: “Target needs confirmation” in the overview/result badges, an under-review target label, and a conditional explanation |
| MODERN-01 | AAA advisory / Medium | Muted report text misses enhanced contrast | Improved: page muted text increases from 6.35:1 to 8.15:1; chart muted text is 8.66:1 |
| MODERN-02 | AAA advisory / Low | Unexpanded report abbreviations and small auxiliary link targets add friction | Improved: report terms and 44 px-high auxiliary link/checkbox-label targets |

### A11Y-01 — Skip and fragment navigation lose focus

**Scope:** all three indicators. **Target relationship:** WCAG 2.2 AA floor, criterion [2.4.1 Bypass Blocks](https://www.w3.org/TR/WCAG22/#bypass-blocks). Keyboard use is also relevant to 2.1.1.

On the baseline, focus the first “Skip to report” link and press Enter. The global `popstate` handler reloads the page after the fragment changes. After settling, `document.activeElement` is `BODY`, not the report. The same handler can discard an unsaved note on a fragment navigation.

The report now treats fragment-only history as native navigation and focuses `#indicator-title`, a heading with `tabindex="-1"`. The regression checks focus after Enter and retains draft note text through navigation. The indicator heading has a visible outline when focused. Source navigation opens its disclosure rather than landing on collapsed content.

### A11Y-02 — Reflow under text-spacing adjustments

**Scope:** report at 320 CSS px with spacing overrides. **Target relationship:** [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow); the spacing settings in [1.4.12 Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing) were used as an additional resilience condition.

With line height 1.5, paragraph spacing 2em, letter spacing .12em, and word spacing .16em, the baseline document measured **342 px at a 320 px viewport (+22 px)**. Heading/control wrapping and minimum sizing are now resilient. The same condition measures **320/320** after correction. The deliberately wide line visualization and data tables remain contained, keyboard-operable regions rather than enlarging the document.

### FUNC-01 — Back skips report choices

The baseline writes every selection with `replaceState`. In the recorded sequence, selecting Indicator 5 and Measure 5B then pressing Back returns to the previously loaded Indicator 6C URL, skipping those report choices. This also makes orientation/recovery unnecessarily difficult.

Indicator, measure, and chart-view choices now add history entries. Display adjustments replace the current entry. Back and Forward restore the prior choice, retain in-memory drafts, and move focus to the indicator heading. Modified link clicks retain normal browser behavior.

### UX-01 — A percentage is presented as a count

All seven baseline comparison views use a count chart with percentage formatting. Measure 6B visibly says **“Count: 28.12%”**, its scale says **“shared count scale up to 100”**, and Explain begins **“The total is Unavailable.”** The table adds unavailable shares and a total even though the rows are separate observations, not parts of a whole.

The report-only adapter now supplies rate terminology and a decision-oriented explanation. Its accessible data table has “Reporting period” and “Rate” columns and three observations. Inapplicable share/total columns are hidden from both rendering and the accessibility tree. Count-oriented exports are disabled for this comparison; line/population exports remain available. Shared chart source and demo behavior were not changed.

### UX-02 — Feedback location and scope

On mobile, the baseline hides the sidebar’s “Review notes” shortcut, leaving a long scroll to the form. The main instructions imply notes stay in the browser before an explicit save. The synthetic walkthrough recovered after scrolling up two screens to copy and down six-and-a-half screens to reach feedback. The copied URL does not contain feedback.

The header now exposes “Add review notes” at every width. The selected measure also exposes copy and review actions, and the feedback section receives native focus. Download review notes is the primary action for preparing shareable feedback; local save remains available. The form states that saving is local, downloading produces a file for sharing, and a view link does not include notes. It names the current indicator/measure, associates instructions with the textarea, and reports unsaved changes without repeatedly rewriting the same live message on every keystroke. Browser storage denial preserves the text and recommends downloading a copy.

### UX-03 — Legend and control consistency

Auxiliary fill/outline series in the baseline can supply ECharts’ automatic legend colors, differing from the actual plot. SPP/APR now uses the public chart settings for a simpler two-series line plot, with solid actual and dashed target lines. Baselines remain consistently described in the summary, including the later 2020 reference year for Measure 6A. Native “Show actual series” / “Show target series” controls provide keyboard equivalents to chart-series selection. Hiding both series produces a clear recovery message. Settings update the existing chart instead of rebuilding the settings and reading guide.

### UX-04 — Target uncertainty lost in the headline

In the frozen baseline walkthrough, C5 explicitly skips the source-discrepancy paragraph and C11 repeats 18.29% without qualification. This supports an omitted-caveat finding in this synthetic attempt; it does not prove that real users believe the figures are validated.

The 6B overview and selected result now say **“Target needs confirmation.”** The 18.29% figure is identified as the detailed target under review, and Explain states that the result would not meet that target while the source summary gives a conflicting target. No source value was changed. Other measures retain their ordinary target outcomes.

### AAA improvements, kept separate from AA failures

[1.4.6 Contrast (Enhanced)](https://www.w3.org/TR/WCAG22/#contrast-enhanced) was **not** an AA release blocker. The review nevertheless darkened muted copy and badges and adjusted the report-scoped population-chart muted token. Measured values are in `contrast.json`; focus outlines contrast 7.04:1 with white and 6.62:1 with the page background. Actual/target plot strokes contrast 9.49:1 / 4.75:1 with white.

Definitions for IDEA, Part B, IEP, FFY, and percentage points improve comprehension. Auxiliary links and checkbox-label hit areas are at least 44 px high. These improvements do not establish compliance with every AAA criterion.

## Strengths retained

The report has a single H1 and main landmark, named report navigation, native disclosure controls, non-color target outcomes, readable actual/target values, accessible underlying data, keyboard chart-period navigation, and modal Escape/focus restoration. Missing histories remain unavailable rather than zero. The conflicting 6B targets and incomplete population categories remain explicitly disclosed.

## Remediation order and release gate

1. Correct native navigation/focus and history first.
2. Correct rate semantics and feedback scope.
3. Correct reflow, focus/series controls, and contrast enhancements.
4. Rerun regressions, broad state scans, responsive/expanded-state checks, and the synthetic walkthrough.
5. Deploy only the corrected SPP/APR changes and confirm the gallery and three demo responses are byte-for-byte unchanged.

The binary feedback-sharing gate is: working skip focus; Back/Forward restores choices; no AA engine violations in the tested states; no body overflow across the width matrix or spacing check; functioning keyboard dialogs with focus restoration; accurate rate labels and explanations; recovery for blocked clipboard/storage; no changed demo responses. Human desktop/mobile screen-reader smoke tests remain necessary before making a full accessibility or release-conformance claim.

## Evidence and reproduction

- `before.json`, `before-*.png`: baseline deployed observations.
- `verified-final.json`, `verified-final-*.png`: corrected production-build observations before deployment.
- `expanded-local.json`: disclosure/dialog scans, cross-engine smoke checks, storage/clipboard recovery, and text resizing.
- `keyboard.json`, `keyboard-chart.png`: sequential keyboard focus and chart period navigation.
- `contrast.json`: measured source/rendered color pairs.
- `demo-baseline.json`: before-deployment hashes for `/` and all three existing demos.
- `audit.cjs`, `expanded-audit.cjs`: reproducible browser checks; run from the repository root with installed package dependencies. Example: `AUDIT_BASE=https://a11y-charts-report-preview.vercel.app AUDIT_PHASE=production node audit-evidence/2026-11-09/spp-apr/audit.cjs`.
- `npm run browser:spp-apr`: eight passing report regressions, including the two rock-exposed cases. `npm run gallery:typecheck` and `npm run site:build`: typing/build checks.

The completed blind baseline walkthrough is documented in `.bag-of-rocks/runs/spp-apr-2026-11-09/REVIEW.md`, with an annotated filmstrip and frozen screenshots. It exposed skipped source uncertainty and long travel between review controls; it did not save or send feedback. Deterministic reviewer checks verify the implemented corrections; a new blind retest has not been run. Post-deployment verification is recorded separately after it completes. Automated screenshots/DOM checks are not screen-reader research or a conformance certification.
