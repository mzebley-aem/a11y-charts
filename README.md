# A11y Charts

Framework-free Light DOM chart components for accessible reporting:

- [`packages/target-line-chart`](./packages/target-line-chart): actual-versus-target performance.
- [`packages/bar-chart`](./packages/bar-chart): horizontal category counts and
  population shares, with explanation, definitions, suppression, and CSV.
- [`packages/segmented-bar-chart`](./packages/segmented-bar-chart): breakdowns
  of a total and individual measures compared with a denominator.

The bar chart and the localization/data-view additions to both charts follow
[`BAR-CHART-SPEC.md`](./BAR-CHART-SPEC.md).

The Angular replacement gap assessment and grouped-selection requirements are
recorded in [`BAR-CHART-REPLACEMENT-PARITY.md`](./BAR-CHART-REPLACEMENT-PARITY.md).
The grouped selector, shared scales, explicit suppression, authored explanations,
and CSV export are implemented locally. The gallery includes four grouped
compositions; production ADAPT integration remains separately unverified.

## Target line chart

A framework-free, Light DOM Web Component for one focused data question:

> Was the target met in the latest reported period?

The project is building an actual-versus-target line chart that is exceptionally
usable with keyboards, screen readers, refreshable braille, magnification,
forced colors, touch, and conventional visual interaction. ECharts 6 is an
internal rendering detail; the public boundary is the standards-based
`<a11y-target-line-chart>` custom element.

It was published as `@mzebley-aem/line-chart` (`<a11y-line-chart>`) through
v0.1.0. It was renamed because it only answers the actual-versus-target
question; it isn't a general-purpose line chart. Every tag, class, CSS
property, event, and exported name moved from `line-chart`/`LineChart`/`LINE_CHART` to
`target-line-chart`/`TargetLineChart`/`TARGET_LINE_CHART`.

The first release is for a specific internal use case. Public open-source
packaging will follow after the documented accessibility evidence gates are
complete.

## Project status

- The line implementation is [`packages/target-line-chart`](./packages/target-line-chart).
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
cd packages/target-line-chart
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
cd packages/target-line-chart
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
[line package](./packages/target-line-chart/README.md) for keys and examples.

For a language switch, supply the complete translated dictionary and update
host-authored titles, data labels, context, and the document/chart `lang` too.
Omitted message keys deliberately use English defaults; `locale` controls
formatting rather than translating text. Both standalone demos include complete
French and Spanish examples in their `demo/locales.ts` files and switch every
chart together.

## Direct consumption

The packages are published to GitHub Packages as `@mzebley-aem/*`; see
[RELEASING.md](./RELEASING.md) for installing (an `.npmrc` and a `read:packages`
token) and for cutting a release.

```ts
import '@mzebley-aem/target-line-chart/define';
import '@mzebley-aem/target-line-chart/styles.css';
import type { A11yTargetLineChartElement } from '@mzebley-aem/target-line-chart';

const chart = document.querySelector<A11yTargetLineChartElement>('a11y-target-line-chart');

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
  dataView: 'dialog'
};
```

```html
<a11y-target-line-chart
  chart-title="Actual versus target performance"
  subtitle="Reported results and planned targets"
  value-preset="percent"
></a11y-target-line-chart>
```

Complex values and callbacks are assigned as properties. The component accepts
ordered `{ x, actual, target }` rows; the compatibility layer also accepts the
Angular-era `{ year, actual, target }` shape.

Targets may also be inclusive ranges, for example
`{ x: 2025, actual: 75, target: { min: 70, max: 80 } }`. Both endpoints meet
the target; values outside the range do not. Numeric targets retain the
configured `positiveDirection` behavior. Range boundaries, target fill,
summary, tooltips, keyboard announcements, and data tables share the same
interpretation. See the [range contract](./packages/target-line-chart/README.md#target-ranges).

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
`a11y-target-line-chart-error` event while leaving the chart usable without baseline
context.

Consumers control titles, series names, locale and structured formatting, a
baseline explanation, and an optional context note. The component retains core
outcome and comparison sentences so visual and assistive representations do not
contradict one another.

## Events

The component dispatches bubbling framework-neutral events:

- `a11y-target-line-chart-ready`
- `a11y-target-line-chart-error`
- `a11y-target-line-chart-point-change`
- `a11y-target-line-chart-settings-change` (reader-driven changes only; detail is `{ setting, value, source }`)

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
under `a11y-target-line-chart`, generated classes use the `a11y-target-line-chart__*`
namespace, and documented `--a11y-target-line-chart-*` custom properties provide the
theme surface. Internal classes are not a stable consumer API.

See [`packages/target-line-chart/README.md`](./packages/target-line-chart/README.md) for the
current package-level feature inventory and integration notes.

## Audit fixes and verification

The October 21 audit is in [AUDIT-2026-10-21.md](./AUDIT-2026-10-21.md).
Use Node 24 and install the active packages separately:

```bash
npm ci --prefix packages/target-line-chart
npm ci --prefix packages/bar-chart
npm ci --prefix packages/segmented-bar-chart
npm run verify
npm run browser:test
```

The browser suite requires Playwright Chromium (`npx playwright install chromium`
from `packages/target-line-chart`). To use an installed Chrome locally, set
`PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`. It checks real hidden-container layout,
focus continuity, native dialog reconnection, and defensive event payloads.
Package builds also smoke-test the built `./core` export in Node without DOM globals.
CI runs package verification, demo builds, and browser regressions.

Vercel runs `npm run deploy:build` and publishes `dist/site`: the
[docs site](./docs) at `/`, including the chart examples under `/examples/` and
the report prototypes under `/reports/`, plus the standalone demos at
`/demo/target-line-chart.html` and `/demo/bar-chart.html`. The former gallery URLs
(`/spp-apr/`, `/dispute-resolution/`, `/segmented/`, and
`/demo/report-demo.html`) redirect to their new pages.

Root `start`, `build`, `test`, and `typecheck` now target the active chart packages.
`start:bar` opens the bar demo. The frozen Angular reference remains available only
through explicitly named `reference:start`, `reference:build`, and `reference:test`
commands (or `ng`). Its old dependency tree still has audit findings; this work
does not upgrade or claim to secure that reference application.

Both packages expose `@mzebley-aem/{target-line-chart|bar-chart}/core` for DOM-free
semantic/validation/message helpers and CSV generation. Pass plain-text metadata
as `contextText` and `dataNoteText` for server exports. These fields take
precedence even when empty. HTML `context`/`dataNote` conversion requires a browser
DOM; server callers receive an explicit error rather than different parsing.
Browser elements and registration continue to use the normal package and
`/define` entries. Code that also runs on the server (Angular SSR, prerendering)
should register through each package's `/loader` entry instead, which has no
static imports and does nothing outside a browser.


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

## Examples and report prototypes

The examples formerly in the chart gallery are pages of the docs site. Run
`npm run docs:dev` and open `http://localhost:4321/examples/` for the line, bar,
grouped, and segmented examples, each with a **Try other settings** panel, and a
scoped theme comparison with a full-width Adapt-shaped report specimen. The
comparison shows component defaults, the Adapt report token adapter, and a
substantially different theme on standalone and grouped charts. Its
`--usa-data-rep-*` values are local fixtures; it does not load USWDS+. Grouped
examples identify screenshot-derived values separately from illustrative data.

The example sources live in [`docs/src/examples`](./docs/src/examples).
`npm run docs:build` builds the packages and the site, and
`npm run docs:typecheck` checks the example sources. `npm run browser:docs` runs
the examples' settings, keyboard, narrow-layout, and automated accessibility
checks against the built site in any browser engine. Build the docs before the
browser suites below, which also run against the built site.
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
`vite.audit.config.mjs`, then run `npm run a11y:audit --prefix packages/target-line-chart`.
A clean automated scan does not certify spoken screen-reader behavior.

## SPP/APR interactive report mockup

The full-page `/reports/spp-apr/` prototype in the docs site uses the actual line
and bar components to explore Hawaii Part B FFY 2023 Indicators 2, 5, and 6.

```bash
npm run docs:dev
# Open http://localhost:4321/reports/spp-apr/
npm run docs:typecheck
npm run docs:build
npm run browser:spp-apr
```

Copy-link preserves the selected indicator, measure, chart view, and display
settings. Links become externally shareable when this build is deployed to the
existing host. Review notes are stored locally on explicit save and can be
downloaded as a text file; no feedback service is connected.

Report content and transcribed values live in
[`docs/src/examples/spp-apr/data.ts`](./docs/src/examples/spp-apr/data.ts), with their source
page references and unresolved data issues. The supplied PDFs are reference
examples, not independently validated official data. Missing history and baseline
placeholders remain unavailable. Measure 6B uses the detailed comparison's
18.29% target and explicitly flags the conflicting summary. Incomplete population
breakdowns retain the full supplied denominator. No future target values are
invented. Update this data file and the visible source notes together when
feedback resolves these issues.

## Dispute resolution interactive report demo

Open `/reports/dispute-resolution/` with `npm run docs:dev` (default:
http://localhost:4321/reports/dispute-resolution/). The docs Examples page links
to this demo. The source mockup and its original file are not modified.

The overview and four section views use the actual `<a11y-bar-chart>` component
for 15 charts. Counts are transcribed from the supplied “Part B Dispute
Resolution Report.html.” No State is identified; 2022–23 is retained without
inferring exact reporting dates. These are unverified example values, not
independently validated official data. The demo separates overlapping meeting
activity from complaint status, names every percentage denominator, keeps
totals out of category rows, and does not invent unreported outcomes.

Overview quick links include a segmented status bar and numeric legend drawn
from each section’s complete complaint/request status breakdown; overlapping
meeting activity is excluded from these bars.

Copy-link preserves section and display preferences; Back/Forward restores
views. Each chart offers Data, Explain, and data exports.
Print applies to the current view. The report interface has no demo notices,
source-review panels, glossary appendix, or feedback collection. Provenance and
audit limitations remain documented here and in the review report.

- Content/data: `docs/src/examples/dispute-resolution/data.ts`
- Flow, content, and WCAG 2.2 AA review with AAA advice:
  `audit-evidence/2026-11-10/dispute-resolution/REVIEW.md`
- Checks: `npm run docs:build`, `npm run docs:typecheck`, and
  `npm run browser:dispute-resolution`
- Reproduce automated evidence:
  `node audit-evidence/2026-11-10/dispute-resolution/audit.cjs`
  (requires a running docs server and the supplied local source file).
  Set `SKIP_SOURCE=1` to check only the demo, or `AUDIT_BASE` for a built preview.

Before replacing examples with live data, confirm the State, period, metric
mapping, whether expedited complaints are included in the due process total,
and the approved small-count disclosure policy. Human screen-reader testing
remains required; a clean automated scan is not a conformance claim.

The dispute-resolution demo's local application shell is styled to match the
supplied QA assessment report (reviewed November 10): desktop rail/mobile Menu,
breadcrumbs, horizontal section links, Quick Summary
panels, and report-style chart values. It uses no QA application runtime and has
no live State data connection. See the review's QA framework alignment addendum.

The overview and single-value panels use the reusable segmented chart.
Section-specific labels, definitions, and explanatory sentences live in
`single-value-content.ts`; source counts remain in `data.ts`. Meeting counts
are compared with complaint totals as in the supplied data; the unfilled track
does not represent an additional reported meeting outcome.

## License

MIT, copyright (c) 2026 Weiss Center. See [LICENSE](./LICENSE). The target line chart bundles ECharts, ZRender, and tslib; their licenses ship in its `dist/` folder.
