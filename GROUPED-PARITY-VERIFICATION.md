# Grouped bar-chart parity: local verification

October 22, 2026. Implementation is local and uncommitted. No ADAPT source,
production CMS, or deployment was changed.

## Review entry

Run `npm run gallery:dev` and open
[Grouped populations](http://127.0.0.1:5191/#grouped-examples).
The existing gallery now has five line, five bar, and three grouped examples.
`npm run gallery:build` produces `dist/gallery/`.

1. **Children by age range:** All Ages preserves 365/80/20 against total 510.
   Individual age selections are explicitly illustrative.
2. **Children by race/ethnicity:** All shows Home 322/510 (63.14%). Selecting
   Black or African American shows Home 102/102 (100%), while the population
   insight remains 102/510 (20%). Two category values remain suppressed.
3. **Multiple sections and availability states:** section switching, collapse,
   explicit zeros, protected counts, missing values, and no matching records.

Shared count scales are the default, per the user's selection. Customize each
example to compare rescaling or population-share mode, switch Data between
inline and modal presentation, or apply an external filter that survives All.
The selected configuration disclosure shows the prepared view and settings.

## Implemented boundary

The flow is native radio/disclosure selection → a prepared view → the persistent
bar component's semantic model → chart, Explain, Data table, CSV, and XLSX.
No network API or database participates in these local fixtures.

The new companion, pure view-preparation helper, explicit row suppression,
authoritative-unknown totals, shared scale, authored explanation, and Excel export
are documented in `packages/bar-chart/README.md`. The original gap inventory and
integration limits are in `BAR-CHART-REPLACEMENT-PARITY.md`.

## Verification evidence

Results on the final source:

| Check | Result |
| --- | --- |
| Bar package unit tests | 134 passed |
| Line package unit tests | 131 passed |
| Both package typechecks and gallery typecheck | Passed |
| Both package builds and packed-consumer checks | Passed |
| Gallery and standalone bar demo builds | Passed |
| Existing gallery/bar browser regressions | 13 passed |
| Grouped browser regressions | 5 passed |
| Grouped axe WCAG 2.1 A/AA scan | No violations in tested compositions |
| Browser console inspection | No errors or warnings |
| Git whitespace check | Passed |

The grouped browser suite covered Chrome keyboard/touch selection, selected
ratios and separate denominators, All/external-filter behavior, in-place modal
updates, modal closure on removed/invalid views, focus recovery, disclosures,
Excel download, 320/375px overflow, forced colors, and reduced motion. These
widths verify narrow reflow; actual browser zoom through 400% and human screen
reader testing are not claimed by this run. The gallery build retains a Vite
large-chunk advisory; it does not prevent building or running the review page.

Reusable grouped browser coverage is in `packages/line-chart/browser-tests/grouped-parity.spec.ts`;
run it using `npm run browser:grouped`. Existing gallery and bar regressions use
`PLAYWRIGHT_CHROMIUM_CHANNEL=chrome npm run browser:test --prefix packages/line-chart -- browser-tests/gallery.spec.ts browser-tests/bar-accessibility.spec.ts`.

Excel verification additionally used an independently generated workbook,
Python ZIP/XML inspection, and LibreOffice headless open/conversion. Reported
counts and percentages remain numeric, withheld/missing cells remain text,
Unicode and XML-special characters survive, and formula-like labels are literal
strings. CSV preserves display formatting; XLSX preserves numeric precision.

Screenshots are saved under `audit-evidence/2026-10-22/`.

## Remaining scope

- The full production ADAPT payloads and template/glossary outputs have not been
  migrated or compared end-to-end. The library accepts prepared views; its helper
  accepts resolved records and callbacks rather than embedding ADAPT services.
- Screenshot fixtures retain the reported facts without deriving protected
  values or inventing the full underlying dataset. Added selections are labeled
  illustrative, not production evidence.
- Actual screen-reader/braille and participant testing in the consuming
  application remains a release gate. Browser/axe evidence does not establish
  page conformance or replace those checks.
- Visual parity is deferred, as requested. The new native filter interaction is
  intentional; legacy nested listbox/button semantics are not reproduced.
