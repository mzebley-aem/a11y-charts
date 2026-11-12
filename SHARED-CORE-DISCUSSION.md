# Shared chart core and standalone distribution

The shared source library lives in `packages/chart-core/src`. The chart packages
compile the utilities and UI primitives they use into independent outputs.
Chart-specific semantic models and renderers remain in their own packages.

## Distribution contract

A consumer should be able to load a chart-specific script and stylesheet and
use `<a11y-line-chart>`, `<a11y-bar-chart>`, or `<a11y-segmented-bar-chart>`. No shared JavaScript file, private
core package, framework runtime, or separately loaded ECharts should be required
for the standalone browser distribution.

Author shared code once in a private workspace package. Build each public chart
independently, inlining only the shared code it uses. Avoid a multi-entry build
that creates a mandatory shared runtime chunk. The bar output must not include
ECharts. Provide an ESM entry for application bundlers and a registration entry
for direct browser use. Keep a DOM-free helper entry for server exports.

CSS remains namespaced per chart. A script-plus-CSS distribution is predictable
for strict content-security policies and theme overrides; an optional single-JS
variant can install its compiled CSS once if one-file integration is desired.
That packaging choice need not change the authoring architecture.

## Source responsibilities

| Layer | Owns | Does not own |
|---|---|---|
| Pure core | Input primitives, scalar/range comparisons, message interpolation, number-format factories, CSV cell encoding, copied payload helpers | DOM, ECharts, global preferences |
| Content utilities | One HTML allowlist, URL policy, browser rich-content rendering, explicit plain-text conversion contract | Chart interpretation |
| UI primitives | Card markup, action buttons, data dialog, disclosure, focus recovery, positioning and dismissal controllers | Actual-versus-target or population calculations |
| Line package | Line semantic model, baseline/history, period navigator, ECharts adapter | A second sanitizer/dialog implementation |
| Bar package | Count/share model, category bars, total/suppression conventions, category identity | ECharts or a second generic card state machine |
| Segmented bar package | Part-to-whole breakdowns and independent comparisons, compact presentation | Inventing unreported comparison categories |

Use small functions and composed controllers. A universal chart superclass would
couple unrelated rendering and data assumptions and make extraction harder.

## Shared hover/focus cards

Share two things separately:

1. **Card presentation:** heading, label/value rows, outcome text, optional
   definition/context, typography, spacing, borders, and forced-colors styles.
   Feed it an explicit view model made from each chart's canonical semantic
   model. Labels and values remain text by default.
2. **Card interaction controller:** preview on pointer hover or keyboard focus,
   pin/toggle on activation when supported, Escape dismissal, leave delay,
   pointer travel into the card, outside interaction, viewport placement,
   scroll/resize handling, and teardown.

The controller should accept an anchor interface: a real category button for
bars, or a virtual point rectangle derived from the line renderer. It should
also accept the current active-item identity and ownership/lifecycle hooks.
Neither the card renderer nor controller should need to import ECharts.

A noninteractive tooltip and an interactive pinned detail card need different
semantics. A tooltip does not gain arbitrary Tab stops; a detail card containing
links/actions is a named nonmodal region with a discoverable trigger and an
intentional keyboard order. Do not force `role=tooltip` onto both. The line
range navigator must retain its concise canonical `aria-valuetext`; opening a
card should not cause duplicate announcements of the same content.

Keep current interactions as the starting contract. Align visuals and common
behavior without replacing line keyboard navigation with a tab stop per point
or forcing every bar to behave like a time-series slider.

## Implemented boundaries and remaining work

The pure utilities, sanitizer, card markup, dialog lifecycle, and disclosure
helpers are shared source. The bar chart uses the floating-card controller for
its explicit category triggers. ECharts continues to own line tooltip placement
and hover state; the line chart supplies shared card markup through its formatter
and preserves the period navigator's `showTip`/`hideTip` behavior. This avoids two
controllers competing for the same tooltip. Custom tooltip hooks remain intact.

Line updates preserve the chart DOM and ECharts adapter. The surrounding DOM and
bar rows still rebuild, with focus and disclosure state recovered by their chart
owners. Shared visual tokens and a full incremental DOM update system are future
work; chart-specific CSS remains namespaced. No heap-profile evidence establishes
that every possible integration is leak-free. Teardown and reconnect regressions
cover known listener, timer, observer, and modal lifecycle risks.

## Using the built output

Build both packages with `npm run build` (Node 24). Copy a chart package's
`dist/chart.js` and `dist/styles.css` to your application:

```html
<link rel="stylesheet" href="/charts/line/styles.css">
<script defer src="/charts/line/chart.js"></script>
<a11y-line-chart chart-title="Progress"></a11y-line-chart>
<script>
  customElements.whenDefined('a11y-line-chart').then(() => {
    document.querySelector('a11y-line-chart').data = [
      { x: '2025', actual: 45, target: 40 }
    ];
  });
</script>
```

Use the equivalent bar files and `<a11y-bar-chart>` for category data. Each script
registers only its chart type. ECharts is embedded only in the line package.
There is no shared runtime script to copy. CSS is a separate, namespaced file;
the script does not inject it. The ESM `./define` entry auto-registers, the root
entry exposes the API, and `./core` remains importable without browser globals.
Declarations include their internal shared types within each package archive.

`npm run artifacts:test` builds and tests fresh npm archives served from an empty
temporary directory, with external requests blocked. Package builds additionally
check a packed Node/TypeScript consumer. CI runs both source browser regressions
and these distribution tests.

The small shared implementations are intentionally duplicated in the two built
scripts when a page uses both charts. This trades a little transfer duplication
for independent deployment and a simple consumer contract. There is no public
shared-core version to coordinate.
