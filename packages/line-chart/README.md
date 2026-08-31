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
- the original display controls, pattern fills, axis-title toggles, data-fit Y zoom, outcome tooltips, legend synchronization, and announcements;
- a single native range-control tab stop with Arrow, Home, End, optional wraparound, live point descriptions, and internal scroll synchronization;
- touch-safe Previous/Next period controls that appear automatically for a
  horizontally overflowing chart and share the range navigator's selection,
  tooltip, announcement, scrolling, and point-change behavior;
- a pure ECharts-independent semantic model for latest-reported-period outcome,
  target comparison, historical counts, missing data, and baseline change;
- an integrated visible summary that answers whether the latest reported target
  was met before detailed chart exploration;
- an independently configured baseline reference with one starting marker, a
  subdued horizontal reference line, a direct label, summary and point
  narratives, table metadata, and data-fit Y-axis inclusion;
- the full theme-token surface, direct legacy sizing/axis properties, `a11y`/`showTable` compatibility, and legacy `{ year }` data acceptance;
- safe default tooltip rendering, a DOM renderer hook, deprecated string-tooltip compatibility, and a high-contrast target-series default.

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
  wrapAround: true
};
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

`stepperVisibility` accepts `auto`, `always`, or `never`. The default `auto`
shows the period-navigation buttons only when the internal chart viewport
overflows horizontally. `always` makes them available at every width; `never`
omits them. Endpoint buttons are disabled unless `wrapAround` is enabled.

The compatibility setter also accepts Angular-shaped rows such as
`{ year: 2024, actual: 72.5, target: 80 }`. New consumers should use `x`.

Component-level events bubble: `a11y-line-chart-ready`,
`a11y-line-chart-error`, `a11y-line-chart-point-change`, and
`a11y-line-chart-display-change`. `a11y-line-chart-config-change` remains an
alias for display-control changes during the pre-release period.

`a11y-line-chart-point-change` includes the canonical announcement, outcome,
outcome label, and structured target/baseline differences in addition to the
selected period and source values.
