# A11y Line Chart Component

**High‑contrast, keyboard and screen‑reader accessible, themable performance chart for Angular 18 (Standalone Components + Signals) built on ECharts 5.**

Actual vs. Target timeline visualization with rich accessibility affordances, dynamic responsive sizing, theming via CSS custom properties, outcome evaluation modes (labels or arrows), patterned fills, zoomable Y‑axis, and customizable HTML/ARIA tooltips.

---

## Table of Contents

1. Overview
2. Feature Matrix
3. Quick Start
4. Basic Usage
5. Data Model
6. Accessibility (A11y) Architecture
7. Keyboard Interaction Model
8. Screen Reader & Live Regions
9. Responsive & Dynamic Sizing System
10. Y‑Axis Zoom & Base Range
11. Outcome / Trend Evaluation Modes
12. Tooltip System (Visual + SR)
13. Theming & Design Tokens (CSS Variables)
14. Patterned Fills
15. Emphasis & Focus Styling
16. Axis Titles
17. Multiple Instances
18. Reduced Motion Handling
19. Gap / Missing Data Handling
20. Configuration Reference
21. Theme Reference
22. CSS Variable Reference (Design Tokens)
23. Extending the Component
24. Performance Considerations
25. Accessibility Testing Checklist
26. Roadmap / Ideas
27. FAQ & Troubleshooting
28. License

---

## 1. Overview

`A11yLineChartComponent` renders paired time‑series (Actual vs Target) percentages across years with layered visual encoding to maximize clarity while preserving semantic meaning for assistive technologies. It deliberately avoids ECharts’ default tooltip and legend behavior where necessary to produce tightly controlled ARIA output and keyboard navigation.

## 2. Feature Matrix

| Category | Capability |
|----------|------------|
| Accessibility | Keyboard navigation (Left/Right/Home/End, optional wrap), live region announcements, off‑screen data table, configurable heading level, reduced motion, structural ARIA grouping, hidden but SR‑visible tooltip content, axis title toggles |
| Visual Clarity | Layered area + outline + halo + main line strategy, white outlines to prevent alpha blending, optional pattern fills |
| Outcome Evaluation | Label mode (default) or arrow symbol mode, positive direction semantics (above/below), customizable positive/negative/equal labels |
| Tooltip | Custom HTML formatter hook + ARIA label builder, difference phrase, relation classification, optional visual suppression (still SR accessible) |
| Theming | Extensive CSS custom properties with runtime dereferencing (works through canvas), symbol sizes, line widths, colors, opacities, emphasis styling |
| Responsive | Intrinsic min/max width calculation, horizontal scroll viewport, automatic per‑point heuristic sizing, overflow detection with SR messaging |
| Data Handling | Missing / future values gap detection, configurable textual substitute for missing data |
| Zoom | Optional dynamic Y‑axis zoom with base range override + initial zoom config |
| Patterns | Diagonal, horizontal, dots patterns for area fills |
| Multiple Instances | Fully self‑contained — can mount multiple charts independently |

## 3. Quick Start

Install dependencies (already present in this repo):

```bash
npm install
npm start
```

Navigate to `http://localhost:4200/`.

Add the component to another Angular project:

```bash
npm install echarts ngx-echarts
```

Then import your local component file and declare usage (standalone; no NgModule needed).

## 4. Basic Usage

```html
<app-a11y-line-chart
  [data]="performanceData"
  [a11y]="{ headingLevel: 2, initialZoomY: true }"
  [theme]="{ actualPatternType: 'diagonal' }"
  xAxisTitle="Year"
  yAxisTitle="Completion"
  [yAxisBaseMin]="50"
  [yAxisBaseMax]="90"
></app-a11y-line-chart>
```

```ts
performanceData = [
  { year: 2019, actual: 72.1, target: 78 },
  { year: 2020, actual: 74.3, target: 79 },
  { year: 2021, actual: 76.0, target: 80 },
];
```

## 5. Data Model

```ts
interface A11yLineChartDatum { year: number; actual?: number | null; target?: number | null; }
```

Values are treated as percentages (0–100 by default base range, but configurable). Null or `undefined` are missing values.

## 6. Accessibility (A11y) Architecture

Core strategies:

1. Dual representation (visual chart + off‑screen HTML table) for screen readers.
2. Live region announces focused year context and changes (toggled series, zoom state, axis titles, etc.).
3. Global heading level configurable to slot into page hierarchy.
4. Tooltip group uses `role="group"` + ARIA label summarizing current point context.
5. Hidden visual tooltip variant still announces content when `showTooltipVisual` is false.
6. Optionally reduced motion based on user preference query.

## 7. Keyboard Interaction Model

| Key | Action |
|-----|--------|
| Left Arrow | Previous year (wrap optional) |
| Right Arrow | Next year (wrap optional) |
| Home | First year |
| End | Last year |

Focus targets an invisible interaction layer. Each navigation updates tooltip and announces context.

## 8. Screen Reader & Live Regions

The component uses an assertive (short‑lived) live region to verbalize:
 
* Focused data point
* Toggling of lines, fills, labels, tooltip visibility
* Axis title enable/disable
* Zoom on/off

Missing data replaced with `describeMissingAs` (default "Missing").

## 9. Responsive & Dynamic Sizing System

Parameters:
 
* `dynamicMinWidth` / `dynamicMaxWidth` — toggle intrinsic min/max computation
* `perPointMinWidth` / `perPointMaxWidth` — base heuristic factors
* `autoPerPointMinWidth` / `autoPerPointMaxWidth` — derive width from label / value complexity
* Horizontal scroll container wraps chart when intrinsic width > viewport.

Overflow triggers an accessible message indicating scroll availability.

## 10. Y‑Axis Zoom & Base Range

Inputs: `yAxisBaseMin`, `yAxisBaseMax`, `a11y.initialZoomY`.

Zoom mode derives min/max from existing values + 6% (≥1) padding, clamps to configured base range, and ensures a minimum visible span (≥4 units) for readability. Toggling announces state change. Non‑zoomed state always uses the base range.

## 11. Outcome / Trend Evaluation Modes

`a11y.trendMode`:
 
* `labels` (default): Displays status pill (Target met / Target not met / On target).
* `arrows`: Displays arrow symbol (↑ ↓ =) colored by outcome.

`positiveDirection`: `'above' | 'below'` defines which relational direction counts as positive.

Custom labels: `positiveLabel`, `negativeLabel`, `equalLabel`.

## 12. Tooltip System

Tooltip shows: Year, actual, target, diff phrase, and either an evaluation label pill or arrow. Visual can be hidden while SR label persists. Two optional callback hooks:

```ts
buildTooltipHtml?: (ctx: A11yLineChartTooltipContext) => string;
buildTooltipAriaLabel?: (ctx: A11yLineChartTooltipContext) => string;
```

`ctx` includes relation, diff, formatted values, and resolved theme. Return HTML or string; exceptions are caught and silently ignored (fallback used).

## 13. Theming & Design Tokens

Theme via `[theme]` input or override CSS variables (preferred for live design systems). All colors can reference CSS variables (`var(--token)`) which are dereferenced prior to passing to ECharts (canvas cannot resolve vars directly).

## 14. Patterned Fills

Optional area pattern types: `none | diagonal | dots | horizontal` per series. Colors (`actualPatternColor`, `targetPatternColor`) default to line colors. Patterns rendered on small in‑memory canvas; SSR gracefully falls back to solid color.

## 15. Emphasis & Focus Styling

Focus line pointer style via tokens: color, width, line type. Point emphasis changes fill/border colors and adds halo outlines.

## 16. Axis Titles

Optional hidden by default; toggle via UI checkboxes or set initial visibility programmatically by updating `showXAxisTitle` / `showYAxisTitle` signals in a wrapper or extending the component. Style independently (font size, weight, color tokens).

## 17. Multiple Instances

All state (signals) is instance‑local. You can render any number of charts side‑by‑side with independent tooltips, zoom, and announcements (live region messages remain scoped because each instance has its own element).

## 18. Reduced Motion Handling

Config: `a11y.reducedMotion`: `'auto' | 'always' | 'never'`.

`auto` queries `prefers-reduced-motion`. When active, animations durations = 0 and easing simplified.

## 19. Gap / Missing Data Handling

`autoDetectGaps` truncates the actual series after the last non‑null value (treating future targets as existing while actuals are missing). Missing values use `describeMissingAs`.

## 20. Configuration Reference (`a11y` Input)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| announceChanges | boolean | true | Live region announcements for toggles & navigation |
| showTable | boolean | true | Include off‑screen data table |
| decimalPlaces | number | 0 | Value formatting precision |
| axisDecimalPlaces | number | 0 | Y‑axis tick precision |
| headingLevel | 1–6 | 2 | Heading level used for chart title wrapper |
| autoDetectGaps | boolean | false | Nulls after last known actual treated as future/missing |
| describeMissingAs | string | "Missing" | Replacement label for null values |
| wrapAround | boolean | false | Keyboard navigation wrap |
| reducedMotion | enum | 'auto' | Motion strategy |
| trendMode | enum | 'labels' | Evaluation style |
| positiveDirection | enum | 'above' | Direction considered positive outcome |
| positiveLabel | string | 'Target met' | Positive pill label |
| negativeLabel | string | 'Target not met' | Negative pill label |
| equalLabel | string | 'On target' | Equal pill label |
| initialZoomY | boolean | false | Start with Y‑axis zoom enabled |

## 21. Theme Reference (`theme` Input)

Key groups (see section 22 for CSS variable mapping):
 
* Series colors / fills / opacities
* Pattern types & colors
* Trend colors & symbols
* Symbol sizes & outlines
* Line widths & halo (outline) widths/colors
* Label colors & font size
* Focus pointer (color/width/style)
* Axis title font size/weight/colors
* Emphasis colors & border widths

## 22. CSS Variable Reference (Excerpt)

You can override globally (e.g., `:root { --a11y-line-chart-actual-color: #005fcc; }`).

| Variable | Purpose |
|----------|---------|
| --a11y-line-chart-actual-color | Actual line/base color |
| --a11y-line-chart-target-color | Target line/base color |
| --a11y-line-chart-actual-fill | Actual area base color |
| --a11y-line-chart-target-fill | Target area base color |
| --a11y-line-chart-actual-fill-opacity | Actual area opacity |
| --a11y-line-chart-target-fill-opacity | Target area opacity |
| --a11y-line-chart-actual-pattern-type | Actual area pattern type |
| --a11y-line-chart-target-pattern-type | Target area pattern type |
| --a11y-line-chart-actual-pattern-color | Stroke for actual pattern |
| --a11y-line-chart-target-pattern-color | Stroke for target pattern |
| --a11y-line-chart-line-width | Line width for both series |
| --a11y-line-chart-actual-line-outline-width | Halo width actual |
| --a11y-line-chart-target-line-outline-width | Halo width target |
| --a11y-line-chart-focus-line-color | Vertical focus line color |
| --a11y-line-chart-focus-line-type | Focus line style |
| --a11y-line-chart-label-font-size | Value label font size |
| --a11y-line-chart-actual-label-color | Actual label color |
| --a11y-line-chart-target-label-color | Target label color |
| --a11y-line-chart-actual-symbol-size | Circle size |
| --a11y-line-chart-target-symbol-size | Diamond size |
| --a11y-line-chart-trend-up-color | Positive indicator color |
| --a11y-line-chart-trend-down-color | Negative indicator color |
| --a11y-line-chart-trend-equal-color | Equal indicator color |
| --a11y-line-chart-x-axis-title-color | X axis title color |
| --a11y-line-chart-y-axis-title-color | Y axis title color |
| --a11y-line-chart-per-point-min-width | Override heuristic per-point min width |
| --a11y-line-chart-per-point-max-width | Override heuristic per-point max width |

## 23. Extending the Component

Ideas:
 
* Add export (CSV/PNG) buttons by accessing chart instance in `onChartInit`.
* Provide external legend control panel (call `toggle(...)`).
* Wrap with parent component managing persisted preferences (zoom, axis titles, trend mode).
* Swap percentage semantics: supply `yAxisBaseMin` / `yAxisBaseMax` for other numeric domains (e.g., 0–1000 counts). Adjust formatting function for non‑percent values (extend component or add an `@Input` for custom value formatter).

## 24. Performance Considerations

* Signals recompute chart options efficiently; only minimal object graph churn.
* Pattern canvases are tiny (20×20) and cached per options build cycle.
* For very large point counts (1000+), consider turning off value labels and halos to reduce DOM size & draw time.

## 25. Accessibility Testing Checklist

| Test | Expectation |
|------|-------------|
| Keyboard arrows | Moves focus & updates live region |
| Wrap disabled | Stops at ends (unless `wrapAround` true) |
| Screen reader | Announces year + actual + target + relation |
| Tooltip hidden | No visual box; still announces content |
| Reduced motion | When user preference set, animations disabled |
| Missing data | Reads configured placeholder |
| Zoom toggle | Announces state change & rescales axis |
| High contrast (OS/Browser) | Lines & labels remain distinguishable |

## 26. Roadmap / Ideas

* Add keyboard shortcut (Z) to toggle zoom.
* Add vertical panning or multi‑range selection.
* Provide optional sparkline condensed variant.
* Build an automated vitest + axe-core accessibility test harness.
* Support non‑percent formatting via `valueFormatter` @Input.
* Add legend focus management & ARIA roles for toggles.

## 27. FAQ & Troubleshooting

| Issue | Fix |
|-------|-----|
| Tooltip doesn’t show | Ensure chart instance loads & `showTooltipVisual` true (or rely on SR only). |
| Colors not applying | If using CSS vars, ensure they’re defined before component renders (global stylesheet). |
| Pattern invisible | Check contrast; pattern color defaults to line color; try darker stroke. |
| Zoom starts disabled | Set `a11y.initialZoomY: true` or call `toggleZoomY()` after view init. |
| Axis labels crowded | Enable dynamic min width or increase `perPointMinWidth`. |

## 28. License

MIT (adjust as appropriate for your project).

---

Generated & maintained as part of an accessibility-focused Angular exploratory project. Contributions and suggestions welcome.
