# `@a11y-charts/line-chart`

Framework-free `a11y-line-chart` autonomous custom element.

This package is intentionally private and pre-release. The Angular application at the repository root remains the frozen reference while the Web Component is validated for the first internal use case.

Current parity coverage:

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
chart.config = { decimalPlaces: 1, wrapAround: true };
chart.theme = { actualColor: '#1e62d0' };
```

The compatibility setter also accepts Angular-shaped rows such as
`{ year: 2024, actual: 72.5, target: 80 }`. New consumers should use `x`.

Component-level events bubble: `a11y-line-chart-ready`,
`a11y-line-chart-error`, `a11y-line-chart-point-change`, and
`a11y-line-chart-display-change`. `a11y-line-chart-config-change` remains an
alias for display-control changes during the pre-release period.
