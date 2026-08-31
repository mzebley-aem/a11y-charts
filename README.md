# A11y Line Chart

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

- The active implementation is [`packages/line-chart`](./packages/line-chart).
- The Angular application under [`src`](./src) is the frozen migration
  reference, not the production direction.
- The technical sequence lives in [`ROADMAP.md`](./ROADMAP.md).
- Product and accessibility decisions live in
  [`CHART-EXPERIENCE-PLAN.md`](./CHART-EXPERIENCE-PLAN.md).
- The original project audit is recorded in [`AUDIT.md`](./AUDIT.md).

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

## Semantic contract

One ECharts-independent semantic model produces:

- the latest period containing an actual value;
- target outcome for `above` or `below` positive direction;
- percentage-point or generic numeric differences;
- historical comparable-period counts;
- missing and future-data states;
- baseline change; and
- canonical visible, tooltip, keyboard, table, and event language.

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
