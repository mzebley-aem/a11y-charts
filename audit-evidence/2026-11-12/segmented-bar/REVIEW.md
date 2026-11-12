# Segmented bar component implementation review — 2026-11-12

## Result and scope

A separate `@a11y-charts/segmented-bar-chart` package now implements single-track breakdowns and reference comparisons. It composes the existing shared formatting, safe-content, modal, disclosure, floating-card, and export infrastructure. Its browser distribution is self-contained with a separate stylesheet; it has no framework or separately loaded shared runtime requirement.

The dispute-resolution report uses it in seven full panels and four compact overview cards. Source counts remain unchanged. Meeting-count panels use reference comparison mode without calculated remainder records. Overview navigation remains native; the component itself does not require a link. Interactive detail controls remain separate from navigation.

## Verified behavior

- Canonical counts/percentages drive legends, prominent metrics, detail cards, tables and exports. Explicit remainders are required for breakdowns; total mismatches do not silently normalize.
- Explicitly suppressed values are redacted before numeric access, formatting, public getters, models and exports. Missing and suppressed status remains visible when numeric annotations are disabled. Incomplete breakdowns do not draw misleading proportional geometry.
- Native legend buttons provide keyboard and touch detail access independent of segment width. Hover/focus previews, pinning, Escape dismissal and focus recovery are covered.
- Native Data dialogs preserve the dialog node and focused controls through updates. Inline data disclosures are independent of the main action strip. Hidden tables close/remove data access and exports. Authored rich content uses the shared sanitizer.
- Native optional links are independent of detail controls. Whole-card linking is restricted to compact charts without embedded controls or authored links.
- Data and configuration copies, coalesced events, localized number formatting and message templates, invalid data, empty/zero states, and above-reference comparisons have targeted regression coverage.
- Responsive checks include 320px, 768px and desktop widths; expanded content, forced colors, reduced motion and text-spacing/text-resize scenarios are covered in browser tests.

## Review corrections

The first implementation was tightened to retain the project's Light DOM contract, preserve dialog identity/focus, make screen-reader table modes retain visible Data access, remove exports from the main report surface, and preserve disclosure preferences. The review also caught a hidden table's intrinsic width causing 320px overflow; a clipped wrapper now preserves native table semantics without widening the page.

## Accessibility target and limitations

WCAG 2.2 AA is the release floor. Automated axe checks and browser/keyboard tests are supporting evidence, not a conformance certification. No hands-on VoiceOver, NVDA, JAWS, refreshable-braille, or participant validation was performed in this implementation run. Browser viewport and text-size tests do not substitute for a full real-browser zoom/assistive-technology matrix.

Optional AAA follow-up: assess enhanced text contrast under each consuming theme, verify enhanced focus appearance and 44px targets throughout consuming pages, and conduct plain-language comprehension testing for comparisons with different reporting units. The default component already uses generous control targets and visible labels independent of color; a consuming theme must be verified separately.

## Reproduction

- `npm test` and `npm run typecheck`
- `npm run build` (includes fresh packed-consumer smoke checks)
- `npm run gallery:typecheck`
- `npm run browser:segmented`
- `npm run browser:dispute-resolution`
- `npm run site:build`

Rendered evidence is in `tmp/segmented/evidence/`. These are local changes; no commit, push, publication or deployment was performed.

## Final gallery and browser verification

- `npm run browser:segmented`: 5 passed. Chromium exercised focused and pinned details with Escape, compact linked-card hit area, independent controls, native data dialog and focus return, CSV content and Excel ZIP signature, language and theme options, missing/suppressed/zero/above-reference examples, and translation-key/placeholder coverage.
- Axe WCAG 2.2 AA tags returned no automated violations in the default page, expanded Explain/Glossary with detail preview, and open Data dialog. Responsive checks covered 320, 768 and 1440 px, forced colors, reduced motion, enlarged text and WCAG text spacing. Automated checks alone do not establish conformance.
- `npm run browser:dispute-resolution`: 6 passed, including all seven single-value panels and comparison rows, navigation, keyboard dialog use, and 320–1440 px reflow with enlarged text.
- `npm run gallery:typecheck` and `npm run site:build` passed. Vite reported its existing large-chunk advisory during the site build.
- Desktop (1440 px) and mobile (320 px) standalone gallery and written-complaints report screenshots were captured and visually inspected locally under `tmp/segmented/evidence/`. The report component preserves the highlighted values and mobile stacking. These screenshots are local verification artifacts, not deployment proof.

Parent review additionally verified 34 segmented unit tests, 136 existing bar tests and 132 existing line tests; all package typechecks and independent packed builds passed. A fresh browser consumer loaded the standalone script/CSS without page errors, and ESM root plus `/define` registered the identical constructor. Final whitespace check passed.
