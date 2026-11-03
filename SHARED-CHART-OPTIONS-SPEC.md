# Shared chart options implementation pass

Implemented and verified locally October 19, 2026. Authorized following the
source parity review. Extend both
existing packages in place; preserve unrelated changes, chart data semantics,
existing defaults, localization, keyboard behavior and open-dialog continuity.
Local implementation only; no commit, push, publication or deployment.

## Shared content and visibility

- `chart.context: string` accepts plain text or sanitized supported HTML.
  Retain line `config.contextNote` as the plain-text fallback when `context`
  has not been supplied. Existing subtitles remain plain text.
- `chart.dataNote: string` accepts the same content and appears before the full
  data table in both dialog and inline modes. Context is also available in the
  data view. CSV uses plain text metadata, never HTML.
- Line adds `chart.definitions: Array<{id: string; label: string;
  definition: string}>` for optional chart/series/period definitions. Treat
  all labels as text; sanitize definitions. No glossary service lookup.
- Both support config `showSummary`, `showContext`, `showActions`,
  `showExplanation`, `showGlossary`, `showExport` (all default true), plus
  `explanationExpanded`, `glossaryExpanded` (default false). Expanded settings
  initialize/update disclosure preferences only when those input values change;
  user preferences otherwise survive unrelated config/data updates.
- `showActions` hides the chart action strip, not line's existing display
  settings. Existing line `showControls` retains that meaning. Data access
  through inline disclosure follows its own table visibility setting.
- Both support `tableVisibility: 'hidden'|'screen-reader'|'visible'` with the
  same precedence over legacy `showTable`. Bar defaults to visible, preserving
  its current presentation; line keeps its screen-reader default. Normal dialog
  modes expose the Data action. Hidden mode removes table, Data and CSV actions.
- Bar additionally supports `showCounts`, `showPercentages`, `showTotal`
  (default true). These control the visual category list/footer only; the
  complete table, explanations and CSV remain complete. Public docs explain
  this distinction. Missing/suppressed status text stays visible even when both
  numeric annotation options are off. Hiding the summary does not remove accessible data.
- Line adds an Explain disclosure using its canonical summary and per-period
  narratives, and a glossary action only when definitions exist. Do not repeat
  baseline context in every point narrative.

## Data tools and public events

- Both have localized CSV actions for current displayed data. Line CSV uses
  formatted period, actual, target/range, outcome and optional baseline change
  columns, preserving missing/suppressed status. Formula-like text is escaped;
  numeric negatives remain numeric where possible. CSV quoting and CRLF match
  the bar export. Exported pure helper: `buildLineCsv`.
- CSV includes authored context/data-note metadata as plain-text rows before
  the column header only when supplied. No metadata rows for existing charts
  without content. XLSX remains deferred in both packages.
- Native dialog open/close changes emit
  `a11y-{bar|line}-chart-data-view-change` with
  `{open: boolean, dataView: 'dialog'|'inline'}`. Inline disclosure toggles use
  the same event. Do not emit duplicate or initial closed events. Handle Escape,
  mode changes, hidden tables and disconnect cleanly.
- Line adds `a11y-line-chart-data-change` with defensive copies of `data` and
  canonical `model`, coalesced for replaced source state after initial render.
  Keep existing point/config/display events. Both add
  `a11y-{bar|line}-chart-disclosure-change` with
  `{disclosure: 'explanation'|'glossary', expanded: boolean}` for user toggles.

## Bar theme and formatters

- `chart.theme` accepts a documented typed theme object mapped to existing CSS
  custom properties, plus useful border/radius, typography and spacing tokens.
  Explicit object values override CSS tokens; removing values restores CSS
  control. Apply to the persistent dialog too. Preserve default bar appearance.
- `chart.formatValue` takes a context with numeric `value`,
  `series: 'count'|'percentage'|'total'`, `locale`, and optional category
  `id`/`label`. Percentage `value` is a population fraction (0–1 normally),
  matching the bar model's existing percentage field and Intl percent format.
  It returns plain text, with canonical fallback for throws/empty/non-string
  returns. Never invoke the formatter for missing or suppressed values.
- Pass formatter through the pure semantic model. Rows, narratives, summary,
  total, table and CSV all use the same formatted text. Theme changes never
  alter semantic values. Export public types and pure theme helper as useful.

## Explicit line suppression and filtered indication

- Add `chart.filtered` boolean presentation metadata. It does not filter data.
- Add optional datum `actualSuppressed?: boolean` and
  `targetSuppressed?: boolean`. True masks only that series value. A numeric
  zero without these flags remains a reported zero. No global zero-conversion
  rule is introduced for line measures.
- Normalize explicitly suppressed values to null while preserving the flags.
  All charts/models/options/events/CSV use that normalized source. Render a
  localized Suppressed status, not Missing, for masked values; no positive
  outcome/comparison can be inferred for a protected value. Suppressed periods
  stay present. Never invoke custom formatters or tooltip builders with the
  masked numeric source. Baselines remain an optional unsuppressed reference.
- Show a localized suppression indicator if any datum has a suppression flag.
  Explain the flag fields and missing/zero distinctions in docs and demos.

## Verification

Preserve complete English/French/Spanish catalogs and authored demo copy for
all newly added labels and content. Demonstrate options in full package demos
and the combined consuming-app preview. Cover options, precedence, sanitized
content, formatters/fallbacks, CSV, suppression, copied event data, disclosure
preferences, dialog identity/focus, mode/visibility transitions and reconnects.
Run both suites/typechecks/builds/demo builds and line report build, whitespace
checks, real browser desktop/390px/320px, languages, keyboard/focus/live update,
forced-colors/reduced-motion and clean console. Record human AT gaps honestly.

## Implementation evidence

- Bar: 41 tests passed; line: 91 tests passed. Both typechecks, production
  builds, standalone demo builds and the line report build passed. The report
  build retains Vite's existing large-chunk advisory. The combined consuming-app
  entry also passes strict TypeScript checking and its Vite build.
- Browser proof includes same dialog/Close/live nodes and focused Close on data
  updates; Tab/Shift+Tab containment; Escape returning to the current opener;
  focus continuity for inline summary/CSV and disclosure actions; actual CSV
  downloads with formatted values, plain metadata and protected values masked.
- Full data remains complete when visual bar counts/shares/totals are hidden.
  Explicit inline tables remain visible in both table modes; hidden background
  copies contain no interactive controls. No duplicate IDs or dangling
  controls/descriptions were found in the integrated fixture.
- Hidden tables emit closed-view state and clear the inline open preference.
  Actions can be hidden independently while an inline data view retains CSV.
  Summary and authored context visibility are independent. Legacy line
  `contextNote` keeps its plain-text interpretation.
- English/French/Spanish switches and layouts at desktop, 390px and 320px
  checked. Actual French/Spanish CSV downloads retain translated headers,
  metadata, missing labels and range separators. Long unbroken context, notes
  and definitions wrap at 320px. Forced-colors and reduced-motion browser
  emulation also passed at 320px, and the integrated console contains no errors.
- Human screen-reader/braille sessions, actual browser zoom/print review and a
  broader assistive-technology/browser matrix remain release verification.
  No commit, push, publication or deployment was performed.
