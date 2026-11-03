# `@a11y-charts/line-chart`

Framework-free `a11y-line-chart` autonomous custom element.

This package is intentionally private and pre-release. The Angular application at the repository root remains the frozen reference while the Web Component is validated for the first internal use case.

Current foundation coverage:

- idempotent custom-element registration;
- Light DOM-only rendering;
- preservation of consumer-authored children;
- unique per-instance relationships;
- validated, replaceable data properties;
- useful empty and invalid states;
- accessible table output;
- strictly prefixed distributed CSS;
- framework-neutral ready/error events;
- ECharts 6 rendering behind a package-private adapter with the original area, outline, and main-series layering;
- actual and target lines distinguished by color, solid/dashed line style, and circle/diamond point shape;
- responsive horizontal chart scrolling without document-level overflow;
- reduced-motion-aware animation;
- the original display controls, pattern fills, axis-title toggles,
  magnitude-aware data-fit Y zoom, outcome tooltips, legend synchronization,
  and announcements;
- a single native range-control tab stop with Arrow, Home, End, optional wraparound, live point descriptions, and internal scroll synchronization;
- touch-safe Previous/Next period controls that appear automatically for a
  horizontally overflowing chart and share the range navigator's selection,
  tooltip, announcement, scrolling, and point-change behavior;
- a pure ECharts-independent semantic model for latest-reported-period outcome,
  target comparison, historical counts, missing data, and baseline change;
- an integrated visible summary that answers whether the latest reported target
  was met before detailed chart exploration;
- an independently configured baseline reference with one starting marker, a
  subdued horizontal reference line, a direct label, chart-level accessible
  description, summary, table metadata, and data-fit Y-axis inclusion;
- the full theme-token surface, direct legacy sizing/axis properties, `a11y`/`showTable` compatibility, and legacy `{ year }` data acceptance;
- safe default tooltip rendering, a DOM renderer hook, deprecated string-tooltip compatibility, and a high-contrast target-series default.
- optional rich context/data notes, Explain and glossary disclosures, CSV
  downloads, and explicit per-value suppression with a filtered indicator.

Open `demo/index.html` directly for the single-file fixture. Its CSS and
JavaScript are embedded so browsers do not make cross-origin `file://`
subresource requests. Regenerate it with `npm run demo:build` after component
or fixture changes. For source-module development, run `npm run dev` and open
`/dev.html`. Both paths consume the custom element without Angular or another
framework. The fixture mirrors the two Angular reference charts.

Complex inputs are assigned as properties:

```ts
const chart = document.querySelector('a11y-line-chart');
chart.data = [{ x: 2024, actual: 72.5, target: 80 }];
chart.baseline = {
  x: 2024,
  value: 60,
  explanation: 'A reporting-policy change defines the comparison boundary.'
};
chart.config = {
  decimalPlaces: 1,
  stepperVisibility: 'auto',
  wrapAround: true,
  dataView: 'dialog'
};
chart.messages = { dataAction: 'Open chart data' };
chart.theme = { actualColor: '#1e62d0' };
```

The baseline is optional. When present, its `x` value must match the earliest
displayed period. Its numeric value is independent of the actual value for that
period. Invalid baselines emit `a11y-line-chart-error` with code
`invalid-baseline`; the chart remains usable without baseline context.

Consumers may configure `actualSeriesLabel`, `targetSeriesLabel`,
`baselineSeriesLabel`, `contextNote`, `positiveDirection`, and the existing
number/locale settings. `formatValue`, `formatDifference`, and `formatXValue`
provide structured formatting hooks with canonical fallbacks. The component
retains the core outcome, comparison, missing-data, and historical language so
the summary, tooltip, keyboard narrative, data view, and semantic event agree.

### Data views and localization

`dataView` accepts `dialog` (the default) or `inline`. The default view adds a
visible **Data** action that opens a native modal dialog with a close button,
Escape handling, focus restoration, and a semantic table. `inline` presents the
table in a native disclosure. `tableVisibility: 'visible'` uses the configured
presentation; `screen-reader` retains the visually hidden semantic table and
offers a visible Data action in dialog mode or a native inline disclosure in
inline mode; `hidden` (including legacy
`showTable: false` when no explicit visibility is supplied) suppresses the
table and its action. An explicit `tableVisibility` takes precedence over
`showTable`.

`showActions: false` hides the chart action strip, including the dialog opener;
it does not hide the existing display settings (`showControls`) or the inline
data disclosure. CSV remains available inside an inline view unless
`showExport: false` is supplied. Hidden background table copies contain no
interactive links or export buttons; explicit data views present a readable
table even with `tableVisibility: 'screen-reader'`.

The exported `ENGLISH_LINE_CHART_MESSAGES` object and `A11yLineChartMessageKey`
type are the canonical English dictionary and complete key list. Set a partial
override with the `messages` property or JSON `messages` attribute. Missing or
invalid property entries use English defaults. The attribute accepts only
known keys and string values; malformed JSON renders a localized alert using
the last valid dictionary (or English defaults if none was supplied). Runtime changes update the chart's visible and
assistive text. Explicit series labels and value/date/difference formatters
remain higher-priority consumer choices.

The standalone demo exposes English (United States), French, and Spanish
selectors near the top of both `/dev.html` and the generated `index.html`. A
switch updates all three charts together, including their titles, subtitles,
context, baseline explanations, axis labels, series names, period presentation,
message catalog, and document/chart language. The complete demo catalogs live in
`demo/locales.ts`; they are examples for consumers, while the component accepts
partial dictionaries and intentionally uses English defaults for omitted keys.
The demo controls also switch every chart between dialog and inline data views
and update the range chart while its data view is open. The numeric sample data
and ordering do not change when the language changes.

Message templates support named
placeholders such as `{series}` and `{period}`; plural families use the
`.zero`, `.one`, `.two`, `.few`, `.many`, and `.other` suffixes, selected with
`Intl.PluralRules` for the configured locale. Missing plural categories fall
back to `.other`. Invalid locales use `en-US`; number/date formatting remains
separate from sentence translation.

The English dictionary keys are:

```text
title, summaryLabel, controlsLabel, valuesLegend, actualLine, targetLine,
actualValue, targetValueLabel, actualFill, targetFill, tooltipVisible,
xAxisTitle, yAxisTitle, zoomYAxis, seriesShown, seriesHidden, stepperStatus,
patternType, patternSet, patternNone,
patternDiagonal, patternDots, patternHorizontal, enabled, disabled,
keyboardHelp, overflowHelp, navigatorLabel, noData, invalidData,
invalidBaseline, previous, next, navigationLabel, previousPeriod,
previousPeriodAt, nextPeriod, nextPeriodAt, dataAction, dataHeading,
closeData, inlineData, chartRole, invalidMessages, dataCaption,
dataCaptionBaseline, targetOutcome, changeFrom, baselineContext,
baselineDescription, unitPercentages, unitValues, percentSuffix, rangeWithin,
rangeLowerBound, rangeUpperBound, differenceEqual, differenceRelative,
outcomeMet, outcomeMetEqual, outcomeNotMet, outcomeUnavailable,
outcomeUnavailableSentence, narrativePeriod, noActual, noTarget,
noTargetOutcome, targetValue, periodTargetOutcome, actualValueSentence,
withinNarrative, differenceSentence, summaryNone, summaryCannotDetermine,
summaryMissingTarget, summaryMetEqual, summaryWithin, summaryOutcome,
summaryEqual, summaryComparison, summaryBaseline, summaryBaselineOnly,
summaryNoLater, summaryPeriods.one, summaryPeriods.other, tableActualHeader,
tableTargetHeader, missing, baselineLabel, targetLabel, actualLabel,
defaultXAxisTitle, defaultYAxisTitle, pointAnnouncement, dataUpdated.one,
dataUpdated.other, validationInvalidRange, validationInvalidBaseline,
validationBaselineObject, validationBaselineX, validationBaselineValue,
validationBaselineExplanation, validationBaselinePeriod, validationDataArray,
validationDataItemObject, validationDataX, validationDataActual,
validationDataTarget, differenceNumber, differencePercent.one,
differencePercent.other, tooltipHeader, tooltipActual, tooltipTarget,
tooltipDifferenceEqual, tooltipDifference, tooltipDifferenceText, rangeSeparator,
tooltipRange, tooltipAria, relationAbove, relationBelow, relationEqual,
relationWithin, relationIncomplete, baselineDifference, lower, upper,
exportCsv, exportUnavailable, explain, glossary, filteredIndicator,
suppressionIndicator, explanationHeading, glossaryHeading, periodExplanations,
suppressed, contextLabel, dataNoteLabel, actualSuppressed, targetSuppressed,
summaryAllSuppressed, summaryLatestSuppressed, summaryTargetSuppressed,
validationSuppressionFlag, narrativeOutcome
```

For live data replacement, the chart, summary, table, and event source update
together. An open dialog and its focused controls remain in place; when enabled,
one concise polite announcement reports the update. Initial rendering does
not announce a data change.

`stepperVisibility` accepts `auto`, `always`, or `never`. The default `auto`
shows the period-navigation buttons only when the internal chart viewport
overflows horizontally. `always` makes them available at every width; `never`
omits them. Endpoint buttons are disabled unless `wrapAround` is enabled.

The compatibility setter also accepts Angular-shaped rows such as
`{ year: 2024, actual: 72.5, target: 80 }`. New consumers should use `x`.

### Target ranges

Each row's `target` accepts a number, an inclusive `{ min, max }` range, or
`null`. Scalar and range targets can coexist in the same chart:

```ts
chart.data = [
  { x: 2024, actual: 72.5, target: 80 },
  { x: 2025, actual: 75, target: { min: 70, max: 80 } },
  { x: 2026, actual: null, target: { min: 72, max: 82 } }
];
```

An actual value meets a range target when `min <= actual <= max`, including
both endpoints. `positiveDirection` applies only to numeric targets; values
outside a range miss the target in either direction. The relation is `within`
inside the range, or `below`/`above` outside it. Differences outside the range
measure the distance to the nearest bound; within-range differences are zero.
Missing actual values retain an unavailable outcome.

Both bounds must be finite numbers with `min <= max`; equal bounds are allowed.
Invalid ranges emit `a11y-line-chart-error` with code `invalid-data` and an
actionable error state. Ranges are copied when assigned or returned.

The chart renders dashed lower/upper boundaries with diamond markers and
vertical range whiskers. `fillTarget` shades only the interval between adjacent
range rows; gaps and numeric targets break the band. The existing target color,
fill, pattern, labels, and visibility controls apply to the entire range. The
summary, tooltip, keyboard navigator, and table format both bounds through
`formatValue`. `targetValue` in interpretations/tooltips and `target` in
point-change events preserve the range object. The exported
`A11yLineChartTarget` and `A11yLineChartTargetRange` types describe this contract.

Component-level events bubble: `a11y-line-chart-ready`,
`a11y-line-chart-error`, `a11y-line-chart-point-change`, and
`a11y-line-chart-display-change`. `a11y-line-chart-config-change` remains an
alias for display-control changes during the pre-release period.

`a11y-line-chart-point-change` includes the canonical announcement, outcome,
outcome label, and structured target/baseline differences in addition to the
selected period and source values.

### Shared content and visibility options

`context` and `dataNote` accept ordinary strings or supported rich HTML.
Context appears with the chart, explanation and full-data view; the data note
appears before the complete table. The allowlist retains paragraphs, emphasis,
lists, line breaks and safe links while removing scripts, embedded content,
styles, event handlers, unsafe URLs and authored IDs. Titles, subtitles,
message templates and definition labels remain plain text.

Context visibility is independent of `showSummary`. Definitions require
nonempty identities and labels; invalid records and repeated identities are
ignored. The component assigns unique DOM IDs and returns defensive copies.

When `context` is `undefined`, the existing plain-text `config.contextNote`
provides the fallback. Assign `context = ''` to explicitly clear it, or
`context = undefined` to restore the fallback. Set `dataNote = ''` to remove a
note. The CSV retains supplied metadata as plain text even when `showContext`
hides it in the interface.

```ts
chart.context = '<p>Results for the <strong>current reporting period</strong>.</p>';
chart.dataNote = '<p>Source: the reporting application.</p>';
chart.definitions = [
  { id: 'actual', label: 'Actual', definition: '<p>The observed result.</p>' },
  { id: 'target', label: 'Target', definition: '<p>The planned value or inclusive range.</p>' }
];
chart.config = {
  ...chart.config,
  showSummary: true,
  showContext: true,
  showActions: true,
  showExplanation: true,
  showGlossary: true,
  showExport: true,
  explanationExpanded: false,
  glossaryExpanded: false
};
```

The six `show*` options above default to `true`; the expansion inputs default
to `false`. The glossary action only appears when definitions exist. Explain
uses the canonical summary and per-period narratives. Changing an expansion
input applies the new state, and removing it restores the default. Unrelated
config/data updates retain the user's disclosure preferences. These options
are independent of the line-specific controls for fills, patterns, values,
tooltips, axis titles and period navigation. No global preference storage is
used.

### CSV and source-state events

`showExport` controls the localized CSV action inside an explicit data view.
Downloads contain the currently formatted period, actual, target/range,
outcome and optional baseline-difference columns. Authored context and data
notes precede the column header as plain-text metadata rows when supplied.
Quoting uses CRLF records; formula-like text is neutralized, and complete safe
negative numeric literals remain numeric. `buildLineCsv` is exported for
applications supplying their own download action. XLSX remains deferred.

The following additional events bubble:

- `a11y-line-chart-data-change`: coalesced source replacements after the
  initial render, with defensive `data` and canonical `model` copies. The model
  is null for unavailable data.
- `a11y-line-chart-data-view-change`: `{ open, dataView }` for dialog/inline
  open and close changes, including Escape and visibility/mode transitions.
- `a11y-line-chart-disclosure-change`: `{ disclosure, expanded }` for user
  changes to `explanation` or `glossary`.

The existing point-change event remains the period-navigation signal; existing
config/display-change events continue to describe display-control and legend
actions.

### Filtered and explicitly suppressed values

`chart.filtered = true` (or the presence of the `filtered` attribute) adds a
localized indicator. The host still owns filtering and supplies the current
dataset.

Unlike count-based bar suppression, line measures never infer suppression from
zero. Protect individual series values explicitly:

```ts
chart.data = [
  { x: 2024, actual: 0, target: 0 }, // reported zero, still comparable
  { x: 2025, actual: null, actualSuppressed: true, target: 80 },
  { x: 2026, actual: 72, target: null, targetSuppressed: true }
];
```

A suppressed series shows the translated suppression label and has no numeric
chart point or inferred target outcome. Missing values retain their distinct
missing label. Periods stay present. Values supplied alongside a true
suppression flag are normalized to null before models, options, events,
tooltips, callbacks and CSV are built. The getter returns normalized copies;
to restore a protected value, the host supplies its current unsuppressed data
again. Baselines remain optional unsuppressed reference values.

## Server helpers and CSV metadata

Import pure helpers from `@a11y-charts/line-chart/core` in Node or SSR code. The
normal package entry exports the browser element and requires DOM globals.
The build checks the `./core` entry in a separate Node process.

CSV `contextText` and `dataNoteText` are already-plain text and work without a
DOM. They override the HTML `context` and `dataNote` options, including when
explicitly set to an empty string. Rich HTML metadata still uses the browser
allowlist; passing it without a DOM throws a descriptive error. CSV formula
protection applies to metadata as well as data cells.

## Change-event timing

After initial rendering, `a11y-line-chart-data-change` reports changes to the
normalized source rows or baseline. Equivalent assignments emit nothing;
multiple assignments in the same turn coalesce to the final state. Payloads
contain copied source data and the current semantic model.

`a11y-line-chart-display-change` also reports programmatic presentation changes
(title, context, configuration, theme, messages, definitions, and formatters)
with `source: 'properties'` and a copied presentation payload. Initial rendering
and equivalent assignments do not emit this event. Existing user controls and
legend interactions retain their immediate `source: 'controls' | 'legend'`
configuration payloads. Use `A11yLineChartDisplayChangeDetail` and narrow on
`source` when consuming the event. The separate `config-change` event remains
specific to those user controls and legend interactions.

Point-change events and formatter/tooltip callback inputs copy mutable Dates
and interpretation objects. Updating an event payload does not update the
chart; assign a property to change its source state.

`buildTooltipHtml` is a trusted application-code hook: its output is passed to
the renderer as HTML. Do not concatenate untrusted content into it. Prefer
`renderTooltip`, setting text through DOM APIs, when customizing the card.


## Independent browser distribution

`npm run build` creates `dist/chart.js` (registering classic script),
`dist/styles.css`, and the ESM API/registration/core entries. Load the script and
stylesheet together; no shared-core script or separately installed rendering
library is required. Shared source utilities and UI primitives are compiled into
each package. The `./core` export supports DOM-free data processing; root and
`./define` require a browser. Each build checks its npm archive in a fresh consumer
for runtime and TypeScript resolution. See the repository's
[architecture document](../../SHARED-CORE-DISCUSSION.md) for integration examples.

### Contextual Y-axis zoom

When reported values occupy a small portion of the full vertical scale, the
chart offers **Zoom Y-axis** beside its other actions. The suggestion compares
the padded, rounded data bounds with the configured full bounds and appears when
zooming would provide at least twice the vertical detail. Targets (including both
range limits) and the baseline participate; missing and suppressed values do not.
A flat series alone does not trigger the suggestion.

Zoom is opt-in. **Restore full Y-axis** stays available while zoom is active,
and the action shares `initialZoomY` with the existing reader checkbox. Setting
`showActions: false` hides the action strip. Labels are customizable through
`zoomYAxis` and `restoreYAxis` messages.
