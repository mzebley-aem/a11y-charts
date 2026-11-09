# A11y Charts

Framework-free Light DOM chart components for accessible reporting:

- [`packages/line-chart`](./packages/line-chart): actual-versus-target performance.
- [`packages/bar-chart`](./packages/bar-chart): horizontal category counts and
  population shares, with explanation, definitions, suppression, and CSV.

The bar chart and the localization/data-view additions to both charts follow
[`BAR-CHART-SPEC.md`](./BAR-CHART-SPEC.md).

The Angular replacement gap assessment and grouped-selection requirements are
recorded in [`BAR-CHART-REPLACEMENT-PARITY.md`](./BAR-CHART-REPLACEMENT-PARITY.md).
The grouped selector, shared scales, explicit suppression, authored explanations,
and Excel export are implemented locally. The gallery includes four grouped
compositions; production ADAPT integration remains separately unverified.

## Line chart

A framework-free, Light DOM Web Component for one focused data question:

> Was the target met in the latest reported period?

The project is building an actual-versus-target line chart that is exceptionally
usable with keyboards, screen readers, refreshable braille, magnification,
forced colors, touch, and conventional visual interaction. ECharts 6 is an
internal rendering detail; the public boundary is the standards-based
`<a11y-line-chart>` custom element.

The first release is for a specific internal use case. Public open-source
packaging will follow after the documented accessibility evidence gates are
complete.

## Project status

- The line implementation is [`packages/line-chart`](./packages/line-chart).
- The bar chart implementation and shared capability contract are specified in
  [`BAR-CHART-SPEC.md`](./BAR-CHART-SPEC.md).
- The Angular application under [`src`](./src) is the frozen migration
  reference, not the production direction.
- The technical sequence lives in [`ROADMAP.md`](./ROADMAP.md).
- Product and accessibility decisions live in
  [`CHART-EXPERIENCE-PLAN.md`](./CHART-EXPERIENCE-PLAN.md).
- The original project audit is recorded in [`AUDIT-2026-08-18.md`](./AUDIT-2026-08-18.md).

Phase 1 has completed the semantic foundation, integrated latest-period
summary, baseline reference, shared point narrative, and corresponding public
contract. Phase 2 is underway with overflow-aware period controls sharing the
existing keyboard selection model.

## Run the Web Component

Requires Node 24 or newer:

```bash
cd packages/line-chart
npm install
npm run dev
```

Open the Vite URL printed by the command. To build the self-contained fixture
that can also be opened directly with `file://`:

```bash
npm run demo:build
open demo/index.html
```

## Verify the package

```bash
cd packages/line-chart
npm test
npm run typecheck
npm run build
npm run demo:build
```

The bar package uses the same install, development, verification, and
self-contained demo commands from `packages/bar-chart`. Run the package suites
independently; the root Angular application remains a reference.

## Data views and text customization

Both chart elements accept `config.dataView` as `dialog` (the default) or
`inline`. Open data views update with new source data while retaining useful
focus and disclosure state. Each package documents its own existing visibility
options and their precedence.

The shared options pass is specified in
[SHARED-CHART-OPTIONS-SPEC.md](./SHARED-CHART-OPTIONS-SPEC.md): common rich
context/data notes, summary/action/disclosure visibility, CSV, data-view and
disclosure events, plus bar themes/formatting and explicit line-value
suppression. The package READMEs describe the concrete property and event APIs.

Both expose a `messages` property and JSON `messages` attribute for partial
overrides of a complete English message catalog, including generated and
assistive text. Use the separate locale setting for number formatting. See the
[bar package](./packages/bar-chart/README.md) and
[line package](./packages/line-chart/README.md) for keys and examples.

For a language switch, supply the complete translated dictionary and update
host-authored titles, data labels, context, and the document/chart `lang` too.
Omitted message keys deliberately use English defaults; `locale` controls
formatting rather than translating text. Both standalone demos include complete
French and Spanish examples in their `demo/locales.ts` files and switch every
chart together.

## Direct consumption

```ts
import '@a11y-charts/line-chart/define';
import '@a11y-charts/line-chart/styles.css';
import type { A11yLineChartElement } from '@a11y-charts/line-chart';

const chart = document.querySelector<A11yLineChartElement>('a11y-line-chart');

chart.data = [
  { x: 2015, actual: 40, target: 50 },
  { x: 2020, actual: 83.92, target: 77.02 },
  { x: 2021, actual: null, target: 78.27 }
];

chart.baseline = {
  x: 2015,
  value: 38,
  explanation: 'A reporting-policy change defines the comparison boundary.'
};

chart.config = {
  decimalPlaces: 2,
  positiveDirection: 'above',
  stepperVisibility: 'auto',
  tableVisibility: 'screen-reader'
};
```

```html
<a11y-line-chart
  chart-title="Actual versus target performance"
  subtitle="Reported results and planned targets"
  value-preset="percent"
></a11y-line-chart>
```

Complex values and callbacks are assigned as properties. The component accepts
ordered `{ x, actual, target }` rows; the compatibility layer also accepts the
Angular-era `{ year, actual, target }` shape.

Targets may also be inclusive ranges, for example
`{ x: 2025, actual: 75, target: { min: 70, max: 80 } }`. Both endpoints meet
the target; values outside the range do not. Numeric targets retain the
configured `positiveDirection` behavior. Range boundaries, target fill,
summary, tooltips, keyboard announcements, and data tables share the same
interpretation. See the [range contract](./packages/line-chart/README.md#target-ranges).

## Semantic contract

One ECharts-independent semantic model produces:

- the latest period containing an actual value;
- target outcome for `above` or `below` positive direction;
- percentage-point or generic numeric differences;
- historical comparable-period counts;
- missing and future-data states;
- baseline change; and
- canonical visible, tooltip, keyboard, table, and event language. Baseline
  period/value context is attached once to the interactive chart rather than
  repeated in each tooltip or keyboard announcement.

An optional baseline is configured independently of the actual series. Its
period must match the earliest displayed datum, and its reference line extends
through the complete target horizon. Invalid baseline configuration emits an
`a11y-line-chart-error` event while leaving the chart usable without baseline
context.

Consumers control titles, series names, locale and structured formatting, a
baseline explanation, and an optional context note. The component retains core
outcome and comparison sentences so visual and assistive representations do not
contradict one another.

## Events

The component dispatches bubbling framework-neutral events:

- `a11y-line-chart-ready`
- `a11y-line-chart-error`
- `a11y-line-chart-point-change`
- `a11y-line-chart-display-change`

The point-change detail contains selected source values, canonical
announcement, outcome, outcome label, and structured target/baseline
differences. No ECharts instance or internal action name is exposed.

## Accessibility target

WCAG 2.2 Level AA is the product release floor. Applicable Section 508 review
is recorded separately. Automated scans are supporting evidence only: internal
and public releases also require the hands-on assistive-technology and
participant validation defined in the experience plan.

WCAG conformance applies to complete pages, so eventual claims will name the
tested demo and framework-consumer fixtures rather than claim that an isolated
package conforms on behalf of every integration.

## Styling

All generated markup remains in Light DOM. Distributed selectors are scoped
under `a11y-line-chart`, generated classes use the `a11y-line-chart__*`
namespace, and documented `--a11y-line-chart-*` custom properties provide the
theme surface. Internal classes are not a stable consumer API.

See [`packages/line-chart/README.md`](./packages/line-chart/README.md) for the
current package-level feature inventory and integration notes.

## Audit fixes and verification

The October 21 audit is in [AUDIT-2026-10-21.md](./AUDIT-2026-10-21.md).
Use Node 24 and install the two active packages separately:

```bash
npm ci --prefix packages/line-chart
npm ci --prefix packages/bar-chart
npm run verify
npm run browser:test
```

The browser suite requires Playwright Chromium (`npx playwright install chromium`
from `packages/line-chart`). To use an installed Chrome locally, set
`PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`. It checks real hidden-container layout,
focus continuity, native dialog reconnection, and defensive event payloads.
Package builds also smoke-test the built `./core` export in Node without DOM globals.
CI runs package verification, demo builds, and browser regressions.

Vercel runs `npm run site:build` and publishes `dist/gallery`. The chart gallery
is served at `/`; standalone demos are at `/demo/line-chart.html` and
`/demo/bar-chart.html`. The existing `/demo/report-demo.html` URL remains available.
The site build includes the current line, bar, grouped-population, and theme examples.

Root `start`, `build`, `test`, and `typecheck` now target the active chart packages.
`start:bar` opens the bar demo. The frozen Angular reference remains available only
through explicitly named `reference:start`, `reference:build`, and `reference:test`
commands (or `ng`). Its old dependency tree still has audit findings; this work
does not upgrade or claim to secure that reference application.

Both packages expose `@a11y-charts/{line-chart|bar-chart}/core` for DOM-free
semantic/validation/message helpers and CSV generation. Pass plain-text metadata
as `contextText` and `dataNoteText` for server exports. These fields take
precedence even when empty. HTML `context`/`dataNote` conversion requires a browser
DOM; server callers receive an explicit error rather than different parsing.
Browser elements and registration continue to use the normal package and
`/define` entries.


## Shared source, standalone outputs

Both chart packages use the private `packages/chart-core/src` library for shared
utilities and card/dialog behavior. Each build embeds the code it needs; consumers
do not load a shared library. Copy each chart's `dist/chart.js` and
`dist/styles.css`, or use its ESM exports. The line script embeds ECharts; the bar
script does not. See [distribution and architecture](SHARED-CORE-DISCUSSION.md)
for an example and the boundaries between shared and chart-specific code.

Run `npm run artifacts:test` to build both packages and exercise their fresh npm
archives in a browser. On a local machine using installed Chrome, prefix the
command with `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`.

## Unified review gallery

Run `npm run gallery:dev` and open `http://127.0.0.1:5191/` for line/bar/grouped
examples, a full-width Adapt-shaped report specimen, and a scoped theme comparison. The comparison shows component defaults,
the Adapt report token adapter, and a substantially different theme on standalone
and grouped charts. Its `--usa-data-rep-*` values are local fixtures; it does not
load USWDS+. Grouped examples identify screenshot-derived values separately from
illustrative data. The chart's built-in reader controls remain available where
enabled by the example.

`npm run gallery:build` creates the static site in `dist/gallery/`.
`npm run gallery:typecheck` checks the gallery source. The browser regression suite
includes the gallery's settings, keyboard, and narrow-layout checks.
`npm run browser:grouped` checks grouped selection, shared scales, state
preservation, downloads, touch/reflow, and automated accessibility.
`npm run browser:themes` checks token inheritance, nested chart surfaces, scoped
theme isolation, the report fixture's values and interaction states, explanation
placement, edge-to-edge band sizing, endpoint geometry, and 320px overflow. The
comparison is a token integration demo rather than a claim of pixel parity with
the Angular report.

## Accessibility audit and regression checks

The October 21 audit targets WCAG 2.2 AAA wherever applicable. Findings, fixes,
scope, evidence, and the spoken screen-reader release gate are in
[ACCESSIBILITY-AUDIT-2026-10-21.md](ACCESSIBILITY-AUDIT-2026-10-21.md).

`npm run browser:test` includes keyboard/card navigation, state/focus recovery,
AAA target/contrast checks, all demo shells, and axe default/expanded scans.
Regenerate both standalone demos before running the all-demo checks after source
changes. Set `PLAYWRIGHT_BROWSER=firefox` or `PLAYWRIGHT_BROWSER=webkit` to run
another installed engine; use `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` for local Chrome.
For the full raw evidence sweep, serve the repo with the line package's
`vite.audit.config.mjs`, then run `npm run a11y:audit --prefix packages/line-chart`.
A clean automated scan does not certify spoken screen-reader behavior.

## SPP/APR interactive report mockup

The separate `/spp-apr/` page uses the actual line and bar components to explore
Hawaii Part B FFY 2023 Indicators 2, 5, and 6. The gallery at `/` and existing
demo/report URLs remain unchanged.

```bash
npm run gallery:dev
# Open http://127.0.0.1:5191/spp-apr/
npm run gallery:typecheck
npm run browser:spp-apr
npm run site:build
```

`site:build` includes `/spp-apr/index.html` in the existing deployment output.
Copy-link preserves the selected indicator, measure, chart view, and display
settings. Links become externally shareable when this build is deployed to the
existing host. Review notes are stored locally on explicit save and can be
downloaded as a text file; no feedback service is connected.

Report content and transcribed values live in
[`demo-gallery/spp-apr/data.ts`](./demo-gallery/spp-apr/data.ts), with their source
page references and unresolved data issues. The supplied PDFs are reference
examples, not independently validated official data. Missing history and baseline
placeholders remain unavailable. Measure 6B uses the detailed comparison's
18.29% target and explicitly flags the conflicting summary. Incomplete population
breakdowns retain the full supplied denominator. No future target values are
invented. Update this data file and the visible source notes together when
feedback resolves these issues.
