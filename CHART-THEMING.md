# Chart theme contract

Charts expose inherited `--a11y-charts-bar-*` and `--a11y-charts-line-*` custom properties. Set them on a project wrapper or an individual chart. Defaults remain inside the component stylesheet as fallbacks, so they do not mask values inherited from a wrapper. No USWDS+ dependency is required.

Existing `--a11y-bar-chart-*` and `--a11y-line-chart-*` properties remain the internal bridge and continue to support existing consumers. Direct overrides of those older properties take precedence over the new entry points.

## Project adapter example

The chart gallery includes a project-owned adapter at [`demo-gallery/adapt-report-theme.css`](demo-gallery/adapt-report-theme.css). Its selectors map the reference report's actual `--usa-data-rep-*` token names to chart properties, and its demo compares defaults, the adapter, and a substantially different theme in standalone and grouped charts. The adapter can be copied and narrowed for a consuming project.

```css
.adapt-report-theme {
  --a11y-charts-text: var(--usa-data-rep-container-ink, #1b1b1b);
  --a11y-charts-surface: var(--usa-data-rep-container-background, #fff);
  --a11y-charts-border: var(--usa-data-rep-container-border-color, #dfe1e2);
  --a11y-charts-font-family: var(--usa-data-rep-container-content-font-family, system-ui, sans-serif);
  --a11y-charts-bar-color: var(--usa-data-rep-series-item-background, #005ea8);
  --a11y-charts-bar-label-font-size: var(--usa-data-rep-series-label-font-size, 1rem);
  --a11y-charts-bar-value-font-size: var(--usa-data-rep-series-value-font-size, 1.25rem);
  --a11y-charts-bar-percentage-surface: var(--usa-data-rep-series-percentage-background, #dfe1e2);
  --a11y-charts-bar-value-layout: column;
  --a11y-charts-bar-track: transparent;
  --a11y-charts-bar-plain-language-inset: var(--usa-data-rep-series-group-padding-x, 1.5rem);
  --a11y-charts-bar-action-icon-display: inline-block;
  --a11y-charts-group-selector-background: var(--usa-base-lighter, #dfe1e2);
}
```

These tokens are available from Adapt's compiled USWDS+ integration stylesheet, not from USWDS core. The gallery intentionally does not install or load that stylesheet: local `--usa-data-rep-*` fixture values provide fallbacks, clearly marked in the adapter. When the reference stylesheet is present, its inherited values take precedence over those fallback values. Keep the adapter with the consuming project. Two wrappers can carry different themes on the same page.

The adapter maps report typography and semantic roles, bar color and geometry, value and percentage presentation, action controls, and grouped selector surfaces. The full-width report specimen opts into additional presentation properties for a full-width action divider, explanation band, total, and endpoint values. The selector surface uses the USWDS `--usa-base-lighter` role referenced by the grouped report template's utility classes; it is not a `--usa-data-rep-*` token. Grouped charts retain the web component's section disclosure and option controls instead of reproducing the Angular report's vertical navigation rail. The full-width standalone specimen uses observed report values Male 14 and Female 13 (total 27), with the matching 51.85% and 48.15% shares. The plain-language explanation is authored from those values; it does not reproduce the source template's erroneous `undefined` output. Grouped age values are an internally consistent illustrative fixture totaling 510; the original screenshot's displayed percentages and counts do not reconcile, so those values are not presented as source data.

## Fidelity plan

1. Inventory the old Angular charts' rendered typography, spacing, surfaces, borders, bars, targets, controls, tables, dialogs, and interaction states.
2. Introduce shared semantic tokens for text, muted text, surfaces, borders, focus, typography, spacing, and controls. Component-specific properties should fall back to these shared roles while retaining useful per-chart overrides.
3. Replace remaining hard-coded visual styles with semantic properties, including grouped chart styles and details cards. Preserve forced-colors rules, readable labels, focus visibility, and usable control sizes.
4. Map the consuming project's actual `--usa-*` values in a project adapter. Validate CSS lengths and font values when bridging into the line chart renderer, which also consumes numeric settings. Define and verify runtime theme refresh behavior.
5. Compare old and new charts with the same data and viewport. Verify default, USWDS+, and a substantially different theme, including two scoped themes together, mobile layout, keyboard focus, and forced colors.

The properties exposed in the table below cover the pre-existing theme controls. The bar chart also exposes opt-in presentation properties for label/value/percentage typography and layout; the grouped selector exposes opt-in surface and border properties. A runnable gallery compares component defaults, a distinctly different theme, and this scoped Adapt adapter in standalone and grouped charts, plus a full-width report-shaped specimen. It demonstrates token inheritance and layout hooks; it does not claim pixel parity with the Angular component.

## Fidelity status

**Verified from source tokens:** the adapter's `--usa-data-rep-*` names and fallback values are taken from the current Adapt compiled `uswds+adapt.min.css` token block (container, series, action bar, focus and grouped surfaces). The old standalone and grouped templates confirm that the percentage and count are adjacent to the horizontal bar; the report source styles specify the separate percentage surface and count weight/size. The neighboring `data-rep-wrapper-aria.spec.ts` confirms the wrapper and glossary definition semantics that must remain separate from visual theming.

**Implemented for visual comparison:** the local gallery wires the same standalone values into default, Adapt-token-adapter and alternate-theme wrappers. Both standalone and grouped examples remain independently scoped. The report-shaped specimen includes its title and context, actions, an initially closed Explain disclosure with an authored plain-language summary, glossary, data dialog, total, and the observed values. Its endpoint-value layout preserves the percentage-above-count stack beside the bar. The gallery's `--usa-*` fallbacks and grouped age data are fixtures only; they are not an embedded copy of USWDS+ or source report data.

**Verified in the local gallery:** the browser test checks scoped theme inheritance, Public Sans resolution from local font files, alternate-theme isolation, the report's values and percentages, action/disclosure state, explanation order above the rows, endpoint geometry, edge-to-edge explanation band on desktop and mobile, and 320px overflow. Closed/open report specimens and the theme comparison are saved under `audit-evidence/2026-10-23/`. These are local implementation checks, not a matched-browser comparison to the Angular page. **Still pending:** direct live comparison at matched viewport/zoom and exact spacing/layout parity. Grouped interaction remains a disclosure and radio/option control rather than the source's vertical navigation. The endpoint values remain anchored to the component's fixed bar track. Treat this as a token integration and visual direction demo, not pixel parity.

## Token defaults

Values below retain their existing types. Unitless renderer settings must remain unitless; CSS lengths require the units shown. `inherit` uses the containing project's typography.

| Token | Default |
| --- | --- |
| `--a11y-charts-bar-color` | `#243f91` |
| `--a11y-charts-bar-target-color` | `#172b3a` |
| `--a11y-charts-bar-positive-color` | `#127c25` |
| `--a11y-charts-bar-negative-color` | `#c62828` |
| `--a11y-charts-bar-positive-pattern-color` | `rgb(255 255 255 / 75%)` |
| `--a11y-charts-bar-negative-pattern-color` | `rgb(255 255 255 / 75%)` |
| `--a11y-charts-bar-positive-pattern-image` | `radial-gradient(circle at 3px 3px, currentColor 2px, transparent 2.5px)` |
| `--a11y-charts-bar-positive-pattern-size` | `12px 12px` |
| `--a11y-charts-bar-negative-pattern-image` | `repeating-linear-gradient(135deg, transparent 0 6px, currentColor 6px 8px)` |
| `--a11y-charts-bar-negative-pattern-size` | `auto` |
| `--a11y-charts-bar-target-offset` | `0.5rem` |
| `--a11y-charts-bar-pattern-color` | `rgb(255 255 255 / 75%)` |
| `--a11y-charts-bar-pattern-image` | `none` |
| `--a11y-charts-bar-pattern-size` | `auto` |
| `--a11y-charts-bar-track` | `#dce2ec` |
| `--a11y-charts-bar-text` | `#172b3a` |
| `--a11y-charts-bar-muted` | `#4b5b68` |
| `--a11y-charts-bar-border` | `#c5d0d8` |
| `--a11y-charts-bar-focus` | `#075fcc` |
| `--a11y-charts-bar-surface` | `#fff` |
| `--a11y-charts-bar-space` | `1rem` |
| `--a11y-charts-bar-font` | `inherit` |
| `--a11y-charts-bar-bar-height` | `3rem` |
| `--a11y-charts-bar-border-radius` | `0.5rem` |
| `--a11y-charts-bar-button-radius` | `0.25rem` |
| `--a11y-charts-bar-font-size` | `inherit` |
| `--a11y-charts-bar-title-font-size` | `1.375rem` |
| `--a11y-charts-bar-line-height` | `1.5` |
| `--a11y-charts-bar-gap` | `0.5rem` |
| `--a11y-charts-bar-row-gap` | `1rem` |
| `--a11y-charts-bar-button-padding` | `0.45rem 0.75rem` |
| `--a11y-charts-line-actual-color` | `#1e62d0` |
| `--a11y-charts-line-actual-fill` | `#87b0ff` |
| `--a11y-charts-line-actual-fill-opacity` | `1` |
| `--a11y-charts-line-target-color` | `#765f00` |
| `--a11y-charts-line-target-fill` | `#e8dca4` |
| `--a11y-charts-line-target-fill-opacity` | `1` |
| `--a11y-charts-line-baseline-color` | `#7d335f` |
| `--a11y-charts-line-baseline-label-color` | `#64264b` |
| `--a11y-charts-line-baseline-line-type` | `dotted` |
| `--a11y-charts-line-baseline-line-width` | `2` |
| `--a11y-charts-line-baseline-symbol-size` | `12` |
| `--a11y-charts-line-actual-pattern-type` | `none` |
| `--a11y-charts-line-actual-pattern-color` | `var(--a11y-line-chart-actual-color)` |
| `--a11y-charts-line-target-pattern-type` | `none` |
| `--a11y-charts-line-target-pattern-color` | `var(--a11y-line-chart-target-color)` |
| `--a11y-charts-line-focus-line-color` | `rgba(0, 0, 0, 0.45)` |
| `--a11y-charts-line-focus-line-width` | `1` |
| `--a11y-charts-line-focus-line-type` | `dashed` |
| `--a11y-charts-line-trend-up-color` | `#148f2a` |
| `--a11y-charts-line-trend-down-color` | `#c62828` |
| `--a11y-charts-line-trend-equal-color` | `#444` |
| `--a11y-charts-line-trend-up-symbol` | `"↑"` |
| `--a11y-charts-line-trend-down-symbol` | `"↓"` |
| `--a11y-charts-line-trend-equal-symbol` | `"="` |
| `--a11y-charts-line-actual-symbol-size` | `12` |
| `--a11y-charts-line-target-symbol-size` | `14` |
| `--a11y-charts-line-point-border-color` | `#fff` |
| `--a11y-charts-line-point-border-width` | `2` |
| `--a11y-charts-line-point-shadow-color` | `rgba(0, 0, 0, 0.25)` |
| `--a11y-charts-line-point-shadow-blur` | `4` |
| `--a11y-charts-line-line-width` | `4` |
| `--a11y-charts-line-emphasis-border-color` | `#000` |
| `--a11y-charts-line-emphasis-border-width` | `2` |
| `--a11y-charts-line-actual-emphasis-fill-color` | `#1e62d0` |
| `--a11y-charts-line-target-emphasis-fill-color` | `#765f00` |
| `--a11y-charts-line-actual-emphasis-border-color` | `#000` |
| `--a11y-charts-line-target-emphasis-border-color` | `#000` |
| `--a11y-charts-line-actual-line-outline-color` | `#fff` |
| `--a11y-charts-line-actual-line-outline-width` | `6` |
| `--a11y-charts-line-target-line-outline-color` | `#fff` |
| `--a11y-charts-line-target-line-outline-width` | `6` |
| `--a11y-charts-line-actual-label-color` | `#143e82` |
| `--a11y-charts-line-target-label-color` | `#6d5a00` |
| `--a11y-charts-line-axis-label-font-size` | `12` |
| `--a11y-charts-line-label-font-size` | `11` |
| `--a11y-charts-line-legend-font-size` | `12` |
| `--a11y-charts-line-per-point-min-width` | `70` |
| `--a11y-charts-line-per-point-max-width` | `110` |
| `--a11y-charts-line-x-axis-title-color` | `#222` |
| `--a11y-charts-line-x-axis-title-font-size` | `12` |
| `--a11y-charts-line-x-axis-title-font-weight` | `600` |
| `--a11y-charts-line-y-axis-title-color` | `#222` |
| `--a11y-charts-line-y-axis-title-font-size` | `12` |
| `--a11y-charts-line-y-axis-title-font-weight` | `600` |
| `--a11y-charts-line-color` | `#1b1b1b` |
| `--a11y-charts-line-error-color` | `#b50909` |
| `--a11y-charts-line-focus-color` | `#1e62d0` |

## Consuming report reference

Reference: https://qa-viewer.adaptdata.org/reports/idea-child-count-and-settings-2024-2025

Initial rendered inspection on 2026-10-23 identified an age-filtered chart with a vertical gray navigation panel and a standalone Child Count by Sex chart. Both show blue rectangular bars, labels above bars, percentages on pale backgrounds beside bars, and bold counts below those percentages. White bordered cards, dark typography, blue Explain/Glossary/Data controls, and header separators form the surrounding presentation.

Fidelity tokens must cover value placement and its separate percentage/count typography, bar corners and height, card border/padding, toolbar presentation, and the navigation panel and selected indicator. Some placement changes may require layout variants rather than scalar CSS tokens. This inspection is a starting reference, not full desktop/mobile or interaction verification. The 12-Month Count view has not yet been inspected.

## Segmented bar chart

`<a11y-segmented-bar-chart>` uses the shared inherited text, surface, border,
focus and track roles where applicable. Its chart-specific CSS properties include
`--a11y-segmented-bar-chart-text`, `--a11y-segmented-bar-chart-font`,
`--a11y-segmented-bar-chart-title-font-size`,
`--a11y-segmented-bar-chart-metric-size`,
`--a11y-segmented-bar-chart-bar-height`, and
`--a11y-segmented-bar-chart-track`. Segment defaults can be set with
`--a11y-segmented-bar-chart-segment-color` and numbered properties
`--a11y-segmented-bar-chart-segment-2` through `-6`. Per-category color and
pattern can also be supplied through `theme.segments` keyed by category ID.
Use labels, counts and percentages alongside color; the legend and data table
provide the values in forced colors and other nonvisual contexts.

Grouped breakdowns reserve a neutral treatment for the generated Other categories
segment. Set `theme.other` (`color`, `pattern`, `patternColor`) or
`--a11y-segmented-bar-chart-other-color` to change it. This is independent of
`theme.segments[id]`, so a source category named Other keeps its own identity and
style. Reordering/grouping does not reassign the source categories' theme keys.
